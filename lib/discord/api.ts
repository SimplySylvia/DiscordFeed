import { getDiscordToken, storeDiscordToken, tokenNeedsRefresh } from '../auth/redis';

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

  constructor(userId: string) {
    this.userId = userId;
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

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });

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