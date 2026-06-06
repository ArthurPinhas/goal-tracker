import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Assign Category', () => {
  let createdGoalIds: string[] = [];
  let createdCategoryIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
    createdCategoryIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
    for (const id of createdCategoryIds) {
      await api.deleteCategory(id).catch(() => {});
    }
  });

  test('Assign category to goal and unassign', async ({ page, api, indexPage, editGoalDialog }) => {
    const goalName = uniqueName('AssignCatGoal');
    const catName = uniqueName('UnassignCat');

    const catId = await api.createCategory(catName);
    createdCategoryIds.push(catId);
    
    const goalId = await api.createGoal(goalName);
    createdGoalIds.push(goalId);

    await indexPage.goto();

    const card = await indexPage.getGoalCardByName(goalName);
    await expect(card.categoryPill).not.toBeVisible();

    // Assign via edit dialog
    await card.clickEdit();
    await editGoalDialog.selectCategory(catName);
    await editGoalDialog.saveGoal();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(card.categoryPill).toHaveText(catName);

    // Unassign via edit dialog
    await card.clickEdit();
    await page.locator('#goal-category-edit').click();
    await page.getByRole('option', { name: 'No category' }).click();
    await editGoalDialog.saveGoal();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(card.categoryPill).not.toBeVisible();
  });

  test('Category color is deterministic', async ({ page, api, indexPage }) => {
    const catName = uniqueName('ColorCat');
    const goal1Name = uniqueName('Goal1');
    const goal2Name = uniqueName('Goal2');

    const catId = await api.createCategory(catName);
    createdCategoryIds.push(catId);
    
    const goal1Id = await api.createGoal(goal1Name, { category: catId });
    createdGoalIds.push(goal1Id);
    
    const goal2Id = await api.createGoal(goal2Name, { category: catId });
    createdGoalIds.push(goal2Id);

    await indexPage.goto();

    const card1 = await indexPage.getGoalCardByName(goal1Name);
    const card2 = await indexPage.getGoalCardByName(goal2Name);

    await expect(card1.categoryPill).toBeVisible();
    await expect(card2.categoryPill).toBeVisible();

    // Extract the class names from the pills to compare colors
    const pill1Class = await card1.categoryPill.getAttribute('class') || '';
    const pill2Class = await card2.categoryPill.getAttribute('class') || '';

    // The color classes (e.g. text-blue-600) should be identical for both pills
    expect(pill1Class).toEqual(pill2Class);
  });
});
