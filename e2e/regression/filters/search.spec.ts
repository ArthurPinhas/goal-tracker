import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Search @regression', () => {
  test('Search works', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    await api.createGoal(title);
    await indexPage.goto();
    await indexPage.searchInput.fill(title);
    await indexPage.expectGoalVisible(title);
  });
});
