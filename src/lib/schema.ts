import { z } from 'zod';

export const CourseModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  image: z.string().optional(),
  duration: z.coerce.number().optional()
});

export const ExaminationSchema = z.object({
  id: z.string(),
  interactionType: z.string().optional(),
  question: z.string(),
  correctAnswer: z.string(),
  distractors: z.array(z.string())
});

export const CourseContentSchema = z.object({
  modules: z.array(CourseModuleSchema).min(1),
  examination: z.array(ExaminationSchema).min(1)
});

export type CourseContent = z.infer<typeof CourseContentSchema>;
