import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe.skip('Concurrent Operations', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Rapid subtask toggling', async ({ page, api, indexPage }) => {
    const goalName = uniqueName('ConcurrentGoal');
    const goalId = await api.createGoal(goalName);
    createdGoalIds.push(goalId);

    const subtaskNames = Array.from({ length: 5 }, (_, i) => `Subtask ${i + 1}`);
    for (const sub of subtaskNames) {
      await api.createSubtask(goalId, sub);
    }

    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(goalName);
    await card.expand();

    // Toggle all subtasks rapidly
    const togglePromises = subtaskNames.map(async (name) => {
      const subtask = await card.getSubtaskByName(name);
      await subtask.toggleComplete();
    });

    await Promise.all(togglePromises);

    // Give it a moment to settle
    await page.waitForTimeout(500);

    // Verify all are checked or progress is 100%
    const progress = await card.getProgressPercent();
    expect(progress).toBe(100);
  });
});
