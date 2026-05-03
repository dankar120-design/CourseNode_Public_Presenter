'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithCode } from '@/actions/auth';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { PortfolioTooltip } from '@/components/PortfolioTooltip';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (formData: FormData) => {
    const code = formData.get('code')?.toString() || '';
    const cleanCode = code.trim();
    
    if (!cleanCode) {
      setError('Please enter your access code first.');
      return;
    }
    
    setError('');
    
    startTransition(async () => {
      try {
        const result = await loginWithCode(cleanCode);
        
        if (result?.error) {
          setError(result.error);
        } else {
          router.push('/course');
        }
      } catch (err) {
        console.error("Login error (Network/Server):", err);
        setError('A network error occurred. Please check your connection.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 sm:p-6 w-full flex justify-start">
        <Link href="/" className="hover:opacity-80 transition-opacity block">
          <BrandLogo className="h-8 w-8 sm:h-10 sm:w-10" showText={true} />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 mb-12 sm:mb-20">
        <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-2xl shadow-xl border border-border">
        <div className="flex justify-center mb-6">
          <ShieldCheck className="w-16 h-16 text-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-center text-primary mb-2">Sign In</h1>
        <p className="text-center text-foreground/70 font-medium mb-8">
          Enter your unique access code (e.g. DEMO-2026-XXXX) to start or resume your training.
        </p>
        
        <form action={handleAction} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-bold text-primary mb-2">Access Code</label>
            <input 
              type="text" 
              id="code"
              name="code"
              required 
              defaultValue=""
              className="w-full px-5 py-4 text-center tracking-widest uppercase font-mono text-xl bg-input border-transparent rounded-lg focus:ring-2 focus:ring-ring focus:bg-card focus:border-ring outline-none transition-all text-foreground"
              placeholder="___-____-____"
            />
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className={`w-full py-4 px-6 flex justify-center items-center gap-2 text-primary-foreground font-bold rounded-lg transition-all shadow-md ${
              isPending
                ? 'bg-primary/70 cursor-wait' 
                : 'bg-primary hover:bg-primary/90 hover:shadow-lg'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Start Training
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 p-4 bg-secondary/50 rounded-xl border border-primary/10">
          <div className="flex justify-center items-center mb-4">
            <p className="text-xs font-bold text-primary/60 uppercase tracking-wider text-center">Test the system (Demo)</p>
            <PortfolioTooltip title="Authentication Flow">
              This demo bypasses standard enterprise SSO. When entering a DEMO- code, a Server Action automatically provisions a stateless user session via encrypted JWTs stored in strict HTTP-only cookies.
            </PortfolioTooltip>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-secondary/40 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/60 transition-colors border border-border/50">
                <span className="text-xs font-bold font-mono bg-background border border-border px-3 py-1.5 rounded-md shadow-sm text-primary select-all">
                DEMO-COMPLIANCE
                </span>
              <p className="text-[10px] text-center text-foreground/60 font-medium leading-tight">Enterprise Risk Management<br/>(Compliance & Policy)</p>
              </div>
                        <div className="bg-secondary/40 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/60 transition-colors border border-border/50">
                <span className="text-xs font-bold font-mono bg-background border border-border px-3 py-1.5 rounded-md shadow-sm text-primary select-all">
                DEMO-SEC
                </span>
              <p className="text-[10px] text-center text-foreground/60 font-medium leading-tight">Zero-Trust Architecture<br/>(Security & MTO)</p>
              </div>
            </div>
        </div>
        
        <div className="mt-8 text-center text-sm font-medium text-foreground/50">
          Need help? Contact your manager or technical support.
        </div>
      </div>
      </div>
    </div>
  );
}
