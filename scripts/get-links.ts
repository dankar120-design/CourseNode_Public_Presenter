import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool as PgPool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';
import dotenv from 'dotenv';

neonConfig.webSocketConstructor = ws;
dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
const isNeon = connectionString.includes('neon.tech');

let adapter;
if (isNeon) {
  const pool = new NeonPool({ connectionString });
  adapter = new PrismaNeon(pool as any);
} else {
  const pool = new PgPool({ connectionString });
  adapter = new PrismaPg(pool);
}
const prisma = new PrismaClient({ adapter });
const BASE_URL = process.env.BASE_URL || 'https://demo.example.com';

async function main() {
  const searchQuery = process.argv[2];

  try {
    const licenses = await prisma.license.findMany({
      where: searchQuery ? {
        companyName: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (licenses.length === 0) {
      console.log(`❌ Hittade inga licenser${searchQuery ? ` för "${searchQuery}"` : ''}.`);
      return;
    }

    console.log(`\n🔎 Hittade ${licenses.length} licens(er):\n`);
    
    for (const license of licenses) {
      console.log(`🏢 Företag: ${license.companyName}`);
      console.log(`📅 Skapad: ${license.createdAt.toLocaleDateString('sv-SE')}`);
      console.log(`🔢 Koder: ${license.usedCodes} / ${license.totalCodes}`);
      console.log(`🔗 Länk: ${BASE_URL}/dashboard/${license.dashboardKey}`);
      console.log('--------------------------------------------------');
    }

  } catch (error) {
    console.error('❌ Ett fel uppstod:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
