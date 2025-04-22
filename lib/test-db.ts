// Sanity check to ensure the database connection is working
import { prisma } from './prisma';

async function testConnection() {
  try {
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();