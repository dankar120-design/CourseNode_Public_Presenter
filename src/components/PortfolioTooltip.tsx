'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface PortfolioTooltipProps {
  title: string;
  children: React.ReactNode;
}

export function PortfolioTooltip({ title, children }: PortfolioTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={tooltipRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-1 rounded-full bg-accent/20 text-accent hover:bg-accent/40 transition-colors ml-2"
        aria-label="More technical info"
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 sm:w-80 p-5 mt-3 -translate-x-1/2 left-1/2 md:left-auto md:right-0 md:translate-x-0 bg-[#111] text-foreground border border-border shadow-2xl rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              {title}
            </span>
            <button onClick={() => setIsOpen(false)} className="text-foreground/50 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-foreground/80 leading-relaxed text-xs">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
