import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe.skip('Showcase', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Toggle showcase for completed goal', async ({ page, api, indexPage }) => {
    const goalName = uniqueName('ShowcaseGoal');
    const id = await api.createGoal(goalName, { is_completed: true });
    createdGoalIds.push(id);

    await indexPage.goto();

    const card = await indexPage.getGoalCardByName(goalName);
    
    // Expand the card
    await card.card.click();

    // Click "Link your win"
    await card.card.getByRole('button', { name: /Link your win/i }).click();

    // The ShowcaseQuickDialog opens
    const dialog = page.getByRole('dialog', { name: /Add to Showcase/i });
    await expect(dialog).toBeVisible();

    // Fill the URL
    await dialog.locator('input[type="url"]').fill('https://example.com');
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Go to Showcase view
    await indexPage.selectFilter('Showcase');

    // Verify goal is visible
    await expect(page.getByText(goalName)).toBeVisible();
    
    // The "Link your win" button should be gone, instead we might see the link itself
    await expect(card.card.getByRole('button', { name: /Link your win/i })).not.toBeVisible();
  });
});
