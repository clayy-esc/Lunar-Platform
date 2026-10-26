import React from 'react';

interface AmbientBackgroundProps {
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({ className = '' }) => {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f8fafc] ${className}`}>
      {/* Blue ambient glow – top right */}
      <div
        className="absolute -top-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full blur-[120px] opacity-70 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 70%)' }}
      />
      {/* Amber ambient glow – mid right */}
      <div
        className="absolute top-[35%] -right-[15%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.04) 50%, transparent 70%)' }}
      />
      {/* Navy ambient glow – top left */}
      <div
        className="absolute top-[10%] -left-[15%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(15, 23, 42, 0.06) 0%, rgba(30, 41, 59, 0.03) 50%, transparent 70%)' }}
      />
      {/* Blue-amber blend glow – bottom center */}
      <div
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] rounded-full blur-[150px] opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 70%)' }}
      />
      {/* Crystalline glass highlight overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 80%)' }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
