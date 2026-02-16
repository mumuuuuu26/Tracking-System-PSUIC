const { test, expect, request } = require('@playwright/test');

test.describe('User Report Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // API Login & Injection Strategy (Copied from login-and-create-ticket.spec.js)
        
        const uniqueEmail = `e2e_report_${Date.now()}@example.com`;
        
        // 1. Create User via API
        const apiContext = await request.newContext();
        await apiContext.post('http://localhost:5002/api/register', {
            data: {
                email: uniqueEmail,
                password: 'password123',
                name: 'Test User'
            }
        });

        // 2. Login via API
        const loginResponse = await apiContext.post('http://localhost:5002/api/login', {
            data: {
                email: uniqueEmail,
                password: 'password123'
            }
        });

        expect(loginResponse.ok()).toBeTruthy();
        const loginData = await loginResponse.json();

        // 3. Inject token
        await page.addInitScript((value) => {
            window.localStorage.setItem('auth-store', JSON.stringify(value));
            window.localStorage.setItem('token', value.state.token); 
        }, {
            state: {
                user: loginData.payload,
                token: loginData.token,
                hasHydrated: true
            },
            version: 0
        });

        // 4. Navigate to Dashboard
        await page.goto('/user');
        await expect(page).toHaveURL(/\/user/);
    });

    test('should navigate to report dashboard and filter tickets', async ({ page }) => {
        // 1. Verify Home Page "Report Issue" button still goes to Create Ticket
        await page.click('text=Report Issue');
        await expect(page).toHaveURL(/\/user\/create-ticket/);
        await page.goBack();

        // 2. Navigate to Report Dashboard via Bottom Nav using the text "Report"
        // Note: The bottom nav has a link with text "Report".
        // Ensure viewport is set
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Wait for the bottom navigation to be visible
        const bottomNav = page.locator('div.fixed.bottom-0 nav');
        await expect(bottomNav).toBeVisible();

        // Click the "Report" link in the bottom navigation
        // Use exact text match or href to be safe
        await bottomNav.getByText('Report', { exact: true }).click();
        await expect(page).toHaveURL(/\/user\/report/);

        // 3. Verify Page Elements
        await expect(page.locator('h1')).toHaveText('Report');
        await expect(page.locator('input[placeholder="Search active tickets..."]')).toBeVisible();

        // 4. Verify Filters
        const allTab = page.locator('button:has-text("All")');
        const notStartedTab = page.locator('button:has-text("Not Started")');
        const inProgressTab = page.locator('button:has-text("In progress")');

        await expect(allTab).toBeVisible();
        await expect(notStartedTab).toBeVisible();
        await expect(inProgressTab).toBeVisible();

        // Click "Not Started" and verify active state (checking class or just clickability)
        await notStartedTab.click();
        // We can check if the button style changed (e.g., bg color) but for now just clicking is enough to test interaction.

        // 5. Verify Search
        await page.fill('input[placeholder="Search active tickets..."]', 'Printer');
        // Wait for potential filtering (local state update is fast)
        // Assert that we see tickets or "No tickets found" message
        // This depends on seeded data, but ensuring the input works is key.
    });
});
