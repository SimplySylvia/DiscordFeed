import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import Redis from "ioredis";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { CustomPrismaAdapter } from "@/lib/prisma-adapter";

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "");

// Add a check to ensure prisma is defined
if (!prisma) {
  throw new Error("Prisma client not initialized. Check your database connection.");
}

// Helper function to store Discord tokens in Redis
async function storeTokensInRedis(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
) {
  const key = `user:${userId}`;
  await redis.setex(
    key,
    60 * 60 * 24, // 24 hours
    JSON.stringify(tokens)
  );
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read messages.read",
        },
      },
      profile(profile) {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.image_url,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // On initial sign-in, account and user are present
      if (account && user) {
        try {
          await storeTokensInRedis(user.id, {
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            expiresAt: account.expires_at! * 1000,
          });
          // Also store tokens in the database (Account table)
          await prisma.account.updateMany({
            where: { userId: user.id, provider: 'discord' },
            data: {
              access_token: account.access_token!,
              refresh_token: account.refresh_token!,
              expires_at: account.expires_at!, // Prisma expects seconds
            },
          });
          // Also store tokens in the User table
          await prisma.user.update({
            where: { id: user.id },
            data: {
              accessToken: account.access_token!,
              refreshToken: account.refresh_token!,
              expiresAt: new Date(account.expires_at! * 1000), // User model expects DateTime
            },
          });
        } catch (error) {
          console.error("Error storing token in Redis, Account, or User table:", error);
        }
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at! * 1000;
        token.sub = user.id;
        token.discordId = account.providerAccountId;
        return token;
      }
      // On subsequent calls, use token fields if available and of correct type
      if (
        typeof token.accessToken === 'string' &&
        typeof token.refreshToken === 'string' &&
        typeof token.expiresAt === 'number' &&
        typeof token.sub === 'string'
      ) {
        try {
          await storeTokensInRedis(token.sub, {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            expiresAt: token.expiresAt,
          });
          // Also store tokens in the database (Account table)
          await prisma.account.updateMany({
            where: { userId: token.sub, provider: 'discord' },
            data: {
              access_token: token.accessToken,
              refresh_token: token.refreshToken,
              expires_at: Math.floor(token.expiresAt / 1000), // Prisma expects seconds
            },
          });
          // Also store tokens in the User table
          await prisma.user.update({
            where: { id: token.sub },
            data: {
              accessToken: token.accessToken,
              refreshToken: token.refreshToken,
              expiresAt: new Date(token.expiresAt),
            },
          });
        } catch (error) {
          console.error("Error storing token in Redis, Account, or User table (refresh):", error);
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
}; 