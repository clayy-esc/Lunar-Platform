import React from 'react';

interface StarfieldBackgroundProps {
  className?: string;
}

export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = React.memo(({ className = '' }) => {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f6f8fc] ${className}`}>
      {/* Ambient ethereal fluid light orbs inspired by the modern glassmorphic design */}
      <div
        className="absolute -top-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full blur-[120px] opacity-70 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[35%] -right-[15%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-60 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(129, 140, 248, 0.10) 50%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[10%] -left-[15%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-60 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(238, 242, 255, 0.10) 50%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] rounded-full blur-[150px] opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(192, 132, 252, 0.08) 50%, transparent 70%)',
        }}
      />

      {/* Subtle iridescent crystalline glass highlight */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 80%)',
        }}
      />
    </div>
  );
});

StarfieldBackground.displayName = 'StarfieldBackground';
