#!/bin/bash

# Create directory if it doesn't exist
mkdir -p scripts

# Welcome message
echo "DiscordFeed Setup Script"
echo "========================"
echo

# Check if .env.local already exists
if [ -f .env.local ]; then
  read -p ".env.local already exists. Do you want to overwrite it? (y/n): " overwrite
  if [ "$overwrite" != "y" ]; then
    echo "Setup aborted. .env.local not overwritten."
    exit 0
  fi
fi

# Generate a secure NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local with template
cat << EOF > .env.local
# Discord API Configuration
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback/discord

# Database Configuration
DATABASE_URL="postgresql://discordfeed_user:your_secure_password@localhost:5432/discordfeed"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Optional: Vercel KV (if using Vercel)
# KV_URL=your_kv_url
# KV_REST_API_URL=your_kv_rest_api_url
# KV_REST_API_TOKEN=your_kv_rest_api_token
# KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token
EOF

echo "Created .env.local with template values."
echo "Please edit .env.local to add your Discord API credentials and database information."
echo

# Check if Docker is installed and offer to run docker-compose
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
  read -p "Docker detected. Do you want to start PostgreSQL and Redis using Docker Compose? (y/n): " use_docker
  if [ "$use_docker" == "y" ]; then
    docker-compose up -d
    echo "PostgreSQL and Redis started with Docker Compose."
    echo "Database will be available at: postgresql://discordfeed_user:your_secure_password@localhost:5432/discordfeed"
    echo "Redis will be available at: redis://localhost:6379"
    echo "Don't forget to update passwords in both docker-compose.yml and .env.local"
  fi
fi

# Ask to run Prisma migration
read -p "Do you want to generate the Prisma client? (y/n): " generate_prisma
if [ "$generate_prisma" == "y" ]; then
  npx prisma generate
  echo "Prisma client generated."
  
  read -p "Do you want to run the initial Prisma migration? (y/n): " run_migration
  if [ "$run_migration" == "y" ]; then
    npm run db:migrate:init
    echo "Initial migration created and applied."
  else
    echo "Migration skipped."
  fi
else
  echo "Prisma client generation skipped."
fi

echo
echo "Setup complete!"
echo "Next steps:"
echo "1. Edit .env.local to add your Discord API credentials"
echo "2. Set up your database by following docs/postgresql-setup.md"
echo "3. Set up Redis by following docs/redis-setup.md"
echo "4. Start the development server with: npm run dev" 