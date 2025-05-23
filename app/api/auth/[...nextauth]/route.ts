import NextAuth from "next-auth";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/authOptions";

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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 