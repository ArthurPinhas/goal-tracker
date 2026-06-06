import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Duplicate Goal @regression', () => {
  test('Duplicate copies fields', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    await api.createGoal(title);
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.clickDuplicate();
    await indexPage.expectGoalVisible(title + ' (copy)');
  });
});
