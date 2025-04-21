# Authentication Design Creative Phase

## Problem Statement

Design a secure, scalable authentication system that:

1. Implements Discord OAuth2 login
2. Manages token refresh and storage
3. Handles session management
4. Provides appropriate authorization scopes
5. Meets the performance requirement of handling thousands of concurrent users

## Requirements & Constraints

- Secure login with Discord account
- Grant only necessary permissions
- Easily revoke access
- Must handle 50+ servers
- Support thousands of concurrent users
- OAuth2 only with HTTPS
- Robust error handling

## Options Considered

### Option 1: Standard NextAuth.js with Database Sessions

```typescript
// Authentication configuration with database session strategy
{
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.members.read messages.read'
        }
      }
    })
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id
        }
      }
    }
  }
}
```

**Pros:**

- Built-in database session management
- Easy to revoke sessions
- Good for user tracking
- Simple to implement

**Cons:**

- Additional database queries for each request
- Higher latency for session validation
- More storage overhead

### Option 2: JWT-based Sessions with Redis Cache

```typescript
// JWT-based authentication with Redis caching
{
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.members.read messages.read'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Store Discord tokens in Redis with JWT id as key
        await redis.setex(
          `discord_token:${token.sub}`,
          24 * 60 * 60,
          JSON.stringify({
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
          })
        )
      }
      return token
    }
  }
}
```

**Pros:**

- Better performance (no DB queries)
- Reduced database load
- Easy to scale horizontally
- Lower latency

**Cons:**

- More complex token refresh logic
- Harder to revoke individual sessions
- Requires Redis setup and maintenance

### Option 3: Hybrid Approach with Edge Middleware

```typescript
// Hybrid authentication with Edge middleware validation
{
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.members.read messages.read'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Store minimal data in JWT
        token.sub = account.providerAccountId
        // Store detailed data in Redis
        await redis.setex(
          `user:${account.providerAccountId}`,
          24 * 60 * 60,
          JSON.stringify({
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
          })
        )
      }
      return token
    }
  }
}

// middleware.ts
export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return redirectToLogin()

  // Quick validation at the edge
  if (isTokenExpired(token)) {
    return redirectToRefresh()
  }

  // Attach minimal user context
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', token.sub as string)

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}
```

**Pros:**

- Best performance with edge validation
- Scalable and efficient
- Good balance of security and speed
- Supports token refresh without full database queries

**Cons:**

- More complex implementation
- Requires careful coordination between edge and backend
- More sophisticated deployment requirements

## Selected Approach

**Option 3: Hybrid Approach with Edge Middleware**

### Justification

1. Best Performance:

   - Edge validation reduces latency
   - Minimal database queries
   - Efficient token management

2. Security:

   - Proper scope handling
   - Secure token storage
   - Easy session management

3. Scalability:

   - Handles thousands of concurrent users
   - Works well with Redis caching
   - Supports horizontal scaling

4. Maintainability:
   - Clear separation of concerns
   - Easy to debug and monitor
   - Flexible for future enhancements

## Implementation Plan

1. Set up environment variables:

   - DISCORD_CLIENT_ID
   - DISCORD_CLIENT_SECRET
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - REDIS_URL

2. Create NextAuth configuration (`app/api/auth/[...nextauth]/route.ts`)
3. Implement Edge middleware for token validation
4. Create Redis client for token storage
5. Implement token refresh mechanism
6. Build login page and protected routes
7. Add error handling and logging

## Authentication Flow Diagram

```
User -> Login Page -> Discord OAuth -> Auth Callback -> Store Tokens -> JWT Cookie -> Protected Routes
```

## Required Dependencies

- next-auth
- @auth/prisma-adapter (for account linkage)
- ioredis (for Redis client)
- jose (for JWT handling in middleware)
