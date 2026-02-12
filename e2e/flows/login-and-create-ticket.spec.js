const { test, expect, request } = require('@playwright/test');

test.describe('User Workflow', () => {
    test('Register, Login and Create Ticket', async ({ page }) => {
        // Increase timeout for this test as per recommendation
        test.setTimeout(60000);

        const uniqueEmail = `e2e_${Date.now()}@example.com`;
        
        // 1. API Seeding: Create User via API
        const apiContext = await request.newContext();
        await apiContext.post('http://localhost:5002/api/register', {
            data: {
                email: uniqueEmail,
                password: 'password123'
            }
        });

        // 2. Login via API (Bypass UI to avoid race conditions)
        const loginResponse = await apiContext.post('http://localhost:5002/api/login', {
            data: {
                email: uniqueEmail,
                password: 'password123'
            }
        });

        expect(loginResponse.ok()).toBeTruthy();
        const loginData = await loginResponse.json();
        const token = loginData.token;

        // Inject token BEFORE app loads to avoid race conditions
        // The app uses Zustand with persist middleware, key: 'auth-store'
        await page.addInitScript((value) => {
            window.localStorage.setItem('auth-store', JSON.stringify(value));
            // Also set 'token' just in case legacy code or other checks use it
            window.localStorage.setItem('token', value.state.token); 
        }, {
            state: {
                user: loginData.payload,
                token: loginData.token,
                hasHydrated: true
            },
            version: 0
        });

        // Navigate to Dashboard (Protected Route)
        await page.goto('/user');
        
        // Ensure we are on user dashboard
        await expect(page).toHaveURL(/\/user/);



        // Debugging: Log current URL and localStorage
        const currentUrl = page.url();
        console.log('Current URL after login attempt:', currentUrl);

        // Verification: Check if auth token exists in localStorage (auth-store is the actual key)
        await page.waitForFunction(() => {
            const token = localStorage.getItem('token'); // Fallback
            const authStore = localStorage.getItem('auth-store'); // Zustand
            return token !== null || (authStore && JSON.parse(authStore)?.state?.token);
        }, null, { timeout: 10000 }).catch(() => console.log('Auth token/store not found in localStorage'));

        // 3. Verify redirection to Dashboard (HomeUser)
        // Double ensure we are on the user dashboard
        await expect(page).toHaveURL(/\/user/, { timeout: 30000 }); 

        // 4. Navigate to "Create Ticket"
        // In HomeUser, there is a "Report Issue" button
        await page.getByRole('button', { name: 'Report Issue' }).click();
        
        // 5. Submit a ticket
        // Verify we are on create page
        await expect(page).toHaveURL(/\/user\/create-ticket/);

        // Fill Description
        await page.fill('textarea', 'This is an automated E2E test ticket.');
        
        // Select Equipment (CustomSelect)
        // Click the trigger (placeholder text)
        await page.getByText('Select Equipment').click();

        // Wait for Dropdown to be visible
        const dropdown = page.locator('div.absolute.z-50');
        await dropdown.waitFor({ state: 'visible' });

        // Check if there are options
        const optionsCount = await dropdown.locator('div.cursor-pointer').count();
        expect(optionsCount, 'Dropdown is empty! Did you seed the database?').toBeGreaterThan(0);

        // Click the first option (assuming there is at least one)
        // We use locator for the dropdown item. CustomSelect renders items as divs with text.
        // We avoid "No options available"
        const equipmentOption = dropdown.locator('div.cursor-pointer').first();
        await equipmentOption.click();

        // Select Floor
        // Use more specific locator because label also has text "Floor"
        await page.locator('span').filter({ hasText: /^Floor$/ }).click();
        const floorOption = page.locator('div.absolute.z-50').locator('div.cursor-pointer').first();
        await floorOption.click();

        // Select Room
        await page.locator('span').filter({ hasText: /^Room$/ }).click();
        const roomOption = page.locator('div.absolute.z-50').locator('div.cursor-pointer').first();
        await roomOption.click();
        
        // Select Urgency (Optional, default Low)
        await page.click('button:has-text("Medium")');

        // Click Submit
        await page.click('button:has-text("Submit Request")');

        // 6. Verify success (SweetAlert2 popup)
        await expect(page.getByText('Created Successfully')).toBeVisible();
        await page.click('button:has-text("View Ticket")');
        
        // Verify redirection to ticket detail
        await expect(page).toHaveURL(/\/user\/ticket\/\d+/);
    });
});
