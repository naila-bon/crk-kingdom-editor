#!/usr/bin/env sh
set -eu

if [ ! -f .env ]; then
  echo "No .env file found. Copying .env.example..."
  cp .env.example .env
fi

if command -v npm >/dev/null 2>&1; then
  echo "Starting project services..."
  docker compose up --build
else
  echo "npm is required to run this script."
  exit 1
fi
