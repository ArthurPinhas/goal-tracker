import { test, expect } from '../fixtures/test-fixtures';

test.describe('Auth Sanity @sanity', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login with valid credentials → redirects to home', async ({ page, loginPage, indexPage }) => {
    await loginPage.goto();
    await loginPage.login('e2e_user', 'testing123');
    await expect(page).toHaveURL('/');
    await indexPage.waitForGoalsLoaded();
  });

  test('Register new user → auto-login → home', async ({ page, registerPage }) => {
    await registerPage.goto();
    const uniqueUser = `user_${Date.now()}`;
    await registerPage.register(uniqueUser, 'testing123');
    await expect(page).toHaveURL('/');
  });

  test('Logout → redirects to login', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('e2e_user', 'testing123');
    await expect(page).toHaveURL('/');
    
    // The logout button usually is an icon button
    await page.getByRole('button', { name: /Log out/i }).first().click();
    await loginPage.expectOnLoginPage();
  });

  test('Unauthenticated → redirect to /login', async ({ page, loginPage }) => {
    await page.goto('/');
    await loginPage.expectOnLoginPage();
  });
});
