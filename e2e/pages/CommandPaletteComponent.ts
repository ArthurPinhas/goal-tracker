import { expect, Locator, Page } from '@playwright/test';

export class CommandPaletteComponent {
  readonly dialog: Locator;
  readonly searchInput: Locator;

  constructor(public readonly page: Page) {
    this.dialog = page.locator('[role="dialog"]');
    this.searchInput = page.locator('[cmdk-input]');
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog).not.toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async selectItem(name: string): Promise<void> {
    await this.page.locator('[cmdk-item]', { hasText: name }).click();
  }
}
