'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Loader2, LogOut, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { logout } from '@/actions/auth';
import { submitExam, cheatCompleteExam, startExamSession } from '@/actions/exam';
import { saveProgress } from '@/actions/progress';
import { resetDemoProgress } from '@/actions/demo';
import { BrandLogo } from '@/components/BrandLogo';
import { PortfolioTooltip } from '@/components/PortfolioTooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock } from 'lucide-react';
import { EXAM_COOLDOWN_SECONDS } from '@/config/constants';
import Image from 'next/image';
import Link from 'next/link';

interface Module {
  id: string;
  title: string;
  content: string;
  image?: string;
  duration?: number;
}

interface Examination {
  id: string;
  question: string;
  options: string[];
}

interface CourseEngineProps {
  courseTitle: string;
  modules: Module[];
  examination: Examination[];
  initialStatus: string;
  lastAttemptAt: string | null;
  initialStep?: number;
  isSandbox?: boolean;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Linear Slide Chunker
function getModuleSlides(markdown: string) {
  if (!markdown) return [];
  const rawChunks = markdown.split(/(?=\n### |^### )/);
  return rawChunks
    .map(c => c.trim())
    .filter(c => c.length > 0)
    .map(chunk => {
       const lines = chunk.split('\n');
       const title = chunk.startsWith('### ') ? lines[0].replace(/^### /, '').trim() : 'Introduction';
       return { title: title || 'Introduction', content: chunk };
    });
}

export default function CourseEngine({ courseTitle, modules, examination, initialStatus, lastAttemptAt, initialStep = 0, isSandbox }: CourseEngineProps) {
  const router = useRouter();
  
  // If already completed, jump straight to the certificate step (modules.length + 1)
  const isAlreadyCompleted = initialStatus === 'COMPLETED';
  const certificateStepIndex = modules.length + 1;
  const examStepIndex = modules.length;
  
  const [currentStep, setCurrentStep] = useState(isAlreadyCompleted ? certificateStepIndex : initialStep); 
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [failedQuestionIds, setFailedQuestionIds] = useState<string[]>([]);
  const [certName, setCertName] = useState('');
  const [examError, setExamError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const isExamStep = currentStep === examStepIndex;
  const isCertificateStep = currentStep === certificateStepIndex;
  
  const [shuffledQuestions, setShuffledQuestions] = useState<Examination[]>([]);

  const storageKey = `examState_${courseTitle.replace(/\s+/g, '_')}`;

  // Hydrate state from sessionStorage to survive page refreshes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
        if (parsed.failedQuestionIds) setFailedQuestionIds(parsed.failedQuestionIds);
        if (parsed.shuffledQuestions) setShuffledQuestions(parsed.shuffledQuestions);
      }
    } catch (e) {
      console.error('Failed to parse saved exam state', e);
    }
  }, [storageKey]);

  // Persist state to sessionStorage
  useEffect(() => {
    if (shuffledQuestions.length > 0 || Object.keys(selectedAnswers).length > 0 || failedQuestionIds.length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify({ selectedAnswers, failedQuestionIds, shuffledQuestions }));
    }
  }, [selectedAnswers, failedQuestionIds, shuffledQuestions, storageKey]);

  const fetchExam = useCallback(async () => {
    setLoadingExam(true);
    setExamError('');
    const result = await startExamSession(isSandbox);
    if (result.questions) {
      setShuffledQuestions(result.questions);
    } else if (result.error) {
      setExamError(result.error);
    }
    setLoadingExam(false);
  }, [isSandbox]);

  // Fetch questions securely when entering the exam step
  useEffect(() => {
    if (isExamStep && shuffledQuestions.length === 0 && !loadingExam && !examError) {
      fetchExam();
    }
  }, [isExamStep, shuffledQuestions.length, loadingExam, examError, fetchExam]);

  // Handle cooldown timer
  useEffect(() => {
    if (lastAttemptAt) {
      const checkCooldown = () => {
        const last = new Date(lastAttemptAt);
        const now = new Date();
        const diffSeconds = Math.ceil(EXAM_COOLDOWN_SECONDS - (now.getTime() - last.getTime()) / 1000);
        if (diffSeconds > 0) {
          setCooldownRemaining(diffSeconds);
        } else {
          setCooldownRemaining(0);
        }
      };
      checkCooldown();
      const interval = setInterval(checkCooldown, 1000);
      return () => clearInterval(interval);
    }
  }, [lastAttemptAt]);

  const prevCooldownRef = useRef(cooldownRemaining);

  // Reshuffle happens on server via router.refresh, clear UI state
  useEffect(() => {
    // Endast när vi övergår från >0 till 0 (hindrar oändlig loop)
    if (prevCooldownRef.current > 0 && cooldownRemaining === 0) {
      if (failedQuestionIds.length > 0) {
        setSelectedAnswers({});
        setFailedQuestionIds([]);
        setShuffledQuestions([]); 
        sessionStorage.removeItem(storageKey); // Clear persistency
      }
      if (examError) {
        setExamError('');
      }
    }
    prevCooldownRef.current = cooldownRemaining;
  }, [cooldownRemaining, failedQuestionIds.length, examError]);

  const currentSlides = useMemo(() => {
    if (isExamStep || currentStep >= modules.length) return [];
    return getModuleSlides(modules[currentStep].content);
  }, [currentStep, modules, isExamStep]);

  const handleNext = () => {
    if (currentStep < examStepIndex) {
      if (currentSlideIndex < currentSlides.length - 1) {
        window.scrollTo(0, 0);
        setCurrentSlideIndex(s => s + 1);
      } else {
        window.scrollTo(0, 0);
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setCurrentSlideIndex(0);
        if (!isSandbox) {
          saveProgress(nextStep).catch(() => {
            alert("Could not save your progress due to a network error.");
          });
        }
      }
    }
  };

  const handlePrev = () => {
    if (currentStep === examStepIndex) {
      window.scrollTo(0, 0);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const prevSlides = getModuleSlides(modules[prevStep].content);
      setCurrentSlideIndex(Math.max(0, prevSlides.length - 1));
      return;
    }
    
    if (currentSlideIndex > 0) {
      window.scrollTo(0, 0);
      setCurrentSlideIndex(s => s - 1);
    } else if (currentStep > 0) {
      window.scrollTo(0, 0);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const prevSlides = getModuleSlides(modules[prevStep].content);
      setCurrentSlideIndex(Math.max(0, prevSlides.length - 1));
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    setExamError('');
  };

  const handleExamSubmit = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (Object.keys(selectedAnswers).length < shuffledQuestions.length) {
      setExamError('You must answer all questions before submitting the exam.');
      return;
    }

    setSubmitting(true);
    setExamError('');
    setFailedQuestionIds([]);

    const result = await submitExam(selectedAnswers, isSandbox);

    if (result.error) {
      setExamError(result.error);
      if (result.failedQuestionIds) {
        setFailedQuestionIds(result.failedQuestionIds);
      }
      
      if (result.error.includes('No active exam session') || result.error.includes('Security error')) {
        sessionStorage.removeItem(storageKey);
        setShuffledQuestions([]);
        setSelectedAnswers({});
        setFailedQuestionIds([]);
      } else if (!isSandbox) {
        setCooldownRemaining(EXAM_COOLDOWN_SECONDS); // Proactive UI update
        // Refresh page data to fetch new lastAttemptAt from server
        router.refresh();
      }
      
      setSubmitting(false);
    } else if (result.success) {
      sessionStorage.removeItem(storageKey); // Clear persistency
      setCurrentStep(certificateStepIndex);
      setSubmitting(false);
    }
  };

  const handleCheat = async () => {
    if (confirm('Do you want to cheat and skip directly to the certificate?')) {
      setSubmitting(true);
      
      if (isSandbox) {
        setCurrentStep(certificateStepIndex);
        setSubmitting(false);
        return;
      }

      const result = await cheatCompleteExam();
      if (result.success) {
        sessionStorage.removeItem(storageKey); // Clear persistency
        setCurrentStep(certificateStepIndex);
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
      setSubmitting(false);
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Are you sure you want to reset the demo exam and start over?')) {
      setSubmitting(true);
      const result = await resetDemoProgress();
      if (result.error) {
        alert(result.error);
        setSubmitting(false);
      } else {
        sessionStorage.removeItem(storageKey);
        window.location.reload();
      }
    }
  };

  const handleGenerateCertificate = async () => {
    if (!certName.trim()) {
      setExamError('You must enter your name for the certificate.');
      return;
    }

    setSubmitting(true);
    setExamError('');

    // Trigger the actual file download via the API route
    window.location.href = `/api/certificate?name=${encodeURIComponent(certName)}`;
    
    // Simulate setting a URI so the UI transitions to the "Ready" state
    setTimeout(() => {
      setPdfUri('download_triggered');
      setSubmitting(false);
    }, 500);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ------------------------------------------------------------------
  // VIEW: CERTIFICATE GENERATION
  // ------------------------------------------------------------------
  if (isCertificateStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in fade-in zoom-in duration-500 bg-background">
        <div className="bg-card shadow-sm border border-border p-8 md:p-12 rounded-2xl text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-success" />
          </div>
          <h1 className="text-4xl font-black text-primary mb-2">Training Completed</h1>
          <p className="text-lg font-medium text-foreground/80 mb-8">
            You have passed <span className="text-accent font-bold">{courseTitle}</span>.
          </p>

          {!pdfUri ? (
            <div className="text-left bg-card p-6 rounded-xl mb-8">
              <label className="block text-sm font-bold text-primary mb-2">Enter name for the certificate</label>
              <input 
                type="text" 
                value={certName}
                onChange={(e) => {
                  setCertName(e.target.value);
                  setExamError('');
                }}
                placeholder="First and Last Name"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-ring outline-none transition-all font-medium text-foreground mb-3"
              />
              <p className="text-xs text-foreground/60 font-medium flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
                Privacy: Your name is NOT saved in the database (GDPR). It is only used to generate the PDF locally.
              </p>
              
              {examError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 font-medium">
                  {examError}
                </div>
              )}

              <button 
                onClick={handleGenerateCertificate}
                disabled={submitting || !certName}
                className={`w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-xl transition-all ${
                  submitting || !certName
                    ? 'bg-secondary/50 text-foreground/50 cursor-not-allowed' 
                    : 'bg-accent text-white'
                }`}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Generate and download certificate
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-success/5 p-8 rounded-xl border border-success/20 mb-8">
               <p className="text-success font-bold mb-6 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Your certificate is ready!
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => {
                    window.location.href = `/api/certificate?name=${encodeURIComponent(certName)}`;
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white font-bold rounded-xl"
                >
                  <Download className="w-5 h-5" /> Download file
                </button>
                <button 
                  onClick={() => {
                    setPdfUri(null);
                    setCertName('');
                  }} 
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-card border border-border text-foreground/70 font-bold rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-6 flex flex-col gap-3">
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-6 py-3 mx-auto bg-card text-primary font-bold rounded-lg hover:bg-secondary/50 transition-colors w-full sm:w-auto">
              <LogOut className="w-5 h-5" /> Sign out and close
            </button>
            {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
              <button 
                onClick={handleResetDemo}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-3 mx-auto bg-destructive/10 text-destructive font-bold rounded-lg hover:bg-destructive hover:text-white transition-colors w-full sm:w-auto"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Reset Demo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW: COURSE ENGINE (MODULES & EXAM)
  // ------------------------------------------------------------------
  const allQuestionsAnswered = shuffledQuestions.length > 0 && shuffledQuestions.every(q => selectedAnswers[q.id]);

  const baseProgress = (currentStep / (modules.length + 1)) * 100;
  const slideProgress = currentSlides.length > 0 && !isExamStep && !isCertificateStep
    ? (currentSlideIndex / currentSlides.length) * (100 / (modules.length + 1)) 
    : 0;
  const totalProgress = Math.min(baseProgress + slideProgress, 100);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-card shadow-sm border border-border sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center rounded-none ">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="hover:opacity-80 transition-opacity block">
            <BrandLogo className="h-6 sm:h-8" showText={true} />
          </Link>
          <span className="font-black text-primary hidden md:inline ml-2 border-l border-border pl-4">{courseTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
            <button 
              onClick={handleResetDemo}
              disabled={submitting}
              className="text-[10px] uppercase tracking-tighter font-black bg-destructive/10 text-destructive px-2 py-1 rounded hover:bg-destructive hover:text-white transition-colors"
            >
              {submitting ? '...' : (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Reset Demo
                </span>
              )}
            </button>
          )}
          {(process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') && (
            <div className="flex items-center gap-1">
              <button 
                onClick={handleCheat}
                disabled={submitting}
                className="text-[10px] uppercase tracking-tighter font-black bg-destructive/10 text-destructive px-2 py-1 rounded hover:bg-destructive hover:text-white transition-colors"
              >
                {submitting ? '...' : '🐛 Cheat'}
              </button>
              <PortfolioTooltip title="Cheat Mode">
                This feature automatically bypasses the exam requirements for demonstration purposes, mimicking an authorized admin override. It's disabled in real production environments.
              </PortfolioTooltip>
            </div>
          )}
          <span className="text-sm font-bold text-foreground/60 bg-secondary px-3 py-1 rounded-full">
            Step {currentStep + 1} of {modules.length + 1}
          </span>
          <button onClick={handleLogout} className="text-foreground/50 hover:text-primary transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-2 sm:p-4 py-6 md:py-12">
        <div className="max-w-3xl w-full bg-card shadow-sm border border-border rounded-2xl overflow-hidden">
          
          <div className="w-full bg-secondary h-2">
            <div 
              className="bg-accent h-full transition-all duration-500 ease-out" 
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          <div className="p-5 sm:p-8 md:p-12">
            {!isExamStep ? (
              <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-black text-primary">{modules[currentStep].title}</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                      Part {currentSlideIndex + 1} of {currentSlides.length}
                    </div>
                    {modules[currentStep].duration && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/40 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <Clock className="w-3.5 h-3.5" />
                        {modules[currentStep].duration} min read
                      </div>
                    )}
                  </div>
                </div>

                {modules[currentStep].image && (
                  <div className="mb-8 rounded-xl overflow-hidden bg-card relative w-full aspect-video max-h-[400px]">
                    <Image 
                      src={modules[currentStep].image} 
                      alt=""
                      fill
                      priority={currentStep === 0}
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="prose prose-slate prose-lg max-w-none text-foreground/80 leading-relaxed prose-headings:text-primary prose-headings:font-black prose-strong:text-primary prose-strong:font-bold">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                      table: (props) => (
                        <div className="overflow-x-auto my-6 border border-border rounded-xl">
                          <table className="min-w-full text-left border-collapse" {...props} />
                        </div>
                      ),
                      thead: (props) => <thead className="bg-secondary/50" {...props} />,
                      th: (props) => <th className="px-4 py-3 font-bold text-primary border-b border-border text-sm" {...props} />,
                      td: (props) => <td className="px-4 py-3 border-b border-border/50 text-foreground text-sm" {...props} />,
                      img: (props) => (
                        <div className="relative w-full aspect-video my-8 rounded-xl overflow-hidden border border-border shadow-sm bg-card">
                          <Image src={(props.src as string) || ''} alt={props.alt || ''} fill className="object-cover" />
                        </div>
                      )
                    }}
                  >
                    {currentSlides[currentSlideIndex]?.content || 'Content missing.'}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-accent/10 p-3 rounded-full">
                    <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-primary">Examination</h2>
                </div>
                
                {cooldownRemaining > 0 && (
                  <div className="mb-8 p-6 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-black text-lg">Exam is locked</h3>
                        <p className="mt-1 font-medium text-destructive/80">
                          {examError && !examError.includes('vänta') && <span className="block mb-2 font-bold text-destructive">{examError}</span>}
                          Review the course material. You can try again in {formatTime(cooldownRemaining)}.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        window.scrollTo(0, 0);
                        const prevStep = currentStep - 1;
                        setCurrentStep(prevStep);
                        const prevSlides = getModuleSlides(modules[prevStep].content);
                        setCurrentSlideIndex(Math.max(0, prevSlides.length - 1));
                      }}
                      className="w-full md:w-auto px-6 py-3 bg-card text-destructive border border-destructive/20 rounded-lg shadow-sm hover:bg-destructive/5 font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      ← Go back and review
                    </button>
                  </div>
                )}

                {loadingExam && (
                  <div className="flex flex-col items-center justify-center p-12 mb-8">
                    <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
                    <p className="text-foreground/60 font-bold">Loading secure examination...</p>
                  </div>
                )}

                {!loadingExam && shuffledQuestions.length === 0 && cooldownRemaining === 0 && examError && (
                  <div className="flex flex-col items-center justify-center p-8 mb-8 bg-card border-accent/20">
                    <AlertCircle className="w-12 h-12 text-primary mb-4" />
                    <p className="text-foreground/80 font-bold mb-6 text-center max-w-md">{examError}</p>
                    <button 
                      onClick={fetchExam}
                      className="px-8 py-4 bg-accent text-white font-bold rounded-xl flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" /> Try Again
                    </button>
                  </div>
                )}

                {!loadingExam && shuffledQuestions.length > 0 && (
                  <div className="space-y-12 mb-10">
                    {shuffledQuestions.map((q, index) => {
                    const isFailed = failedQuestionIds.includes(q.id);
                    return (
                      <div key={q.id} className={`p-4 sm:p-6 rounded-2xl border-2 transition-all ${isFailed ? 'border-destructive bg-destructive/5' : 'border-border/50 bg-secondary/10'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                            <span className="text-accent mr-2">{index + 1}.</span>
                            {q.question}
                          </h3>
                          {isFailed && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md self-start sm:self-auto whitespace-nowrap">Incorrect answer</span>}
                        </div>
                        
                        <div className="space-y-3">
                          {q.options.map((answer, i) => (
                              <label 
                                key={i} 
                                className={`flex items-start p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  selectedAnswers[q.id] === answer 
                                    ? (isFailed ? 'border-destructive bg-destructive/10 ring-1 ring-destructive' : 'border-accent bg-accent/5 shadow-sm ring-1 ring-accent')
                                    : 'border-border bg-card hover:border-accent/40 hover:bg-secondary/30'
                                } ${cooldownRemaining > 0 ? 'opacity-70 pointer-events-none' : ''}`}
                              >
                                <input 
                                  type="radio" 
                                  name={`exam-${q.id}`} 
                                  value={answer}
                                  checked={selectedAnswers[q.id] === answer}
                                  onChange={() => handleAnswerChange(q.id, answer)}
                                  disabled={cooldownRemaining > 0}
                                  className="mt-1 w-5 h-5 text-accent focus:ring-accent border-gray-300 flex-shrink-0"
                                />
                                <span className="ml-3 sm:ml-4 font-medium text-sm sm:text-base text-foreground leading-snug">{answer}</span>
                              </label>
                          ))}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}

                {examError && cooldownRemaining === 0 && (
                  <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 font-medium">
                    {examError}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-secondary/30 px-6 py-6 border-t border-border flex justify-between items-center">
            <button 
              onClick={handlePrev}
              disabled={currentStep === 0 || submitting}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 font-bold rounded-lg transition-colors ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-primary hover:bg-secondary'
              }`}
            >
              <ArrowLeft className="w-5 h-5" /> 
              <span className="hidden sm:inline">
                {!isExamStep && currentSlideIndex > 0 
                  ? `Previous: ${currentSlides[currentSlideIndex - 1]?.title}` 
                  : 'Previous Module'}
              </span>
            </button>

            {!isExamStep ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 shadow-md transition-all hover:shadow-lg max-w-[50%] sm:max-w-[60%]"
              >
                <span className="truncate">
                  {currentSlideIndex < currentSlides.length - 1 
                    ? `Next: ${currentSlides[currentSlideIndex + 1]?.title}` 
                    : (currentStep === examStepIndex - 1 ? 'Go to Examination' : 'Next Module')
                  }
                </span>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>
            ) : (
              <button 
                onClick={handleExamSubmit}
                disabled={submitting || !allQuestionsAnswered || cooldownRemaining > 0}
                className={`flex items-center justify-center gap-2 px-4 sm:px-8 py-3 text-white font-bold rounded-lg shadow-md transition-all flex-grow sm:flex-grow-0 ml-4 sm:ml-0 ${
                  submitting || !allQuestionsAnswered || cooldownRemaining > 0
                    ? 'bg-success/50 cursor-not-allowed' 
                    : 'bg-success hover:bg-success/90 hover:shadow-lg'
                }`}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 hidden sm:inline" />}
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
