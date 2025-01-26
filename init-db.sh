#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
sleep 10

# Apply database migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Seed the database with initial data
echo "Seeding database..."
npx prisma db seed