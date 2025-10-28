#!/bin/sh

echo "Starting entrypoint..."

echo "Running database migrations (npm run migration:run)..."
npm run migration:run

echo "Migrations complete. Starting the application (node dist/main)..."
node dist/main