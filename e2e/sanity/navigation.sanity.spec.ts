import { test, expect } from '../fixtures/test-fixtures';

test.describe('Navigation Sanity @sanity', () => {
  test('Main page loads with sidebar + list', async ({ page, indexPage, sidebar }) => {
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    await expect(indexPage.goalList).toBeVisible();
  });

  test('Filter tabs switch content', async ({ page, indexPage }) => {
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    
    await indexPage.selectTab('Done');
    expect(await indexPage.getActiveTab()).toContain('Done');
    
    await indexPage.selectTab('All');
    expect(await indexPage.getActiveTab()).toContain('All');
  });

  test('Search filters goals', async ({ page, indexPage, api }) => {
    const title = 'SEARCHABLE_UNIQUE_TEST_TITLE';
    const goalId = await api.createGoal(title);
    
    await indexPage.goto();
    await indexPage.waitForGoalsLoaded();
    
    await indexPage.search(title);
    await indexPage.expectGoalVisible(title);
    
    await indexPage.search('NONEXISTENT_BLABLABLA');
    await indexPage.expectGoalNotVisible(title);
    
    await api.deleteGoal(goalId);
  });

  test('Theme toggle dark ↔ light', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const isDark = await html.evaluate((el: HTMLElement) => el.classList.contains('dark'));
    
    await page.getByRole('button', { name: /Switch to/i }).click();
    
    const isDarkAfter = await html.evaluate((el: HTMLElement) => el.classList.contains('dark'));
    expect(isDarkAfter).not.toBe(isDark);
  });

  test('Cmd+K opens command palette', async ({ page, commandPalette, indexPage }) => {
    await page.goto('/');
    await indexPage.waitForGoalsLoaded();
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');
    
    await commandPalette.expectOpen();
  });
});
