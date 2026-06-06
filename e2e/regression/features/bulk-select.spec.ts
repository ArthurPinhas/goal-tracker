import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Bulk Select', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Select mode activation and bulk operations', async ({ page, api, indexPage }) => {
    const goal1 = uniqueName('BulkGoal1');
    const goal2 = uniqueName('BulkGoal2');

    createdGoalIds.push(await api.createGoal(goal1));
    createdGoalIds.push(await api.createGoal(goal2));

    await indexPage.goto();

    await expect(page.getByText(goal1)).toBeVisible();
    await expect(page.getByText(goal2)).toBeVisible();

    // Click "Select"
    await indexPage.enterBulkSelectMode();

    // Verify checkboxes appear. We can just select them.
    await indexPage.selectGoalInBulk(goal1);
    await indexPage.selectGoalInBulk(goal2);

    // Bulk delete
    await indexPage.bulkDelete();

    // Verify both are gone
    await expect(page.getByText(goal1)).not.toBeVisible();
    await expect(page.getByText(goal2)).not.toBeVisible();

    // They are deleted from backend, so remove from cleanup
    createdGoalIds = [];
  });
});
