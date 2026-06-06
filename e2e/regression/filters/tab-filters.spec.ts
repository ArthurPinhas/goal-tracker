import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Tab Filters @regression', () => {
  test('Tabs switch content', async ({ indexPage, page }) => {
    await indexPage.goto();
    await page.getByRole('tab', { name: /Done/i }).click();
    await expect(page.getByRole('tab', { name: /Done/i, selected: true })).toBeVisible();
  });
});
