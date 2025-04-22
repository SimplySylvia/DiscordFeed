import NextAuth, { NextAuthOptions } from "next-auth";
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
  // Use our custom adapter instead of the standard PrismaAdapter
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
    async session({ session, token }: { session: Session; token: JWT }) {
      // Safely set the ID without type casting
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 