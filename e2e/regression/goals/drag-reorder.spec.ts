import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe.skip('Drag to Reorder', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Drag goal to new position and verify order persists', async ({ page, api, indexPage }) => {
    const goal1 = uniqueName('DragGoal1');
    const goal2 = uniqueName('DragGoal2');
    const goal3 = uniqueName('DragGoal3');

    createdGoalIds.push(await api.createGoal(goal1));
    createdGoalIds.push(await api.createGoal(goal2));
    createdGoalIds.push(await api.createGoal(goal3));

    await indexPage.goto();

    await expect(page.getByText(goal1)).toBeVisible();
    await expect(page.getByText(goal2)).toBeVisible();
    await expect(page.getByText(goal3)).toBeVisible();

    // Verify initial order
    const initialOrder = await indexPage.page.locator('[id^="goal-card-"] p.font-medium').allInnerTexts();

    // Locate the drag handles for goal 1 and goal 3
    const card1 = await indexPage.getGoalCardByName(goal1);
    const card3 = await indexPage.getGoalCardByName(goal3);

    const handle1 = card1.card.locator('[aria-label="Drag to reorder goal"]');
    const handle3 = card3.card.locator('[aria-label="Drag to reorder goal"]');

    // Drag handle1 to handle3
    await handle1.dragTo(handle3);

    // Give it a small wait for the state to settle and backend to update
    await page.waitForTimeout(500);

    const newOrder = await indexPage.page.locator('[id^="goal-card-"] p.font-medium').allInnerTexts();
    // Verify order has changed
    expect(newOrder).not.toEqual(initialOrder);

    // Refresh and verify order persists
    await page.reload();
    await indexPage.waitForGoalsLoaded();

    const refreshedOrder = await indexPage.page.locator('[id^="goal-card-"] p.font-medium').allInnerTexts();
    expect(refreshedOrder).toEqual(newOrder);
  });

  test('Drag disabled in sorted view', async ({ page, api, indexPage }) => {
    const goalName = uniqueName('DragSortedGoal');
    createdGoalIds.push(await api.createGoal(goalName, { due_date: '2099-12-31' }));

    await indexPage.goto();
    
    // Switch sort
    await indexPage.selectSort('Due date');

    const card = await indexPage.getGoalCardByName(goalName);
    const handle = card.card.locator('[aria-label="Drag to reorder goal"]');
    
    // In our UI, when sort is applied, drag handles are either hidden or the whole list isn't sortable
    // Often it's hidden. Let's check visibility.
    await expect(handle).not.toBeVisible();
  });
});
