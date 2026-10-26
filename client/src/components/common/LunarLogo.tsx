import React from 'react';

export interface LunarLogoProps {
  /** Logo mark size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  /** Whether to render the 'Lunar' wordmark alongside the mark */
  showText?: boolean;
  /** Stack the mark above the wordmark for hero-style brand lockups */
  stacked?: boolean;
  /** Subtitle to show below brand name (e.g. 'Survey Builder Platform') */
  subtitle?: string;
  /** Custom class for root container */
  className?: string;
  /** Custom class for the mark/image element (svgClassName kept for flexible prop pass-through) */
  svgClassName?: string;
  imageClassName?: string;
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

export const LunarLogo: React.FC<LunarLogoProps> = ({
  size = 'md',
  showText = false,
  stacked = false,
  subtitle,
  className = '',
  svgClassName = '',
  imageClassName = '',
  textClassName = '',
  onClick,
}) => {
  const pxSize = typeof size === 'number' ? size : sizeMap[size] || 36;

  return (
    <div
      className={`inline-flex ${stacked ? 'flex-col items-center gap-4' : 'items-center gap-3'} select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Lunar Logo"
    >
      {/* Mascot Icon Container */}
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
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.22) 50%, transparent 75%)',
            opacity: 0.45,
          }}
        />

        {/* Lunar Mascot */}
        <img
          src="/favicon.png"
          alt="Lunar Mascot"
          className={`relative z-10 w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(79,70,229,0.22)] transition-transform duration-300 hover:scale-105 ${imageClassName || svgClassName}`}
          draggable={false}
        />
      </div>

      {/* Brand Typography Lockup */}
      {showText && (
        <div className={`flex flex-col leading-tight ${stacked ? 'items-center text-center' : ''} ${textClassName}`}>
          <div className="flex items-baseline tracking-tight font-extrabold text-foreground">
            <span
              className="bg-clip-text text-transparent font-extrabold tracking-tight"
              style={{
                backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
              }}
            >
              Lunar
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

export default LunarLogo;
