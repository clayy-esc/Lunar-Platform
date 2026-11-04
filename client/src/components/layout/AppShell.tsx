import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SurveyHeader } from './SurveyHeader';
import { Survey } from '../../types';
import { useAuth } from '../../contexts/useAuth';
import api from '../../lib/api';
import { useToast } from '../ui/useToast';

interface AppShellProps {
  children: React.ReactNode;
  survey?: Survey | null;
  onPublish?: () => void;
  isPublishing?: boolean;
  onUnpublish?: () => void;
  isUnpublishing?: boolean;
  onCreateSurvey?: () => void;
  isCreatingSurvey?: boolean;
  isDirty?: boolean;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  savedAt?: Date | null;
  onTitleChange?: (title: string) => void;
  onSaveDraft?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, survey, onPublish, isPublishing, onUnpublish, isUnpublishing, onCreateSurvey, isCreatingSurvey, isDirty, saveState, savedAt, onTitleChange, onSaveDraft }) => {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [headerSurvey, setHeaderSurvey] = useState(survey);

  useEffect(() => setHeaderSurvey(survey), [survey]);

  const handlePublish = async () => {
    if (onPublish) return onPublish();
    if (!headerSurvey) return;
    try {
      const response = await api.post(`/surveys/${headerSurvey._id}/publish`);
      setHeaderSurvey(response.data.survey);
      addToast('Survey published', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to publish survey', 'error');
    }
  };

  const handleUnpublish = async () => {
    if (onUnpublish) return onUnpublish();
    if (!headerSurvey || !window.confirm('Unpublish this survey? Respondents will no longer be able to answer it.')) return;
    try {
      const response = await api.post(`/surveys/${headerSurvey._id}/unpublish`);
      setHeaderSurvey(response.data.survey);
      addToast('Survey unpublished', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to unpublish survey', 'error');
    }
  };

  const handleTitleChange = async (title: string) => {
    if (onTitleChange) return onTitleChange(title);
    if (!headerSurvey) return;
    try {
      const response = await api.put(`/surveys/${headerSurvey._id}`, { title });
      setHeaderSurvey(response.data.survey);
      addToast('Survey title updated', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to update survey title', 'error');
    }
  };

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
        {headerSurvey ? <SurveyHeader survey={headerSurvey} isDirty={isDirty} saveState={saveState} savedAt={savedAt} isPublishing={isPublishing} isUnpublishing={isUnpublishing} onTitleChange={handleTitleChange} onSaveDraft={onSaveDraft} onPublish={handlePublish} onUnpublish={handleUnpublish} /> : <Topbar onCreateSurvey={onCreateSurvey} isCreatingSurvey={isCreatingSurvey} onMenuOpen={() => setIsMobileNavOpen(true)} />}
        <main className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 pb-20 pt-7 sm:px-6 lg:px-8">
          <div className="mx-auto min-h-full w-full max-w-[1280px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
