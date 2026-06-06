import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Delete Goal @regression', () => {
  test('Delete via UI', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    await api.createGoal(title);
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.clickDelete();
    await card.confirmDelete();
    await indexPage.expectGoalNotVisible(title);
  });

  test('Delete archived goal', async ({ indexPage, api }) => {
    const title = uniqueName('goal');
    await api.createGoal(title);
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.toggleStandaloneComplete();
    await card.clickArchive();
    await indexPage.selectTab('Archived');
    const archivedCard = await indexPage.getGoalCardByName(title);
    await archivedCard.clickDelete();
    await archivedCard.confirmDelete();
    await indexPage.expectGoalNotVisible(title);
  });
});
