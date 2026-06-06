import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Category CRUD', () => {
  let createdCategoryIds: string[] = [];
  let createdGoalIds: string[] = [];

  test.beforeEach(async ({ api }) => {
    createdCategoryIds = [];
    createdGoalIds = [];
    // Ensure there's at least one goal so the toolbar (and category filter) is always visible.
    const goalId = await api.createGoal(uniqueName('Dummy Goal'));
    createdGoalIds.push(goalId);
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
    for (const id of createdCategoryIds) {
      await api.deleteCategory(id).catch(() => {});
    }
  });

  test('Create category via manage dialog -> verify in list -> verify in GoalCategoryPicker', async ({ page, indexPage, categoriesDialog }) => {
    const categoryName = uniqueName('CategoryTest');
    await indexPage.goto();

    // Open manage categories dialog
    await categoriesDialog.open();

    // Create category
    await categoriesDialog.createCategory(categoryName);

    // Verify it appears in the manage dialog list
    await expect(page.getByRole('dialog').getByText(categoryName)).toBeVisible();
    await categoriesDialog.close();

    // Open Add Goal dialog and verify it appears in the Category Picker
    await page.getByRole('button', { name: /New Goal/i }).click();
    await page.getByRole('combobox', { name: /Category/i }).click();
    await expect(page.getByRole('option', { name: categoryName })).toBeVisible();
  });

  test('Rename category -> verify updated everywhere', async ({ page, api, indexPage, categoriesDialog, addGoalDialog }) => {
    const oldName = uniqueName('OldCat');
    const newName = uniqueName('RenamedCat');

    // Create via API
    const catId = await api.createCategory(oldName);
    createdCategoryIds.push(catId);

    await indexPage.goto();

    // Open manage categories dialog and rename
    await categoriesDialog.open();
    await categoriesDialog.renameCategory(oldName, newName);

    // Verify updated in the dialog
    await expect(page.getByRole('dialog').getByText(newName)).toBeVisible();
    await categoriesDialog.close();

    // Verify updated in Category Filter
    await indexPage.openCategoryFilter();
    await page.getByText('Only selected categories').click();
    await expect(page.locator('label').filter({ hasText: newName })).toBeVisible();
    await page.keyboard.press('Escape');

    // Verify updated in GoalCategoryPicker
    await page.getByRole('button', { name: /New Goal/i }).click();
    await page.getByRole('combobox', { name: /Category/i }).click();
    await expect(page.getByRole('option', { name: newName })).toBeVisible();
  });

  test('Delete category (no goals) -> verify gone', async ({ page, api, indexPage, categoriesDialog }) => {
    const catName = uniqueName('ToBeDeleted');
    const catId = await api.createCategory(catName);
    createdCategoryIds.push(catId);
    
    await indexPage.goto();

    await categoriesDialog.open();
    await categoriesDialog.deleteCategory(catName);

    // Confirm delete in the alert dialog
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();

    // Verify it's gone from the dialog
    await expect(page.getByRole('dialog').getByText(catName)).not.toBeVisible();
    await categoriesDialog.close();

    // Verify it's gone from the category filter
    await indexPage.openCategoryFilter();
    await expect(page.getByRole('menuitemcheckbox', { name: catName })).not.toBeVisible();
  });

  test('Delete category (with goals) -> verify goal loses category', async ({ page, api, indexPage, categoriesDialog }) => {
    const catName = uniqueName('CatWithGoals');
    const goalName = uniqueName('GoalWithCat');

    // Create category
    const catId = await api.createCategory(catName);
    createdCategoryIds.push(catId);
    
    // Create goal and assign category
    const goalId = await api.createGoal(goalName, { category: catId });
    createdGoalIds.push(goalId);

    await indexPage.goto();

    // Verify category is shown on the goal card
    const card = await indexPage.getGoalCardByName(goalName);
    await expect(card.categoryPill).toHaveText(catName);

    // Delete category
    await categoriesDialog.open();
    await categoriesDialog.deleteCategory(catName);
    
    // Confirm delete in the alert dialog
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();

    // Close the dialog
    await categoriesDialog.close();

    // Verify category pill is gone from the goal card
    await expect(card.categoryPill).not.toBeVisible();
  });
});

