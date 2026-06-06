import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';
test.describe('Add Subtask @regression', () => {
  test('Add subtask with name', async ({ indexPage, addSubtaskDialog, api }) => {
    const title = uniqueName('goal');
    const id = await api.createGoal(title);
    await indexPage.goto();
    const card = await indexPage.getGoalCardByName(title);
    await card.clickAddSubtask();
    const subTitle = uniqueName('sub');
    await addSubtaskDialog.fillName(subTitle);
    await addSubtaskDialog.addSubtask();
    await expect((await card.getSubtaskByName(subTitle)).locator).toBeVisible();
  });
});