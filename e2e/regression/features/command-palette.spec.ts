import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Command Palette @regression', () => {
  test('Opens', async ({ indexPage, page, commandPalette }) => {
    await indexPage.goto();
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');
    await commandPalette.expectOpen();
  });
});
