const { test, expect } = require('@playwright/test');

test.describe('User Workflow', () => {
    test('Register, Login and Create Ticket', async ({ page }) => {
        const uniqueEmail = `e2e_${Date.now()}@example.com`;
        
        // 1. Register
        await page.goto('/register');
        // Register form only has email, password, confirmPassword
        // await page.fill('input[name="firstName"]', 'E2E'); // Removed
        // await page.fill('input[name="lastName"]', 'Tester'); // Removed
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'password123');
        
        await page.click('button:has-text("Register")');
        
        // Verify redirect to login (Wait for registration success)
        await expect(page).toHaveURL(/\/login/);
        
        // Login page has a "Login with Email" button to show the form
        // Wait for it to be visible and click it. 
        // Note: Sometimes it might not be visible if manual login is already shown (unlikely on refresh), 
        // but let's enforce the flow.
        const loginBtn = page.getByRole('button', { name: 'Login with Email' });
        await loginBtn.waitFor({ state: 'visible' }); 
        await loginBtn.click();
        
        // Wait for email input to be visible to ensure form is rendered
        const emailInput = page.locator('input[name="email"]');
        await emailInput.waitFor({ state: 'visible' });
        await emailInput.fill(uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]'); // Or 'Sign In' button

        // Verify successful login via Toast or URL
        await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
        
        // 3. Verify redirection to Dashboard (HomeUser)
        await expect(page).toHaveURL('/user', { timeout: 15000 }); 

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
