# Active Context: Phase 2 – Message Aggregation Engine

## Focus

The project is now focused on implementing the Message Aggregation Engine, which will efficiently fetch, cache, and serve Discord messages across all user channels, provide unread logic, and enable real-time updates.

## Architecture & Approach

- **Chosen Approach:** Webhook-First Aggregation with Polling Fallback
  - Use Discord webhooks for real-time updates where possible
  - Poll channels that do not support webhooks
  - Cache messages and unread status in Redis
  - Use Bull for background job scheduling and processing
  - Integrate with existing Next.js, Prisma, Redis, and Discord.js stack

## Implementation Plan

- Extend database schema for message cache, last visit tracking, and webhook event tracking
- Update Prisma schema and generate migration
- Set up Bull queues and job processors for message fetching, cache refresh, and retries
- Implement Discord webhook registration and handler endpoints
- Use Redis for caching and rate limit tracking
- Build API endpoints for message aggregation and unread status
- Update frontend to display unread indicators and real-time updates
- Comprehensive testing and documentation

## Next Steps

1. Complete database and schema updates
2. Implement and test background job system
3. Integrate webhook and polling logic
4. Build and secure API endpoints
5. Update frontend for new feed features
6. Test and document the new system

## Dependencies

- NextAuth.js for authentication
- Prisma for database access
- Bull for job queueing
- Redis for caching and token storage
- Discord.js for API integration

## Status Update (as of current code review)

### Completed

- Database schema extended for message cache, last visit tracking, and webhook event tracking (Prisma models: MessageCache, LastRead, WebhookEvent)
- Prisma schema updated and migration generated
- Bull queue (messageAggregationQueue) set up for message aggregation
- Job processors implemented: fetch-messages, refresh-cache, retry-failed, priority-fetch
- Repeatable job scheduling and fallback polling logic present
- Redis caching for recent messages per channel
- Next.js API route for Discord webhooks implemented (handles MESSAGE_CREATE, updates cache and unread status)
- Discord webhook registration function implemented
- Webhook handler endpoints built
- Rate limit tracking and enforcement in Redis
- Cache refresh logic refactored as refreshChannelCache helper, used after marking as read
- API endpoint POST /api/messages implemented: marks messages as read, updates DB and cache, returns unread count
- API endpoint GET /api/messages implemented: returns latest 50 messages for a channel, with unread status and unread count, uses Redis cache if available
- Endpoints secured with authentication and authorization: only authenticated users who are members of the server that owns the channel can access or modify messages for that channel
- Discord API integration for message fetching in fetch-messages job processor: job now fetches messages from Discord, stores them in the DB, and updates the cache

### In Progress / TODO

- Advanced rate limit tracking and handling in Redis
- Robust webhook event type handling and signature verification
- Real channel/webhook tracking for fallback polling
- Frontend integration for unread indicators and real-time updates
- Unit/integration tests and documentation updates
- Integrate Discord API for message fetching in fetch-messages job processor (next priority; enables real Discord messages to be fetched, stored, and cached)
