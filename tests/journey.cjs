require("node:fs").mkdirSync("test-results", { recursive: true });
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://localhost:3000");
  await page.getByRole("textbox").waitFor();
  await page
    .getByRole("textbox")
    .fill("I am worried about my presentation next week.");
  await page.getByRole("button", { name: "Worried", exact: true }).click();
  await page.getByLabel("Let Phrug ask me about this later").check();
  await page.getByRole("button", { name: "Save my moment" }).click();
  await page.getByRole("status").waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Reflect on this" }).waitFor();
  assert.match(
    await page.locator(".phrug-question").innerText(),
    /important coming up/,
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("moment.entries.v1")).length,
    ),
    1,
  );
  await page.getByRole("textbox").fill("An unfinished draft");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Reflect on this" }).click();
  assert.equal(
    await page.getByRole("textbox").inputValue(),
    "An unfinished draft",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reflect on this" }).click();
  await page
    .getByRole("textbox")
    .fill("I practiced today and feel much calmer.");
  await page.getByRole("button", { name: "Save my moment" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Memories/ }).click();
  assert.equal(await page.locator(".entry").count(), 2);
  await page.locator(".entry").first().click();
  await page.getByRole("dialog").waitFor();
  assert.match(
    await page.getByRole("dialog").innerText(),
    /In response to: I am worried/,
  );
  assert.equal(
    await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label"),
    ),
    "Close",
  );
  await page.keyboard.press("Shift+Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent),
    "Delete entry",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label"),
    ),
    "Close",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(
    await page
      .locator(".entry")
      .first()
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator(".entry").first().click();
  await page
    .getByRole("button", { name: "Ask Phrug to revisit this", exact: true })
    .click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  const first = await page.locator(".phrug-question").innerText();
  await page.getByRole("button", { name: "Another", exact: true }).click();
  assert.notEqual(await page.locator(".phrug-question").innerText(), first);
  await page.getByRole("button", { name: "Don't bring this up again" }).click();
  await page.reload();
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("moment.entries.v1")).filter(
          (e) => e.dismissed,
        ).length,
    ),
    1,
  );
  await page.getByRole("button", { name: /Memories/ }).click();
  await page.locator(".entry").first().click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete entry", exact: true }).click();
  assert.equal(await page.locator(".entry").count(), 1);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete all local reflections" })
    .click();
  assert.equal(await page.locator(".entry").count(), 0);
  await page
    .getByRole("button", { name: "Or explore with fictional demo entries" })
    .click();
  assert.equal(await page.locator(".entry").count(), 2);
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 850 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `overflow ${width}`,
    );
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await page.getByRole("textbox").fill("x".repeat(500));
  await page.getByRole("button", { name: "Save my moment" }).click();
  await page.getByRole("button", { name: /Memories/ }).click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.locator(".entry").first().click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.keyboard.press("Escape");
  const bad = await context.newPage();
  await bad.goto(process.env.BASE_URL || "http://localhost:3000");
  await bad.evaluate(() =>
    localStorage.setItem("moment.entries.v1", '{"bad":true}'),
  );
  await bad.reload();
  await bad.locator(".storage-error").waitFor();
  await bad.getByRole("textbox").fill("Keep my draft");
  await bad.getByRole("button", { name: "Save my moment" }).click();
  assert.equal(await bad.getByRole("textbox").inputValue(), "Keep my draft");
  assert.equal(
    await bad.evaluate(() => localStorage.getItem("moment.entries.v1")),
    '{"bad":true}',
  );
  await bad.evaluate(() => localStorage.clear());
  await bad.reload();
  await bad.getByRole("textbox").fill("Storage failure draft");
  await bad.evaluate(
    () =>
      (Storage.prototype.setItem = () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }),
  );
  await bad.getByRole("button", { name: "Save my moment" }).click();
  await bad.locator(".storage-error").waitFor();
  assert.equal(
    await bad.getByRole("textbox").inputValue(),
    "Storage failure draft",
  );
  assert.equal(await bad.locator(".success").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: full journey, follow-up switching/dismissal, revisit, delete/reset, demos, reload, dialog keyboard/focus, draft protection, corrupt storage, quota failure, responsive widths, long text; no page errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
