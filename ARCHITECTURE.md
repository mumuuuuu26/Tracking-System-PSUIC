# System Architecture

## Overview
This document outlines the architecture of the IT Support & Tracking System. The system is designed to manage tickets, assets (equipment), and users within the organization.

## Architecture Diagram

```mermaid
graph TD
    User[User / Client] -->|HTTP/HTTPS| Frontend[Frontend (React + Vite)]
    Frontend -->|REST API / Socket.io| Backend[Backend (Node.js + Express)]
    
    subgraph "Backend Server"
        Backend -->|Auth| JWT[JWT Authentication]
        Backend -->|Data Access| Prisma[Prisma ORM]
        Backend -->|Real-time| Socket[Socket.io]
        Backend -->|Jobs| Cron[node-cron (Scheduler)]
    end
    
    subgraph "Data Storage"
        Prisma -->|Query| DB[(MySQL Database)]
    end
    
    subgraph "External Services"
        Backend -->|Uploads| Cloudinary[Cloudinary (Images)]
        Backend -->|Email| SMTP[Gmail SMTP]
        Backend -->|Calendar| GCal[Google Calendar API]
    end
```

## Detailed Components

### 1. Frontend (Client)
- **Tech Stack**: React.js, Vite, Axios.
- **Role**: Handles user interface, displays tickets, manages forms, and communicates with the backend via REST API.

### 2. Backend (Server)
- **Tech Stack**: Node.js, Express.js.
- **Entry Point**: `server.js`.
- **Key Features**:
    - **API Routes**: `/api/*` for all data operations.
    - **Authentication**: JWT-based auth (`middlewares/auth`).
    - **Real-time**: Socket.io for instant notifications (ticket updates).
    - **Logging**: Winston & Morgan for system monitoring.
    - **Security**: Helmet, Rate Limiting, CORS.

### 3. Database
- **Tech Stack**: MySQL.
- **ORM**: Prisma (`prisma/schema.prisma`).
- **Models**: User, Ticket, Equipment, Room, Category, etc.

### 4. External Integrations
- **Cloudinary**: Stores images uploaded in tickets.
- **Google APIs**:
    - **Gmail**: Sends email notifications.
    - **Calendar**: Syncs IT schedules and tasks.

## Performance & Scalability

### High-Concurrency Handling
The system is optimized to handle **100+ concurrent users** efficiently.
- **Process Management**: Runs with **PM2** in production mode, utilizing Node.js clustering capabilities if configured.
- **Global Rate Limiting**: Limit set to **3000 requests per 15 minutes** per IP to prevent DoS attacks while allowing high legitimate traffic.
- **Auth Rate Limiting**: Strict limits on `/login` and `/register` endpoints (100 req/min) to prevent brute-force attacks.
- **Timeouts**: Server timeout set to **30 seconds** to ensure resources are freed from hanging requests.

### Load Testing Results (k6)
Verified using `k6` with a simulated load of 100 Virtual Users (VUs) hitting the root endpoint.

| Metric | Result | Target | Status |
| :--- | :--- | :--- | :--- |
| **Concurrency** | 100 Users | 100 Users | ✅ Pass |
| **Response Time (p95)** | **~2.5ms** | < 500ms | ✅ Pass |
| **Error Rate** | **0.00%** | < 1% | ✅ Pass |
| **Throughput** | ~56 req/sec | N/A | ✅ Optimized |

To reproduce the load test:
```bash
k6 run tests/load/load-test.js
```
