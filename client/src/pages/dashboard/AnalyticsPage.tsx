import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart3, Clock3, Copy, Download, FileDown, Percent, Send, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/useToast';
import { AnalyticsData, Survey } from '../../types';
import api from '../../lib/api';

const chartColors = ['#3b62c4', '#14214a', '#fdb92b', '#1f9d6a', '#7b8ed1', '#d9534f'];

type AnalyticsResponse = AnalyticsData & {
  completionRate?: number;
  averageTime?: number;
  averageCompletionTime?: number;
  lastResponseAt?: string;
  responseOverTime?: { date: string; count: number }[];
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`;
};

const formatDate = (date?: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : null;

const formatRelativeDate = (date?: string) => {
  if (!date) return null;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} minutes ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} hours ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)} days ago`;
  return formatDate(date);
};

const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-lg bg-[#e8edf8] ${className}`} />;

export const AnalyticsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState(30);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveyResponse, analyticsResponse] = await Promise.all([
          api.get(`/surveys/${surveyId}`),
          api.get(`/surveys/${surveyId}/analytics`),
        ]);
        setSurvey(surveyResponse.data.survey);
        setAnalytics(analyticsResponse.data);
      } catch (error: any) {
        addToast(error.response?.data?.error || 'Failed to load analytics', 'error');
        if (error.response?.status === 404) navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [addToast, navigate, surveyId]);

  const responseTrend = useMemo(() => {
    if (!analytics?.responseOverTime) return [];
    return analytics.responseOverTime.slice(-range).map((item) => ({
      ...item,
      label: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(item.date)),
    }));
  }, [analytics, range]);

  const copyLink = async () => {
    if (!survey?.publicSlug) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${survey.publicSlug}`);
      addToast('Link copied', 'success');
    } catch { addToast('Unable to copy link', 'error'); }
  };

  const exportCsv = () => {
    if (!analytics) return;
    const rows = ['Question,Answer,Count,Percentage'];
    analytics.questions.forEach((question) => {
      if (Array.isArray(question.data)) question.data.forEach((item: any) => rows.push([question.title, item.label, item.count, item.percentage ?? ''].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')));
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    link.download = `${survey?.title || 'survey'}-analytics.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportChart = async () => {
    if (!chartRef.current) return;
    const { toPng } = await import('html-to-image');
    const link = document.createElement('a');
    link.download = `${survey?.title || 'survey'}-responses.png`;
    link.href = await toPng(chartRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    link.click();
  };

  if (isLoading) {
    return <AppShell><div className="analytics-page"><Skeleton className="h-10 w-72" /><Skeleton className="h-5 w-96" /><div className="analytics-stat-grid">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}</div><Skeleton className="h-80" /></div></AppShell>;
  }

  if (!survey || !analytics) return null;

  const hasResponses = analytics.totalResponses > 0;
  const completionRate = analytics.completionRate ?? (analytics as any).completionStats?.completionRate;
  const averageTime = analytics.averageTime ?? analytics.averageCompletionTime ?? (analytics as any).completionStats?.avgTime;
  const lastResponse = analytics.lastResponseAt ?? (analytics as any).lastResponse;

  return (
    <AppShell survey={survey}>
      <div className="analytics-page">
        <div className="analytics-page-heading">
          <div><h2>Analytics</h2><p>See how people are answering.</p></div>
          <div className="analytics-actions"><Button variant="outline" onClick={exportChart}><Download className="mr-2 h-4 w-4" />Export chart</Button><Button variant="outline" onClick={exportCsv}><FileDown className="mr-2 h-4 w-4" />Export CSV</Button></div>
        </div>

        {!hasResponses ? (
          <Card className="analytics-empty-state">
            <CardContent>
              <img src="/favicon.png" alt="" className="analytics-owl" />
              <h3>No responses yet</h3>
              <p>Publish and share your survey to start collecting data.</p>
              <div className="analytics-empty-actions"><Button onClick={() => api.post(`/surveys/${survey._id}/publish`).then((response) => { setSurvey(response.data.survey); addToast('Survey published', 'success'); }).catch(() => addToast('Failed to publish survey', 'error'))}><Send className="mr-2 h-4 w-4" />Publish survey</Button><Button variant="outline" onClick={copyLink}><Copy className="mr-2 h-4 w-4" />Copy link</Button></div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="analytics-stat-grid">
              <StatCard icon={Users} label="Responses" value={analytics.totalResponses ? analytics.totalResponses.toLocaleString() : null} helper={analytics.totalResponses ? undefined : 'No data yet'} tint="blue" />
              <StatCard icon={Percent} label="Completion rate" value={completionRate == null ? null : `${Math.round(completionRate)}%`} helper={completionRate == null ? 'No data yet' : undefined} tint="green" />
              <StatCard icon={Clock3} label="Average time" value={formatDuration(averageTime)} helper={averageTime == null ? 'No data yet' : 'Per response'} tint="amber" />
              <StatCard icon={BarChart3} label="Last response" value={formatRelativeDate(lastResponse)} helper={lastResponse ? undefined : 'No data yet'} title={lastResponse ? formatDate(lastResponse) || undefined : undefined} tint="violet" />
            </div>
            <Card ref={chartRef} className="analytics-trend-card">
              <CardHeader><div className="analytics-card-heading"><div><CardTitle>Responses over time</CardTitle><p>Track when people are completing your survey.</p></div><div className="analytics-range" role="group" aria-label="Date range">{[7, 30, 90].map((days) => <button key={days} type="button" className={range === days ? 'active' : ''} onClick={() => setRange(days)}>{days} days</button>)}</div></div></CardHeader>
              <CardContent>{responseTrend.length ? <ResponsiveContainer width="100%" height={260}><LineChart data={responseTrend}><CartesianGrid stroke="#e3e8f6" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7699' }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7699' }} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e3e8f6' }} /><Line type="monotone" dataKey="count" name="Responses" stroke="#3b62c4" strokeWidth={3} dot={{ r: 4, fill: '#fdb92b', stroke: '#3b62c4', strokeWidth: 2 }} /></LineChart></ResponsiveContainer> : <div className="analytics-no-trend">Response trend data will appear here as new responses arrive.</div>}</CardContent>
            </Card>
            <div className="analytics-question-grid">{analytics.questions.map((question, questionIndex) => <QuestionCard key={question.id} question={question} index={questionIndex} />)}</div>
          </>
        )}
      </div>
    </AppShell>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | null; helper?: string; title?: string; tint: 'blue' | 'green' | 'amber' | 'violet' }> = ({ icon: Icon, label, value, helper, title, tint }) => <Card className={`analytics-stat-card analytics-stat-card-${tint}`}><CardContent className="analytics-stat-content"><span className="analytics-stat-icon" aria-hidden="true"><Icon /></span><div className="analytics-stat-body"><strong className={value === null ? 'analytics-stat-empty' : ''} aria-label={value === null ? 'No data yet' : undefined} title={title}>{value ?? '–'}</strong><span className="analytics-stat-label">{label}</span>{helper && <small>{helper}</small>}</div></CardContent></Card>;

const QuestionCard: React.FC<{ question: AnalyticsData['questions'][number]; index: number }> = ({ question, index }) => {
  const items = Array.isArray(question.data) ? question.data : [];
  const isText = ['short_text', 'long_text'].includes(question.type);
  const isRating = ['rating', 'linear_scale', 'number'].includes(question.type);
  const average = (question.data as any)?.mean ?? (question.data as any)?.average;
  return <Card className="analytics-question-card"><CardHeader><div className="analytics-card-heading"><div><span className="analytics-question-number">Question {index + 1}</span><CardTitle>{question.title}</CardTitle></div><span className="analytics-question-count">{question.totalAnswers ?? items.reduce((sum: number, item: any) => sum + (item.count || 0), 0)} answers</span></div></CardHeader><CardContent>{isText ? <div className="analytics-word-list">{items.length ? items.slice(0, 8).map((item: any) => <span key={item.label}>{item.label}<b>{item.count}</b></span>) : <p className="analytics-muted">Text answers will appear here.</p>}</div> : isRating ? <div className="analytics-average"><strong>{average == null ? '—' : Number(average).toFixed(1)}</strong><span>Average score</span></div> : <ResponsiveContainer width="100%" height={220}><BarChart data={items} layout="vertical" margin={{ left: 8, right: 20 }}><CartesianGrid stroke="#e3e8f6" horizontal={false} /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#465477' }} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e3e8f6' }} /><Bar dataKey="count" name="Responses" radius={[0, 6, 6, 0]}>{items.map((_, itemIndex) => <Cell key={itemIndex} fill={chartColors[itemIndex % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer>}</CardContent></Card>;
};
