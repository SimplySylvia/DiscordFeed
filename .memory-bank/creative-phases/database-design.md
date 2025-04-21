# Database Schema Design Creative Phase

## Problem Statement

Design an efficient, scalable database schema that:

1. Tracks users and their Discord servers/channels
2. Enables efficient querying of unread messages
3. Supports user preferences
4. Handles the relationships between users, servers, and channels
5. Optimizes for the performance requirements of the application

## Requirements & Constraints

- Must support tracking 50+ servers per user
- Must enable efficient unread message tracking
- Must handle thousands of concurrent users
- Must scale with growing user data
- Must provide fast access patterns for feed generation

## Options Considered

### Option 1: Normalized Schema with Separate LastRead Table

```prisma
model User {
  id            String          @id @default(cuid())
  discordId     String          @unique
  username      String
  email         String?         @unique
  accessToken   String?
  refreshToken  String?
  expiresAt     DateTime?
  servers       ServerUser[]    // Many-to-many relationship
  lastReads     LastRead[]      // One-to-many for read status
  preferences   UserPreference?
}

model LastRead {
  id          String    @id @default(cuid())
  userId      String
  channelId   String
  lastReadAt  DateTime
  user        User      @relation(fields: [userId], references: [id])
  channel     Channel   @relation(fields: [channelId], references: [id])
  @@unique([userId, channelId])
  @@index([lastReadAt])
}
```

**Pros:**

- Clean separation of concerns
- Efficient querying of unread messages
- Easy to track read status per channel
- Optimized for frequent updates

**Cons:**

- Additional joins needed
- More complex queries for aggregation
- Higher storage overhead

### Option 2: Embedded Read Status in Channel

```prisma
model Channel {
  id              String    @id
  name            String
  type            String
  serverId        String
  server          Server    @relation(fields: [serverId], references: [id])
  lastReadStatus  Json?     // Map of userId -> lastReadTimestamp
  @@index([serverId])
}
```

**Pros:**

- Fewer joins needed
- Simpler queries for basic operations
- Lower storage overhead

**Cons:**

- Less flexible for complex queries
- Potential performance issues with large user bases
- JSON operations can be slower

### Option 3: Hybrid Approach with Materialized Views

```prisma
model Channel {
  id          String    @id
  name        String
  type        String
  serverId    String
  server      Server    @relation(fields: [serverId], references: [id])
  lastReads   LastRead[]
}

model LastRead {
  id          String    @id @default(cuid())
  userId      String
  channelId   String
  lastReadAt  DateTime
  // Additional materialized fields for quick access
  serverName  String
  channelName String
  @@index([userId, lastReadAt])
}
```

**Pros:**

- Best query performance for feed generation
- Efficient for both reading and writing
- Good balance of normalization and denormalization

**Cons:**

- More complex to maintain
- Requires careful management of materialized data
- Higher storage requirements

## Selected Approach

**Option 1: Normalized Schema with Separate LastRead Table**

### Justification

1. Flexibility:

   - Provides the most flexibility for future features
   - Clean modeling of relationships
   - Easier to extend

2. Data Integrity:

   - Maintains proper relationships
   - Prevents data inconsistencies
   - Better foreign key constraints

3. Query Efficiency:

   - Can be optimized with proper indexes
   - Supports complex filtering and aggregation
   - Better for transaction handling

4. Scalability:
   - Can scale horizontally by sharding on user ID
   - Standard schema works well with ORM tooling
   - Easier to optimize with database-specific features

## Recommended Schema

```prisma
model User {
  id                String              @id @default(cuid())
  discordId         String              @unique
  username          String
  email             String?             @unique
  image             String?
  accessToken       String?             @map("access_token")
  refreshToken      String?             @map("refresh_token")
  expiresAt         DateTime?           @map("expires_at")
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")
  userPreferences   UserPreference?
  servers           ServerUser[]
  lastReads         LastRead[]

  @@map("users")
}

model DiscordServer {
  id          String           @id
  name        String
  icon        String?
  members     ServerUser[]
  channels    DiscordChannel[]
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  @@map("discord_servers")
}

model ServerUser {
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String        @map("user_id")
  server      DiscordServer @relation(fields: [serverId], references: [id], onDelete: Cascade)
  serverId    String        @map("server_id")

  @@id([userId, serverId])
  @@map("server_users")
}

model DiscordChannel {
  id          String          @id
  name        String
  type        Int
  server      DiscordServer   @relation(fields: [serverId], references: [id], onDelete: Cascade)
  serverId    String          @map("server_id")
  parentId    String?         @map("parent_id")
  position    Int
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")
  lastReads   LastRead[]

  @@map("discord_channels")
}

model LastRead {
  id          String          @id @default(cuid())
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String          @map("user_id")
  channel     DiscordChannel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  channelId   String          @map("channel_id")
  lastReadAt  DateTime        @map("last_read_at")
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  @@unique([userId, channelId])
  @@map("last_reads")
}

model UserPreference {
  id                    String  @id @default(cuid())
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId                String  @unique @map("user_id")
  refreshInterval       Int     @default(300) @map("refresh_interval") // in seconds
  showUnreadOnly        Boolean @default(true) @map("show_unread_only")
  notificationsEnabled  Boolean @default(true) @map("notifications_enabled")
  theme                 String  @default("system")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@map("user_preferences")
}
```

## Implementation Plan

1. Create the Prisma schema file with the models defined above
2. Set up the PostgreSQL database connection
3. Generate the Prisma client
4. Create initial migrations
5. Implement repository patterns for data access
6. Add indexes for common query patterns
7. Implement database seeding for testing

## Database Access Patterns

- User authentication: Query by discordId
- Channel listing: Query channels by serverId
- Unread messages: Join channels with lastReads, filter by lastReadAt
- User preferences: Query by userId
- Server membership: Query servers by userId through ServerUser
