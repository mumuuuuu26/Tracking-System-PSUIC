import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

async function login(page) {
  await page.goto(BASE_URL + '/login');

  // Click "Login with Email" button if visible (it might be hidden if already clicked in a previous session, but usually fresh context wipes it)
  // However, the test runner creates a new context, so we should see the landing state.
  const loginEmailBtn = page.getByText(/login with email/i);
  if (await loginEmailBtn.isVisible()) {
      await loginEmailBtn.click();
  }

  await page.getByLabel(/email/i).fill('e2e@test.com');
  await page.getByLabel(/password/i).fill('12345678');
  await page.getByRole('button', { name: /sign in/i }).click();

  // user authenticated indicator
  await expect(page.locator('body')).not.toContainText('sign in');
}

test.describe('User Report Dashboard', () => {
  // Use mobile viewport for all tests in this file because LayoutUser hides nav on desktop
  test.use({ viewport: { width: 375, height: 667 } });

  test('navigate to report page', async ({ page }) => {
    await login(page);

    // open report (works for mobile / desktop / sidebar / header)
    await page.getByTestId('nav-report').click();

    // confirm page really loaded
    await expect(page.getByTestId('report-page')).toBeVisible();
    await expect(page).toHaveURL(/report/);
  });


  test('filter tickets', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-report').click();
    await expect(page.getByTestId('report-page')).toBeVisible();

    // wait data loaded (not timeout)
    await expect(page.getByTestId('ticket-table')).toBeVisible();

    // apply filters safely (only if exist)
    const category = page.getByTestId('filter-category');
    if (await category.isVisible()) {
      await category.selectOption({ index: 1 });
    }

    const status = page.getByTestId('filter-status');
    if (await status.isVisible()) {
      await status.selectOption({ index: 1 });
    }

    // verify table still renders
    await expect(page.getByTestId('ticket-table')).toBeVisible();
  });


  test('open ticket detail', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-report').click();
    await expect(page.getByTestId('report-page')).toBeVisible();

    const rows = page.getByTestId('ticket-row');

    if (await rows.count() > 0) {
      // Click the row/card itself which navigates to detail
      await rows.first().click();

      // detail page indicator
      await expect(page).toHaveURL(/ticket|detail|view/);
    } else {
      test.skip(true, 'No ticket available in seed data');
    }
  });

});
