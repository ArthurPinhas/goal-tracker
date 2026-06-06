import { expect, Locator, Page } from '@playwright/test';

export class ManageCategoriesDialog {
  readonly dialog: Locator;

  constructor(public readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({ hasText: /Categories/i });
  }

  async open(): Promise<void> {
    await this.page.getByTitle('Rename or delete categories').click();
  }

  async createCategory(name: string): Promise<void> {
    const input = this.dialog.getByPlaceholder(/New category/i);
    await input.fill(name);
    await this.dialog.getByRole('button', { name: /Add/i }).click();
  }

  async renameCategory(oldName: string, newName: string): Promise<void> {
    const row = this.dialog.locator('.flex').filter({ hasText: oldName });
    await row.getByRole('button', { name: /Rename/i }).click();
    const input = this.dialog.getByLabel('Category name', { exact: true });
    await input.fill(newName);
    await input.press('Enter');
    await expect(this.dialog.locator('.flex').filter({ hasText: newName }).first()).toBeVisible();
  }

  async deleteCategory(name: string): Promise<void> {
    const row = this.dialog.locator('.flex').filter({ hasText: name });
    await row.getByRole('button', { name: /Delete/i }).click();
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Close' }).click();
    await expect(this.dialog).not.toBeVisible();
  }
}
