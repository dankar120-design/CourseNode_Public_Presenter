'use client'

import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  reference: string;
  description: string;
  target: string;
  iconColor?: string;
}

const CourseCard = ({ course }: { course: Course }) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-border group">
      <div className={`p-6 flex justify-between items-start ${course.iconColor || 'bg-secondary text-primary'}`}>
        <h3 className="text-xl font-bold px-2">{course.title}</h3>
        <BookOpen className="w-6 h-6 flex-shrink-0 opacity-80" />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wide text-primary bg-secondary rounded-full w-max">
          Ref: {course.reference}
        </span>
        <p className="text-foreground/80 mb-6 flex-grow text-sm leading-relaxed">
          {course.description}
        </p>
        <div className="pt-4 border-t border-border mt-auto mb-6">
          <p className="text-xs text-foreground/60 font-medium">Målgrupp: {course.target}</p>
        </div>
        
        <Link 
          href={`/?courseId=${course.id}#offert`}
          className="w-full py-3 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md group-hover:scale-[1.02]"
        >
          Begär Offert
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
