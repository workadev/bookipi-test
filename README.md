# BookiPi E-commerce Flash Sale Platform

This is an e-commerce platform with flash sale functionality designed to handle high traffic and concurrent purchases.

## System Design

The system is built with a microservices-based architecture to ensure scalability and fault tolerance:

```
┌─────────────────────┐     ┌─────────────────────┐
│   Frontend (Next.js)│◄────►│  API Gateway Layer  │
└─────────────────────┘     └──────────┬──────────┘
                                      │
       ┌───────────────┬──────────────┼──────────────┬───────────────┐
       ▼               ▼              ▼              ▼               ▼
┌─────────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐
│ Auth Service│  │Product   │  │Flash Sale  │  │User      │  │Purchase    │
│             │  │Service   │  │Service     │  │Service   │  │Service     │
└─────┬───────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └──────┬─────┘
      │               │              │               │              │
      └───────────────┴──────────────┼───────────────┴──────────────┘
                                     ▼
                            ┌──────────────────┐
                            │  Database Layer  │
                            │  (PostgreSQL)    │
                            └──────────────────┘
```

### Key Design Choices & Trade-offs

1. **Database Transactions & Locking**: We use database-level transactions with row-level locking to prevent overselling and ensure data consistency. This approach is simpler and more reliable than distributed locking for our scale.

2. **Flash Sale Validation**: All flash sale validation (timing, eligibility, etc.) happens on the backend to prevent client-side tampering.

3. **Authentication & Authorization**: We use JWT for authentication and role-based access control for authorization.

4. **User Experience**: The frontend provides real-time feedback about flash sale status and purchase outcomes.

## Tech Stack

- **Backend**: Node.js with Fastify framework
- **Frontend**: React with Next.js and Tailwind CSS
- **Database**: PostgreSQL
- **Deployment**: Docker containers

## Running the Project

### Prerequisites

- Docker and Docker Compose

### Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd bookipi-test
   ```

2. Build and start the containers:
   ```
   docker compose build
   docker compose up -d
   ```

3. Initialize the database (this will be done automatically):
   ```
   docker compose exec backend npm run migrate
   docker compose exec backend npm run seed
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/docs

### Test Accounts

- Admin: username: `admin`, password: `Satu123`
- User 1: username: `user1`, password: `Satu123`
- User 2: username: `user2`, password: `Satu123`

## Running Tests

### Unit Tests
```
docker compose exec backend npm test
```

### Stress Tests
To simulate high traffic during flash sales:
```
docker compose exec backend npm run stress-test
```

## Expected Stress Test Outcomes

The stress tests demonstrate that the system can handle high concurrent loads without:

1. Overselling products beyond their quantity limits
2. Allowing users to purchase more than one item per flash sale
3. Processing purchases outside the flash sale window
4. Database deadlocks or race conditions

The tests show the system maintains data integrity under load and provides consistent responses even during peak traffic.

## Features

- User authentication and authorization
- Product browsing and viewing
- Flash sale participation with countdown timer
- Purchase history tracking
- Admin dashboard for managing products, flash sales, and users
- Concurrency handling for flash sales
