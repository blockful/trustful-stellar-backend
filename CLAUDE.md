# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker Development (Primary)
- `docker compose up -d` - Start PostgreSQL and API in development mode with hot reload
- `docker compose down` - Stop all services
- `docker compose logs -f api` - Follow API logs
- `docker compose exec api sh` - Access API container shell

### Local Development
- `npm run start:dev` - Start in watch mode (requires local PostgreSQL)
- `npm run start:debug` - Start in debug mode with watch
- `npm run build` - Build the application
- `npm run start:prod` - Start production build

### Database Operations
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply new migrations
- `npm run prisma:seed` - Seed the database with test data
- `npx prisma studio` - Open Prisma Studio database browser

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage report
- `jest --testPathPattern=communities.service.spec.ts` - Run a specific test file
- `jest --testNamePattern="should return all visible communities"` - Run tests matching pattern

### Code Quality
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

## Architecture Overview

NestJS backend for Trustful Stellar, a blockchain-based community and badge management platform built on Stellar network.

### Core Modules

#### Communities Module (`src/communities/`)
- **Controller**: REST endpoints for community management
- **Service**: Business logic for community operations
- **Repository**: Custom SQL queries using `_block_range` for blockchain state management
- **DTOs**: Request/response validation with class-validator

#### Badges Module (`src/badges/`)
- **Controller**: Badge retrieval by type and user
- **Service**: Badge aggregation and user achievement tracking
- **DTOs**: Badge data transfer objects

#### Prisma Module (`src/prisma/`)
- Database connection wrapper
- Shared across all modules

### Database Architecture

PostgreSQL with blockchain-specific features:
- **_block_range**: Tracks blockchain state validity (upper_inf indicates current state)
- **last_indexed_at**: Decimal timestamp from blockchain indexer
- **Temporal queries**: Repository pattern filters records by `upper_inf(_block_range) = true`

### API Endpoints

Base URL: `http://localhost:3000`
Swagger Documentation: `http://localhost:3000/api`

#### Communities
- `GET /communities` - List all visible communities (optional: ?userAddress=)
- `GET /communities/:contractAddress` - Get specific community details
- `PATCH /communities/:contractAddress/visibility` - Update community visibility
- `GET /communities/:contractAddress/members` - Get community members with points
- `GET /communities/:contractAddress/badges` - Get community badges (optional: ?user_address=)
- `GET /communities/created/:userAddress` - Get user's created communities
- `GET /communities/hidden/:userAddress` - Get user's hidden communities
- `GET /communities/joined/:userAddress` - Get user's joined communities

#### Badges
- `GET /badges/:type` - Get badges by type
- `GET /badges/users/:user_address/communities/:community_address/badges` - Get user's community badges
- `GET /badges/users/:userAddress` - Get all user badges

### Key Implementation Patterns

1. **Repository Pattern**: Complex queries isolated in `CommunitiesRepository`
2. **Blockchain State Management**: All queries filter by `upper_inf(_block_range) = true` for current state
3. **Address Normalization**: `toLowerCaseAddress` utility ensures consistent address comparison
4. **Points System**: Community members accumulate points tracked separately from badges
5. **Membership Validation**: Helper methods check active membership status before operations

### Environment Configuration

Required `.env` variables:
```
DATABASE_URL="postgresql://postgres:123@postgres:5432/nest"
```

Docker Compose services:
- **postgres**: PostgreSQL database with health checks
- **api**: NestJS application with volume mounts for hot reload

### Data Flow

1. External indexer writes blockchain data to PostgreSQL
2. Repository queries filter by `_block_range` for valid state
3. Service layer aggregates data from multiple tables
4. Controllers validate requests and format responses
5. Swagger decorators generate API documentation