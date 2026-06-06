import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';
test.describe('Rename Subtask @regression', () => {
  test('Rename via pencil', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, uniqueName('sub'));
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const subs = await card.getSubtaskNames();
    const sub = await card.getSubtaskByName(subs[0]);
    await sub.rename('new_name');
    await expect((await card.getSubtaskByName('new_name')).locator).toBeVisible();
  });
});