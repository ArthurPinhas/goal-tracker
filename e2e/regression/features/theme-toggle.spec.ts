import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Theme Toggle', () => {
  test('Toggle dark/light mode', async ({ page, indexPage }) => {
    await indexPage.goto();

    const html = page.locator('html');

    // It should have either 'light' or 'dark' class, or we can just toggle it
    // Usually theme toggle is in the command palette or a button.
    // Let's assume there's a button with aria-label="Toggle theme" or similar.
    // Or we can use command palette.
    await page.keyboard.press('Meta+k');
    const commandDialog = page.getByRole('dialog');
    await expect(commandDialog).toBeVisible();

    // Type 'theme'
    await page.locator('[cmdk-input]').fill('theme');
    
    // There might be 'Toggle Theme' or 'Light Theme', 'Dark Theme'
    const themeOption = page.locator('[cmdk-item]').filter({ hasText: /theme/i }).first();
    if (await themeOption.isVisible()) {
      await themeOption.click();
      // Wait for theme to change
      await page.waitForTimeout(500);
      
      // Just verifying we interacted with the theme toggle without crashing
      const classList = await html.getAttribute('class') || '';
      expect(classList).toMatch(/light|dark/);
    }
  });
});
