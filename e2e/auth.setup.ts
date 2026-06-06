import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(process.cwd(), 'e2e/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Ensure the user exists in the DB (for fresh CI databases)
  try {
    await page.request.post('http://127.0.0.1:8090/api/collections/users/records', {
      data: {
        username: 'e2e_user',
        password: 'testing123',
        passwordConfirm: 'testing123'
      }
    });
  } catch (e) {
    // Ignore if user already exists
  }

  await page.goto('/login');
  await page.fill('#username', 'e2e_user');
  await page.fill('#password', 'testing123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  
  await expect(page).toHaveURL('/login');
  await page.context().storageState({ path: authFile });
});
