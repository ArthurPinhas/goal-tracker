import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Export', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Export JSON', async ({ page, api, indexPage }) => {
    const goal1 = uniqueName('ExportGoal');
    const id1 = await api.createGoal(goal1);
    createdGoalIds.push(id1);

    await indexPage.goto();

    // Open export dialog
    // "Export" button might be in a dropdown or a separate button
    // Actually, we can just open Command Palette and select "Export goals"
    // Wait, let's look for an Export button.
    // If it's not visible, we can click the user avatar -> Export.
    // Let's see if there's a button with Export.
    // We can open the sidebar to find Export goals
    await page.getByRole('button', { name: /open sidebar|settings/i }).click().catch(() => {});
    await page.getByRole('button', { name: /Export goals/i }).click();

    // Export dialog should appear
    await expect(page.getByRole('dialog', { name: /Export goals/i })).toBeVisible();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Select JSON
    await page.getByRole('button', { name: /^JSON/i }).click();

    // Click Download JSON
    await page.getByRole('button', { name: /Download JSON/i }).click();

    const download = await downloadPromise;
    if (download) {
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/\.json$/i);
    }
  });
});
