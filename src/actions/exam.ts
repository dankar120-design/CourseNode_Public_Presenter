'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Resend } from 'resend'
import { CourseContentSchema } from '@/lib/schema'
import { brandConfig } from '@/config/branding'
import { randomBytes } from 'crypto'
import { EXAM_COOLDOWN_SECONDS } from '@/config/constants'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ProgressData {
  lastAttemptAt?: string;
  activeExamSession?: {
    questionIds: string[];
    generatedAt: string;
  };
  currentStep?: number;
  furthestStep?: number;
}

// Cryptographically secure Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const randomBuffer = randomBytes(4);
    const randomNumber = randomBuffer.readUInt32LE(0);
    const j = randomNumber % (i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function startExamSession(isSandbox: boolean = false) {
  try {
    const session = await getSession()
    if (!session || typeof session.enrollmentId !== 'string') {
      return { error: 'Obehörig.' }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: session.enrollmentId },
      include: { course: true }
    })

    if (!enrollment || enrollment.status === 'COMPLETED') {
      return { error: 'Kan inte starta prov, kursen är redan klar eller hittades inte.' }
    }

    const parsed = CourseContentSchema.safeParse(enrollment.course.content)
    if (!parsed.success) {
      return { error: 'Ogiltigt kursinnehåll i databasen.' }
    }

    // Cooldown check (only if not sandbox)
    const progressData = (enrollment.progressData as ProgressData) || {};
    if (!isSandbox && progressData.lastAttemptAt) {
      const lastAttempt = new Date(progressData.lastAttemptAt);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastAttempt.getTime()) / 1000;
      if (diffSeconds < EXAM_COOLDOWN_SECONDS) {
        return { error: `Du måste vänta ${Math.ceil(EXAM_COOLDOWN_SECONDS - diffSeconds)} sekunder till innan du kan försöka igen.` }
      }
    }

    const allQuestions = parsed.data.examination;
    let selectedQuestions;
    let isNewSession = false;

    // Ateranvand session for att stanga "Infinite Reroll" via F5, men validera sa att fragor inte tagits bort
    if (!isSandbox && progressData.activeExamSession?.questionIds) {
      const existingIds = progressData.activeExamSession.questionIds;
      const existingQuestions = allQuestions.filter(q => existingIds.includes(q.id));
      
      if (existingQuestions.length === 10) {
        selectedQuestions = existingQuestions;
      }
    }

    if (!selectedQuestions) {
      const shuffledPool = shuffleArray(allQuestions);
      selectedQuestions = shuffledPool.slice(0, 10);
      isNewSession = true;
    }

    const selectedQuestionIds = selectedQuestions.map(q => q.id);

    // If not sandbox, lock this session in DB to prevent Hand-Picked exploit
    if (!isSandbox && isNewSession) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progressData: {
            ...progressData,
            activeExamSession: {
              questionIds: selectedQuestionIds,
              generatedAt: new Date().toISOString()
            }
          }
        }
      });
    }

    // Strip correct answers
    const safeQuestions = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: shuffleArray([q.correctAnswer, ...q.distractors])
    }));

    return { questions: safeQuestions }
  } catch (error) {
    console.error('startExamSession error:', error);
    return { error: 'Ett fel inträffade när provet skulle startas.' }
  }
}

export async function submitExam(answers: Record<string, string>, isSandbox: boolean = false) {
  try {
    const session = await getSession()
    if (!session || typeof session.enrollmentId !== 'string') {
      return { error: 'Obehörig.' }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: session.enrollmentId },
      include: { course: true }
    })

    if (!enrollment || enrollment.status === 'COMPLETED') {
      return { error: 'Kunde inte hitta kursregistreringen eller provet är redan klart.' }
    }

    const progressData = (enrollment.progressData as ProgressData) || {};

    if (!isSandbox) {
      if (progressData.lastAttemptAt) {
        const lastAttempt = new Date(progressData.lastAttemptAt);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastAttempt.getTime()) / 1000;
        if (diffSeconds < EXAM_COOLDOWN_SECONDS) {
          return { error: `Du måste vänta ${Math.ceil(EXAM_COOLDOWN_SECONDS - diffSeconds)} sekunder till innan du kan försöka igen.` }
        }
      }

      // Security Check: Match active session
      if (!progressData.activeExamSession || !progressData.activeExamSession.questionIds) {
        return { error: 'Ingen aktiv prov-session hittades. Ladda om sidan.' }
      }

      const activeIds = progressData.activeExamSession.questionIds;
      const submittedIds = Object.keys(answers);
      
      if (activeIds.length !== submittedIds.length || !activeIds.every(id => submittedIds.includes(id))) {
        return { error: 'Säkerhetsfel: Inskickade svar matchar inte den aktiva prov-sessionen. Manipulation misstänks.' }
      }
    }

    const parsed = CourseContentSchema.safeParse(enrollment.course.content)
    if (!parsed.success) { return { error: 'Ogiltigt kursinnehåll.' } }
    const examQuestions = parsed.data.examination;

    const failedQuestionIds: string[] = []
    // For sandbox, we might not have activeExamSession validation, but answers must match valid IDs
    for (const qId of Object.keys(answers)) {
      const q = examQuestions.find(eq => eq.id === qId)
      if (!q || answers[qId] !== q.correctAnswer) {
        failedQuestionIds.push(qId)
      }
    }

    const requiredCount = Object.keys(answers).length;
    const correctCount = requiredCount - failedQuestionIds.length;
    const passThreshold = Math.ceil(requiredCount * 0.8);

    if (correctCount < passThreshold) {
      if (!isSandbox) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            progressData: {
              ...progressData,
              lastAttemptAt: new Date().toISOString(),
              activeExamSession: undefined // Clear session
            }
          }
        })
      }
      return { 
        error: isSandbox ? `[SANDBOX] Du fick ${correctCount} av ${requiredCount} rätt. Felaktiga svar markeras röda.` : `Du fick ${correctCount} av ${requiredCount} rätt (Krav: ${passThreshold}). Läs igenom materialet och försök igen.`, 
        failedQuestionIds 
      }
    }

    if (!isSandbox) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          auditLogs: {
            examPassedAt: new Date().toISOString(),
            answers: answers
          },
          progressData: {
            ...progressData,
            activeExamSession: undefined // Clear session
          }
        }
      })

      // Email notification
      try {
        const adminEmail = process.env.ADMIN_EMAIL
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder' && adminEmail) {
          await resend.emails.send({
            from: `${brandConfig.email.senderName} <noreply@acme-enterprise.com>`,
            to: [adminEmail],
            subject: `Ny kurs godkänd (${enrollment.accessCodeId})`,
            text: `Användaren med kod ${enrollment.accessCodeId} har precis klarat kursen ${enrollment.course.title}.`,
          })
        }
      } catch (emailError) {}
    }

    return { success: true }
  } catch (error) {
    console.error('Exam submission error:', error)
    return { error: 'Ett internt fel inträffade vid rättningen.' }
  }
}

export async function cheatCompleteExam() {
  if (process.env.NODE_ENV === 'production') return { error: 'Denna funktion är spärrad i produktionsmiljö.' }
  try {
    const session = await getSession()
    if (!session || typeof session.enrollmentId !== 'string') return { error: 'Obehörig.' }
    await prisma.enrollment.update({
      where: { id: session.enrollmentId },
      data: { status: 'COMPLETED', completedAt: new Date(), auditLogs: { cheatUsed: true, cheatedAt: new Date().toISOString() } }
    })
    return { success: true }
  } catch (error) { return { error: 'Ett fel inträffade vid exekvering av fusk.' } }
}
