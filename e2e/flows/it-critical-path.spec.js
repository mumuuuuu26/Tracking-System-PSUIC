import { test, expect } from '@playwright/test';
import { createTicketAsUser, loginAs } from '../helpers/session';

const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:5002';
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test.describe('IT Critical Paths', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('IT can accept and draft-update a new ticket from detail page', async ({ page, request }) => {
    const { ticket } = await createTicketAsUser(request, `accept-${Date.now()}`);
    const itLogin = await loginAs(page, request, 'it');

    await page.goto(`${BASE_URL}/it/ticket/${ticket.id}`);
    await expect(page).toHaveURL(new RegExp(`/it/ticket/${ticket.id}`));

    const acceptButton = page.getByRole('button', { name: /^Accept$/i }).first();
    await expect(acceptButton).toBeVisible({ timeout: 15000 });
    await acceptButton.click();

    const noteBox = page.getByPlaceholder(/Describe the solution or diagnosis/i);
    await expect(noteBox).toBeVisible({ timeout: 15000 });
    await noteBox.fill('E2E draft note from IT critical flow');

    const saveDraftButton = page.getByRole('button', { name: /Save Draft/i });
    await expect(saveDraftButton).toBeVisible();
    await saveDraftButton.click();

    const verifyTicketRes = await request.get(`${API_BASE_URL}/api/ticket/${ticket.id}`, {
      headers: { Authorization: `Bearer ${itLogin.token}` },
    });
    expect(verifyTicketRes.ok()).toBeTruthy();

    const verifyTicket = await verifyTicketRes.json();
    expect(verifyTicket.status).toBe('in_progress');
    expect(verifyTicket.assignedToId).toBe(itLogin.payload.id);
  });

  test('tickets and history pages render core IT workflows', async ({ page, request }) => {
    await loginAs(page, request, 'it');

    await page.goto(`${BASE_URL}/it/tickets`);
    await expect(page).toHaveURL(/\/it\/tickets/);
    await expect(page.getByTestId('it-filter-floor')).toBeVisible();
    await expect(page.getByTestId('it-filter-room')).toBeVisible();
    await expect(page.getByText(/ticket(s)? found/i)).toBeVisible();

    const inProgressFilter = page.getByTestId('it-filter-status-in_progress');
    await expect(inProgressFilter).toBeVisible();
    await inProgressFilter.click();
    await expect(page).toHaveURL(/status=in_progress/);

    await page.goto(`${BASE_URL}/it/history`);
    await expect(page).toHaveURL(/\/it\/history/);
    await expect(page.getByText('Task History', { exact: true }).first()).toBeVisible();

    const emptyState = page.getByText(/No history found/i);
    const resolvedBadge = page.getByText(/Resolved/i).first();
    await expect(emptyState.or(resolvedBadge).first()).toBeVisible();
  });
});
