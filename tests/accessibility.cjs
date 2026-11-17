const { chromium } = require("@playwright/test");
const { AxeBuilder } = require("@axe-core/playwright");
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto(process.env.BASE_URL || "http://localhost:3000");
  await p.getByRole("textbox").waitFor();
  for (const state of ["today", "populated-today", "memories", "dialog"]) {
    if (state === "populated-today") {
      await p
        .getByRole("button", { name: "Try two fictional demo entries" })
        .click();
    }
    if (state === "memories") {
      await p.getByRole("button", { name: /Memories/ }).click();
    }
    if (state === "dialog") await p.locator(".entry").first().click();
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
  }
  await b.close();
})();
