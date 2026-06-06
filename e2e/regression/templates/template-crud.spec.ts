import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueName } from '../../helpers/test-data';

test.describe.skip('Template CRUD', () => {
  let createdGoalIds: string[] = [];

  test.beforeEach(() => {
    createdGoalIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdGoalIds) {
      await api.deleteGoal(id).catch(() => {});
    }
  });

  test('Create template from goal and apply it', async ({ page, api, indexPage, editGoalDialog }) => {
    const goalName = uniqueName('TemplateGoal');
    const templateDesc = 'Template Description';
    const goalId = await api.createGoal(goalName, { description: templateDesc });
    createdGoalIds.push(goalId);

    await indexPage.goto();

    const card = await indexPage.getGoalCardByName(goalName);
    await card.clickEdit();

    // Save as template
    await editGoalDialog.saveAsTemplate();
    
    // Verify toast
    await expect(page.getByText('Template saved')).toBeVisible();

    await editGoalDialog.cancel();

    // Now apply template to a new goal
    await indexPage.clickAddGoal();
    
    await page.getByRole('button', { name: /From template/i }).click();
    await page.getByRole('listitem').filter({ hasText: goalName }).getByRole('button', { name: 'Apply' }).click();

    // Verify fields populated
    const titleInput = page.locator('input[placeholder*="Goal title" i], input[name="title" i], #title, [aria-label*="title" i]').first();
    const descInput = page.locator('textarea[placeholder*="description" i], textarea[name="description" i], #description, [aria-label*="description" i]').first();

    await expect(titleInput).toHaveValue(goalName);
    await expect(descInput).toHaveValue(templateDesc);

    await page.keyboard.press('Escape'); // close dialog
  });
});
