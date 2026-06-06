import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Register', () => {
  // Use a fresh context for these tests so we are not logged in
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Register page loads', async ({ page }) => {
    await page.goto('/register');
    // Verify form renders
    await expect(page.getByRole('button', { name: /Create account|Sign up/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Password < 8 chars -> client error', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form
    await page.locator('input[type="text"], input[type="email"], #username').first().fill('testuser_reg');
    await page.locator('input[type="password"]').fill('short');
    
    // Submit
    await page.getByRole('button', { name: /Create account|Sign up/i }).click();

    // Verify error message. We expect something about password length
    await expect(page.getByText(/password.*8/i)).toBeVisible();
  });

  test('Navigate to login link', async ({ page }) => {
    await page.goto('/register');
    
    // Click "Sign in" link
    await page.getByRole('link', { name: /Sign in/i }).click();

    // Verify on /login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
