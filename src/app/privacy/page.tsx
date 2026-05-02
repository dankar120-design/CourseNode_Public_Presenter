import React from 'react';
import { brandConfig } from '@/config/branding';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
            &larr; Tillbaka
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Integritetspolicy & GDPR
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Denna policy förklarar hur {brandConfig.company} hanterar data och garanterar din personliga integritet när du använder vår utbildningsplattform.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              1. Vår "Zero-Knowledge"-Princip
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Vår plattform är byggd med integritet som grundsten ("Privacy by Design"). Vi använder en så kallad Zero-Knowledge-modell vilket innebär att vi <strong>inte</strong> samlar in, lagrar eller behandlar några direkta personuppgifter om dig som användare.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              2. Vilken data hanterar vi?
            </h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2 leading-relaxed">
              <li><strong>Inloggningskoder:</strong> Du loggar in med en anonym engångskod (t.ex. DEMO-XXXX-XXXX). Denna kod kan inte knytas till dig som individ av vårt system, utan enbart av din arbetsgivare som delat ut den.</li>
              <li><strong>Kursframsteg:</strong> Vi sparar endast information om hur långt den anonyma inloggningskoden har kommit i kursen och dess provresultat.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              3. Vilken data hanterar vi INTE?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              För att minimera risker och värna din integritet lagrar plattformen aldrig:
            </p>
            <ul className="list-disc pl-5 text-slate-600 space-y-2 leading-relaxed">
              <li>Namn eller personnummer</li>
              <li>E-postadresser</li>
              <li>IP-adresser (förutom för kortsiktigt säkerhetsskydd under pågående anslutning)</li>
              <li>Fysiska adresser eller telefonnummer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              4. Cookies
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Vi använder enbart nödvändiga, tekniska cookies (via en säker JWT-session) för att hålla dig inloggad under tiden du genomför kursen. Inga spårningscookies (tredjeparts-cookies) eller annons-cookies används.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              5. Dina rättigheter (GDPR)
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Eftersom vi inte lagrar några personuppgifter kan vi inte koppla specifik data till dig vid en begäran om utdrag. För frågor kring din licens och de koder som delats ut hänvisar vi till den HR-avdelning eller chef hos din arbetsgivare som administrerat köpet. Vid andra frågor, kontakta {brandConfig.company}.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500 text-center">
          Senast uppdaterad: 2026-04-23
        </div>
      </div>
    </div>
  );
}
