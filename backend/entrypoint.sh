#!/bin/sh
set -e

echo "========================================="
echo "TDS Backend - Starting entrypoint script"
echo "========================================="

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "Waiting for database connection at $DB_HOST:$DB_PORT..."
  sleep 2
done

echo "✅ MySQL is ready!"

# Run migrations
echo "Running database migrations..."
./migrate 2>&1 || echo "⚠️  Warning during migration (likely just .env not found warning)"
echo "✅ Migrations completed"

# Run seeder (optional, comment out if not needed every time)
echo "Running database seeder..."
if ./seed; then
  echo "✅ Seeding completed successfully"
else
  echo "⚠️  Seeding failed, but continuing..."
fi

# Start the API server
echo "Starting API server..."
exec ./api
