import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Sort @regression', () => {
  test('Sort changes', async ({ indexPage, page }) => {
    await indexPage.goto();
    await page.getByRole('combobox', { name: 'Sort goals' }).click();
    await expect(page.getByRole('listbox').first()).toBeVisible();
  });
});
