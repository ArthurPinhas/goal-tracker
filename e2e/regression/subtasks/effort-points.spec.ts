import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';
test.describe('Effort Points @regression', () => {
  test('Set effort', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, uniqueName('sub'));
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const subs = await card.getSubtaskNames();
    const sub = await card.getSubtaskByName(subs[0]);
    await sub.setEffort(3);
    await expect(sub.locator.getByText(/Medium/)).toBeVisible();
  });
});