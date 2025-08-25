#!/bin/bash
set -e

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
until $(curl --output /dev/null --silent --fail http://localhost:3001/health); do
  printf '.'
  sleep 1
done
echo "Backend is ready!"

# Run database migrations
echo "Running database migrations..."
docker compose exec -T backend npm run migrate

# Seed the database
echo "Seeding the database..."
docker compose exec -T backend npm run seed

echo "Setup complete! The application is ready."
echo "- Frontend: http://localhost:3000"
echo "- API: http://localhost:3001"
echo "- API docs: http://localhost:3001/docs"
echo ""
echo "Login credentials:"
echo "- Admin: admin / Satu123"
echo "- User: user1 / Satu123"
echo "- User: user2 / Satu123"
