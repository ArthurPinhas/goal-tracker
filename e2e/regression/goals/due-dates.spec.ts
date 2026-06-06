import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Due Dates', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Due date assignment and styling', async ({ page, api, indexPage }) => {
    const goalFuture = uniqueName('FutureDue');
    const goalPast = uniqueName('PastDue');

    // Create a date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Create a date for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    createdGoalIds.push(await api.createGoal(goalFuture, { due_date: tomorrowStr }));
    createdGoalIds.push(await api.createGoal(goalPast, { due_date: yesterdayStr }));

    await indexPage.goto();

    const futureCard = await indexPage.getGoalCardByName(goalFuture);
    const pastCard = await indexPage.getGoalCardByName(goalPast);

    // Future goal should have a due date chip saying "Tomorrow" or similar
    const futureChip = futureCard.card.getByTestId('due-date');
    await expect(futureChip).toBeVisible();
    await expect(futureChip).toHaveClass(/text-gold\/95/); // It's tomorrow, so "soon"

    const pastChip = pastCard.card.getByTestId('due-date');
    await expect(pastChip).toBeVisible();
    await expect(pastChip).toHaveClass(/text-red-400/); // It's yesterday, so "overdue"
  });
});
