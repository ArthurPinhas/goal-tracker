import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Expand Collapse', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Expand all and collapse all', async ({ page, api, indexPage }) => {
    const goal1 = uniqueName('ExpandGoal1');
    const goal2 = uniqueName('ExpandGoal2');

    const id1 = await api.createGoal(goal1);
    const id2 = await api.createGoal(goal2);
    createdGoalIds.push(id1, id2);

    await api.createSubtask(id1, 'Subtask 1');
    await api.createSubtask(id2, 'Subtask 2');

    await indexPage.goto();

    await expect(page.getByText(goal1)).toBeVisible();
    await expect(page.getByText(goal2)).toBeVisible();

    // Verify initially hidden (Wait, in our UI they might be expanded by default?
    // Let's assume we can click Expand All / Collapse All anyway.)
    const subtask1 = page.getByText('Subtask 1');
    const subtask2 = page.getByText('Subtask 2');

    // Click Expand all
    await indexPage.expandAll();
    
    // Subtasks should be visible
    await expect(subtask1).toBeVisible();
    await expect(subtask2).toBeVisible();

    // Click Collapse all
    await indexPage.collapseAll();
    
    // Subtasks should be hidden
    await expect(subtask1).not.toBeVisible();
    await expect(subtask2).not.toBeVisible();
  });
});
