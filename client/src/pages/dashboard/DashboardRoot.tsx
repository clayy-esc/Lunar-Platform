import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/useToast';
import { useAuth } from '../../contexts/useAuth';
import api from '../../lib/api';
import { Survey } from '../../types';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutTemplate,
  Plus,
  Radio,
  Trash2,
} from 'lucide-react';

export const DashboardRoot: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await api.get('/surveys');
      setSurveys(Array.isArray(res.data?.surveys) ? res.data.surveys : []);
      setLoadError(false);
    } catch {
      setLoadError(true);
      addToast('Failed to load surveys', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await api.post('/surveys', { title: 'New survey' });
      navigate(`/dashboard/${res.data.survey._id}/builder`);
    } catch {
      addToast('Failed to create survey', 'error');
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/surveys/${deleteId}`);
      addToast('Survey deleted', 'success');
      setSurveys((current) => current.filter((survey) => survey._id !== deleteId));
    } catch {
      addToast('Failed to delete survey', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const publishedCount = useMemo(() => surveys.filter((survey) => survey.status === 'published').length, [surveys]);
  const responseCount = useMemo(
    () => surveys.reduce((total, survey) => total + (Number(survey.responseCount) || 0), 0),
    [surveys]
  );

  return (
    <AppShell>
      <div className="flex min-h-full flex-col gap-7">
        <section className="dashboard-hero relative overflow-hidden rounded-3xl px-6 py-7 text-white sm:px-8 sm:py-8">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
          <div className="absolute -bottom-28 right-24 h-44 w-44 rounded-full border-[20px] border-[#ffb928]/20" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your survey workspace</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#dce7ff]">
                Build thoughtful surveys, collect better answers, and turn every response into a clear next step.
              </p>
            </div>
            <Button onClick={handleCreate} isLoading={isCreating} size="lg" className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Create survey
              <ArrowUpRight className="ml-1.5 h-4 w-4 opacity-70" />
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Workspace overview">
          {[
            { label: 'Total surveys', value: surveys.length, icon: FileText, tone: 'bg-[#eef2fa] text-[#4169b2]' },
            { label: 'Published', value: publishedCount, icon: Radio, tone: 'bg-[#fff6dd] text-[#b77900]' },
            { label: 'Total responses', value: responseCount.toLocaleString(), icon: BarChart3, tone: 'bg-[#eaf0ff] text-[#4169b2]' },
            { label: 'Drafts', value: surveys.filter((survey) => survey.status === 'draft').length, icon: CheckCircle2, tone: 'bg-[#edf8f1] text-[#27804d]' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="dashboard-stat rounded-2xl p-4 sm:p-5">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-[#172342]">{value}</p>
              <p className="mt-1 text-xs font-semibold text-[#66718a]">{label}</p>
            </div>
          ))}
        </section>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#172342]">Your surveys</h2>
            <p className="mt-1 text-sm text-[#66718a]">Pick up where you left off.</p>
          </div>
          {surveys.length > 0 && (
            <span className="rounded-full bg-[#eaf0ff] px-3 py-1.5 text-xs font-bold text-[#4169b2]">
              {surveys.length} {surveys.length === 1 ? 'survey' : 'surveys'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : loadError ? (
          <div className="rounded-2xl border border-[#f2c7c3] bg-[#fff7f6] px-6 py-10 text-center">
            <h3 className="text-lg font-extrabold text-[#8f1d14]">We couldn&apos;t load your surveys</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#a34c45]">Check your connection and try again. Your survey data is still safe.</p>
            <Button variant="outline" className="mt-5" onClick={() => { setIsLoading(true); fetchSurveys(); }}>
              Try again
            </Button>
          </div>
        ) : surveys.length === 0 ? (
          <EmptyState
            icon={LayoutTemplate}
            title="Your workspace is ready"
            description="Create your first survey to start collecting thoughtful feedback."
            action={<Button onClick={handleCreate} isLoading={isCreating} size="lg"><Plus className="mr-2 h-4 w-4" />Create survey</Button>}
          />
        ) : (
          <div className="dashboard-grid grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <Card
                key={survey._id}
                className="dashboard-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl"
                onClick={() => navigate(`/dashboard/${survey._id}/builder`)}
              >
                <div className={`h-1 w-full ${survey.status === 'published' ? 'bg-[#ffb928]' : 'bg-[#dce3f2]'}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-1 flex-1 text-lg" title={survey.title}>{survey.title}</CardTitle>
                    <button
                      aria-label={`Delete ${survey.title}`}
                      title="Delete survey"
                      className="rounded-lg p-2 text-[#66718a] opacity-0 transition-all hover:bg-[#fff0ef] hover:text-[#b42318] group-hover:opacity-100"
                      onClick={(event) => { event.stopPropagation(); setDeleteId(survey._id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-10 text-xs">
                    {survey.description || 'No description added yet.'}
                  </CardDescription>
                </CardHeader>
                <div className="mx-6 mb-5 flex items-center gap-2 border-t border-[#e4e9f3] pt-4 text-[11px] font-semibold text-[#66718a]">
                  <span>{Array.isArray(survey.questions) ? survey.questions.length : 0} {survey.questions?.length === 1 ? 'question' : 'questions'}</span>
                  <span className="h-1 w-1 rounded-full bg-[#b8c8ed]" />
                  <span>{(Number(survey.responseCount) || 0).toLocaleString()} responses</span>
                </div>
                <CardContent className="mt-auto flex items-center justify-between pb-6 pt-0">
                  <div className="flex items-center text-xs font-semibold text-[#66718a]">
                    <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                    {new Date(survey.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      survey.status === 'published' ? 'bg-[#edf8f1] text-[#27804d]' :
                      survey.status === 'closed' ? 'bg-[#fff0ef] text-[#b42318]' : 'bg-[#eef2fa] text-[#66718a]'
                    }`}>{survey.status}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2fa] text-[#4169b2] transition-colors group-hover:bg-[#4169b2] group-hover:text-white">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Survey"
        description="Are you sure you want to delete this survey? This action cannot be undone and will permanently delete all associated responses."
        confirmText="Delete Survey"
        isDestructive
        requiredTypedConfirmation="DELETE"
      />
    </AppShell>
  );
};
