import { expect, Locator, Page } from '@playwright/test';

export class EditGoalDialog {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly notesInput: Locator;
  readonly showcaseUrlInput: Locator;
  readonly showcaseCaptionInput: Locator;
  readonly showcaseImageInput: Locator;
  readonly saveButton: Locator;

  constructor(public readonly page: Page) {
    this.titleInput = page.locator('#edit-title');
    this.descriptionInput = page.locator('#edit-desc');
    this.notesInput = page.locator('#edit-notes');
    this.showcaseUrlInput = page.locator('#edit-showcase-url');
    this.showcaseCaptionInput = page.locator('#edit-showcase-caption');
    this.showcaseImageInput = page.locator('#edit-showcase-image');
    this.saveButton = page.getByRole('button', { name: /^Save$/i });
  }

  async fillTitle(name: string): Promise<void> {
    await this.titleInput.fill(name);
  }

  async fillDescription(desc: string): Promise<void> {
    await this.descriptionInput.fill(desc);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes);
  }

  async selectDueDate(date: string): Promise<void> {
    await this.page.getByRole('button', { name: /Pick a date/i }).click();
    await this.page.getByRole('gridcell', { name: date }).click();
  }

  async clearDueDate(): Promise<void> {
    await this.page.getByRole('button', { name: /Clear date/i }).click();
  }

  async selectCategory(name: string): Promise<void> {
    await this.page.locator('#goal-category-edit').click();
    await this.page.getByRole('option', { name }).click();
  }

  async fillShowcaseUrl(url: string): Promise<void> {
    await this.showcaseUrlInput.fill(url);
  }

  async fillShowcaseCaption(caption: string): Promise<void> {
    await this.showcaseCaptionInput.fill(caption);
  }

  async uploadShowcaseImage(filePath: string): Promise<void> {
    await this.showcaseImageInput.setInputFiles(filePath);
  }

  async removeShowcaseImage(): Promise<void> {
    await this.page.getByRole('button', { name: /Remove image/i }).click();
  }

  async saveAsTemplate(): Promise<void> {
    await this.page.getByRole('button', { name: /Save as template/i }).click();
  }

  async duplicateGoal(): Promise<void> {
    await this.page.getByRole('button', { name: /Duplicate/i }).click();
  }

  async saveGoal(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async expectShowcaseVisible(): Promise<void> {
    await expect(this.showcaseUrlInput).toBeVisible();
  }

  async expectShowcaseHidden(): Promise<void> {
    await expect(this.showcaseUrlInput).not.toBeVisible();
  }
}
