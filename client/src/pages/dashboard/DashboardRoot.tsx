import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { Survey } from '../../types';
import {
  BarChart3, CheckCircle2, Clock3, Copy, FileText, LayoutTemplate, MoreHorizontal,
  Pencil, Radio, Search, Trash2,
} from 'lucide-react';

type StatusFilter = 'all' | 'draft' | 'published';

export const DashboardRoot: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const navigate = useNavigate();
  const { addToast } = useToast();

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

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

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

  const handleDuplicate = async (survey: Survey) => {
    try {
      const created = await api.post('/surveys', { title: `${survey.title} copy`, description: survey.description });
      if (created.data?.survey?._id) {
        await api.put(`/surveys/${created.data.survey._id}`, {
          description: survey.description,
          questions: survey.questions,
          logic: survey.logic,
          theme: survey.theme,
          settings: survey.settings,
        });
      }
      addToast('Survey duplicated', 'success');
      fetchSurveys();
    } catch {
      addToast('Failed to duplicate survey', 'error');
    }
  };

  const publishedCount = surveys.filter((survey) => survey.status === 'published').length;
  const responseCount = surveys.reduce((total, survey) => total + (Number(survey.responseCount) || 0), 0);
  const filteredSurveys = useMemo(() => surveys.filter((survey) => {
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    const matchesSearch = survey.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  }), [search, statusFilter, surveys]);

  return (
    <AppShell onCreateSurvey={handleCreate} isCreatingSurvey={isCreating}>
      <div className="flex min-h-full flex-col gap-7">
        <section className="dashboard-hero dashboard-hero-refined relative overflow-hidden px-6 py-7 text-white sm:px-10 sm:py-9">
          <div className="relative z-10 flex min-h-[188px] items-center justify-between gap-6 pr-24 sm:pr-36">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#b8c3ee]">Good to see you</p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Your survey workspace</h1>
              <p className="mt-3 text-sm leading-6 text-[#dce7ff]">Build thoughtful surveys and turn every response into a clear next step.</p>
              <Button onClick={handleCreate} isLoading={isCreating} size="md" className="mt-5">
                Continue building
              </Button>
            </div>
            <img src="/favicon.png" alt="" aria-hidden="true" className="dashboard-hero-owl absolute bottom-4 right-5 h-32 w-32 object-contain sm:right-10 sm:h-40 sm:w-40" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Workspace overview">
          {[
            { label: 'Total surveys', value: surveys.length, icon: FileText, tone: 'bg-[#eef2fa] text-[#3b62c4]' },
            { label: 'Published', value: publishedCount, icon: Radio, tone: 'bg-[#fff6dd] text-[#b77900]' },
            { label: 'Total responses', value: responseCount.toLocaleString(), icon: BarChart3, tone: 'bg-[#eaf0ff] text-[#3b62c4]' },
            { label: 'Drafts', value: surveys.filter((survey) => survey.status === 'draft').length, icon: CheckCircle2, tone: 'bg-[#edf8f1] text-[#1f9d6a]' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="dashboard-stat rounded-2xl p-5">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
              <p className="text-3xl font-extrabold tracking-tight text-[#14214a]">{value}</p>
              <p className="mt-1 text-xs font-semibold text-[#6b7699]">{label}</p>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#14214a]">Your surveys</h2>
              <p className="mt-1 text-sm text-[#6b7699]">Pick up where you left off.</p>
            </div>
            <div className="dashboard-list-tools flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <span className="sr-only">Search surveys</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7699]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search surveys" className="h-10 w-full rounded-xl border border-[#e3e8f6] bg-white pl-9 pr-3 text-sm text-[#14214a] outline-none focus:border-[#3b62c4] focus:ring-3 focus:ring-[#3b62c4]/15 sm:w-52" />
              </label>
              <label>
                <span className="sr-only">Filter surveys by status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-10 w-full rounded-xl border border-[#e3e8f6] bg-white px-3 text-sm font-semibold text-[#14214a] outline-none focus:border-[#3b62c4] sm:w-32">
                  <option value="all">All</option><option value="draft">Draft</option><option value="published">Published</option>
                </select>
              </label>
            </div>
          </div>

          {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : loadError ? (
            <div className="rounded-2xl border border-[#f2c7c3] bg-[#fff7f6] px-6 py-10 text-center">
              <h3 className="text-lg font-extrabold text-[#8f1d14]">We couldn&apos;t load your surveys</h3>
              <Button variant="outline" className="mt-5" onClick={() => { setIsLoading(true); fetchSurveys(); }}>Try again</Button>
            </div>
          ) : surveys.length === 0 ? (
            <EmptyState icon={LayoutTemplate} title="Create your first survey" description="Start collecting thoughtful feedback with a survey built for your team." action={<Button onClick={handleCreate} isLoading={isCreating} size="lg">Create survey</Button>} />
          ) : filteredSurveys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd5ee] bg-white px-6 py-12 text-center text-sm font-semibold text-[#6b7699]">No surveys match those filters.</div>
          ) : (
            <div className="dashboard-grid grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredSurveys.map((survey) => (
                <Card key={survey._id} className="dashboard-card group relative flex cursor-pointer flex-col overflow-visible" onClick={() => navigate(`/dashboard/${survey._id}/builder`)}>
                  <div className={`h-1 w-full rounded-t-2xl ${survey.status === 'published' ? 'bg-[#1f9d6a]' : 'bg-[#fdb92b]'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-1 flex-1 text-lg" title={survey.title}>{survey.title}</CardTitle>
                      <div onClick={(event) => event.stopPropagation()}>
                        <Dropdown trigger={<button type="button" aria-label={`More actions for ${survey.title}`} className="rounded-lg p-2 text-[#6b7699] hover:bg-[#eef2fa]"><MoreHorizontal className="h-5 w-5" /></button>}>
                          <DropdownItem onClick={() => navigate(`/dashboard/${survey._id}/builder`)}><Pencil className="mr-2 inline h-4 w-4" />Edit</DropdownItem>
                          <DropdownItem onClick={() => handleDuplicate(survey)}><Copy className="mr-2 inline h-4 w-4" />Duplicate</DropdownItem>
                          <DropdownItem destructive onClick={() => setDeleteId(survey._id)}><Trash2 className="mr-2 inline h-4 w-4" />Delete</DropdownItem>
                        </Dropdown>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-10 text-xs">{survey.description || <span className="text-[#98a2b8]">No description yet. <button type="button" className="font-bold text-[#3b62c4] hover:underline" onClick={(event) => { event.stopPropagation(); navigate(`/dashboard/${survey._id}/builder`); }}>Add</button></span>}</CardDescription>
                  </CardHeader>
                  <div className="mx-6 mb-5 flex items-center gap-2 border-t border-[#e3e8f6] pt-4 text-[11px] font-semibold text-[#6b7699]">
                    <span>{survey.questions?.length || 0} questions</span><span className="h-1 w-1 rounded-full bg-[#b8c3ee]" /><span>{(Number(survey.responseCount) || 0).toLocaleString()} responses</span>
                  </div>
                  <CardContent className="mt-auto flex items-center justify-between pb-6 pt-0">
                    <div className="flex items-center text-xs font-semibold text-[#6b7699]"><Clock3 className="mr-1.5 h-3.5 w-3.5" />{new Date(survey.updatedAt).toLocaleDateString()}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${survey.status === 'published' ? 'bg-[#edf8f1] text-[#1f9d6a]' : 'bg-[#fff6dd] text-[#a66b00]'}`}>{survey.status === 'published' ? 'Published' : 'Draft'}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete survey" description="Are you sure you want to delete this survey? This action cannot be undone." confirmText="Delete survey" isDestructive requiredTypedConfirmation="DELETE" />
    </AppShell>
  );
};
