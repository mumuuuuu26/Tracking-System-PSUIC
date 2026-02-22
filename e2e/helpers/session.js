import { expect } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:5002';
const WEB_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export const E2E_USERS = {
  user: { email: 'e2e@test.com', password: '12345678', homePath: '/user' },
  admin: { email: 'e2e.admin@test.com', password: '12345678', homePath: '/admin' },
  it: { email: 'e2e.it@test.com', password: '12345678', homePath: '/it' },
};

async function apiLogin(request, credentials) {
  const loginResponse = await request.post(`${API_BASE_URL}/api/login`, {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();
  return loginResponse.json();
}

export async function loginAs(page, request, roleKey) {
  const credentials = E2E_USERS[roleKey];
  if (!credentials) {
    throw new Error(`Unknown E2E role key: ${roleKey}`);
  }

  const loginData = await apiLogin(request, credentials);
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

  await page.goto(`${WEB_BASE_URL}${credentials.homePath}`);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(new RegExp(credentials.homePath));
  return loginData;
}

export async function createTicketAsUser(request, titleSuffix = `${Date.now()}`) {
  const userLogin = await apiLogin(request, E2E_USERS.user);
  const token = userLogin.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [categoryRes, roomRes] = await Promise.all([
    request.get(`${API_BASE_URL}/api/category`, { headers: authHeaders }),
    request.get(`${API_BASE_URL}/api/room`, { headers: authHeaders }),
  ]);

  expect(categoryRes.ok()).toBeTruthy();
  expect(roomRes.ok()).toBeTruthy();

  const categories = await categoryRes.json();
  const rooms = await roomRes.json();
  expect(Array.isArray(categories) && categories.length > 0).toBeTruthy();
  expect(Array.isArray(rooms) && rooms.length > 0).toBeTruthy();

  const createRes = await request.post(`${API_BASE_URL}/api/ticket`, {
    headers: authHeaders,
    data: {
      title: `E2E IT Ticket ${titleSuffix}`,
      description: 'E2E generated ticket for IT critical path.',
      urgency: 'Medium',
      roomId: rooms[0].id,
      categoryId: categories[0].id,
    },
  });

  expect(createRes.ok()).toBeTruthy();
  const ticket = await createRes.json();
  return { ticket, userToken: token };
}

