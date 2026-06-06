import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Edit Goal', () => {
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

  test('Edit name', async ({ page, api, indexPage, editGoalDialog }) => {
    const goalName = uniqueName('GoalToEdit');
    const newName = uniqueName('GoalRenamed');

    const goalId = await api.createGoal(goalName);
    createdGoalIds.push(goalId);

    await indexPage.goto();
    
    const card = await indexPage.getGoalCardByName(goalName);
    await card.clickEdit();

    await editGoalDialog.fillTitle(newName);
    await editGoalDialog.saveGoal();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(card.card).not.toBeVisible();
    
    const newCard = await indexPage.getGoalCardByName(newName);
    await expect(newCard.card).toBeVisible();
  });

  test('Edit description', async ({ page, api, indexPage, editGoalDialog }) => {
    const goalName = uniqueName('GoalDescEdit');
    const goalId = await api.createGoal(goalName, { description: 'Old Description' });
    createdGoalIds.push(goalId);

    await indexPage.goto();
    
    const card = await indexPage.getGoalCardByName(goalName);
    await card.clickEdit();

    await editGoalDialog.fillDescription('New Description');
    await editGoalDialog.saveGoal();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await card.expand();
    
    // Check description in the expanded card if visible.
    // In our UI, description is shown in the card if available.
    await expect(card.card.getByText('New Description')).toBeVisible();
  });

  test('Edit notes', async ({ page, api, indexPage, editGoalDialog }) => {
    const goalName = uniqueName('GoalNotesEdit');
    const goalId = await api.createGoal(goalName, { notes: 'Old Notes' });
    createdGoalIds.push(goalId);

    await indexPage.goto();
    
    const card = await indexPage.getGoalCardByName(goalName);
    await card.clickEdit();

    await editGoalDialog.fillNotes('New Notes');
    await editGoalDialog.saveGoal();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Notes are not directly on the card, but we can verify by opening edit dialog again
    await card.clickEdit();
    await expect(editGoalDialog.notesInput).toHaveValue('New Notes');
  });

  test('Change category', async ({ page, api, indexPage, editGoalDialog }) => {
    const goalName = uniqueName('GoalCatEdit');
    const cat1Name = uniqueName('Cat1');
    const cat2Name = uniqueName('Cat2');

    const cat1Id = await api.createCategory(cat1Name);
    createdCategoryIds.push(cat1Id);
    const cat2Id = await api.createCategory(cat2Name);
    createdCategoryIds.push(cat2Id);

    const goalId = await api.createGoal(goalName, { category: cat1Id });
    createdGoalIds.push(goalId);

    await indexPage.goto();
    
    const card = await indexPage.getGoalCardByName(goalName);
    await expect(card.categoryPill).toHaveText(cat1Name);

    await card.clickEdit();
    await editGoalDialog.selectCategory(cat2Name);
    await editGoalDialog.saveGoal();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(card.categoryPill).toHaveText(cat2Name);
  });
});
