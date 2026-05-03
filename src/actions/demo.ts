'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function resetDemoProgress() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return { error: 'Demo mode is disabled' }
  }

  try {
    const session = await getSession()
    if (!session || typeof session.enrollmentId !== 'string' || typeof session.accessCode !== 'string') {
      return { error: 'Obehörig.' }
    }

    if (!session.accessCode.startsWith('DEMO-')) {
      return { error: 'Endast DEMO-konton kan nollställas.' }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: session.enrollmentId }
    })

    if (!enrollment) {
      return { error: 'Could not find course enrollment.' }
    }

    // Reset status and progressData
    await prisma.enrollment.update({
      where: { id: session.enrollmentId },
      data: {
        status: 'NOT_STARTED',
        progressData: {}
      }
    })

    revalidatePath('/course')
    return { success: true }
  } catch (error) {
    console.error('Demo reset error:', error)
    return { error: 'A server error occurred during reset.' }
  }
}
