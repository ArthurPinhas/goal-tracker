import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Deadline filters @regression', () => {
  test('Filter by deadline', async ({ indexPage, page, api }) => {
    await api.createGoal('Test goal with due date', { due_date: new Date().toISOString() });
    await indexPage.goto();
    await page.getByRole('button', { name: 'Overdue' }).click();
    await expect(page.getByRole('button', { name: 'Overdue' })).toHaveAttribute('class', /text-foreground/);
  });
});
