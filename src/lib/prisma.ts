import { PrismaClient } from '@prisma/client'
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool as PgPool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = global as unknown as { prisma: PrismaClient, neonPool?: NeonPool, pgPool?: PgPool }

const connectionString = process.env.DATABASE_URL || ''
const isNeon = connectionString.includes('neon.tech')

let adapter: PrismaNeon | PrismaPg;

if (isNeon) {
  const pool = globalForPrisma.neonPool || new NeonPool({ connectionString })
  globalForPrisma.neonPool = pool
  adapter = new PrismaNeon(pool as any)
} else {
  const pool = globalForPrisma.pgPool || new PgPool({ connectionString })
  globalForPrisma.pgPool = pool
  adapter = new PrismaPg(pool)
}

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
