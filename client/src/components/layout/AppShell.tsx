import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Survey } from '../../types';
import { useAuth } from '../../contexts/useAuth';

interface AppShellProps {
  children: React.ReactNode;
  survey?: Survey | null;
  onPublish?: () => void;
  isPublishing?: boolean;
  onUnpublish?: () => void;
  isUnpublishing?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, survey, onPublish, isPublishing, onUnpublish, isUnpublishing }) => {
  const { logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f6f8fc]">
      {/* Ambient background lighting mesh inspired by the reference image */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div 
          className="absolute -top-[15%] right-0 w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%)' }}
        />
        <div 
          className="absolute top-[40%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(129, 140, 248, 0.07) 50%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-[10%] left-[25%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.10) 0%, transparent 60%)' }}
        />
      </div>

      <Sidebar
        surveyId={survey?._id}
        onLogout={logout}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          survey={survey}
          onPublish={onPublish}
          isPublishing={isPublishing}
          onUnpublish={onUnpublish}
          isUnpublishing={isUnpublishing}
          onMenuOpen={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
          <div className="mx-auto h-full max-w-360">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
