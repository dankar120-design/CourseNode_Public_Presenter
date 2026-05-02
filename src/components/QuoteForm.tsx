'use client'

import React, { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { courses } from '@/data/coursesData';
import { requestQuote } from '@/actions/quote';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const QuoteForm = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get('courseId');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    company: string;
    email: string;
    courseId: string;
    licenses: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    
    setStatus('loading');
    setErrorMessage('');
    
    const formData = new FormData(formRef.current);
    const data = {
      company: formData.get('company_name') as string,
      email: formData.get('user_email') as string,
      courseId: formData.get('selected_course') as string,
      licenses: formData.get('licenses') as string,
    };

    const result = await requestQuote(formData);
    
    if (result.error) {
      setStatus('error');
      setErrorMessage(result.error);
    } else {
      setSubmittedData(data);
      setStatus('success');
      formRef.current.reset();
    }
  };

  if (status === 'success' && submittedData) {
    const course = courses.find(c => c.id === submittedData.courseId);
    const courseTitle = course ? course.title : submittedData.courseId;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 bg-success/10 border border-success/30 rounded-2xl text-center shadow-lg">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h3 className="text-xl font-bold text-success mb-1">Offertförfrågan skickad!</h3>
          <p className="text-success/80 text-sm font-medium">Vi återkommer med en offert inom 24 timmar.</p>
        </div>

        {/* Demo Email Preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="bg-secondary/50 px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive/20"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/20"></div>
                <div className="w-3 h-3 rounded-full bg-success/20"></div>
              </div>
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest ml-2">Simulerad Inkorg: Acme Enterprise</span>
            </div>
            <span className="text-[10px] font-mono text-foreground/30">noreply@acme-enterprise.com</span>
          </div>
          
          <div className="p-8 font-sans">
            <div className="mb-6 pb-6 border-b border-border/50">
              <div className="text-sm text-foreground/50 mb-1">Ämne: <span className="text-foreground font-bold">Ny offertförfrågan: {courseTitle}</span></div>
              <div className="text-sm text-foreground/50">Från: <span className="text-foreground font-medium">Acme Enterprise</span></div>
            </div>

            <div className="max-w-xl mx-auto border border-border/30 rounded-xl p-8 shadow-sm">
              <h2 style={{ color: '#003366', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Ny offertförfrågan mottagen</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>En ny förfrågan har kommit in via webbplatsen.</p>
              <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#003366', width: '120px' }}>Företag:</td>
                    <td style={{ padding: '8px 0' }}>{submittedData.company}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#003366' }}>Kontakt:</td>
                    <td style={{ padding: '8px 0' }}>{submittedData.email}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#003366' }}>Kurs:</td>
                    <td style={{ padding: '8px 0' }}>{courseTitle} ({submittedData.courseId})</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#003366' }}>Antal licenser:</td>
                    <td style={{ padding: '8px 0' }}>{submittedData.licenses} st</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px', fontSize: '11px', color: '#999' }}>
                Detta är ett automatiskt meddelande från Acme Enterprise.
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            setStatus('idle');
            setSubmittedData(null);
          }}
          className="w-full py-3 text-primary/50 text-sm font-bold hover:text-primary transition-colors"
        >
          ← Tillbaka till formuläret
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 rounded-2xl shadow-xl border border-border">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-primary mb-2">Begär Offert</h2>
        <p className="text-foreground/70">Fyll i formuläret nedan för volymrabatter och B2B-lösningar.</p>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="company_name" className="block text-sm font-bold text-primary mb-2">Företagsnamn</label>
          <input 
            type="text" 
            name="company_name" 
            id="company_name"
            required 
            className="w-full px-4 py-3 bg-input border-transparent rounded-lg focus:ring-2 focus:ring-ring focus:bg-white focus:border-ring outline-none transition-all font-medium text-foreground"
            placeholder="Ex. Bygg & Säkerhet AB"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="licenses" className="block text-sm font-bold text-primary mb-2">Antal Licenser</label>
            <input 
              type="number" 
              name="licenses" 
              id="licenses"
              min="1"
              required 
              className="w-full px-4 py-3 bg-input border-transparent rounded-lg focus:ring-2 focus:ring-ring focus:bg-white focus:border-ring outline-none transition-all font-medium text-foreground"
              placeholder="Antal anställda"
            />
          </div>
          <div>
            <label htmlFor="selected_course" className="block text-sm font-bold text-primary mb-2">Vald Kurs</label>
            <select 
              name="selected_course" 
              id="selected_course"
              required
              defaultValue={initialCourseId || ""}
              className="w-full px-4 py-3 bg-input border-transparent rounded-lg focus:ring-2 focus:ring-ring focus:bg-white focus:border-ring outline-none transition-all font-medium text-foreground appearance-none"
            >
              <option value="" disabled>Välj en kurs...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="user_email" className="block text-sm font-bold text-primary mb-2">Företagets E-postadress</label>
          <input 
            type="email" 
            name="user_email" 
            id="user_email"
            required 
            className="w-full px-4 py-3 bg-input border-transparent rounded-lg focus:ring-2 focus:ring-ring focus:bg-white focus:border-ring outline-none transition-all font-medium text-foreground"
            placeholder="kontakt@foretag.se"
          />
        </div>

        {status === 'error' && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className={`w-full py-4 px-6 flex justify-center items-center gap-2 text-white font-bold rounded-lg transition-all shadow-md ${
            status === 'loading'
              ? 'bg-primary/70 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary/90 hover:shadow-lg'
          }`}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Skickar förfrågan...
            </>
          ) : 'Skicka Offertförfrågan'}
        </button>
      </form>
    </div>
  );
};

export default QuoteForm;
