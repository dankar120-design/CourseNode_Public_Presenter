'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface CodeRow {
  code: string;
  status: string;
  completedAt: string;
  certDownloads: number;
}

interface ExportButtonProps {
  data: CodeRow[];
  companyName: string;
}

export default function ExportButton({ data, companyName }: ExportButtonProps) {
  const handleDownload = () => {
    const csvRows = [
      ['Kod', 'Status', 'Datum för slutförande', 'Intyg utskrivna']
    ];

    for (const row of data) {
      csvRows.push([row.code, row.status, row.completedAt, row.status === 'Godkänd' ? `${row.certDownloads}/3` : '-']);
    }

    const csvContent = csvRows.map(row => 
      row.map(cell => {
        let safeCell = cell;
        if (/^[=+\-@]/.test(safeCell)) {
          safeCell = `'${safeCell}`;
        }
        return `"${safeCell.replace(/"/g, '""')}"`;
      }).join(';')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${safeName}_rapport_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <button 
      onClick={handleDownload}
      className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-sm"
    >
      <Download className="w-4 h-4" />
      Ladda ner CSV-rapport
    </button>
  );
}
