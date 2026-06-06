import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';
test.describe('Toggle Subtask @regression', () => {
  test('Check subtask', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, uniqueName('sub'));
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const subs = await card.getSubtaskNames();
    const sub = await card.getSubtaskByName(subs[0]);
    await sub.toggleComplete();
    await expect(async () => expect(await card.getProgressPercent()).toBeGreaterThan(0)).toPass();
  });
});