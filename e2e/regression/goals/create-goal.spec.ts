import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe('Create Goal @regression', () => {
  test('Create with name only', async ({ indexPage, addGoalDialog, api }) => {
    await indexPage.goto();
    const title = uniqueName('goal');
    await indexPage.clickAddGoal();
    await addGoalDialog.fillName(title);
    await addGoalDialog.createGoal();
    await indexPage.expectGoalVisible(title);
  });

  test('Create with all fields', async ({ indexPage, addGoalDialog, api }) => {
    await indexPage.goto();
    const title = uniqueName('goal');
    await indexPage.clickAddGoal();
    await addGoalDialog.fillName(title);
    await addGoalDialog.fillDescription('desc');
    await addGoalDialog.fillNotes('notes');
    await addGoalDialog.createGoal();
    await indexPage.expectGoalVisible(title);
  });

  test('Name required — create button disabled when empty', async ({ indexPage, addGoalDialog }) => {
    await indexPage.goto();
    await indexPage.clickAddGoal();
    await addGoalDialog.fillName('');
    await expect(addGoalDialog.createButton).toBeDisabled();
  });

  test('Cancel doesnt create', async ({ indexPage, addGoalDialog }) => {
    await indexPage.goto();
    const title = uniqueName('goal');
    await indexPage.clickAddGoal();
    await addGoalDialog.fillName(title);
    await addGoalDialog.cancel();
    await indexPage.expectGoalNotVisible(title);
  });
});
