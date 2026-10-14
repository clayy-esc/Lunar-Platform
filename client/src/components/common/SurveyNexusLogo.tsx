import React from 'react';

export interface SurveyNexusLogoProps {
  /** Logo mark size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  /** Whether to render the 'SurveyNexus' wordmark alongside the mark */
  showText?: boolean;
  /** Stack the mark above the wordmark for hero-style brand lockups */
  stacked?: boolean;
  /** Subtitle to show below brand name (e.g. 'Survey Builder Platform') */
  subtitle?: string;
  /** Custom class for root container */
  className?: string;
  /** Custom class for the SVG element */
  svgClassName?: string;
  /** Custom class for the brand text */
  textClassName?: string;
  /** Click handler */
  onClick?: () => void;
}

const sizeMap = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
  '2xl': 84,
};

export const SurveyNexusLogo: React.FC<SurveyNexusLogoProps> = ({
  size = 'md',
  showText = false,
  stacked = false,
  subtitle,
  className = '',
  svgClassName = '',
  textClassName = '',
  onClick,
}) => {
  const pxSize = typeof size === 'number' ? size : sizeMap[size] || 36;
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`inline-flex ${stacked ? 'flex-col items-center gap-4' : 'items-center gap-3'} select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="SurveyNexus Logo"
    >
      {/* Galactic Icon Container */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          width: pxSize,
          height: pxSize,
        }}
      >
        {/* Subtle Atmospheric Glow Nebula */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none blur-md"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(139, 92, 246, 0.25) 50%, transparent 75%)',
            opacity: 0.35,
          }}
        />

        {/* Master Cosmic Survey Logo */}
        <svg
          viewBox="0 0 600 600"
          width={pxSize}
          height={pxSize}
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 ${svgClassName}`}
          style={{
            filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.25))',
          }}
        >
          <style>{`
            .cosmic-track { fill: none; stroke: url(#galaxyGrad-${uniqueId}); stroke-width: 8; opacity: 0.4; }
            .cosmic-data-flow { fill: none; stroke: url(#galaxyGrad-${uniqueId}); filter: url(#soft-glow-${uniqueId}); }
            .cosmic-flow-data-1 { stroke-dasharray: 10 15; }
            .cosmic-flow-data-2 { stroke-dasharray: 20 30; }
            .cosmic-flow-data-3 { stroke-dasharray: 8 12; }
          `}</style>
          <defs>
            <linearGradient id={`galaxyGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#4facfe" />
              <stop offset="75%" stopColor="#7f00ff" />
              <stop offset="100%" stopColor="#ff0844" />
            </linearGradient>

            <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id={`soft-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <clipPath id={`back-half-${uniqueId}`}>
              <rect x="0" y="0" width="600" height="300" />
            </clipPath>
            <clipPath id={`front-half-${uniqueId}`}>
              <rect x="0" y="300" width="600" height="300" />
            </clipPath>

            <path id={`path-orbit-1-${uniqueId}`} d="M 60 300 A 240 120 0 1 1 540 300 A 240 120 0 1 1 60 300" pathLength="100" />
            <path id={`path-orbit-2-${uniqueId}`} d="M 100 300 A 200 80 0 1 1 500 300 A 200 80 0 1 1 100 300" pathLength="100" />
            <path id={`path-orbit-3-${uniqueId}`} d="M 160 300 A 140 50 0 1 1 440 300 A 140 50 0 1 1 160 300" pathLength="100" />

            <g id={`docIcon-${uniqueId}`} stroke="#fff" strokeWidth="2.5" fill="none">
              <path d="M -6 -8 L 2 -8 L 6 -4 L 6 8 L -6 8 Z" />
              <path d="M 2 -8 L 2 -4 L 6 -4" />
              <line x1="-3" y1="0" x2="3" y2="0" />
              <line x1="-3" y1="3" x2="3" y2="3" />
            </g>
            
            <g id={`checkIcon-${uniqueId}`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M -5 0 L -1 4 L 6 -4" />
            </g>

            <g id={`orbit-system-${uniqueId}`}>
              <g transform="rotate(-30 300 300)">
                <use href={`#path-orbit-1-${uniqueId}`} className="cosmic-track" />
                <use href={`#path-orbit-1-${uniqueId}`} className="cosmic-data-flow cosmic-flow-data-1" strokeWidth="16"/>
                <g transform="translate(60, 300)">
                  <g transform="rotate(30)"><circle r="32" fill="#ff0844" filter={`url(#glow-${uniqueId})`}/><use href={`#docIcon-${uniqueId}`} transform="scale(2)"/></g>
                </g>
                <g transform="translate(540, 300)">
                  <g transform="rotate(30)"><circle r="32" fill="#00f2fe" filter={`url(#glow-${uniqueId})`}/><use href={`#checkIcon-${uniqueId}`} transform="scale(2.2)"/></g>
                </g>
              </g>

              <g transform="rotate(45 300 300)">
                <use href={`#path-orbit-2-${uniqueId}`} className="cosmic-track" />
                <use href={`#path-orbit-2-${uniqueId}`} className="cosmic-data-flow cosmic-flow-data-2" strokeWidth="12"/>
                <g transform="translate(100, 300)">
                  <g transform="rotate(-45)"><circle r="26" fill="#4facfe" filter={`url(#glow-${uniqueId})`}/><use href={`#checkIcon-${uniqueId}`} transform="scale(1.8)"/></g>
                </g>
                <g transform="translate(500, 300)">
                  <g transform="rotate(-45)"><circle r="26" fill="#7f00ff" filter={`url(#glow-${uniqueId})`}/><use href={`#docIcon-${uniqueId}`} transform="scale(1.6)"/></g>
                </g>
              </g>

              <g transform="rotate(-15 300 300)">
                <use href={`#path-orbit-3-${uniqueId}`} className="cosmic-track" />
                <use href={`#path-orbit-3-${uniqueId}`} className="cosmic-data-flow cosmic-flow-data-3" strokeWidth="10"/>
                <g transform="translate(160, 300)">
                  <circle r="18" fill="#fff" opacity="0.95" filter={`url(#glow-${uniqueId})`}/>
                </g>
              </g>
            </g>
          </defs>

          <circle cx="300" cy="300" r="220" fill={`url(#galaxyGrad-${uniqueId})`} opacity="0.12" filter={`url(#glow-${uniqueId})`}/>

          <g clipPath={`url(#back-half-${uniqueId})`}>
            <use href={`#orbit-system-${uniqueId}`} />
          </g>

          <g className="cosmic-pulse">
            <path d="M 300 140 Q 300 300 460 300 Q 300 300 300 460 Q 300 300 140 300 Q 300 300 300 140 Z" fill={`url(#galaxyGrad-${uniqueId})`} opacity="0.6" filter={`url(#glow-${uniqueId})`}/>
            <path d="M 300 200 Q 300 300 400 300 Q 300 300 300 400 Q 300 300 200 300 Q 300 300 300 200 Z" fill="#ffffff" filter={`url(#glow-${uniqueId})`}/>
            <circle cx="300" cy="300" r="24" fill="#00f2fe" />
          </g>

          <g clipPath={`url(#front-half-${uniqueId})`}>
            <use href={`#orbit-system-${uniqueId}`} />
          </g>
        </svg>
      </div>

      {/* Brand Typography Lockup */}
      {showText && (
        <div className={`flex flex-col leading-tight ${stacked ? 'items-center text-center' : ''} ${textClassName}`}>
          <div className="flex items-baseline tracking-tight font-extrabold text-foreground">
            <span className="text-current">Survey</span>
            <span
              className="ml-0.5 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #a855f7 100%)',
              }}
            >
              Nexus
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
