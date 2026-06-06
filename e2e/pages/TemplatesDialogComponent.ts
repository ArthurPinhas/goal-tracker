import { expect, Locator, Page } from '@playwright/test';

export class TemplatesDialogComponent {
  readonly dialog: Locator;

  constructor(public readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({ hasText: /Templates/i });
  }

  async selectTemplate(name: string): Promise<void> {
    const row = this.dialog.locator('.group').filter({ hasText: name });
    await row.getByRole('button', { name: /Apply/i }).click();
  }

  async deleteTemplate(name: string): Promise<void> {
    const row = this.dialog.locator('.group').filter({ hasText: name });
    await row.getByRole('button', { name: /Delete/i }).click();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
