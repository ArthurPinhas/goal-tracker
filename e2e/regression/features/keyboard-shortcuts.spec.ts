import { test, expect } from '../../fixtures/test-fixtures';

test.describe.skip('Keyboard Shortcuts', () => {
  test('Cmd+N opens AddGoalDialog', async ({ page, indexPage }) => {
    await indexPage.goto();
    // Use Mac key sequence Meta+N or Control+N
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+n`);
    await expect(page.getByRole('dialog', { name: /New goal/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Cmd+K opens CommandPalette', async ({ page, indexPage }) => {
    await indexPage.goto();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Escape closes open dialog', async ({ page, indexPage }) => {
    await indexPage.goto();
    await indexPage.clickAddGoal();
    const dialog = page.getByRole('dialog', { name: /New goal/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
