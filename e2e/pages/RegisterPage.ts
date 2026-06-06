import { expect, Locator, Page } from '@playwright/test';

export class RegisterPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly createAccountButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;

  constructor(public readonly page: Page) {
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.createAccountButton = page.getByRole('button', { name: /Create account/i });
    this.loginLink = page.getByText(/Sign in/i);
    this.errorMessage = page.locator('.text-destructive');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async register(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.createAccountButton.click();
  }

  async expectErrorVisible(text?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }
}
