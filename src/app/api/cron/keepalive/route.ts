import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Strikta "fail-closed" kontroller (säkerhet)
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Extremt lättviktig fråga som tvingar databasen att "vakna"
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ ok: true, message: 'Database keep-alive ping successful' });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ ok: false, error: 'Database keep-alive failed' }, { status: 500 });
  }
}
