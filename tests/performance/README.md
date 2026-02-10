# Performance Testing with k6

This directory contains load testing scripts to verify the application's performance under high concurrency (100+ users).

## Prerequisites

You need to install [k6](https://k6.io/docs/get-started/installation/) on your machine.

### macOS (via Homebrew)
```bash
brew install k6
```

### Windows (via Chocolatey)
```bash
choco install k6
```

### Docker
```bash
docker pull grafana/k6
```

## Running the Load Test

1. Ensure your backend server is running locally on port `5002`.
   ```bash
   npm run server
   ```

2. Run the load test script:
   ```bash
   k6 run loadtest.js
   ```

3. **Docker Alternative**:
   ```bash
   docker run --rm -i --network="host" grafana/k6 run - < loadtest.js
   ```
   *(Note: `--network="host"` is needed to access localhost regarding Linux; for Mac/Windows Docker, replace `localhost` in `loadtest.js` with `host.docker.internal`)*

## Scenarios

The `loadtest.js` script is configured to:
- Ramp up to **100 concurrent users** over 2 minutes.
- Sustain the load for 2 minutes.
- Check if **95% of requests** complete within **500ms**.
- specific login and ticket fetching flows.
