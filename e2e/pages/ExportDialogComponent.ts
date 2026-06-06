import { expect, Locator, Page } from '@playwright/test';

export class ExportDialogComponent {
  readonly dialog: Locator;

  constructor(public readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({ hasText: /Export/i });
  }

  async downloadJSON(): Promise<void> {
    await this.dialog.getByRole('button', { name: /Download JSON/i }).click();
  }

  async downloadCSV(): Promise<void> {
    await this.dialog.getByRole('button', { name: /Download CSV/i }).click();
  }

  async downloadPDF(): Promise<void> {
    await this.dialog.getByRole('button', { name: /Download PDF/i }).click();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
