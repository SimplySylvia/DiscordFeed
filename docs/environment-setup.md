# Environment Setup Guide

This guide will help you set up the required environment variables for Discord Feed.

## Required Environment Variables

Discord Feed requires several environment variables to function properly. Create a `.env.local` file in the root directory of the project with the following variables:

### Using the Setup Script (Recommended)

The easiest way to set up your environment variables is by using the provided setup script:

```bash
# Run the setup script
./scripts/setup.sh
```

This script will:

- Create a `.env.local` file with all required variables
- Generate a secure random string for `NEXTAUTH_SECRET`
- Detect Docker and offer to start PostgreSQL and Redis services
- Optionally run Prisma migrations to initialize your database

After running the script, you'll need to update your Discord API credentials in the `.env.local` file.

### Manual Setup

If you prefer to set up your environment variables manually, create a `.env.local` file with the following content:

```
# Discord API Configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback/discord

# Database Configuration
DATABASE_URL=postgresql://discordfeed_user:your_secure_password@localhost:5432/discordfeed

# Redis Configuration
REDIS_URL=redis://localhost:6379

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: Vercel KV (if using Vercel)
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token
```

## Discord Developer Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application by clicking the "New Application" button
3. Enter a name for your application (e.g., "Discord Feed")
4. Navigate to the "OAuth2" section in the left sidebar
5. Add the following redirect URL: `http://localhost:3000/api/auth/callback/discord`
6. Copy the "Client ID" and "Client Secret" from the "General Information" section
7. Paste these values into your `.env.local` file for `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`

## NextAuth Secret

If you used the setup script, a secure random string has already been generated for `NEXTAUTH_SECRET`.

If you're setting up manually, generate a secure random string:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET` in your `.env.local` file.

## Production Environment

For production deployments, update the following variables:

```
NEXTAUTH_URL=https://your-production-domain.com
DISCORD_REDIRECT_URI=https://your-production-domain.com/api/auth/callback/discord
```

## Environment Variables with Vercel

If you're deploying to Vercel:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add each environment variable from your `.env.local` file
4. Deploy your project

## Checking Environment Variables

To verify that your environment variables are correctly set up, you can run:

```bash
# Check if .env.local file exists
ls -la .env.local

# For debugging, print environment variables (but hide secrets)
npm run dev
```

If the application starts without environment-related errors, your setup is correct.

## Troubleshooting

### Common Issues and Solutions

1. **"Missing environment variable" errors**:

   - Double-check that all required variables are defined in your `.env.local` file
   - Ensure variable names are spelled correctly

2. **OAuth errors**:

   - Verify that the redirect URI in Discord Developer Portal matches `DISCORD_REDIRECT_URI`
   - Check that `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct

3. **Session errors**:
   - Ensure `NEXTAUTH_SECRET` is set and is a secure random string
   - Verify that `NEXTAUTH_URL` matches your application's URL

## Next Steps

After setting up your environment variables:

1. Set up your [PostgreSQL database](./postgresql-setup.md)
2. Set up [Redis](./redis-setup.md)
3. Run database migrations to initialize your schema
4. Start the application with `npm run dev`
