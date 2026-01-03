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
if ./migrate; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed, but continuing..."
fi

# Run seeder (optional, comment out if not needed every time)
# Uncomment if you want to seed data on every container start
# echo "Running database seeder..."
# if ./seed; then
#   echo "✅ Seeding completed successfully"
# else
#   echo "⚠️  Seeding failed, but continuing..."
# fi

# Start the API server
echo "Starting API server..."
exec ./api
