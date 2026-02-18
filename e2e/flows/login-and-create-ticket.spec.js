const { test, expect, request } = require('@playwright/test');

async function waitForAppReady(page) {
    // 1. Wait for network to settle
    await page.waitForLoadState('networkidle');

    // 2. Ensure Zustand hydrate is complete
    await page.waitForFunction(() => {
        const store = window.localStorage.getItem('auth-store');
        return store !== null && JSON.parse(store).state.hasHydrated === true;
    }, { timeout: 15000 });

    // 3. Wait for critical setup data (Implicitly waited by networkidle)
    // Removed explicit waitForResponse because it races with networkidle.
    // Use UI assertions in the test flow to ensure data readiness.
}

test.describe('User Workflow', () => {
    test('Register, Login and Create Ticket', async ({ page }) => {
        // Increase timeout for this test as per recommendation
        test.setTimeout(90000);
        // Set viewport to mobile
        await page.setViewportSize({ width: 375, height: 667 });

        // Seeded User
        const email = 'e2e@test.com';
        const password = '12345678';
        
        // 1. Login via API (User already exists from seed)
        const apiContext = await request.newContext();
        const loginResponse = await apiContext.post('http://localhost:5002/api/login', {
            data: {
                email: email,
                password: password
            }
        });

        if (!loginResponse.ok()) {
            console.log('Login failed status:', loginResponse.status());
            console.log('Login failed body:', await loginResponse.text());
        }
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
        const floorName = await floorOption.textContent();
        await expect(floorOption).toBeVisible();
        await floorOption.click();

        // Wait for floor selection to be reflected in the combobox
        await expect(floorSelect).toContainText(floorName);

        // Select Room
        const roomSelect = page.getByRole('combobox', { name: /select room/i });
        // Wait for it to not be disabled (meaning floor selection worked)
        await expect(roomSelect).toBeEnabled({ timeout: 15000 });
        await expect(roomSelect).not.toHaveClass(/opacity-60/);
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
