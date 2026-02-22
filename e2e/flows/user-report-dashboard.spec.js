import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

async function login(page, request) {
  const loginResponse = await request.post('http://localhost:5002/api/login', {
    data: {
      email: 'e2e@test.com',
      password: '12345678',
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const loginData = await loginResponse.json();
  await page.addInitScript((value) => {
    window.localStorage.setItem('auth-store', JSON.stringify(value));
    window.localStorage.setItem('token', value.state.token);
  }, {
    state: {
      user: loginData.payload,
      token: loginData.token,
      hasHydrated: true,
    },
    version: 0,
  });

  await page.goto(`${BASE_URL}/user`);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/user/);
}

async function clickFirstTicketRowWithRetry(page, maxAttempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const firstRow = page.getByTestId('ticket-row').first();
    try {
      await expect(firstRow).toBeVisible({ timeout: 5000 });
      await firstRow.click({ force: true });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.waitForTimeout(200);
      }
    }
  }

  throw lastError;
}

test.describe('User History Dashboard', () => {
  // Use mobile viewport for all tests in this file because LayoutUser hides nav on desktop
  test.use({ viewport: { width: 375, height: 667 } });

  test('navigate to history page', async ({ page, request }) => {
    await login(page, request);

    // open history
    await page.locator('[data-testid="nav-history"]:visible').click();

    // confirm page really loaded
    await expect(page).toHaveURL(/history/);
    await expect(page.getByText('Task History', { exact: true }).first()).toBeVisible();
  });


  test('filter tickets', async ({ page, request }) => {
    await login(page, request);
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


  test('open ticket detail', async ({ page, request }) => {
    await login(page, request);
    await page.locator('[data-testid="nav-history"]:visible').click();
    await expect(page).toHaveURL(/history/);

    const rows = page.getByTestId('ticket-row');
    const firstRow = rows.first();
    const emptyState = page.getByText(/No tickets found/i);

    await expect(firstRow.or(emptyState).first()).toBeVisible({ timeout: 10000 });

    if (await firstRow.isVisible()) {
      // Ticket cards can re-render while list data settles, so click with retry.
      await clickFirstTicketRowWithRetry(page);

      // detail page indicator
      await expect(page).toHaveURL(/ticket|detail|view/);
    } else {
      test.skip(true, 'No ticket available in seed data');
    }
  });

});
