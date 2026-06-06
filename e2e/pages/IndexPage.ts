import { expect, Locator, Page } from '@playwright/test';
import { GoalCardComponent } from './GoalCardComponent';

export class IndexPage {
  readonly searchInput: Locator;
  readonly emptyState: Locator;
  readonly goalList: Locator;
  readonly skeletonCard: Locator;

  constructor(public readonly page: Page) {
    this.searchInput = page.getByTestId('search-input');
    this.emptyState = page.getByTestId('empty-state');
    this.goalList = page.getByTestId('goal-list');
    this.skeletonCard = page.locator('.animate-pulse');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForGoalsLoaded();
  }

  async waitForGoalsLoaded(): Promise<void> {
    await expect(this.skeletonCard).toHaveCount(0);
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
  }

  async selectTab(tab: string): Promise<void> {
    await this.page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();
  }

  async getActiveTab(): Promise<string> {
    return await this.page.locator('[role="tab"][aria-selected="true"]').innerText();
  }

  async selectDeadlineFilter(filter: 'Any' | 'Has date' | 'Overdue' | '≤7 days'): Promise<void> {
    await this.page.getByRole('button', { name: /Due date/i }).click();
    await this.page.getByRole('radio', { name: filter }).click();
    await this.page.keyboard.press('Escape');
  }

  async selectSort(sort: string): Promise<void> {
    await this.page.getByRole('combobox', { name: /Sort goals/i }).click();
    await this.page.getByRole('option', { name: new RegExp(sort, 'i') }).click();
  }

  async openCategoryFilter(): Promise<void> {
    await this.page.getByRole('button', { name: 'Category filter' }).click();
  }

  async selectCategory(name: string): Promise<void> {
    await this.openCategoryFilter();
    await this.page.getByRole('menuitemcheckbox', { name }).click();
    await this.page.keyboard.press('Escape');
  }

  async getGoalCardByName(name: string): Promise<GoalCardComponent> {
    const loc = this.page.locator(`[id^="goal-card-"]`, { hasText: name }).first();
    return new GoalCardComponent(loc);
  }

  async getVisibleGoalCount(): Promise<number> {
    return await this.page.locator('[id^="goal-card-"]').count();
  }

  async expectGoalVisible(name: string): Promise<void> {
    const card = await this.getGoalCardByName(name);
    // Since card is a GoalCardComponent, we access the underlying locator.
    // However, GoalCardComponent might not expose it publicly. Let's make it public or use the title check.
    // Or we can just find it again:
    await expect(this.page.locator(`[id^="goal-card-"]`, { hasText: name }).first()).toBeVisible();
  }

  async expectGoalNotVisible(name: string): Promise<void> {
    await expect(this.page.locator(`[id^="goal-card-"]`, { hasText: name }).first()).not.toBeVisible();
  }

  async expectGoalOrder(names: string[]): Promise<void> {
    const cards = this.page.locator('[id^="goal-card-"]');
    await expect(cards).toHaveCount(names.length);
    for (let i = 0; i < names.length; i++) {
      await expect(cards.nth(i)).toContainText(names[i]);
    }
  }

  async enterBulkSelectMode(): Promise<void> {
    await this.page.getByRole('button', { name: /Select/i }).first().click();
  }

  async selectGoalInBulk(name: string): Promise<void> {
    await this.page.getByRole('checkbox', { name: new RegExp(`Select.*${name}`, 'i') }).check();
  }

  async bulkDelete(): Promise<void> {
    await this.page.getByRole('button', { name: /Delete \(\d+\)/i }).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  async bulkArchive(): Promise<void> {
    await this.page.getByRole('button', { name: /Archive selected/i }).click();
  }

  async expandAll(): Promise<void> {
    await this.page.getByRole('button', { name: /Expand all/i }).click();
  }

  async collapseAll(): Promise<void> {
    await this.page.getByRole('button', { name: /Collapse all/i }).click();
  }

  async clickAddGoal(): Promise<void> {
    await this.page.getByRole('button', { name: /New goal/i }).first().click();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }
}
