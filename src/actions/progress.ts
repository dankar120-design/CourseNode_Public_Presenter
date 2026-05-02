'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function saveProgress(currentStep: number) {
  try {
    const session = await getSession()
    if (!session || typeof session.enrollmentId !== 'string') {
      return { error: 'Obehörig.' }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: session.enrollmentId }
    })

    if (!enrollment || enrollment.status === 'COMPLETED') {
      return { error: 'Kan inte spara framsteg. Kursen är redan klar.' }
    }

    const currentProgress = (enrollment.progressData as Record<string, any>) || {}
    
    const previousFurthest = currentProgress.furthestStep || 0;
    const newFurthest = Math.max(previousFurthest, currentStep);

    await prisma.enrollment.update({
      where: { id: session.enrollmentId },
      data: {
        progressData: {
          ...currentProgress,
          currentStep: currentStep,
          furthestStep: newFurthest
        },
        status: 'IN_PROGRESS'
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Save progress error:', error)
    return { error: 'Kunde inte spara framsteg.' }
  }
}
