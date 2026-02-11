const { test, expect, request } = require('@playwright/test');

test.describe('User Workflow', () => {
    test('Register, Login and Create Ticket', async ({ page }) => {
        const uniqueEmail = `e2e_${Date.now()}@example.com`;
        
        // 1. API Seeding: Create User via API
        const apiContext = await request.newContext();
        await apiContext.post('http://localhost:5002/api/register', {
            data: {
                email: uniqueEmail,
                password: 'password123'
            }
        });

        // 2. Login
        await page.goto('/login');
        
        // Click "Login with Email" to show the email/password form
        // The login page has multiple login methods, so we need to select email login first
        await page.getByRole('button', { name: /Login with Email/i }).click();
        
        // Wait for email input to be visible
        const emailInput = page.locator('input[name="email"]');
        await emailInput.waitFor({ state: 'visible', timeout: 10000 });
        await emailInput.fill(uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]'); // Or 'Sign In' button

        // Verify successful login via Toast or URL
        await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 15000 });

        // Debugging: Log current URL and localStorage
        const currentUrl = page.url();
        console.log('Current URL after login attempt:', currentUrl);

        // Verification: Check if auth-storage exists in localStorage
        await page.waitForFunction(() => {
            const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            return auth?.state?.user && auth?.state?.token;
        }, null, { timeout: 10000 }).catch(() => console.log('Auth storage not found in localStorage'));

        // 3. Verify redirection to Dashboard (HomeUser)
        await expect(page).toHaveURL('/user', { timeout: 30000 }); 

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
        // Click the first option (assuming there is at least one)
        // We use locator for the dropdown item. CustomSelect renders items as divs with text.
        // We avoid "No options available"
        const equipmentOption = page.locator('div.absolute.z-50').locator('div.cursor-pointer').first();
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
