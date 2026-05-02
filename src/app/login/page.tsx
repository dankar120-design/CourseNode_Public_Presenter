'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithCode } from '@/actions/auth';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (formData: FormData) => {
    const code = formData.get('code')?.toString() || '';
    const cleanCode = code.trim();
    
    if (!cleanCode) {
      setError('Vänligen fyll i din åtkomstkod först.');
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
        console.error("Inloggningsfel (Nätverk/Server):", err);
        setError('Ett nätverksfel uppstod. Kontrollera din anslutning eller servern.');
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
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-border">
        <div className="flex justify-center mb-6">
          <ShieldCheck className="w-16 h-16 text-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-center text-primary mb-2">Logga In</h1>
        <p className="text-center text-foreground/70 font-medium mb-8">
          Ange din personliga åtkomstkod (ex. DEMO-2026-XXXX) för att starta eller återuppta din utbildning.
        </p>
        
        <form action={handleAction} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-bold text-primary mb-2">Åtkomstkod</label>
            <input 
              type="text" 
              id="code"
              name="code"
              required 
              defaultValue=""
              className="w-full px-5 py-4 text-center tracking-widest uppercase font-mono text-xl bg-input border-transparent rounded-lg focus:ring-2 focus:ring-ring focus:bg-white focus:border-ring outline-none transition-all text-foreground"
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
            className={`w-full py-4 px-6 flex justify-center items-center gap-2 text-white font-bold rounded-lg transition-all shadow-md ${
              isPending
                ? 'bg-primary/70 cursor-wait' 
                : 'bg-primary hover:bg-primary/90 hover:shadow-lg'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Starta Utbildning
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 p-4 bg-secondary/50 rounded-xl border border-primary/10">
          <p className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-4 text-center">Testa systemet (Demo)?</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-secondary/40 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/60 transition-colors border border-border/50">
                <span className="text-xs font-bold font-mono bg-white px-3 py-1.5 rounded-md shadow-sm text-primary select-all">
                DEMO-COMPLIANCE
                </span>
              <p className="text-[10px] text-center text-slate-500 font-medium leading-tight">Enterprise Risk Management<br/>(Compliance & Policy)</p>
              </div>
                        <div className="bg-secondary/40 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/60 transition-colors border border-border/50">
                <span className="text-xs font-bold font-mono bg-white px-3 py-1.5 rounded-md shadow-sm text-primary select-all">
                DEMO-SEC
                </span>
              <p className="text-[10px] text-center text-slate-500 font-medium leading-tight">Zero-Trust Architecture<br/>(Security & MTO)</p>
              </div>
            </div>
        </div>
        
        <div className="mt-8 text-center text-sm font-medium text-foreground/50">
          Behöver du hjälp? Kontakta din närmaste chef eller skyddsombud.
        </div>
      </div>
      </div>
    </div>
  );
}
