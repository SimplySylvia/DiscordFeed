import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import Redis from "ioredis";
import { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

// Add interface to extend Session type
interface ExtendedSession extends Session {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "");

// Helper function to store Discord tokens in Redis
async function storeTokensInRedis(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
) {
  const key = `discord_token:${userId}`;
  await redis.setex(
    key,
    60 * 60 * 24, // 24 hours
    JSON.stringify(tokens)
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read messages.read",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        try {
          // Store tokens in Redis
          await storeTokensInRedis(user.id, {
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            expiresAt: account.expires_at! * 1000, // Convert to milliseconds
          });
        } catch (error) {
          console.error("Error storing token in Redis:", error);
        }

        return {
          ...token,
          sub: user.id,
          discordId: account.providerAccountId,
        };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        (session as ExtendedSession).user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 