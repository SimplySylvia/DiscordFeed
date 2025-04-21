# Redis Setup Guide

This guide will help you set up Redis for the Discord Feed application.

## Quick Setup with Docker Compose

If you ran the setup script (`./scripts/setup.sh`) and chose to start services with Docker Compose, Redis should already be running and configured.

You can verify this by running:

```bash
docker ps | grep discordfeed-redis
```

If you see output showing the container is running, Redis is ready to use.

For manual installation or other options, continue with the instructions below.

## Prerequisites

- Operating System: Windows, macOS, or Linux
- Administrative access to your computer
- Terminal/Command Prompt

## Installation Options

### Option 1: Install Redis Locally

#### macOS

1. **Using Homebrew (Recommended)**:

   ```bash
   # Install Homebrew if you don't have it
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Install Redis
   brew install redis

   # Start Redis service
   brew services start redis
   ```

2. **Using the Source Code**:

   ```bash
   # Download and extract Redis
   curl -O http://download.redis.io/redis-stable.tar.gz
   tar xvzf redis-stable.tar.gz
   cd redis-stable

   # Compile Redis
   make

   # Install Redis
   sudo make install

   # Start Redis
   redis-server
   ```

#### Windows

Redis doesn't officially support Windows, but there are alternatives:

1. **Use WSL (Windows Subsystem for Linux) - Recommended**:

   - Enable WSL by following [Microsoft's Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
   - Install Ubuntu from Microsoft Store
   - Open Ubuntu and run:
     ```bash
     sudo apt update
     sudo apt install redis-server
     sudo service redis-server start
     ```

2. **Unofficial Windows Port**:
   - Download from [MicrosoftArchive/redis](https://github.com/MicrosoftArchive/redis/releases)
   - Extract and run `redis-server.exe`

#### Linux (Ubuntu/Debian)

```bash
# Update package lists
sudo apt update

# Install Redis
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis
sudo systemctl enable redis
```

### Option 2: Use Docker

If you prefer using Docker, you can run Redis in a container:

```bash
# Pull the Redis image
docker pull redis:7.0

# Run Redis container
docker run --name discordfeed-redis -p 6379:6379 -d redis:7.0
```

### Option 3: Use a Cloud Service

You can also use a managed Redis service:

- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Upstash](https://upstash.com/)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/overview/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)
- [Google Cloud Memorystore](https://cloud.google.com/memorystore)
- [Azure Cache for Redis](https://azure.microsoft.com/en-us/services/cache/)

## Configuration

### Basic Redis Configuration

By default, Redis runs on port 6379 without authentication. For production, you should:

1. Set a password
2. Configure persistence
3. Adjust memory limits

Edit the Redis configuration file (usually at `/etc/redis/redis.conf` on Linux/macOS):

```
# Set a password
requirepass your_secure_password

# Enable AOF persistence
appendonly yes

# Set memory limit (example: 256MB)
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Restart Redis after making changes:

```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis

# Docker
docker restart discordfeed-redis
```

### Configure Environment Variables

Add the Redis connection string to your `.env.local` file:

```
REDIS_URL="redis://localhost:6379"
```

If you've set a password:

```
REDIS_URL="redis://:your_secure_password@localhost:6379"
```

If using a cloud service, use the connection string provided by your service provider.

## Verify the Installation

To verify that Redis is working:

```bash
# Using redis-cli
redis-cli ping
# Should return PONG

# If you set a password
redis-cli
AUTH your_secure_password
ping
# Should return PONG
```

## Using Redis with Discord Feed

Discord Feed uses Redis for:

1. **Caching** - Storing Discord API responses to reduce API calls
2. **Rate limiting** - Managing request rates to stay within Discord API limits
3. **Session storage** - Storing user session data

The application is pre-configured to use Redis through the Vercel KV package, but you can update the configuration in `.env.local` file.

## Troubleshooting

### Common Issues and Solutions

1. **Connection refused errors**:

   - Ensure Redis service is running
   - Check if the port is correct (default: 6379)
   - Verify firewall settings aren't blocking connections

2. **Authentication errors**:

   - Check if you've correctly set and configured the password
   - Ensure the password in your connection string matches the one in Redis configuration

3. **Memory issues**:

   - Adjust the `maxmemory` setting in redis.conf
   - Monitor Redis memory usage with `redis-cli info memory`

4. **Persistence problems**:
   - Verify that AOF or RDB persistence is enabled
   - Check disk space and permissions for the persistence files

## Resources

- [Redis Documentation](https://redis.io/docs)
- [Redis Configuration](https://redis.io/topics/config)
- [Redis Security](https://redis.io/topics/security)
- [Redis Persistence](https://redis.io/topics/persistence)
