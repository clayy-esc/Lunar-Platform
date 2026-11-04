import React from 'react';
import { LunarLogo } from '../common/LunarLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register' | 'forgot';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, variant = 'login' }) => {
  const headline = variant === 'register'
    ? 'Start collecting insights today.'
    : variant === 'forgot'
      ? "We'll get you back in."
      : 'Turn questions into clear direction.';

  return (
    <div className="auth-page relative flex min-h-[100dvh] items-center justify-center p-6">
      <div className="auth-layout relative z-10 w-full">
        <aside className="auth-visual-panel">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5">
                <LunarLogo size="sm" imageClassName="brightness-0 invert" showText={false} />
                <span className="text-lg font-extrabold tracking-tight text-white">Lunar</span>
              </div>
            </div>

            <div className="auth-brand-content">
              <div className="auth-mascot-wrap" aria-hidden="true">
                <img src="/favicon.png" alt="" className="auth-mascot" />
              </div>
              <h1 className="auth-visual-title">
                {variant === 'login' ? <>Turn questions into <span>clear direction.</span></> : headline}
              </h1>
              <p className="auth-tagline">
                Build thoughtful surveys, follow every signal, and make decisions with confidence.
              </p>
            </div>
            <div className="auth-feature-row">
              <span>Build fast</span>
              <span>Get insights</span>
              <span>Your data is safe</span>
            </div>
          </div>
        </aside>

        <main className="auth-form-area">
          <div className="auth-mobile-header">
            <LunarLogo size="sm" showText />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
