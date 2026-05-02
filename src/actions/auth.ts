'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { encrypt } from '@/lib/auth'

export async function loginWithCode(accessCode: string) {
  try {
    const code = accessCode.toUpperCase()
    
    // Find enrollment for this access code. For MVP, we assume 1 enrollment per code,
    // but the schema supports many. Let's find the first one.
    const enrollment = await prisma.enrollment.findFirst({
      where: { accessCodeId: code },
      include: { course: true }
    })

    if (!enrollment) {
      return { error: 'Ogiltig åtkomstkod eller ingen kurs tilldelad.' }
    }

    // Återställning av demo-konton om DEMO_MODE är aktivt (för säljare/testning)
    const isDemoCode = code.startsWith('DEMO-');
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

    if (isDemoCode && isDemoMode) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'IN_PROGRESS',
          completedAt: null,
          progressData: Prisma.DbNull,
          auditLogs: Prisma.DbNull,
          certDownloads: 0
        }
      })
    } else if (!enrollment.startedAt) {
      // Update startedAt if it's the first time
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { 
          startedAt: new Date(),
          status: 'IN_PROGRESS' 
        }
      })
    }

    const sessionData = {
      enrollmentId: enrollment.id,
      accessCode: code,
      courseId: enrollment.courseId,
    }

    const session = await encrypt(sessionData)
    const cookieStore = await cookies()
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Ett oväntat fel inträffade.' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
