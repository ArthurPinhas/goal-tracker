import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Progress Color Tiers', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Color changes according to progress percentage', async ({ page, api, indexPage }) => {
    const goalName = uniqueName('ColorTierGoal');
    const goalId = await api.createGoal(goalName);
    createdGoalIds.push(goalId);

    // Create 4 subtasks to represent 25%, 50%, 75%, 100%
    const sub1 = await api.createSubtask(goalId, 'Sub1');
    const sub2 = await api.createSubtask(goalId, 'Sub2');
    const sub3 = await api.createSubtask(goalId, 'Sub3');
    const sub4 = await api.createSubtask(goalId, 'Sub4');

    await indexPage.goto();

    const card = await indexPage.getGoalCardByName(goalName);
    await card.expand();

    const fillLocator = card.card.getByTestId('progress-fill');

    // 0% -> emerald (#34d399) -> rgb(52, 211, 153)
    await expect(fillLocator).toHaveCSS('background-color', 'rgb(52, 211, 153)');

    // 25% (0 - 49%) -> emerald
    const sub1Component = await card.getSubtaskByName('Sub1');
    await sub1Component.toggleComplete();
    await expect(card.card.locator('[class*="tabular-nums"]').first()).toHaveText(/25%/);
    await expect(fillLocator).toHaveCSS('background-color', 'rgb(52, 211, 153)');

    // 50% (50 - 99%) -> green (#22c55e) -> rgb(34, 197, 94)
    const sub2Component = await card.getSubtaskByName('Sub2');
    await sub2Component.toggleComplete();
    await expect(card.card.locator('[class*="tabular-nums"]').first()).toHaveText(/50%/);
    await expect(fillLocator).toHaveCSS('background-color', 'rgb(34, 197, 94)');

    // 75% -> green
    const sub3Component = await card.getSubtaskByName('Sub3');
    await sub3Component.toggleComplete();
    await expect(card.card.locator('[class*="tabular-nums"]').first()).toHaveText(/75%/);
    await expect(fillLocator).toHaveCSS('background-color', 'rgb(34, 197, 94)');

    // 100% -> amber (#f59e0b) -> rgb(245, 158, 11)
    const sub4Component = await card.getSubtaskByName('Sub4');
    await sub4Component.toggleComplete();
    await expect(card.card.locator('[class*="tabular-nums"]').first()).toHaveText(/100%/);
    await expect(fillLocator).toHaveCSS('background-color', 'rgb(245, 158, 11)');
  });
});
