import { expect, Locator } from '@playwright/test';

export class SubtaskItemComponent {
  constructor(public readonly locator: Locator) {}

  async getName(): Promise<string> {
    return await this.locator.locator('[id^="subtask-label-"]').innerText();
  }

  async isCompleted(): Promise<boolean> {
    return await this.locator.locator('button[role="checkbox"]').getAttribute('aria-checked') === 'true';
  }

  async getEffort(): Promise<number | null> {
    const text = await this.locator.locator('[aria-label*="effort"]').first().innerText();
    if (!text) return null;
    return parseInt(text, 10);
  }

  async toggleComplete(): Promise<void> {
    await this.locator.locator('button[role="checkbox"]').click();
  }

  async rename(newName: string): Promise<void> {
    await this.locator.getByRole('button', { name: /edit name/i }).first().click();
    const input = this.locator.getByLabel(/Subtask name/i);
    await input.fill(newName);
    await input.press('Enter');
  }

  async setEffort(effort: 1|2|3|4|5): Promise<void> {
    await this.locator.getByRole('button', { name: /effort/i }).first().click();
    const map: Record<number, string> = { 1: 'Quick', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Major' };
    await this.locator.getByRole('button', { name: new RegExp('^' + map[effort] + '$', 'i') }).click();
  }

  async clearEffort(): Promise<void> {
    await this.locator.getByRole('button', { name: /effort/i }).first().click();
    await this.locator.page().getByRole('menuitem', { name: /Clear/i }).click();
  }

  async delete(): Promise<void> {
    await this.locator.getByRole('button', { name: /Delete subtask/i }).click();
  }

  async expandNotes(): Promise<void> {
    await this.locator.getByRole('button', { name: /Notes/i }).click();
  }

  async editNotes(text: string): Promise<void> {
    await this.expandNotes();
    const input = this.locator.getByLabel(/Notes for/i);
    await input.fill(text);
    await input.press('Escape');
  }
}
