import Redis from "ioredis";

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "");

// Token interface
interface DiscordToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Generate Redis key for a Discord token
const getDiscordTokenKey = (userId: string) => `discord_token:${userId}`;

// Store Discord tokens in Redis
export async function storeDiscordToken(userId: string, token: DiscordToken): Promise<void> {
  const key = getDiscordTokenKey(userId);
  await redis.setex(
    key,
    60 * 60 * 24, // 24 hours
    JSON.stringify(token)
  );
}

// Get Discord token from Redis
export async function getDiscordToken(userId: string): Promise<DiscordToken | null> {
  const key = getDiscordTokenKey(userId);
  const token = await redis.get(key);

  if (!token) {
    return null;
  }

  return JSON.parse(token) as DiscordToken;
}

// Delete Discord token from Redis
export async function deleteDiscordToken(userId: string): Promise<void> {
  const key = getDiscordTokenKey(userId);
  await redis.del(key);
}

// Check if token needs to be refreshed (expires in 5 minutes or less)
export function tokenNeedsRefresh(token: DiscordToken): boolean {
  const currentTime = Date.now();
  const fiveMinutesInMs = 5 * 60 * 1000;

  return token.expiresAt - currentTime <= fiveMinutesInMs;
}

export default redis; 