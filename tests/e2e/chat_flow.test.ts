/**
 * E2E test: requires both backend (port 8765) and frontend (port 6173) running.
 * Run with: npx playwright test
 */
import { test, expect } from "@playwright/test";

const SAMPLE_ZIP_BASE64 =
  "UEsDBBQAAAAIANJbU1ywXZXYGgAAABoAAAAHAAAAbWFpbi5weUtJTVPISM3JydfQtOJSAIKi1JLSojwFQy4AUEsBAhQDFAAAAAgA0ltTXLBdldgaAAAAGgAAAAcAAAAAAAAAAAAAAIABAAAAAG1haW4ucHlQSwUGAAAAAAEAAQA1AAAAPwAAAAAA";

test.describe("Ragnar E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("health badge shows version", async ({ page }) => {
    await expect(page.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("index a project and chat about it", async ({ page }) => {
    // Upload zip archive
    const zipInput = page.getByLabel(/archivo zip/i);
    await zipInput.setInputFiles({
      name: "repo.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(SAMPLE_ZIP_BASE64, "base64"),
    });
    await page.getByText("Indexar").click();

    // Wait for success
    await expect(page.getByText(/chunks indexados/)).toBeVisible({
      timeout: 30_000,
    });

    // Ask a question
    await page
      .getByPlaceholder(/pregunta sobre el codigo/)
      .fill("What files are in this project?");
    await page.getByText("Enviar").click();

    // Wait for response
    await expect(
      page.locator("[class*='justify-start'] p").last(),
    ).not.toBeEmpty({ timeout: 30_000 });
  });
});
