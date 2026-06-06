import { expect, Locator } from '@playwright/test';

export class ProgressBarComponent {
  constructor(public readonly locator: Locator) {}
  
  async getPercentage(): Promise<number> {
    const text = await this.locator.innerText();
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
