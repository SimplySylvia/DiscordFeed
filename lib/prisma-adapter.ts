import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Adapter, AdapterUser } from "next-auth/adapters";

// Extend AdapterUser to include profile data coming from Discord OAuth
interface AdapterUserWithDiscord extends Omit<AdapterUser, "id"> {
  profile?: {
    id?: string;
    [key: string]: any;
  };
}

/**
 * Custom Prisma adapter that extends the standard NextAuth Prisma adapter
 * to handle additional fields like discordId
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  // Get the standard adapter
  const standardAdapter = PrismaAdapter(prisma);

  // Return a new adapter with overridden createUser method
  return {
    ...standardAdapter,
    createUser: async (userData: AdapterUserWithDiscord) => {
      // Get discordId from profile if available
      const discordId = userData.profile?.id || "";

      // Create user with discordId
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          image: userData.image,
          discordId: discordId,
          username: userData.name || "user", // Required by your schema
        },
      });

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.username,
        image: user.image,
      } as AdapterUser;
    },
  };
} 