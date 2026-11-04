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
  onCreateSurvey?: () => void;
  isCreatingSurvey?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, survey, onPublish, isPublishing, onUnpublish, isUnpublishing, onCreateSurvey, isCreatingSurvey }) => {
  const { logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="app-shell relative flex h-screen overflow-hidden bg-[#eef4ff]">
      {/* Ambient background lighting mesh inspired by the reference image */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div 
          className="absolute -top-[15%] right-0 w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(96, 165, 250, 0.08) 50%, transparent 70%)' }}
        />
        <div 
          className="absolute top-[40%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(96, 165, 250, 0.07) 50%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-[10%] left-[25%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 60%)' }}
        />
      </div>

      <Sidebar
        surveyId={survey?._id}
        surveyTitle={survey?.title}
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
          onCreateSurvey={onCreateSurvey}
          isCreatingSurvey={isCreatingSurvey}
          onMenuOpen={() => setIsMobileNavOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 pb-20 pt-7 sm:px-6 lg:px-8">
          <div className="mx-auto min-h-full w-full max-w-[1280px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
