# Discord Feed Project Tasks

## Current Phase: Phase 2 – Message Aggregation Engine In Progress

### Setup Tasks

- [x] Create Memory Bank structure
- [x] Initialize Next.js project
- [x] Setup project structure
- [x] Configure initial dependencies
- [x] Setup Github repository

### Phase 1: OAuth2 Authentication and Channel Indexing

- [x] Design Discord OAuth2 architecture (Hybrid Approach with Edge Middleware)
- [x] Design database schema (Normalized Schema with Separate LastRead Table)
- [x] Design channel indexing strategy (Priority-based Progressive Indexing)
- [x] Implement Discord OAuth2 login with NextAuth.js
- [x] Create database schema for user/server/channel tracking
- [x] Implement periodic channel indexing
- [x] Develop user preferences system
- [x] Complete environment setup for production
- [x] Test full authentication flow
- [x] Test channel indexing with real Discord data

### Phase 2: Message Aggregation Engine

- [x] Extend database schema for message cache, last visit tracking, webhook event tracking
- [x] Update Prisma schema and generate migration
- [x] Set up Bull queues for message fetching and cache refresh
- [x] Implement job processors: fetch-messages, refresh-cache, retry-failed
- [x] Integrate Discord API for message fetching in fetch-messages job processor
- [x] Schedule jobs based on channel priority and activity (repeatable jobs, fallback polling logic present)
- [x] Create Next.js API route for Discord webhooks (app/api/webhook/discord/route.ts)
- [x] Implement Discord webhook registration for eligible channels (lib/discord/api.ts)
- [x] Build webhook handler endpoints (Next.js API routes)
- [x] Update message cache and unread status on webhook events
- [x] Fallback to polling for channels without webhook support (placeholder logic present)
- [x] Use Redis to cache recent messages per channel/user
- [x] Track and respect Discord API rate limits in Redis (basic structure present, advanced logic TODO)
- [x] Implement cache invalidation and refresh logic (refreshChannelCache helper, used after marking as read)
- [x] Create endpoint to mark messages as read (POST /api/messages, updates DB and cache, returns unread count)
- [x] Create endpoint to fetch aggregated messages (GET /api/messages, returns latest 50 messages, unread status, unread count, uses Redis cache)
- [x] Secure endpoints with authentication and authorization (only authenticated users who are members of the server that owns the channel can access/modify messages)
- [ ] Update feed UI to display aggregated/unread messages (TODO)
- [ ] Add unread indicators and real-time update handling (TODO)
- [ ] Allow users to mark messages as read (TODO)
- [ ] Provide feedback for real-time updates (websockets or polling) (TODO)
- [ ] Unit tests for message fetching, caching, and unread logic (TODO)
- [ ] Integration tests for end-to-end aggregation and real-time updates (TODO)
- [ ] Manual testing with real Discord data (TODO)
- [ ] Update API documentation for new endpoints (TODO)
- [ ] Add user guide section for new feed/unread features (TODO)
- [ ] Document architecture and data flow for aggregation engine (TODO)

### Phase 3: Unified Feed Interface

- [ ] Create infinite scroll feed grouped by server/channel
- [ ] Implement message interactions (read, respond, react)
- [ ] Add filtering/sorting options
- [ ] Ensure mobile-responsive design

### Phase 4: Performance Optimization

- [ ] Optimize caching (Edge and Redis)
- [ ] Optimize database queries
- [ ] Implement background sync for offline
- [ ] Add engagement analytics

## Design Decisions Documentation

- [x] Authentication design document (.memory-bank/creative-phases/auth-design.md)
- [x] Database schema design document (.memory-bank/creative-phases/database-design.md)
- [x] Channel indexing strategy document (.memory-bank/creative-phases/channel-indexing.md)
- [x] Creative phase summary (.memory-bank/creative-phases/summary.md)
- [x] Message aggregation engine design (.memory-bank/creative-phases/phase2-message-aggregation.md)

## Implementation Documentation

- [x] Implementation plan (implementation-plan.md)
- [ ] Environment setup guide
- [ ] Testing documentation
