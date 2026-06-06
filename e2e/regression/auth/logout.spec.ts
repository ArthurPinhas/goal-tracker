import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Logout @regression', () => {
  test('Logout clears session', async ({ page, loginPage }) => {
    await page.goto('/');
    const logoutBtn = page.getByRole('button', { name: /Log out/i }).first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await loginPage.expectOnLoginPage();
  });

  test('Re-login after logout', async ({ page, loginPage }) => {
    await page.goto('/');
    const logoutBtn = page.getByRole('button', { name: /Log out/i }).first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await loginPage.expectOnLoginPage();
    await loginPage.login('e2e_user', 'testing123');
    await expect(page).toHaveURL('/');
  });
});
