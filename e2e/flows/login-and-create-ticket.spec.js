const { test, expect, request } = require('@playwright/test');

async function waitForAppReady(page) {
    // 1. Wait for network to settle
    await page.waitForLoadState('networkidle');

    // 2. Ensure Zustand hydrate is complete
    await page.waitForFunction(() => {
        const store = window.localStorage.getItem('auth-store');
        return store !== null && JSON.parse(store).state.hasHydrated === true;
    }, { timeout: 15000 });

    // 3. Wait for critical setup data to be fetched
    // These calls happen on HomeUser and CreateTicket
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/category') && res.status() === 200, { timeout: 15000 }).catch(() => {}),
        page.waitForResponse(res => res.url().includes('/api/room') && res.status() === 200, { timeout: 15000 }).catch(() => {})
    ]);
}

test.describe('User Workflow', () => {
    test('Register, Login and Create Ticket', async ({ page }) => {
        // Increase timeout for this test as per recommendation
        test.setTimeout(90000);
        // Set viewport to mobile
        await page.setViewportSize({ width: 375, height: 667 });

        const uniqueEmail = `e2e_${Date.now()}@example.com`;
        
        // 1. API Seeding: Create User
        const apiContext = await request.newContext();
        await apiContext.post('http://localhost:5002/api/register', {
            data: {
                email: uniqueEmail,
                password: 'password123'
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

        // Inject token
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

        // Navigate to Dashboard
        await page.goto('/user');
        await waitForAppReady(page);
        
        // Ensure we are on user dashboard
        await expect(page).toHaveURL(/\/user/, { timeout: 30000 }); 

        // 4. Navigate to "Create Ticket"
        const reportBtn = page.getByRole('button', { name: /report issue/i });
        await expect(reportBtn).toBeVisible();
        await reportBtn.click();
        
        // 5. Submit a ticket
        await page.waitForURL('**/create-ticket');
        await waitForAppReady(page);

        // Fill Topic Issue (Title)
        const topicInput = page.getByPlaceholder(/computer cannot start/i);
        await expect(topicInput).toBeVisible();
        await topicInput.fill('E2E Test: Printer Jam');

        // Select Equipment Category
        const equipmentSelect = page.getByRole('combobox', { name: /equipment category/i });
        await expect(equipmentSelect).toBeVisible({ timeout: 15000 });
        await equipmentSelect.click();

        const categoryDropdown = page.getByRole('listbox');
        await expect(categoryDropdown).toBeVisible();
        const categoryOption = categoryDropdown.getByRole('option').first();
        await expect(categoryOption).toBeVisible();
        await categoryOption.click();

        // Fill Description
        await page.getByPlaceholder(/describe the issue in detail/i).fill('This is an automated E2E test ticket description.');

        // Select Floor
        const floorSelect = page.getByRole('combobox', { name: /select floor/i });
        await expect(floorSelect).toBeVisible({ timeout: 15000 });
        await floorSelect.click();
        
        const floorDropdown = page.getByRole('listbox');
        await expect(floorDropdown).toBeVisible();
        const floorOption = floorDropdown.getByRole('option').first();
        await expect(floorOption).toBeVisible();
        await floorOption.click();

        // Select Room
        const roomSelect = page.getByRole('combobox', { name: /select room/i });
        await expect(roomSelect).toBeVisible({ timeout: 15000 });
        await roomSelect.click();

        const roomDropdown = page.getByRole('listbox');
        await expect(roomDropdown).toBeVisible();
        const roomOption = roomDropdown.getByRole('option').first();
        await expect(roomOption).toBeVisible();
        await roomOption.click();
        
        // Select Urgency
        await page.getByRole('button', { name: /medium/i }).click();

        // Click Submit
        const submitBtn = page.getByRole('button', { name: /submit report/i });
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // 6. Verify success (SweetAlert2 popup)
        const swal = page.locator('.swal2-popup');
        await expect(swal).toBeVisible({ timeout: 30000 });
        await expect(swal).toContainText(/created successfully/i);
        await swal.getByRole('button', { name: /view ticket/i }).click();
        
        // Verify redirection to ticket detail
        await page.waitForURL('**/user/ticket/**', { timeout: 15000 });
        await expect(page).toHaveURL(/\/user\/ticket\/\d+/);

        // 7. Verify Profile Picture Navigation
        await page.goto('/user'); 
        await waitForAppReady(page);
        
        const profileSelector = page.locator('div.w-12.h-12.cursor-pointer').first(); 
        await expect(profileSelector).toBeVisible();
        await profileSelector.click();

        // Verify navigation to profile page
        await page.waitForURL('**/user/profile');
        await expect(page).toHaveURL(/\/user\/profile/);
    });
});
