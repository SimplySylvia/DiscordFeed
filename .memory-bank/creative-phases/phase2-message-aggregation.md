# 🎨🎨🎨 ENTERING CREATIVE PHASE: ARCHITECTURE & ALGORITHM DESIGN

## Component Description

The Message Aggregation Engine is responsible for efficiently fetching, caching, and serving Discord messages across all user channels, providing unread logic and real-time updates.

## Requirements & Constraints

- Efficiently fetch messages from Discord channels, respecting Discord API rate limits
- Implement custom unread logic using last visit timestamps
- Cache messages to minimize API calls and improve performance
- Provide real-time updates via webhooks where possible
- Scalable for many users and channels
- Must integrate with existing Next.js, Prisma, Redis, and Discord.js stack

## Architecture & Algorithm Options

### Option 1: Polling-Based Aggregation with Redis Caching

- **Description:** Use background jobs to periodically poll Discord channels for new messages, cache results in Redis, and update unread status based on last visit timestamps.
- **Pros:**
  - Simple to implement
  - Works for all channels (no webhook dependency)
  - Easy to scale horizontally
- **Cons:**
  - Higher API usage, risk of hitting rate limits
  - Not truly real-time (depends on polling interval)

### Option 2: Webhook-First Aggregation with Polling Fallback

- **Description:** Register Discord webhooks for channels that support them to receive real-time updates; fallback to polling for others. Use Redis for caching and last visit tracking.
- **Pros:**
  - Real-time updates where possible
  - Reduces API calls for webhook-enabled channels
  - Flexible and efficient
- **Cons:**
  - Webhook setup/management complexity
  - Not all channels support webhooks (requires fallback logic)

### Option 3: On-Demand Fetching with Intelligent Caching

- **Description:** Fetch messages only when the user requests them, using Redis to cache recent results and track unread status. Use background jobs to refresh cache for active users.
- **Pros:**
  - Minimal API usage
  - Always fresh data for active users
  - Lower infrastructure cost
- **Cons:**
  - Slower initial load for inactive channels
  - More complex cache invalidation

## Options Analysis

- **Option 1** is simple and reliable but may not scale well with many users/channels due to rate limits and polling delays.
- **Option 2** offers the best balance of real-time updates and efficiency, leveraging webhooks where possible and falling back to polling as needed.
- **Option 3** is API-efficient but may lead to inconsistent user experience and higher complexity.

## Recommended Approach

- **Option 2: Webhook-First Aggregation with Polling Fallback**
  - Justification: Provides real-time updates for most channels, reduces API usage, and is flexible enough to handle Discord's limitations. Polling fallback ensures all channels are covered.

## Implementation Guidelines

- Extend database schema for message cache and last visit tracking
- Implement background jobs (Bull) for polling and cache refresh
- Integrate Discord webhooks for real-time updates
- Use Redis for caching messages and tracking rate limits
- Build API endpoints for aggregated messages and unread status
- Update frontend to display unread indicators and real-time updates

## Verification Checkpoint

- [ ] All requirements addressed
- [ ] Design options explored and analyzed
- [ ] Recommended approach justified
- [ ] Implementation guidelines documented
- [ ] Ready for implementation phase

# 🎨🎨🎨 EXITING CREATIVE PHASE

# 🚀 IMPLEMENTATION PHASE: PHASE 2 – MESSAGE AGGREGATION ENGINE

## Implementation Breakdown & Task Sequencing

### 1. Database & Schema Updates

- [x] Design and add tables/fields for:
  - Message cache (message content, metadata, timestamps, channel/user references)
  - Last visit timestamps per user/channel
  - Webhook event tracking (if needed)
- [x] Update Prisma schema and generate migration
- [x] Test schema changes locally

### 2. Background Job System (Bull)

- [x] Set up Bull queues for message fetching and cache refresh
- [x] Implement job processor for:
  - [x] Polling Discord channels for new messages (fetch-messages, with stubs and DB/cache integration)
  - [x] Refreshing Redis cache with latest messages (refresh-cache)
  - [x] Handling retry and error logic (retry-failed)
- [x] Schedule jobs based on channel priority and activity (**now using Bull's repeatable jobs with cron-based scheduling; persistent and distributed; ready for dynamic updates**)

### 3. Webhook Integration

- [x] Create Next.js API route for Discord webhooks (app/api/webhook/discord/route.ts)
  - Accepts POST requests from Discord
  - (TODO) Verifies webhook signature for security
  - Parses event and channelId from payload
  - Enqueues refresh-cache job for the relevant channel
  - (TODO) Handle different event types (MESSAGE_CREATE, etc.)
- [x] Implement Discord webhook registration for eligible channels (registerDiscordWebhook in lib/discord/api.ts)
  - Registers a webhook for a given channel using the Discord API
  - Requires MANAGE_WEBHOOKS permission and uses the bot token
  - Returns webhook ID and URL for storage/use
  - Accepts callback URL for Discord to send events
- [x] Build webhook handler endpoints (Next.js API routes)
  - Handles MESSAGE_CREATE events: upserts message into MessageCache and updates Redis cache
  - Enqueues refresh-cache job for other event types
  - (TODO) Add support for more event types and robust error handling
- [x] Update message cache and unread status on webhook events
  - Webhook handler updates unread status for all users in the channel when a new message is created
  - (Note: For large channels, optimize with batch updates or triggers)
- [x] Fallback to polling for channels without webhook support
  - Schedules repeatable fetch-messages jobs for such channels using Bull
  - Placeholders for real channel/webhook tracking integration

### 4. Caching & Rate Limiting

- [ ] Use Redis to cache recent messages per channel/user
- [ ] Track and respect Discord API rate limits in Redis
- [ ] Implement cache invalidation and refresh logic

### 5. API Endpoints

- [ ] Create endpoints to:
  - Fetch aggregated messages for a user (with unread status)
  - Mark messages as read
  - Get unread counts per channel/server
- [ ] Secure endpoints with authentication/middleware

### 6. Frontend Integration

- [ ] Update feed UI to display aggregated/unread messages
- [ ] Add unread indicators and real-time update handling
- [ ] Allow users to mark messages as read
- [ ] Provide feedback for real-time updates (websockets or polling)

### 7. Testing & Validation

- [ ] Unit tests for message fetching, caching, and unread logic
- [ ] Integration tests for end-to-end aggregation and real-time updates
- [ ] Manual testing with real Discord data

### 8. Documentation

- [ ] Update API documentation for new endpoints
- [ ] Add user guide section for new feed/unread features
- [ ] Document architecture and data flow for aggregation engine

## Task Sequencing Example

1. [x] Schema & DB changes
2. [x] Background job setup
3. [x] fetch-messages job processor (stub/DB/cache integration)
4. [x] refresh-cache job logic
5. [x] retry-failed job logic
6. [x] Job scheduling based on channel priority/activity (**Bull repeatable jobs, cron-based**)
7. [ ] Webhook integration
8. [ ] Caching logic
9. [ ] API endpoints
10. [ ] Frontend updates
11. [ ] Testing
12. [ ] Documentation

---

# ✅ READY FOR IMPLEMENTATION

All design, architecture, and implementation steps are now documented. Proceed to implementation, following the above breakdown and sequence.

# 🛠️ DETAILED PLAN: BACKGROUND JOB SYSTEM (BULL)

## Purpose

Efficiently fetch, cache, and refresh Discord messages for all user channels, respecting rate limits and channel priority, using background jobs.

## Queue Structure

- **Queue Name:** message-aggregation
- **Job Types:**
  - `fetch-messages`: Poll Discord API for new messages in a channel
  - `refresh-cache`: Update Redis cache for a channel/user
  - `retry-failed`: Retry failed fetches with exponential backoff
  - `priority-fetch`: Immediate fetch for high-priority channels (e.g., user is active)

## Job Data Structure

- `channelId`: Discord channel to fetch
- `userId`: (optional) For DMs or user-specific jobs
- `lastFetchedAt`: Timestamp of last successful fetch
- `priority`: Numeric priority (higher = more urgent)
- `attempt`: Retry count

## Scheduling & Triggers

- **Periodic Polling:**
  - Schedule jobs at intervals based on channel priority and user activity
  - Use cron or setInterval for regular polling
- **Event-Driven:**
  - Trigger `priority-fetch` when user opens a channel/feed
  - Trigger `refresh-cache` after webhook events
- **Rate Limit Awareness:**
  - Track Discord API rate limits in Redis
  - Pause/schedule jobs to avoid exceeding limits

## Job Processor Responsibilities

- Fetch messages from Discord API (since `lastFetchedAt`)
- Store new messages in `MessageCache` table
- Update Redis cache for fast access
- Update `LastRead`/last visit timestamps as needed
- Handle errors (network, rate limit, API errors)
- Retry failed jobs with exponential backoff
- Log failures and alert if persistent

## Error Handling & Monitoring

- Use Bull's built-in retry and failure queues
- Log errors to a monitoring service or database
- Alert on repeated failures or rate limit issues
- Optionally, expose a dashboard for job status (Bull Board)

## Integration Points

- **Prisma:** For DB writes to `MessageCache`, `LastRead`
- **Redis:** For caching messages, tracking rate limits, and job state
- **Discord.js:** For API calls to fetch messages
- **Webhook System:** Trigger cache refresh jobs on webhook events
- **Frontend:** Trigger `priority-fetch` jobs when user opens a channel/feed

## Security & Resource Management

- Ensure jobs are authenticated and scoped to the correct user/server
- Limit concurrent jobs to avoid resource exhaustion
- Clean up old jobs and cache entries regularly

## Next Steps

1. Scaffold Bull queue and processor files
2. Implement job data structure and scheduling logic
3. Integrate with Discord API, Prisma, and Redis
4. Test with sample channels and users
5. Monitor and tune job performance

---
