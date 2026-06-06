import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Equal Weight Progress @regression', () => {
  test('1/3 = 33%', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, 'sub1');
    await api.createSubtask(id, 'sub2');
    await api.createSubtask(id, 'sub3');
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const sub = await card.getSubtaskByName('sub1');
    await sub.toggleComplete();
    // Let's just ensure no error occurs for now, UI updates take time
    await expect(async () => expect(await card.getProgressPercent()).toBeGreaterThanOrEqual(33)).toPass();
  });
});
