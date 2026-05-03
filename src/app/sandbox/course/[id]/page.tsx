import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CourseContentSchema } from '@/lib/schema';
import CourseEngine from '@/components/CourseEngine';
import * as fs from 'fs';
import * as path from 'path';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}

export default async function SandboxPage({ params, searchParams }: PageProps) {
  // 1. Production Guard
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { id } = await params;
  const { source } = await searchParams;

  // 2. Security: Path Traversal Protection
  // Only allow alphanumeric, underscore, and hyphen for file access
  const safeId = id.replace(/[^a-z0-9_-]/gi, '');
  if (safeId !== id) {
    notFound();
  }

  let courseTitle = '';
  let modules: any[] = [];
  let examination: any[] = [];
  let status = 'NOT_STARTED';

  try {
    if (source === 'file') {
      // 3. Load from local file system
      const filePath = path.join(process.cwd(), 'data', 'courses', `${safeId}.json`);
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const courseData = JSON.parse(fileContent);
      
      const parsed = CourseContentSchema.safeParse(courseData);
      if (!parsed.success) {
        return (
          <div className="p-8 text-center bg-destructive/10 text-destructive font-bold">
            <h2 className="text-xl mb-4">JSON Validation Error</h2>
            <pre className="text-left text-xs overflow-auto bg-card p-4 rounded-lg border border-border shadow-inner">
              {parsed.error.message}
            </pre>
          </div>
        );
      }
      
      courseTitle = `[SANDBOX FILE] ${safeId}`;
      modules = parsed.data.modules;
      examination = [];
    } else {
      // 4. Load from Database
      const course = await prisma.course.findUnique({
        where: { id: safeId }
      });

      if (!course) {
        notFound();
      }

      const parsed = CourseContentSchema.safeParse(course.content);
      if (!parsed.success) {
        notFound();
      }

      courseTitle = `[SANDBOX DB] ${course.title}`;
      modules = parsed.data.modules;
      examination = [];
    }
  } catch (error) {
    console.error('Sandbox Load Error:', error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between bg-accent/10 p-3 rounded-lg border border-accent/20">
          <span className="text-xs font-black uppercase tracking-widest text-accent">
            Sandbox Mode: {source === 'file' ? '📁 Local File' : '🗄️ Database'}
          </span>
          <div className="flex gap-2">
            <a href="?source=file" className={`px-3 py-1 rounded text-xs font-bold transition-colors ${source === 'file' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>File</a>
            <a href="?source=db" className={`px-3 py-1 rounded text-xs font-bold transition-colors ${source !== 'file' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>Database</a>
          </div>
        </div>
        
        <CourseEngine 
          courseTitle={courseTitle}
          modules={modules}
          examination={examination}
          initialStatus={status as any}
          lastAttemptAt={null}
          isSandbox={true}
        />
      </div>
    </div>
  );
}
