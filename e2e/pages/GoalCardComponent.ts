import { expect, Locator } from '@playwright/test';
import { SubtaskItemComponent } from './components/SubtaskItemComponent';

export class GoalCardComponent {
  public readonly categoryPill: Locator;

  constructor(public readonly card: Locator) {
    this.categoryPill = this.card.getByTestId('category-pill');
  }

  async getTitle(): Promise<string> {
    return await this.card.locator('p.font-medium').first().innerText();
  }

  async getProgressPercent(): Promise<number> {
    const text = await this.card.locator('[class*="tabular-nums"]').first().innerText();
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getProgressBarWidthPercent(): Promise<number> {
    const fill = this.card.getByTestId('progress-fill');
    const style = await fill.getAttribute('style');
    const match = style?.match(/width:\s*([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  async getDueDateText(): Promise<string | null> {
    const badge = this.card.getByTestId('due-date').first();
    if (await badge.isVisible()) {
      return await badge.innerText();
    }
    return null;
  }

  async getCategoryName(): Promise<string | null> {
    // Might just be inside a pill with aria-label
    const badge = this.card.getByTestId('category-pill').first();
    if (await badge.isVisible()) {
      return await badge.innerText();
    }
    return null;
  }

  async getSubtaskCount(): Promise<number> {
    return await this.card.locator('[id^="subtask-check-"]').count();
  }

  async isExpanded(): Promise<boolean> {
    return await this.card.locator('[role="region"]').isVisible();
  }

  async expand(): Promise<void> {
    const isExp = await this.isExpanded();
    if (!isExp) {
      await this.card.getByRole('button', { name: /Expand/i }).click();
    }
  }

  async collapse(): Promise<void> {
    const isExp = await this.isExpanded();
    if (isExp) {
      await this.card.getByRole('button', { name: /Collapse/i }).click();
    }
  }

  async clickEdit(): Promise<void> {
    await this.card.getByRole('button', { name: /Edit/i }).first().click();
  }

  async clickDuplicate(): Promise<void> {
    await this.card.getByRole('button', { name: /Duplicate/i }).first().click();
  }

  async clickArchive(): Promise<void> {
    await this.card.getByRole('button', { name: /Archive/i }).first().click();
  }

  async clickDelete(): Promise<void> {
    await this.card.getByRole('button', { name: /Delete/i }).first().click();
  }

  async confirmDelete(): Promise<void> {
    await this.card.page().getByRole('button', { name: 'Delete' }).click();
  }

  async clickAddSubtask(): Promise<void> {
    await this.card.getByRole('button', { name: /Add/i }).click();
  }

  async getSubtaskByName(name: string): Promise<SubtaskItemComponent> {
    const subtaskLoc = this.card.locator('[class*="group/sub"]').filter({ hasText: name }).first();
    return new SubtaskItemComponent(subtaskLoc);
  }

  async getSubtaskNames(): Promise<string[]> {
    const locators = await this.card.locator('[id^="subtask-label-"]').all();
    return await Promise.all(locators.map(l => l.innerText()));
  }

  async toggleStandaloneComplete(): Promise<void> {
    await this.card.locator('[id^="goal-standalone-"]').click();
  }
}
