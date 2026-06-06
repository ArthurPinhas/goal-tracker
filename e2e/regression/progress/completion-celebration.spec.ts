import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Completion Celebration @regression', () => {
  test('Shows celebration', async ({ indexPage, page, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, 'sub1');
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const sub = await card.getSubtaskByName('sub1');
    await sub.toggleComplete();
    await expect(page.getByTestId('celebration-overlay').first()).toBeVisible({ timeout: 10000 });
  });
});
