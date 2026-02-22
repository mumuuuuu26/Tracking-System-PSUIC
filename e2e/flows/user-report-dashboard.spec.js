import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

async function login(page) {
  await page.goto(BASE_URL + '/login');
  
  const loginEmailBtn = page.getByText(/login with email/i);
  if (await loginEmailBtn.isVisible()) {
      await loginEmailBtn.click();
  }

  await page.getByLabel(/email/i).fill('e2e@test.com');
  await page.getByLabel(/password/i).fill('12345678');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.locator('body')).not.toContainText('sign in');
  // ensure we hit the user dashboard
  await expect(page).toHaveURL(/user/);
}

test.describe('User History Dashboard', () => {
  // Use mobile viewport for all tests in this file because LayoutUser hides nav on desktop
  test.use({ viewport: { width: 375, height: 667 } });

  test('navigate to history page', async ({ page }) => {
    await login(page);

    // open history
    await page.locator('[data-testid="nav-history"]:visible').click();

    // confirm page really loaded
    await expect(page).toHaveURL(/history/);
    await expect(page.getByText('Task History', { exact: true }).first()).toBeVisible();
  });


  test('filter tickets', async ({ page }) => {
    await login(page);
    await page.locator('[data-testid="nav-history"]:visible').click();
    await expect(page).toHaveURL(/history/);

    // In TicketHistory, categories are buttons. The first is "All".
    // We want to click the second button if it exists.
    const buttons = page.getByRole('button');
    const categoryButtons = buttons.filter({ hasText: /All|Hardware|Software|Network/i });
    
    if (await categoryButtons.count() > 1) {
      await categoryButtons.nth(1).click();
    }

    // verify table still renders (or empty state renders)
    // "ticket-row" data-testid is in UserTicketCard
    const row = page.getByTestId('ticket-row').first();
    const emptyState = page.getByText(/No tickets found/i);
    await expect(row.or(emptyState).first()).toBeVisible();
  });


  test('open ticket detail', async ({ page }) => {
    await login(page);
    await page.locator('[data-testid="nav-history"]:visible').click();
    await expect(page).toHaveURL(/history/);

    const rows = page.getByTestId('ticket-row');

    if (await rows.count() > 0) {
      // Click the row/card itself which navigates to detail
      await rows.first().click({ force: true });

      // detail page indicator
      await expect(page).toHaveURL(/ticket|detail|view/);
    } else {
      test.skip(true, 'No ticket available in seed data');
    }
  });

});
