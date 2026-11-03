import React from 'react';

interface AmbientBackgroundProps {
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({ className = '' }) => {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#caf0f8] ${className}`}>
      {/* Blue ambient glow – top right */}
      <div
        className="absolute -top-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full blur-[120px] opacity-70 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 150, 199, 0.28) 0%, rgba(72, 202, 228, 0.12) 45%, transparent 70%)' }}
      />
      {/* Cyan ambient glow – mid right */}
      <div
        className="absolute top-[35%] -right-[15%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 180, 216, 0.2) 0%, rgba(144, 224, 239, 0.1) 50%, transparent 70%)' }}
      />
      {/* Navy ambient glow – top left */}
      <div
        className="absolute top-[10%] -left-[15%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(3, 4, 94, 0.1) 0%, rgba(2, 62, 138, 0.04) 50%, transparent 70%)' }}
      />
      {/* Blue-cyan blend glow – bottom center */}
      <div
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] rounded-full blur-[150px] opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 119, 182, 0.16) 0%, rgba(173, 232, 244, 0.16) 50%, transparent 70%)' }}
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
