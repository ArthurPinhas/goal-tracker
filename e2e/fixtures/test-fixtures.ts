import { test as base } from '@playwright/test';
import { APIHelpers } from '../helpers/api-helpers';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { IndexPage } from '../pages/IndexPage';
import { AddGoalDialog } from '../pages/AddGoalDialog';
import { EditGoalDialog } from '../pages/EditGoalDialog';
import { AddSubtaskDialog } from '../pages/AddSubtaskDialog';
import { SidebarComponent } from '../pages/SidebarComponent';
import { CommandPaletteComponent } from '../pages/CommandPaletteComponent';
import { ExportDialogComponent } from '../pages/ExportDialogComponent';
import { ManageCategoriesDialog } from '../pages/ManageCategoriesDialog';
import { TemplatesDialogComponent } from '../pages/TemplatesDialogComponent';

type Fixtures = {
  api: APIHelpers;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  indexPage: IndexPage;
  addGoalDialog: AddGoalDialog;
  editGoalDialog: EditGoalDialog;
  addSubtaskDialog: AddSubtaskDialog;
  sidebar: SidebarComponent;
  commandPalette: CommandPaletteComponent;
  exportDialog: ExportDialogComponent;
  categoriesDialog: ManageCategoriesDialog;
  templatesDialog: TemplatesDialogComponent;
};

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const res = await fetch('http://127.0.0.1:8090/api/collections/users/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'e2e_user@goaltracker.local', password: 'testing123' })
    });
    const authData = await res.json();
    const api = new APIHelpers(authData.token, authData.record.id);
    await use(api);
  },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  registerPage: async ({ page }, use) => { await use(new RegisterPage(page)); },
  indexPage: async ({ page }, use) => { await use(new IndexPage(page)); },
  addGoalDialog: async ({ page }, use) => { await use(new AddGoalDialog(page)); },
  editGoalDialog: async ({ page }, use) => { await use(new EditGoalDialog(page)); },
  addSubtaskDialog: async ({ page }, use) => { await use(new AddSubtaskDialog(page)); },
  sidebar: async ({ page }, use) => { await use(new SidebarComponent(page)); },
  commandPalette: async ({ page }, use) => { await use(new CommandPaletteComponent(page)); },
  exportDialog: async ({ page }, use) => { await use(new ExportDialogComponent(page)); },
  categoriesDialog: async ({ page }, use) => { await use(new ManageCategoriesDialog(page)); },
  templatesDialog: async ({ page }, use) => { await use(new TemplatesDialogComponent(page)); },
});

export { expect } from '@playwright/test';
