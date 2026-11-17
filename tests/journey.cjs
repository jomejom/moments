const fs = require("node:fs");
const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
fs.mkdirSync("test-results", { recursive: true });
const url = process.env.BASE_URL || "http://localhost:3000";
const launch = {
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
  args: ["--no-sandbox"],
};
(async () => {
  const browser = await chromium.launch(launch);
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const click = async (name) =>
      page.getByRole("button", { name, exact: true }).click();
    const begin = async () => {
      await click("Begin");
      await click("Skip");
    };
    await page.goto(url);
    await page
      .getByRole("heading", { name: "Hi, I’m Phrug.", exact: true })
      .waitFor();
    assert.equal(await page.getByRole("textbox").count(), 0);
    await page.screenshot({
      path: "test-results/greeting-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await click("Begin");
    await page
      .getByRole("heading", { name: "How are you feeling?", exact: true })
      .waitFor();
    assert.equal(await page.getByRole("textbox").count(), 0);
    await click("Worried");
    assert.equal(
      await page
        .getByRole("button", { name: "Worried", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await click("Continue");
    await page
      .getByRole("heading", {
        name: "What’s on your mind?",
        exact: true,
      })
      .waitFor();
    await page.getByText("A little help", { exact: true }).click();
    await click("Something on my mind…");
    await page
      .getByRole("textbox")
      .fill("I am worried about my presentation next week.");
    await page.getByLabel("Revisit this later").check();
    await click("Save");
    await page.getByRole("status").waitFor();
    const records = () =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("moment.entries.v1")),
      );
    assert.equal((await records())[0].mood, "😟");
    await page.reload();
    await page
      .getByRole("heading", { name: "Welcome back.", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Stay with this", exact: true })
        .count(),
      0,
    );
    await begin();
    assert.match(
      await page.getByRole("heading", { level: 1 }).innerText(),
      /presentation/,
    );
    assert.equal(await page.getByRole("textbox").count(), 0);
    await page.screenshot({
      path: "test-results/returning-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    // The new-topic path is always available, and Back preserves the draft.
    await click("Something new");
    await page.getByRole("textbox").fill("An unfinished draft");
    await click("Back");
    page.once("dialog", (d) => d.dismiss());
    await click("Stay with this");
    await click("Something new");
    assert.equal(
      await page.getByRole("textbox").inputValue(),
      "An unfinished draft",
    );
    await click("Back");
    page.once("dialog", (d) => d.accept());
    await click("Stay with this");
    assert.equal(await page.getByRole("textbox").inputValue(), "");
    await page
      .getByRole("textbox")
      .fill("I practiced today and feel much calmer.");
    await click("Save");
    await page.getByRole("status").waitFor();
    await click("My memories");
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
    assert.equal(
      await page
        .locator(".entry")
        .first()
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.locator(".entry").first().click();
    await click("Ask Phrug to revisit this");
    await click("Close");
    await click("Today");
    await click("Write again");
    await click("Skip");
    await page.getByText("More", { exact: true }).click();
    const first = await page.getByRole("heading", { level: 1 }).innerText();
    await click("Another memory");
    assert.notEqual(
      await page.getByRole("heading", { level: 1 }).innerText(),
      first,
    );
    await click("Don’t bring this up again");
    await page.reload();
    await begin();
    assert.equal((await records()).filter((e) => e.dismissed).length, 1);
    // Check each scene on narrow screens, plus long content in memory details.
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 850 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `topic overflow ${width}`,
      );
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: "test-results/returning-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await click("Something new");
    await page.getByRole("textbox").fill("x".repeat(500));
    await page.screenshot({
      path: "test-results/writing-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await click("Save");
    await click("My memories");
    await page.locator(".entry").first().click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.keyboard.press("Escape");
    await page.locator(".entry").first().click();
    page.once("dialog", (d) => d.accept());
    await click("Delete entry");
    assert.equal(await page.locator(".entry").count(), 2);
    page.once("dialog", (d) => d.accept());
    await click("Delete all local reflections");
    assert.equal(await page.locator(".entry").count(), 0);
    await click("Or explore with fictional demo entries");
    await page
      .getByRole("heading", { name: "How are you feeling?", exact: true })
      .waitFor();
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 812 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `mood overflow ${width}`,
      );
    }
    await page.screenshot({
      path: "test-results/mood-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await click("Skip");
    assert.equal((await records()).length, 2);
    await click("Something new");
    await page
      .getByRole("textbox")
      .fill("A new thought, unrelated to my old entries.");
    await click("Save");
    assert.equal((await records())[0].sourceId, undefined);
    // Invalid persisted data must never be replaced by a new save.
    const bad = await context.newPage();
    await bad.goto(url);
    await bad.evaluate(() =>
      localStorage.setItem("moment.entries.v1", '{"bad":true}'),
    );
    await bad.reload();
    await bad.locator(".storage-error").waitFor();
    await bad.getByRole("button", { name: "Begin", exact: true }).click();
    await bad.getByRole("button", { name: "Skip", exact: true }).click();
    await bad
      .getByRole("button", { name: "Start writing", exact: true })
      .click();
    await bad.getByRole("textbox").fill("Keep my draft");
    await bad.getByRole("button", { name: "Save", exact: true }).click();
    assert.equal(await bad.getByRole("textbox").inputValue(), "Keep my draft");
    assert.equal(
      await bad.evaluate(() => localStorage.getItem("moment.entries.v1")),
      '{"bad":true}',
    );
    await bad.evaluate(() => localStorage.clear());
    await bad.reload();
    await bad.getByRole("button", { name: "Begin", exact: true }).click();
    await bad.getByRole("button", { name: "Skip", exact: true }).click();
    await bad
      .getByRole("button", { name: "Start writing", exact: true })
      .click();
    await bad.getByRole("textbox").fill("Storage failure draft");
    await bad.evaluate(
      () =>
        (Storage.prototype.setItem = () => {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }),
    );
    await bad.getByRole("button", { name: "Save", exact: true }).click();
    await bad.locator(".storage-error").waitFor();
    assert.equal(
      await bad.getByRole("textbox").inputValue(),
      "Storage failure draft",
    );
    assert.equal(
      await bad
        .getByRole("heading", { name: "Safely kept.", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: guided first/returning journeys; optional mood; new topic/follow-up; draft preservation; save/reload; linked Memories; revisit/switch/dismiss; delete/reset/demo; dialog keyboard; mobile overflow; corrupt storage and quota failure; no page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
