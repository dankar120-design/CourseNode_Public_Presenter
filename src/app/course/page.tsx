import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CourseContentSchema } from '@/lib/schema';
import CourseEngine from '@/components/CourseEngine';

export default async function CoursePage() {
  const session = await getSession();
  
  if (!session || typeof session.enrollmentId !== 'string') {
    redirect('/login?error=course_no_session');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: session.enrollmentId },
    include: { course: true }
  });

  if (!enrollment || !enrollment.course) {
    redirect('/login?error=course_no_enrollment');
  }

  const parsed = CourseContentSchema.safeParse(enrollment.course.content);
  if (!parsed.success) {
    return <div className="p-8 text-center text-destructive font-bold">Invalid course content in database.</div>;
  }
  
  const courseContent = parsed.data;
  const progressData = (enrollment.progressData as Record<string, any>) || {};
  const lastAttemptAt = progressData.lastAttemptAt || null;
  const initialStep = typeof progressData.currentStep === 'number' ? progressData.currentStep : 0;

  // 🛡️ ZERO-TRUST SECURITY:
  // We no longer send any exam questions on initial render to avoid "Hand-Picked" exploit.
  // CourseEngine will call startExamSession() Server Action to securely generate and lock a session.
  const safeExamination: any[] = [];

  return (
    <div className="min-h-screen bg-background">
      <CourseEngine 
        courseTitle={enrollment.course.title}
        modules={courseContent.modules}
        examination={safeExamination}
        initialStatus={enrollment.status}
        lastAttemptAt={lastAttemptAt}
        initialStep={initialStep}
      />
    </div>
  );
}
