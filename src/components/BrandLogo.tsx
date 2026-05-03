import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ className = "h-8 text-primary", showText = true }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        viewBox="0 0 60 60" 
        fill="none" 
        className="h-full w-auto shrink-0"
      >
        <path d="M30 5 L55 20 L55 40 L30 55 L5 40 L5 20 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 15 L45 25 L45 35 L30 45 L15 35 L15 25 Z" fill="currentColor" fillOpacity="0.2" />
        <circle cx="30" cy="30" r="4" fill="currentColor" />
        <line x1="30" y1="5" x2="30" y2="15" stroke="currentColor" strokeWidth="1.5" />
        <line x1="55" y1="20" x2="45" y2="25" stroke="currentColor" strokeWidth="1.5" />
        <line x1="55" y1="40" x2="45" y2="35" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="55" x2="30" y2="45" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="40" x2="15" y2="35" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="20" x2="15" y2="25" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {showText && (
        <div className="flex flex-col justify-center leading-none mt-1">
          <span className="font-bold tracking-tight" style={{ fontSize: '1.25em' }}>
            Acme
          </span>
          <span className="font-bold tracking-tight opacity-80 mt-[3px]" style={{ fontSize: '0.9em' }}>
            Enterprise
          </span>
        </div>
      )}
    </div>
  );
}
