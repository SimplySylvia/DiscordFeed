# PostgreSQL Setup Guide

This guide will help you set up PostgreSQL for the Discord Feed application.

## Quick Setup with Docker Compose

If you ran the setup script (`./scripts/setup.sh`) and chose to start services with Docker Compose, PostgreSQL should already be running and configured.

You can verify this by running:

```bash
docker ps | grep discordfeed-postgres
```

If you see output showing the container is running, PostgreSQL is ready to use.

For manual installation or other options, continue with the instructions below.

## Prerequisites

- Operating System: Windows, macOS, or Linux
- Administrative access to your computer
- Terminal/Command Prompt

## Installation Options

### Option 1: Install PostgreSQL Locally

#### macOS

1. **Using Homebrew (Recommended)**:

   ```bash
   # Install Homebrew if you don't have it
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Install PostgreSQL
   brew install postgresql@15

   # Start PostgreSQL service
   brew services start postgresql@15
   ```

   **Note for macOS users**: When PostgreSQL is installed via Homebrew, it creates a superuser with your system username, not 'postgres'. To connect, use:

   ```bash
   psql postgres
   ```

2. **Using the Official Installer**:
   - Download the installer from [PostgreSQL Downloads](https://www.postgresql.org/download/macosx/)
   - Follow the installation wizard instructions

#### Windows

1. Download the installer from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Make note of the port (default: 5432) and password you set during installation
4. Add PostgreSQL bin directory to your PATH environment variable

#### Linux (Ubuntu/Debian)

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists
sudo apt-get update

# Install PostgreSQL 15
sudo apt-get -y install postgresql-15

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Option 2: Use Docker

If you prefer using Docker, you can run PostgreSQL in a container:

```bash
# Pull the PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name discordfeed-postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_USER=discordfeed -e POSTGRES_DB=discordfeed -p 5432:5432 -d postgres:15
```

### Option 3: Use a Cloud Service

You can also use a managed PostgreSQL service:

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Railway](https://railway.app/)
- [Supabase](https://supabase.com/)
- [AWS RDS](https://aws.amazon.com/rds/postgresql/)
- [Google Cloud SQL](https://cloud.google.com/sql/docs/postgres)
- [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/services/postgresql/)

## Database Setup

### Create Database and User

Connect to PostgreSQL with the default `postgres` user:

```bash
# For local installations
psql postgres

# For Docker installations
docker exec -it discordfeed-postgres psql postgres
```

Create a database and user for Discord Feed:

```sql
CREATE DATABASE discordfeed;
CREATE USER discordfeed_user WITH ENCRYPTED PASSWORD 'your_secure_password' CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE discordfeed TO discordfeed_user;
```

**Note**: The `CREATEDB` permission is required for Prisma migrations. Without this permission, you'll encounter errors when running migration commands.

After creating the user, you also need to grant schema permissions. Connect to the discordfeed database and run:

```sql
\c discordfeed
GRANT ALL ON SCHEMA public TO discordfeed_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO discordfeed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO discordfeed_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO discordfeed_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO discordfeed_user;
```

These commands ensure that your user has full permissions to modify the schema, which is required for Prisma migrations.

### Configure Environment Variables

Add the PostgreSQL connection string to your `.env.local` file:

```
DATABASE_URL="postgresql://discordfeed_user:your_secure_password@localhost:5432/discordfeed"
```

If using a cloud service, use the connection string provided by your service provider.

## Initialize the Database with Prisma

Discord Feed uses Prisma as the ORM. To initialize your database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create initial tables
npm run db:migrate:init
```

Note: If you used the setup script and chose to run Prisma migrations, this step has already been completed.

## Verify the Setup

To verify that your PostgreSQL setup is working:

```bash
# Generate Prisma client (if not done already)
npm run db:generate

# Open Prisma Studio to view your database
npm run db:studio
```

Prisma Studio will open in your browser at http://localhost:5555 where you can explore your database schema.

## Troubleshooting

### Common Issues and Solutions

1. **Connection refused errors**:

   - Ensure PostgreSQL service is running
   - Check if the port is correct (default: 5432)
   - Verify firewall settings aren't blocking connections

2. **Authentication failures**:

   - Double-check username and password in your connection string
   - Ensure the user has appropriate permissions

3. **"Role does not exist" errors**:

   - Ensure you've created the user specified in your connection string

4. **Migration errors**:
   - Check if your database exists and the user has CREATEDB permission
   - If you get a "permission denied to create database" error, reconnect to PostgreSQL and grant CREATEDB permission: `ALTER USER discordfeed_user WITH CREATEDB;`
   - If you get a "permission denied for schema public" error, make sure you've granted schema permissions as shown in the Database Setup section
   - Run `npx prisma migrate reset` to reset your database and try again

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/index.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
