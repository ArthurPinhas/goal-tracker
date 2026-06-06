import { Locator, Page } from '@playwright/test';

export class AddSubtaskDialog {
  readonly nameInput: Locator;
  readonly notesInput: Locator;
  readonly addButton: Locator;

  constructor(public readonly page: Page) {
    this.nameInput = page.locator('#subtask-title');
    this.notesInput = page.locator('#subtask-notes');
    this.addButton = page.getByRole('button', { name: /Add subtask/i });
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes);
  }

  async addSubtask(): Promise<void> {
    await this.addButton.click();
  }

  async cancel(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
