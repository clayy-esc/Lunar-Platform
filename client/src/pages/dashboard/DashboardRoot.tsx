import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { Survey } from '../../types';
import { Plus, LayoutTemplate, Clock, Trash2, ArrowUpRight, Radio, FileText, Sparkles } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const DashboardRoot: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await api.get('/surveys');
      setSurveys(res.data.surveys);
    } catch {
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
      setSurveys(surveys.filter((s) => s._id !== deleteId));
    } catch {
      addToast('Failed to delete survey', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AppShell>
      <div className="flex h-full flex-col space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 shadow-xs">
              <Sparkles className="h-3 w-3" />
              Workspace Overview
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Survey <span className="text-gradient-brand">Nexus</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              Design intelligent surveys, monitor engagement, and analyze verified data in one considered workspace.
            </p>
          </div>
          <Button onClick={handleCreate} isLoading={isCreating} size="lg" className="rounded-full shadow-lg shadow-slate-950/20">
            <Plus className="w-4 h-4 mr-2" />
            New Survey
            <ArrowUpRight className="ml-1.5 h-4 w-4 opacity-70" />
          </Button>
        </div>

        {!isLoading && surveys.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            <div className="workspace-panel rounded-3xl border border-white/90 bg-white/80 p-5 sm:p-6 shadow-xl shadow-slate-900/3 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-600 shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-slate-200/80 bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total
                </span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{surveys.length}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">surveys in workspace</p>
            </div>

            <div className="workspace-panel rounded-3xl border border-white/90 bg-white/80 p-5 sm:p-6 shadow-xl shadow-slate-900/3 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-xs">
                  <Radio className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Active
                </span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {surveys.filter((survey) => survey.status === 'published').length}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">published & collecting</p>
            </div>

            <div className="workspace-panel col-span-2 rounded-3xl border border-white/90 bg-white/80 p-5 sm:col-span-1 sm:p-6 shadow-xl shadow-slate-900/3 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 shadow-xs">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Recent
                </span>
              </div>
              <p className="truncate text-base font-extrabold text-slate-900">{surveys[0]?.title || 'Start a survey'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">most recently modified</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : surveys.length === 0 ? (
          <EmptyState
            icon={LayoutTemplate}
            title="No surveys yet"
            description="Create your first survey to start collecting data with our ethereal form builder."
            action={
              <Button onClick={handleCreate} isLoading={isCreating} size="lg" className="rounded-full">
                <Plus className="w-4 h-4 mr-2" /> Create Survey
                <ArrowUpRight className="ml-1.5 h-4 w-4 opacity-70" />
              </Button>
            }
          />
        ) : (
          <div className="dashboard-grid grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <Card 
                key={survey._id} 
                className="dashboard-card group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 shadow-lg shadow-slate-900/3 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300" 
                onClick={() => navigate(`/dashboard/${survey._id}/builder`)}
              >
                <div className={`h-1.5 w-full ${survey.status === 'published' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-slate-300'}`} />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1 flex-1 pr-4 text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors" title={survey.title}>
                      {survey.title}
                    </CardTitle>
                    <button 
                      aria-label={`Delete ${survey.title}`}
                      title="Delete survey"
                      className="rounded-full p-2 text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(survey._id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-10 text-xs leading-relaxed text-slate-500">
                    {survey.description || 'No description added yet.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between pb-6 pt-0">
                  <div className="flex items-center text-xs font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {new Date(survey.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      survey.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                      survey.status === 'closed' ? 'bg-rose-50 text-rose-700 border-rose-200/80' :
                      'bg-slate-100 text-slate-700 border-slate-200/80'
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {survey.status}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
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
        isDestructive={true}
        requiredTypedConfirmation="DELETE"
      />
    </AppShell>
  );
};
