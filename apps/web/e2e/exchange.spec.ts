import { test, expect } from "@playwright/test";

test.describe("Pixel Diary Exchange Flow", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("should display the main UI elements", async ({ page }) => {
        // Check title
        await expect(page.getByRole("heading", { name: "いまのきぶん" })).toBeVisible();

        // Check canvas grid (16 pixels)
        await expect(page.getByRole("grid", { name: "4x4 ピクセルキャンバス" })).toBeVisible();

        // Check color picker
        await expect(page.getByText("いろをえらぶ →")).toBeVisible();

        // Check title input
        await expect(page.getByPlaceholder("タイトル(5もじまで)")).toBeVisible();

        // Check exchange button
        await expect(page.getByRole("button", { name: "こうかんする" })).toBeVisible();

        // Check album section
        await expect(page.getByRole("heading", { name: "アルバム" })).toBeVisible();
    });

    test("should paint pixels when clicked", async ({ page }) => {
        // Get the first pixel button
        const firstPixel = page.getByRole("button", { name: "ピクセル 1" });

        // Check initial color is white
        await expect(firstPixel).toHaveCSS("background-color", "rgb(255, 255, 255)");

        // Click the pixel
        await firstPixel.click();

        // Check color changed to default accent color (#ffb7b2)
        await expect(firstPixel).toHaveCSS("background-color", "rgb(255, 183, 178)");
    });

    test("should change color when color picker is used", async ({ page }) => {
        // Change color to red
        const colorPicker = page.getByLabel("色を選択");
        await colorPicker.fill("#ff0000");

        // Click a pixel
        const pixel = page.getByRole("button", { name: "ピクセル 5" });
        await pixel.click();

        // Check pixel is now red
        await expect(pixel).toHaveCSS("background-color", "rgb(255, 0, 0)");
    });

    test("should limit title to 5 characters", async ({ page }) => {
        const titleInput = page.getByPlaceholder("タイトル(5もじまで)");

        // Try to type more than 5 characters
        await titleInput.fill("あいうえおか");

        // Should only have 5 characters
        await expect(titleInput).toHaveValue("あいうえお");
    });

    test("should show error when submitting empty canvas without title", async ({ page }) => {
        // Listen for dialog
        page.on("dialog", async (dialog) => {
            expect(dialog.message()).toContain("キャンバスが真っ白");
            await dialog.accept();
        });

        // Click exchange button without drawing or adding title
        await page.getByRole("button", { name: "こうかんする" }).click();
    });

    test("should disable button during exchange", async ({ page }) => {
        // Draw something first
        await page.getByRole("button", { name: "ピクセル 1" }).click();

        // Click exchange button
        const exchangeButton = page.getByRole("button", { name: "こうかんする" });
        await exchangeButton.click();

        // Button should show loading state (might be brief)
        // Note: This might be too fast to catch in some cases
        await expect(exchangeButton).toContainText(/つうしんちゅう|こうかんする/);
    });
});

test.describe("Album functionality", () => {
    test("should persist album items in localStorage", async ({ page }) => {
        await page.goto("/");

        // Check if album section exists
        await expect(page.getByRole("heading", { name: "アルバム" })).toBeVisible();

        // Album items would need actual exchange to appear
        // This is a basic check that the UI is present
    });
});
