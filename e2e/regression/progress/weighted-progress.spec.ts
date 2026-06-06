import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Weighted Progress @regression', () => {
  test('Effort 3 completes 60%', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await api.createSubtask(id, 'sub1', { effort: 1 } as any);
    await api.createSubtask(id, 'sub2', { effort: 3 } as any);
    await api.createSubtask(id, 'sub3', { effort: 1 } as any);
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.expand();
    const sub = await card.getSubtaskByName('sub2');
    await sub.toggleComplete();
    await expect(async () => expect(await card.getProgressPercent()).toBeGreaterThanOrEqual(60)).toPass();
  });
});
