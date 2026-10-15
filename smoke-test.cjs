const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    localStorage.removeItem("superSafetyBros.unlocks.v1"),
  );
  await page.reload({ waitUntil: "networkidle" });
  if (
    (await page.locator(".world-count").textContent()).trim() !==
    "6 WORLDS · 20 STAGES · 2 BOSS FIGHTS"
  )
    throw new Error("Expansion copy missing");
  const levels = await page.evaluate(() => window.__safetyBrosQA.getLevels());
  if (
    levels.length !== 20 ||
    levels[9].number !== "3-B" ||
    levels[19].number !== "6-B"
  )
    throw new Error(
      `Bad stage order: ${levels.map((x) => x.number).join(",")}`,
    );
  if (
    !(await page.locator('[data-character="josh"]').isDisabled()) ||
    !(await page.locator('[data-character="tyler"]').isDisabled())
  )
    throw new Error("Secret characters must start locked");
  await page.evaluate(() => {
    window.__safetyBrosQA.prepareBoss("boss1");
    window.__safetyBrosQA.finishLevel();
  });
  await page.locator("#characters").click();
  if (await page.locator('[data-character="josh"]').isDisabled())
    throw new Error("Josh did not unlock after Boss 1");
  if (!(await page.locator('[data-character="tyler"]').isDisabled()))
    throw new Error("Tyler unlocked before Boss 2");
  await page.evaluate(() => {
    window.__safetyBrosQA.prepareBoss("boss2");
    window.__safetyBrosQA.finishLevel();
  });
  await page.locator("#characters").click();
  if (await page.locator('[data-character="tyler"]').isDisabled())
    throw new Error("Tyler did not unlock after Boss 2");
  await page.reload({ waitUntil: "networkidle" });
  if (
    (await page.locator('[data-character="josh"]').isDisabled()) ||
    (await page.locator('[data-character="tyler"]').isDisabled())
  )
    throw new Error("Unlocks did not persist");
  await page.locator('[data-character="nick"]').click();
  await page.locator("#start").click();
  if (!(await page.locator("#game-screen.active").count()))
    throw new Error("Mobile game did not start");
  await page.screenshot({ path: "test-game-mobile.png" });

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  desktop.on("pageerror", (e) => errors.push(e.message));
  await desktop.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await desktop.locator("#start").click();
  await desktop.keyboard.down("ArrowRight");
  await desktop.waitForTimeout(350);
  await desktop.keyboard.press("Space");
  await desktop.keyboard.up("ArrowRight");

  const landscape = await browser.newPage({
    viewport: { width: 844, height: 390 },
    isMobile: true,
  });
  landscape.on("pageerror", (e) => errors.push(e.message));
  await landscape.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await landscape.locator("#start").click();
  await landscape.screenshot({ path: "test-game-landscape.png" });
  const controls = await landscape.locator(".mobile-controls").boundingBox();
  if (!controls || controls.y < 180 || controls.y + controls.height > 390)
    throw new Error("Landscape controls overlap the primary play area");
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.log(
    "PASS: 20 stages, both boss unlocks, persistence, portrait, landscape, desktop keyboard, jump, and assets",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
