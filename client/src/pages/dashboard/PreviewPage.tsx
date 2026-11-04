import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/useToast';
import { Survey } from '../../types';
import api from '../../lib/api';

export const PreviewPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) return;
      try {
        const res = await api.get(`/surveys/${surveyId}`);
        setSurvey(res.data.survey);
      } catch {
        setSurvey(null);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handlePublish = async () => {
    if (!survey) return;
    setIsPublishing(true);
    try {
      const res = await api.post(`/surveys/${survey._id}/publish`);
      setSurvey(res.data.survey);
      addToast('Survey published successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to publish survey', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!survey) return;
    setIsUnpublishing(true);
    try {
      const res = await api.post(`/surveys/${survey._id}/unpublish`);
      setSurvey(res.data.survey);
      addToast('Survey unpublished successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to unpublish survey', 'error');
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <AppShell
      survey={survey}
      onPublish={handlePublish}
      isPublishing={isPublishing}
      onUnpublish={handleUnpublish}
      isUnpublishing={isUnpublishing}
    >
      {!survey ? (
        <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#66718a]">Preview</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#172342]">See the respondent experience</h2>
              <p className="mt-1 text-sm text-[#66718a]">Review your survey before sharing it with your audience.</p>
            </div>
            <span className="hidden rounded-full bg-[#fff6dd] px-3 py-1.5 text-xs font-bold text-[#9b6900] sm:inline-flex">Preview only</span>
          </div>
          <div className="preview-frame preview-height flex flex-col overflow-hidden rounded-2xl border">
          <div className="preview-mode-banner border-b px-4 py-2 text-center text-xs font-semibold">
            Preview mode · Responses will not be saved
          </div>
          <div className="flex-1 w-full relative">
            {/* We reuse the public route inside an iframe for exact 1:1 preview representation */}
            <iframe 
              src={`/s/preview-${surveyId}?preview=true`}
              className="absolute inset-0 w-full h-full border-0"
              title="Survey Preview"
            />
          </div>
        </div>
        </div>
      )}
    </AppShell>
  );
};
