import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe.skip('Empty State', () => {
  let createdGoalIds: string[] = [];

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Empty state illustration and transition', async ({ page, api, indexPage }) => {
    // Delete any existing goals using UI or API? We can't guarantee no goals for the user,
    // so let's rely on a fresh account if possible, or we delete everything for this run.
    // Assuming our test user is isolated, we can clear all goals first.
    // Or we can just mock the goals API response to be empty, which is safer.
    
    await page.route('**/api/collections/goals/records**', async (route) => {
      // Allow POST (create), but mock GET to return empty initially
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: 1,
            perPage: 30,
            totalItems: 0,
            totalPages: 1,
            items: []
          })
        });
      } else {
        await route.continue();
      }
    });

    await indexPage.goto();

    // Verify empty state is visible
    // "You're all set! Enjoy your day, or plant a new goal to watch it grow."
    await expect(page.getByText(/You're all set!|No goals yet/i)).toBeVisible();

    // Now unroute so we can see the real list when we create a new one
    await page.unroute('**/api/collections/goals/records**');

    // Create first goal
    const goalName = uniqueName('FirstGoal');
    await indexPage.clickAddGoal();
    
    // Fill the form manually or use indexPage helper
    const titleInput = page.locator('input[placeholder*="Goal title" i], input[name="title" i], #title, [aria-label*="title" i]').first();
    await titleInput.fill(goalName);
    
    const submitBtn = page.getByRole('button', { name: /^Create|Save|Add$/i });
    await submitBtn.click();

    // Wait for the goal to be created and list to appear
    await expect(page.getByText(goalName)).toBeVisible();
    
    // The empty state should be gone
    await expect(page.getByText(/You're all set!|No goals yet/i)).not.toBeVisible();
  });
});
