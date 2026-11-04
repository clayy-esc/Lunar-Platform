import React from 'react';
import { Check } from 'lucide-react';
import { LunarLogo } from '../common/LunarLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-8 lg:px-10">
      <div className="auth-layout relative z-10 w-full">
        <aside className="auth-visual-panel">
          <div className="auth-visual-glow auth-visual-glow-top" />
          <div className="auth-visual-glow auth-visual-glow-bottom" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LunarLogo size="sm" imageClassName="brightness-0 invert" />
                <span className="text-lg font-extrabold tracking-tight text-white">Lunar</span>
              </div>
              <span className="auth-live-pill">
                <span className="auth-live-dot" />
                Built for curious teams
              </span>
            </div>

            <div className="mt-auto max-w-md pb-8 pt-20">
              <div className="auth-mascot-wrap" aria-hidden="true">
                <img src="/favicon.png" alt="" className="auth-mascot" />
                <span className="auth-mascot-orbit auth-mascot-orbit-one" />
                <span className="auth-mascot-orbit auth-mascot-orbit-two" />
              </div>
              <h1 className="auth-visual-title">
                Turn questions into <span>clear direction.</span>
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
                Build thoughtful surveys, follow every signal, and make decisions with confidence.
              </p>
              <div className="mt-7 grid max-w-sm grid-cols-2 gap-2">
                {['Simple to build', 'Easy to share', 'Clear insights', 'Made for teams'].map((feature) => (
                  <div key={feature} className="auth-feature">
                    <Check className="h-3.5 w-3.5 text-[#ffb928]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>

        <main className="auth-form-area">
          <div className="auth-mobile-mascot" aria-hidden="true">
            <img src="/favicon.png" alt="" />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
