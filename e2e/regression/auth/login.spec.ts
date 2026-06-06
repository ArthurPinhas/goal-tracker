import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Login @regression', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Valid login → home page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('e2e_user', 'testing123');
    await expect(page).toHaveURL('/');
  });

  test('Invalid password → error shown', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('e2e_user', 'wrong');
    await loginPage.expectErrorVisible();
  });

  test('Invalid username → error shown', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('wrong', 'testing123');
    await loginPage.expectErrorVisible();
  });

  test('Empty fields → button disabled or error', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginButton.click();
    // Assuming HTML5 required validation prevents submission, so URL shouldn't change
    await expect(page).toHaveURL(/\/login/);
  });

  test('Password visibility toggle', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.passwordInput.fill('secret');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });
});
