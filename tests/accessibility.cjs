const { chromium } = require("@playwright/test");
const { AxeBuilder } = require("@axe-core/playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto(process.env.BASE_URL || "http://localhost:3000");
    const click = (name) =>
      p.getByRole("button", { name, exact: true }).click();
    const scan = async (state) => {
      const r = await new AxeBuilder({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      if (r.violations.length) process.exitCode = 1;
      console.log(
        state,
        JSON.stringify(
          r.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              html: n.html,
              summary: n.failureSummary,
            })),
          })),
        ),
      );
    };
    await p
      .getByRole("heading", { name: "Hi, I’m Phrug.", exact: true })
      .waitFor();
    await scan("greeting");
    await click("Let’s check in");
    await scan("mood");
    await click("Skip for now");
    await scan("new-topic");
    await p.getByText("Help me find a starting point", { exact: true }).click();
    await scan("starter-options");
    await click("Start writing");
    await scan("editor");
    await p.getByRole("textbox").fill("A happy walk with a friend.");
    await click("Save my moment");
    await scan("saved");
    await click("Another little moment");
    await click("Skip for now");
    await scan("returning-nudge");
    await p.getByText("Try a different nudge", { exact: true }).click();
    await scan("nudge-options");
    await click("Reflect on this");
    await scan("follow-up-editor");
    await p.getByRole("button", { name: /Memories/ }).click();
    await scan("memories");
    await p.locator(".entry").first().click();
    await scan("dialog");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
