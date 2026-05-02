import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Clock, CircleDashed } from 'lucide-react';
import ExportButton from './ExportButton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ key: string }> }) {
  const resolvedParams = await params;
  const license = await prisma.license.findUnique({
    where: { dashboardKey: resolvedParams.key },
    include: {
      course: true,
      accessCodes: {
        include: {
          enrollments: {
            include: {
              course: true
            }
          }
        }
      }
    }
  });

  if (!license) {
    notFound();
  }

  // Calculate statistics
  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;

  const tableData = license.accessCodes.map(ac => {
    // Fetch the enrollment specific to the course defined by this license
    const enrollment = ac.enrollments.find((e) => e.courseId === license.courseId); 
    
    let statusText = 'Ej startad';
    let statusType = 'not_started';
    let completedAt = '-';

    if (!enrollment || enrollment.status === 'NOT_STARTED') {
      notStartedCount++;
    } else if (enrollment.status === 'IN_PROGRESS') {
      inProgressCount++;
      statusText = 'Pågår';
      statusType = 'in_progress';
    } else if (enrollment.status === 'COMPLETED') {
      completedCount++;
      statusText = 'Godkänd';
      statusType = 'completed';
      if (enrollment.completedAt) {
        completedAt = new Date(enrollment.completedAt).toLocaleDateString('sv-SE');
      }
    }

    return {
      code: ac.code,
      status: statusText,
      statusType,
      completedAt,
      certDownloads: enrollment ? enrollment.certDownloads : 0
    };
  });

  const completionPercentage = Math.round((completedCount / license.totalCodes) * 100);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Utbildningsstatus: {license.companyName}
            </h1>
            <h2 className="text-lg font-bold text-slate-600 flex items-center gap-2 mt-1">
              {license.course?.title || 'Okänd Kurs'}
            </h2>
            <p className="text-slate-500 mt-1">
              Här kan ni följa upp hur många av era tilldelade licenser som har aktiverats och slutförts.
            </p>
          </div>
          <ExportButton data={tableData} companyName={license.companyName} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Totalt Antal</div>
            <div className="text-3xl font-black text-slate-800">{license.totalCodes}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50/30">
            <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">Slutförda</div>
            <div className="text-3xl font-black text-emerald-700">{completedCount} <span className="text-lg font-medium text-emerald-600/70">({completionPercentage}%)</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 bg-amber-50/30">
            <div className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">Pågående</div>
            <div className="text-3xl font-black text-amber-700">{inProgressCount}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Ej Startade</div>
            <div className="text-3xl font-black text-slate-800">{notStartedCount}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Licenskod</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Datum för slutförande</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">Intyg utskrivna</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={row.code} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-slate-700">{row.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        {row.statusType === 'not_started' && <CircleDashed className="w-4 h-4 text-slate-400" />}
                        {row.statusType === 'in_progress' && <Clock className="w-4 h-4 text-amber-500" />}
                        {row.statusType === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {row.status}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {row.completedAt}
                    </td>
                    <td className="p-4 text-center">
                      {row.statusType === 'completed' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full ${
                            row.certDownloads >= 3 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.certDownloads} / 3
                          </span>
                          {row.certDownloads >= 3 && (
                            <span className="text-[10px] text-red-600/80 font-medium leading-tight">Spärrad. Kontakta Support.</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
