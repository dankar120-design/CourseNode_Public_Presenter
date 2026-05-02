import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ className = "h-8 text-primary", showText = true }: BrandLogoProps) {
  // Funktion för att rita en isometrisk kub
  const Cube = ({ cx, cy, s }: { cx: number, cy: number, s: number }) => {
    const w = s * 0.866; // cos(30)
    const h = s * 0.5;   // sin(30)
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Top face */}
        <polygon points={`0,${-s} ${w},${-h} 0,0 ${-w},${-h}`} fill="currentColor" fillOpacity="0.4" />
        {/* Left face */}
        <polygon points={`0,0 ${-w},${-h} ${-w},${s-h} 0,${s}`} fill="currentColor" fillOpacity="0.8" />
        {/* Right face */}
        <polygon points={`0,0 ${w},${-h} ${w},${s-h} 0,${s}`} fill="currentColor" fillOpacity="0.6" />
        {/* Anti-aliasing stroke borders */}
        <polygon points={`0,${-s} ${w},${-h} 0,0 ${-w},${-h}`} fill="none" stroke="var(--background, #ffffff)" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`0,0 ${-w},${-h} ${-w},${s-h} 0,${s}`} fill="none" stroke="var(--background, #ffffff)" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`0,0 ${w},${-h} ${w},${s-h} 0,${s}`} fill="none" stroke="var(--background, #ffffff)" strokeWidth="1" strokeLinejoin="round" />
      </g>
    );
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        viewBox="0 0 60 60" 
        fill="none" 
        className="h-full w-auto shrink-0"
      >
        {/* Top cube */}
        <Cube cx={30} cy={22} s={15} />
        {/* Left cube */}
        <Cube cx={17} cy={36} s={15} />
        {/* Right cube (Smaller) */}
        <Cube cx={41} cy={40} s={10} />
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
