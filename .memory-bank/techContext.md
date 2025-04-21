# Technical Context for Discord Feed

## Technology Stack

### Frontend
- Next.js 15 (App Router)
- React Server Components, Client Components
- Tailwind CSS
- React Context + Server Actions

### Backend
- Next.js API Routes
- NextAuth.js for authentication
- Prisma as ORM
- PostgreSQL (Vercel Postgres)
- Redis (Vercel KV) for caching

### Discord Integration
- Discord API for fetching messages
- Webhooks for real-time updates
- discord.js (edge compatible)

## API Limitations

1. **No Unread Messages API**: Discord does not provide a direct API method to fetch unread messages across channels.
2. **Message Retrieval Constraints**: Accessing older messages requires multiple API calls.
3. **Rate Limiting**: Discord has strict rate limits that must be managed.

## Workarounds

1. Track last visit timestamps per channel; fetch recent messages and compare.
2. Intelligent caching, staggered API calls, prioritize active/important channels.
3. Focus on recent unread messages, load more on demand.
4. Webhooks for important channels, periodic polling for others, user-configurable refresh.
