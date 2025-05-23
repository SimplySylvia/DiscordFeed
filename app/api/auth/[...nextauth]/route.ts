import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/authOptions";


// Add a check to ensure prisma is defined
if (!prisma) {
  throw new Error("Prisma client not initialized. Check your database connection.");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 