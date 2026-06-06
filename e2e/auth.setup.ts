import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(process.cwd(), 'e2e/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'e2e_user');
  await page.fill('#password', 'testing123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: authFile });
});
