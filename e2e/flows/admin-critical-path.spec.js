import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/session';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test.describe('Admin Critical Paths', () => {
  test('dashboard and reports pages load critical analytics widgets', async ({ page, request }) => {
    await loginAs(page, request, 'admin');

    await expect(page.getByText('Analytics Dashboard', { exact: true }).first()).toBeVisible();

    await page.getByRole('link', { name: /reports/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/reports/);
    await expect(page.getByText('System Reports', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /export pdf/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /export excel/i })).toBeVisible();

    await page.getByRole('button', { name: /Floor & Room/i }).click();
    await expect(page.getByText(/Floor & Room Analysis/i).first()).toBeVisible();

    await page.getByRole('button', { name: /Equipment/i }).click();
    await expect(page.getByText(/Equipment & Components Analysis/i).first()).toBeVisible();
  });

  test('user management loads and supports searching', async ({ page, request }) => {
    await loginAs(page, request, 'admin');

    await page.goto(`${BASE_URL}/admin/manage-users`);
    await expect(page).toHaveURL(/\/admin\/manage-users/);
    await expect(page.getByText('User Management', { exact: true }).first()).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search by name, email or ID/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('e2e');

    const emptyState = page.getByText(/No users found matching your search/i);
    const e2eUser = page.getByText(/e2e/i).first();
    await expect(emptyState.or(e2eUser).first()).toBeVisible();
  });
});
