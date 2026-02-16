const { test, expect, request } = require('@playwright/test');

async function waitForAppReady(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
        const store = window.localStorage.getItem('auth-store');
        return store !== null && JSON.parse(store).state.hasHydrated === true;
    }, { timeout: 15000 });
}

test.describe('User Report Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        const uniqueEmail = `e2e_report_${Date.now()}@example.com`;
        
        const apiContext = await request.newContext();
        await apiContext.post('http://localhost:5002/api/register', {
            data: {
                email: uniqueEmail,
                password: 'password123',
                name: 'Test User'
            }
        });

        const loginResponse = await apiContext.post('http://localhost:5002/api/login', {
            data: {
                email: uniqueEmail,
                password: 'password123'
            }
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
                hasHydrated: true
            },
            version: 0
        });

        await page.goto('/user');
        await waitForAppReady(page);
    });

    test('should navigate to report dashboard and filter tickets', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // 1. Verify Home Page "Report Issue" button
        const reportIssueBtn = page.getByRole('button', { name: /report issue/i });
        await expect(reportIssueBtn).toBeVisible();
        await reportIssueBtn.click();
        await page.waitForURL('**/create-ticket');
        await expect(page.getByRole('heading', { name: /report issue/i })).toBeVisible();
        await page.goBack();
        await waitForAppReady(page);

        // 2. Navigate to Report Dashboard via Bottom Nav
        const bottomNav = page.locator('div.fixed.bottom-0 nav');
        await expect(bottomNav).toBeVisible();

        const reportNavLink = bottomNav.getByRole('link', { name: /report/i });
        await expect(reportNavLink).toBeVisible();
        await reportNavLink.click();
        
        await page.waitForURL('**/report', { timeout: 15000 });
        
        // 3. Verify Page Elements (Now using h1)
        await expect(page.getByRole('heading', { name: /report/i })).toBeVisible();
        await expect(page.getByPlaceholder(/search active tickets/i)).toBeVisible();

        // 4. Verify Filters
        const allTab = page.getByRole('button', { name: /all/i });
        const notStartedTab = page.getByRole('button', { name: /not started/i });
        const inProgressTab = page.getByRole('button', { name: /in progress/i });

        await expect(allTab).toBeVisible();
        await expect(notStartedTab).toBeVisible();
        await expect(inProgressTab).toBeVisible();

        await notStartedTab.click();

        // 5. Verify Search
        await page.getByPlaceholder(/search active tickets/i).fill('Printer');
    });
});
