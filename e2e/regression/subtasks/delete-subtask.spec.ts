import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';
test.describe('Delete Subtask @regression', () => {
  test('Delete subtask', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, uniqueName('sub'));
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const subs = await card.getSubtaskNames();
    const sub = await card.getSubtaskByName(subs[0]);
    await sub.delete();
    await expect(sub.locator).not.toBeVisible();
  });
});