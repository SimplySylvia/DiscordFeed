import Redis from 'ioredis';
import redis, {
  storeDiscordToken,
  getDiscordToken,
  deleteDiscordToken,
  tokenNeedsRefresh,
} from './redis';

jest.mock('ioredis');

const mockSetex = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();

(redis as any).setex = mockSetex;
(redis as any).get = mockGet;
(redis as any).del = mockDel;

describe('redis.ts', () => {
  const userId = '123';
  const token = {
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeDiscordToken', () => {
    it('stores the token in Redis with correct key and value', async () => {
      await storeDiscordToken(userId, token);
      expect(mockSetex).toHaveBeenCalledWith(
        `user:${userId}`,
        60 * 60 * 24,
        JSON.stringify(token)
      );
    });
  });

  describe('getDiscordToken', () => {
    it('returns the token if it exists', async () => {
      mockGet.mockResolvedValueOnce(JSON.stringify(token));
      const result = await getDiscordToken(userId);
      expect(result).toEqual(token);
      expect(mockGet).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('returns null if token does not exist', async () => {
      mockGet.mockResolvedValueOnce(null);
      const result = await getDiscordToken(userId);
      expect(result).toBeNull();
    });
  });

  describe('deleteDiscordToken', () => {
    it('deletes the token for the user', async () => {
      await deleteDiscordToken(userId);
      expect(mockDel).toHaveBeenCalledWith(`user:${userId}`);
    });
  });

  describe('tokenNeedsRefresh', () => {
    it('returns true if token expires in 5 minutes or less', () => {
      const soonExpiringToken = {
        ...token,
        expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes from now
      };
      expect(tokenNeedsRefresh(soonExpiringToken)).toBe(true);
    });

    it('returns false if token expires in more than 5 minutes', () => {
      const laterExpiringToken = {
        ...token,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
      };
      expect(tokenNeedsRefresh(laterExpiringToken)).toBe(false);
    });
  });
});
