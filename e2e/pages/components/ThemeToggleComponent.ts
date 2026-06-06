import { expect, Locator, Page } from '@playwright/test';

export class ThemeToggleComponent {
  readonly toggleBtn: Locator;
  
  constructor(public readonly page: Page) {
    this.toggleBtn = page.getByRole('button', { name: /Switch to/i });
  }

  async toggle(): Promise<void> {
    await this.toggleBtn.click();
  }

  async isDark(): Promise<boolean> {
    const html = this.page.locator('html');
    return await html.evaluate((el: HTMLElement) => el.classList.contains('dark'));
  }
}
