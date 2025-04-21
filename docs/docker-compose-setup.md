# Docker Compose Setup Guide

This guide provides a streamlined way to set up both PostgreSQL and Redis using Docker Compose for Discord Feed.

## Quick Setup with the Setup Script

The easiest way to set up Docker Compose is by using the provided setup script:

```bash
# Run the setup script
./scripts/setup.sh
```

When prompted, answer 'y' to the question about starting PostgreSQL and Redis using Docker Compose. The script will automatically start the services for you.

If you prefer manual setup or need to customize your configuration, continue with the instructions below.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- Basic knowledge of Docker and terminal commands

## Setup Instructions

### 1. Create Docker Compose File

Create a file called `docker-compose.yml` in the root of your project:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15
    container_name: discordfeed-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: discordfeed_user
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: discordfeed
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U discordfeed_user -d discordfeed"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.0
    container_name: discordfeed-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

You can customize the usernames, passwords, and other settings according to your needs.

### 2. Start the Services

Run the following command to start both PostgreSQL and Redis:

```bash
docker compose up -d
```

This will download the necessary Docker images (if they don't exist locally) and start the containers in detached mode.

### 3. Configure Environment Variables

Create or update your `.env.local` file with the Docker-specific environment variables:

```
# Database Configuration for Docker
DATABASE_URL=postgresql://discordfeed_user:your_secure_password@localhost:5432/discordfeed

# Redis Configuration for Docker
REDIS_URL=redis://localhost:6379
```

Make sure to use the same username and password you defined in the Docker Compose file.

### 4. Verify the Setup

Check if your containers are running:

```bash
docker compose ps
```

You should see both the PostgreSQL and Redis containers running.

### 5. Initialize the Database

With your containers running, run Prisma migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Using the Services

### PostgreSQL

You can interact with your PostgreSQL database using your favorite PostgreSQL client, or directly through the command line:

```bash
# Connect to PostgreSQL
docker exec -it discordfeed-postgres psql -U discordfeed_user -d discordfeed
```

### Redis

You can interact with your Redis instance using redis-cli:

```bash
# Connect to Redis
docker exec -it discordfeed-redis redis-cli
```

## Managing the Services

### Viewing Logs

```bash
# View logs for all services
docker compose logs

# View logs for a specific service
docker compose logs postgres
docker compose logs redis

# Follow logs in real time
docker compose logs -f
```

### Stopping and Starting Services

```bash
# Stop all services
docker compose stop

# Start all services
docker compose start

# Restart all services
docker compose restart

# Stop and remove containers
docker compose down

# Stop and remove containers, volumes, and images
docker compose down -v
```

## Troubleshooting

### Common Issues and Solutions

1. **Port conflicts**:

   - If you already have PostgreSQL or Redis running on your machine, you might face port conflicts
   - Change the port mapping in docker-compose.yml (e.g., "5433:5432" for PostgreSQL)

2. **Container doesn't start**:

   - Check logs: `docker compose logs [service_name]`
   - Ensure you have the correct permissions on the host machine

3. **Cannot connect from the application**:

   - Verify that your DATABASE_URL and REDIS_URL in .env.local match the Docker Compose configuration
   - Ensure the containers are running: `docker compose ps`

4. **Data persistence issues**:
   - Ensure volumes are correctly configured in docker-compose.yml
   - Avoid using `docker compose down -v` if you want to keep your data

## Next Steps

Now that you have PostgreSQL and Redis running:

1. Configure your [environment variables](./environment-setup.md)
2. Start the Discord Feed application
3. Begin development with a fully configured local environment

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis/)
