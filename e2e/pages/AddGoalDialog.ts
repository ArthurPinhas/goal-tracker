import { expect, Locator, Page } from '@playwright/test';

export class AddGoalDialog {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly notesInput: Locator;
  readonly createButton: Locator;

  constructor(public readonly page: Page) {
    this.titleInput = page.locator('#goal-title');
    this.descriptionInput = page.locator('#goal-desc');
    this.notesInput = page.locator('#goal-notes');
    this.createButton = page.getByRole('button', { name: /^Create$/i });
  }

  async fillName(name: string): Promise<void> {
    await this.titleInput.fill(name);
  }

  async fillDescription(desc: string): Promise<void> {
    await this.descriptionInput.fill(desc);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes);
  }

  async selectDueDate(date: string): Promise<void> {
    await this.page.locator('#goal-due').click();
    // Assuming 'date' is a visible text in the calendar, or format that can be clicked
    // Just click the day if it matches text. Note: more robust way is needed if the date is complex
    await this.page.getByRole('gridcell', { name: date }).click();
  }

  async clearDueDate(): Promise<void> {
    await this.page.getByRole('button', { name: /Clear date/i }).click();
  }

  async selectCategory(name: string): Promise<void> {
    await this.page.locator('#goal-category-new').click();
    await this.page.getByRole('option', { name }).click();
  }

  async createGoal(): Promise<void> {
    await this.createButton.click();
  }

  async cancel(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  async expectCreateDisabled(): Promise<void> {
    await expect(this.createButton).toBeDisabled();
  }
}
