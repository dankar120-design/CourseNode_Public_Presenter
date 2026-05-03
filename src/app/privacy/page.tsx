import React from 'react';
import { brandConfig } from '@/config/branding';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-secondary rounded-xl shadow-sm border border-border p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
            &larr; Back
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-primary mb-6">
          Privacy Policy & GDPR
        </h1>
        <p className="text-foreground/80 mb-8 leading-relaxed">
          This policy explains how {brandConfig.company} handles data and guarantees your personal privacy when using our educational platform.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-primary mb-4 border-b border-border/50 pb-2">
              1. Our "Zero-Knowledge" Principle
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Our platform is built with privacy as its foundation ("Privacy by Design"). We use a Zero-Knowledge model, which means we <strong>do not</strong> collect, store, or process any direct personal data about you as a user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-4 border-b border-border/50 pb-2">
              2. What data do we process?
            </h2>
            <ul className="list-disc pl-5 text-foreground/80 space-y-2 leading-relaxed">
              <li><strong>Access Codes:</strong> You log in using an anonymous, one-time code (e.g., DEMO-XXXX-XXXX). This code cannot be linked to you as an individual by our system, but only by your employer who distributed it.</li>
              <li><strong>Course Progress:</strong> We only store information about how far the anonymous access code has progressed in the course and its exam results.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-4 border-b border-border/50 pb-2">
              3. What data do we NOT process?
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              To minimize risks and protect your privacy, the platform never stores:
            </p>
            <ul className="list-disc pl-5 text-foreground/80 space-y-2 leading-relaxed">
              <li>Names or social security numbers</li>
              <li>Email addresses</li>
              <li>IP addresses (except for short-term security protection during an active connection)</li>
              <li>Physical addresses or phone numbers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-4 border-b border-border/50 pb-2">
              4. Cookies
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              We only use necessary, technical cookies (via a secure JWT session) to keep you logged in while you complete the course. No tracking cookies (third-party cookies) or advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-4 border-b border-border/50 pb-2">
              5. Your Rights (GDPR)
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Since we do not store any personal data, we cannot link specific data to you in the event of a data subject access request. For questions regarding your license and the codes distributed, we refer you to the HR department or manager at your employer who administered the purchase. For other questions, contact {brandConfig.company}.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-foreground/60 text-center">
          Last updated: 2026-05-03
        </div>
      </div>
    </div>
  );
}
