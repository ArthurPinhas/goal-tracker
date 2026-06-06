import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Archive/Restore Goal @regression', () => {
  test('Archive shows in tab', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    await api.createGoal(title);
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.toggleStandaloneComplete();
    await card.clickArchive();
    await indexPage.expectGoalNotVisible(title);
    await indexPage.page.getByRole('tab', { name: /Archived/i }).click();
    await indexPage.page.waitForTimeout(1000);
    await indexPage.page.screenshot({ path: 'debug-archive.png' });
    await indexPage.expectGoalVisible(title);
  });
});
