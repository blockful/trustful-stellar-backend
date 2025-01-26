# Trustful Stellar Backend

## Prerequisites

Before you begin, ensure you have the following installed:

- Docker and Docker Compose (latest version)
- Node.js (v20.18.1 or higher)

### Environment Setup

For development, create `.env`:

```bin/bash
DATABASE_URL="postgresql://postgres:123@postgres:5432/nest"
```

## Running the Application

The application uses Docker for consistent development environments. Follow these steps to get it running:

1. Build and start the containers:

```bash
docker compose up -d
```

This command will:

- Set up a PostgreSQL database
- Create necessary database tables
- Start the NestJS application
- Watch for file changes during development

2. Wait for the initialization to complete. You should see logs indicating the server is running.

The API will be available at http://localhost:3000.

## Database Management

When running the application for the first time or after schema changes:

1. Generate Prisma client:

```bash
npx prisma generate
```

2. Run migrations:

```bash
npx prisma migrate dev
```

3. Seed the database (if needed):

```bash
npm run prisma:seed
```

4. To view your database using Prisma Studio:

```bash
npx prisma studio
```

## API Documentation

### Available Endpoints

1. Get All Communities

```bash
GET /communities
```

Returns a list of all visible communities.

2. Get Specific Community

```bash
GET /communities/:contractAddress
```

Returns detailed information for a specific community.

3. Update Community Visibility

```bash
PATCH /communities/:contractAddress/visibility
```

Updates the visibility status of a community.
request body:

```json
{
  "isHidden": true
}
```

### Example Requests

```bash
curl http://localhost:3000/communities
```

Updating community visibility:

```bash
curl -X PATCH http://localhost:3000/communities/[contract-address]/visibility \
  -H "Content-Type: application/json" \
  -d '{"isHidden": true}'
```

## Testing

The application includes comprehensive test coverage. Here's how to run different types of tests:

1. Unit Tests:

```bash
npm run test
```

2. E2E Tests:

```bash
npm run test:e2e
```

3. Test Coverage:

```bash
npm run test:cov
```
