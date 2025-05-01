import { getDiscordToken, storeDiscordToken, tokenNeedsRefresh } from '../auth/redis';
import Redis from 'ioredis';

// Discord API base URL
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Define interfaces for Discord API responses
export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id: string;
  parent_id: string | null;
  position: number;
}

// Discord API client
export class DiscordAPI {
  private userId: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private redis: Redis;

  constructor(userId: string) {
    this.userId = userId;
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Get user guilds (servers)
  async getGuilds(): Promise<DiscordGuild[]> {
    return this.makeRequest<DiscordGuild[]>('/users/@me/guilds');
  }

  // Get channels in a guild
  async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    return this.makeRequest<DiscordChannel[]>(`/guilds/${guildId}/channels`);
  }

  // Get a single guild
  async getGuild(guildId: string): Promise<DiscordGuild> {
    return this.makeRequest<DiscordGuild>(`/guilds/${guildId}`);
  }

  // Fetch messages from a channel
  async fetchChannelMessages(channelId: string, options?: { after?: string; before?: string; limit?: number }) {
    let endpoint = `/channels/${channelId}/messages`;
    const params = [];
    if (options?.after) params.push(`after=${options.after}`);
    if (options?.before) params.push(`before=${options.before}`);
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return this.makeRequest<any[]>(endpoint);
  }

  // Make a request to the Discord API with rate limit handling
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getValidToken();

    if (!token) {
      throw new Error('No valid Discord token available');
    }

    const url = `${DISCORD_API_BASE}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    };

    // --- Rate limit check before request ---
    // Use endpoint as bucket key (can be improved with Discord's bucket system)
    const bucketKey = `discord:ratelimit:${endpoint}`;
    const rateLimitData = await this.redis.get(bucketKey);
    if (rateLimitData) {
      const { remaining, reset } = JSON.parse(rateLimitData);
      const now = Math.floor(Date.now() / 1000);
      if (remaining !== undefined && remaining <= 0 && reset && now < reset) {
        // Wait until reset
        const waitMs = (reset - now) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
    // --- End rate limit check ---

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });

    // --- Store rate limit headers in Redis ---
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const resetAfter = response.headers.get('x-ratelimit-reset-after');
    const bucket = response.headers.get('x-ratelimit-bucket');
    const retryAfter = response.headers.get('retry-after');
    if (limit && remaining && reset) {
      await this.redis.set(
        bucketKey,
        JSON.stringify({
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: parseInt(reset, 10),
          resetAfter: resetAfter ? parseFloat(resetAfter) : undefined,
          bucket,
          retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
        }),
        'EX',
        Math.max(1, parseInt(reset, 10) - Math.floor(Date.now() / 1000))
      );
    }
    // --- End store rate limit headers ---

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '1', 10);

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.makeRequest<T>(endpoint, options);
      } else {
        this.retryCount = 0;
        throw new Error('Rate limit exceeded');
      }
    }

    // Reset retry counter on success
    this.retryCount = 0;

    // Handle other error responses
    if (!response.ok) {
      // Authentication error - token may be invalid
      if (response.status === 401 || response.status === 403) {
        // Try to refresh the token and retry once
        await this.refreshToken();
        // Only retry once
        if (this.retryCount === 0) {
          this.retryCount++;
          return this.makeRequest<T>(endpoint, options);
        }
      }

      throw new Error(`Discord API error: ${response.status}`);
    }

    return response.json();
  }

  // Get a valid token, refreshing if necessary
  private async getValidToken() {
    const token = await getDiscordToken(this.userId);

    if (!token) {
      return null;
    }

    if (tokenNeedsRefresh(token)) {
      return this.refreshToken();
    }

    return token;
  }

  // Refresh the Discord token
  private async refreshToken() {
    // Get the current token with refresh token
    const currentToken = await getDiscordToken(this.userId);

    if (!currentToken || !currentToken.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID || '',
          client_secret: process.env.DISCORD_CLIENT_SECRET || '',
          grant_type: 'refresh_token',
          refresh_token: currentToken.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      const newToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      // Store the new token
      await storeDiscordToken(this.userId, newToken);

      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

// Register a Discord webhook for a channel
export async function registerDiscordWebhook({
  userId,
  channelId,
  name = 'DiscordFeed Webhook',
  avatar = undefined,
  callbackUrl,
}: {
  userId: string;
  channelId: string;
  name?: string;
  avatar?: string;
  callbackUrl: string;
}): Promise<{ webhookId: string; webhookUrl: string }> {
  // Requires MANAGE_WEBHOOKS permission for the channel
  const token = await getDiscordToken(userId);
  if (!token) throw new Error('No valid Discord token available');

  const url = `${DISCORD_API_BASE}/channels/${channelId}/webhooks`;
  const body = {
    name,
    avatar,
    url: callbackUrl, // Not used by Discord, but document for clarity
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, avatar }),
  });
  if (!response.ok) {
    throw new Error(`Failed to register webhook: ${response.status}`);
  }
  const data = await response.json();
  return { webhookId: data.id, webhookUrl: data.url };
} 