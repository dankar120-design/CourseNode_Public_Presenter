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
    
    let statusText = 'Not started';
    let statusType = 'not_started';
    let completedAt = '-';

    if (!enrollment || enrollment.status === 'NOT_STARTED') {
      notStartedCount++;
    } else if (enrollment.status === 'IN_PROGRESS') {
      inProgressCount++;
      statusText = 'In progress';
      statusType = 'in_progress';
    } else if (enrollment.status === 'COMPLETED') {
      completedCount++;
      statusText = 'Completed';
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-secondary p-6 md:p-8 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-accent" />
              Training Status: {license.companyName}
            </h1>
            <h2 className="text-lg font-bold text-foreground/80 flex items-center gap-2 mt-1">
              {license.course?.title || 'Unknown Course'}
            </h2>
            <p className="text-foreground/60 mt-1">
              Track the activation and completion status of your assigned licenses.
            </p>
          </div>
          <ExportButton data={tableData} companyName={license.companyName} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary p-6 rounded-2xl shadow-sm border border-border">
            <div className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-1">Total Licenses</div>
            <div className="text-3xl font-black text-primary">{license.totalCodes}</div>
          </div>
          <div className="bg-secondary p-6 rounded-2xl shadow-sm border border-success/20 bg-success/5">
            <div className="text-sm font-bold text-success/80 uppercase tracking-wider mb-1">Completed</div>
            <div className="text-3xl font-black text-success">{completedCount} <span className="text-lg font-medium text-success/80/70">({completionPercentage}%)</span></div>
          </div>
          <div className="bg-secondary p-6 rounded-2xl shadow-sm border border-amber-400/20 bg-amber-400/5">
            <div className="text-sm font-bold text-amber-400/80 uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-3xl font-black text-amber-400">{inProgressCount}</div>
          </div>
          <div className="bg-secondary p-6 rounded-2xl shadow-sm border border-border">
            <div className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-1">Not Started</div>
            <div className="text-3xl font-black text-primary">{notStartedCount}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-secondary rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 font-bold text-foreground/80 text-sm">License Code</th>
                  <th className="p-4 font-bold text-foreground/80 text-sm">Status</th>
                  <th className="p-4 font-bold text-foreground/80 text-sm">Completion Date</th>
                  <th className="p-4 font-bold text-foreground/80 text-sm text-center">Certificates Printed</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={row.code} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4 font-mono text-foreground">{row.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        {row.statusType === 'not_started' && <CircleDashed className="w-4 h-4 text-foreground/40" />}
                        {row.statusType === 'in_progress' && <Clock className="w-4 h-4 text-amber-400/60" />}
                        {row.statusType === 'completed' && <CheckCircle2 className="w-4 h-4 text-success/60" />}
                        {row.status}
                      </div>
                    </td>
                    <td className="p-4 text-foreground/80">
                      {row.completedAt}
                    </td>
                    <td className="p-4 text-center">
                      {row.statusType === 'completed' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full ${
                            row.certDownloads >= 3 
                              ? 'bg-destructive/10 text-destructive' 
                              : 'bg-secondary text-foreground/80'
                          }`}>
                            {row.certDownloads} / 3
                          </span>
                          {row.certDownloads >= 3 && (
                            <span className="text-[10px] text-destructive/80 font-medium leading-tight">Blocked. Contact Support.</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-foreground/20">-</span>
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
