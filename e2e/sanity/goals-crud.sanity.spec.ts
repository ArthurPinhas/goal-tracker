import { test, expect } from '../fixtures/test-fixtures';
import { uniqueName } from '../helpers/test-data';

test.describe('Goals CRUD Sanity @sanity', () => {
  test('Create goal → appears in list', async ({ page, indexPage, addGoalDialog, api }) => {
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    const title = uniqueName('goal');
    
    await indexPage.clickAddGoal();
    await addGoalDialog.fillName(title);
    await addGoalDialog.createGoal();
    
    await indexPage.expectGoalVisible(title);
    
    const goals = await api.getAllGoals();
    const goal = goals.find((g: any) => g.title === title);
    if (goal) await api.deleteGoal(goal.id);
  });

  test('Add subtask → shows in card', async ({ page, indexPage, addSubtaskDialog, api }) => {
    const title = uniqueName('goal');
    const goalId = await api.createGoal(title);
    
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    
    const card = await indexPage.getGoalCardByName(title);
    await card.clickAddSubtask();

    const subTitle = uniqueName('sub');
    await addSubtaskDialog.fillName(subTitle);
    await addSubtaskDialog.addSubtask();

    const subtask = await card.getSubtaskByName(subTitle);
    await expect(subtask.locator).toBeVisible();

    await api.deleteGoal(goalId);
  });

  test('Toggle subtask → progress updates', async ({ page, indexPage, api }) => {
    const title = uniqueName('goal');
    const goalId = await api.createGoal(title);
    await api.createSubtask(goalId, uniqueName('sub'));
    
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    
    const card = await indexPage.getGoalCardByName(title);
    await card.expand(); 
    const subnames = await card.getSubtaskNames();
    if (subnames.length > 0) {
      const subtask = await card.getSubtaskByName(subnames[0]);
      await subtask.toggleComplete();
      
      await expect(async () => {
        const pct = await card.getProgressPercent();
        expect(pct).toBeGreaterThan(0);
      }).toPass();
    }
    
    await api.deleteGoal(goalId);
  });

  test('Delete goal → gone from list', async ({ page, indexPage, api }) => {
    const title = uniqueName('goal');
    const goalId = await api.createGoal(title);
    
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    
    const card = await indexPage.getGoalCardByName(title);
    await card.clickDelete();
    await card.confirmDelete();
    
    await indexPage.expectGoalNotVisible(title);
  });

  test('Goal with due date → badge shown', async ({ page, indexPage, addGoalDialog, api }) => {
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    const title = uniqueName('goal');
    
    await indexPage.clickAddGoal();
    await addGoalDialog.fillName(title);
    await addGoalDialog.selectDueDate('15');
    await addGoalDialog.createGoal();
    
    const card = await indexPage.getGoalCardByName(title);
    const dateText = await card.getDueDateText();
    expect(dateText).not.toBeNull();
    
    const goals = await api.getAllGoals();
    const goal = goals.find((g: any) => g.title === title);
    if (goal) await api.deleteGoal(goal.id);
  });
});
