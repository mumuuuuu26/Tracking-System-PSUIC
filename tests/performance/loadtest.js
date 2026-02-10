import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Options for the load test
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users (Goal)
    { duration: '2m', target: 100 },  // Stay at 100 users for 2 mins
    { duration: '30s', target: 0 },   // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.01'],            // Error rate must be less than 1%
  },
};

const BASE_URL = 'http://localhost:5002/api';

// Helper to get a random user (or just use one specifically for load testing)
// In a real scenario, you'd CSV data to simulate unique users.
const USER_CREDENTIALS = {
  email: 'admin@example.com', // Ensure this user exists!
  password: 'password123',
};

export default function () {
  let token;

  group('Login Flow', () => {
    const loginPayload = JSON.stringify(USER_CREDENTIALS);
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'Login' }, // Separate metrics for login
    };

    const res = http.post(`${BASE_URL}/login`, loginPayload, params);

    const isSuccess = check(res, {
      'Login status is 200': (r) => r.status === 200,
      'Token received': (r) => r.json('token') !== undefined,
    });

    if (!isSuccess) {
      errorRate.add(1);
    } else {
      token = res.json('token');
    }
  });

  // If login failed, we can't really do authentication dependent steps
  if (!token) {
    sleep(1);
    return;
  }

  group('User Activity', () => {
    const authParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'FetchTickets' },
    };

    // 1. Fetch My Tickets
    const resTickets = http.get(`${BASE_URL}/ticket`, authParams);
    
    check(resTickets, {
      'Get Tickets status is 200': (r) => r.status === 200,
      'Response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1); // Think time

    // 2. Fetch specific ticket history (filtered)
    const resHistory = http.get(`${BASE_URL}/ticket/history?categoryId=all`, authParams);
    check(resHistory, {
        'Get History status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(1);
}
