import { expect, Locator, Page } from '@playwright/test';

export class SidebarComponent {
  readonly insightsToggle: Locator;
  readonly exportButton: Locator;

  constructor(public readonly page: Page) {
    this.insightsToggle = page.getByRole('button', { name: /Insights/i });
    this.exportButton = page.getByRole('button', { name: /Export/i });
  }

  async getStatValue(statName: string): Promise<string> {
    // E.g. data-testid="sidebar-stat-active"
    return await this.page.getByTestId(`sidebar-stat-${statName.toLowerCase()}`).innerText();
  }

  async isInsightsExpanded(): Promise<boolean> {
    return await this.insightsToggle.getAttribute('aria-expanded') === 'true';
  }

  async toggleInsights(): Promise<void> {
    await this.insightsToggle.click();
  }

  async openExport(): Promise<void> {
    await this.exportButton.click();
  }
}
