import React, { Suspense } from 'react';
import Link from 'next/link';
import { courses } from '@/data/coursesData';
import CourseCard from '@/components/CourseCard';
import QuoteForm from '@/components/QuoteForm';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { brandConfig } from '@/config/branding';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <BrandLogo />
          </div>
          <Link 
            href="/login" 
            className="px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors shadow-sm flex items-center gap-2"
          >
            Course Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary font-bold text-sm mb-6 border border-border/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Ensure Compliance Today
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-primary mb-6 tracking-tight leading-tight">
            Enterprise-Grade <span className="text-transparent-clip bg-gradient-to-r from-accent to-blue-500">Compliance Training</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto font-medium leading-relaxed">
            Secure your workforce with certified courses in Corporate Risk, InfoSec, and Ethics. 
            Our platform provides end-to-end traceability and Zero-Trust verification.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <a href="#quote" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-lg flex items-center gap-2">
              Request B2B Quote
            </a>
            <a href="#courses" className="px-8 py-4 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all shadow-md border border-border text-lg">
              View Catalog
            </a>
          </div>
        </div>

        {/* Course Catalog (Grid) */}
        <div id="courses" className="scroll-mt-24 mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-primary mb-4">Course Catalog</h2>
            <p className="text-lg text-foreground/70">Asynchronous self-study and hybrid courses tailored for modern industry.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Quote Section */}
        <div id="quote" className="max-w-3xl mx-auto scroll-mt-24">
          <Suspense fallback={<div className="p-10 text-center text-foreground/50">Loading form...</div>}>
            <QuoteForm />
          </Suspense>
        </div>
      </main>

      <footer className="bg-secondary text-secondary-foreground py-12 mt-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-6 opacity-80 text-secondary-foreground" />
          </div>
          <p className="text-secondary-foreground/60 font-medium">© {new Date().getFullYear()} {brandConfig.company}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
