import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Survey, AnalyticsData, QuestionType } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import api from '../../lib/api';
import { toPng } from 'html-to-image';
import {
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  ScatterChart as ScatterIcon,
  AreaChart as AreaIcon,
  Info,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

type PlotType = 'bar' | 'horizontal_bar' | 'pie' | 'donut' | 'line' | 'area' | 'scatter' | 'radar';

interface PlotOption {
  value: PlotType;
  label: string;
  icon: React.ReactNode;
  description: string;
  requiresNumericY: boolean;
}

const PLOT_OPTIONS: PlotOption[] = [
  { value: 'bar', label: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" />, description: 'Vertical bars for comparing categories', requiresNumericY: false },
  { value: 'horizontal_bar', label: 'Horizontal Bar', icon: <BarChart3 className="w-4 h-4 rotate-90" />, description: 'Horizontal bars for long category labels', requiresNumericY: false },
  { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon className="w-4 h-4" />, description: 'Proportional slices of a whole', requiresNumericY: false },
  { value: 'donut', label: 'Donut Chart', icon: <PieChartIcon className="w-4 h-4" />, description: 'Pie chart with a hollow center', requiresNumericY: false },
  { value: 'line', label: 'Line Chart', icon: <TrendingUp className="w-4 h-4" />, description: 'Trend lines connecting data points', requiresNumericY: true },
  { value: 'area', label: 'Area Chart', icon: <AreaIcon className="w-4 h-4" />, description: 'Filled area under a line', requiresNumericY: true },
  { value: 'scatter', label: 'Scatter Plot', icon: <ScatterIcon className="w-4 h-4" />, description: 'Individual data points on X-Y axes', requiresNumericY: true },
  { value: 'radar', label: 'Radar Chart', icon: <BarChart3 className="w-4 h-4" />, description: 'Multivariate data on radial axes', requiresNumericY: false },
];

const COLOR_PALETTES: Record<string, string[]> = {
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6', '#ddd6fe', '#ede9fe'],
  ocean: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#0369a1', '#075985', '#bae6fd', '#e0f2fe'],
  sunset: ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c', '#9a3412', '#fed7aa', '#ffedd5'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#065f46', '#a7f3d0', '#d1fae5'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#be123c', '#9f1239', '#fecdd3', '#ffe4e6'],
  rainbow: ['#8b5cf6', '#0ea5e9', '#10b981', '#f97316', '#f43f5e', '#eab308', '#ec4899', '#06b6d4'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNumericQuestion(type: QuestionType) {
  return ['number', 'linear_scale', 'rating'].includes(type);
}

function isCategoricalQuestion(type: QuestionType) {
  return ['single_choice', 'multi_choice', 'dropdown', 'rating'].includes(type);
}

function isPlottableQuestion(type: QuestionType) {
  return isNumericQuestion(type) || isCategoricalQuestion(type);
}

interface QuestionAnalytics {
  id: string;
  title: string;
  type: QuestionType;
  totalAnswers?: number;
  data?: any;
  samples?: string[];
  distribution?: { label: string; count: number }[];
}

interface SummaryStats {
  count: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  mode?: string;
  stdDev?: number;
}

function computeSummaryStats(chartData: any[], valueKey: string, labelKey: string): SummaryStats {
  const values = chartData.map((d) => Number(d[valueKey])).filter((v) => !isNaN(v));
  if (values.length === 0) return { count: 0 };

  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Standard deviation
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Mode (for categorical: most frequent label)
  const freqMap: Record<string, number> = {};
  chartData.forEach((d) => {
    const label = String(d[labelKey] ?? d[valueKey]);
    freqMap[label] = (freqMap[label] || 0) + 1;
  });
  const modeEntry = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0];
  const mode = modeEntry ? modeEntry[0] : undefined;

  return {
    count,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min,
    max,
    stdDev: Math.round(stdDev * 100) / 100,
    mode,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AnalyticsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Plot Builder State
  const [plotType, setPlotType] = useState<PlotType>('bar');
  const [xAxisQuestion, setXAxisQuestion] = useState<string>('');
  const [yAxisQuestion, setYAxisQuestion] = useState<string>('count');
  const [colorPalette, setColorPalette] = useState<string>('violet');
  const [showStatsPanel, setShowStatsPanel] = useState(true);

  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveyRes, analyticsRes] = await Promise.all([
          api.get(`/surveys/${surveyId}`),
          api.get(`/surveys/${surveyId}/analytics`),
        ]);
        setSurvey(surveyRes.data.survey);
        setAnalytics(analyticsRes.data);
      } catch (err: any) {
        addToast('Failed to load analytics', 'error');
        if (err.response?.status === 404) navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [surveyId, navigate, addToast]);

  // Auto-select first plottable question when data loads
  useEffect(() => {
    if (analytics && analytics.questions.length > 0 && !xAxisQuestion) {
      const firstPlottable = analytics.questions.find((q) => isPlottableQuestion(q.type));
      if (firstPlottable) {
        setXAxisQuestion(firstPlottable.id);
      }
    }
  }, [analytics, xAxisQuestion]);

  // ─── Derived Data ─────────────────────────────────────────────────────

  const plottableQuestions = useMemo(() => {
    if (!analytics) return [];
    return analytics.questions.filter((q) => isPlottableQuestion(q.type));
  }, [analytics]);

  const selectedQuestion = useMemo(() => {
    if (!analytics) return null;
    return analytics.questions.find((q) => q.id === xAxisQuestion) || null;
  }, [analytics, xAxisQuestion]);

  const chartData = useMemo(() => {
    if (!selectedQuestion) return [] as { label: string; count: number; percentage?: number }[];

    if (isCategoricalQuestion(selectedQuestion.type) && Array.isArray(selectedQuestion.data)) {
      return selectedQuestion.data.map((d: any) => ({
        label: d.label as string,
        count: d.count as number,
        percentage: d.percentage as number | undefined,
      }));
    }

    if (isNumericQuestion(selectedQuestion.type)) {
      if (selectedQuestion.distribution && selectedQuestion.distribution.length > 0) {
        return selectedQuestion.distribution.map((d) => ({
          label: d.label,
          count: d.count,
          percentage: undefined as number | undefined,
        }));
      }
      if (selectedQuestion.data && !Array.isArray(selectedQuestion.data)) {
        // Numeric summary — create a single-bar representation
        return [
          { label: 'Avg', count: selectedQuestion.data.avg as number, percentage: undefined as number | undefined },
          { label: 'Median', count: selectedQuestion.data.median as number, percentage: undefined as number | undefined },
          { label: 'Min', count: selectedQuestion.data.min as number, percentage: undefined as number | undefined },
          { label: 'Max', count: selectedQuestion.data.max as number, percentage: undefined as number | undefined },
        ];
      }
    }

    return [] as { label: string; count: number; percentage?: number }[];
  }, [selectedQuestion]);

  const summaryStats = useMemo(() => {
    if (chartData.length === 0) return null;
    return computeSummaryStats(chartData, 'count', 'label');
  }, [chartData]);

  const numericSummary = useMemo(() => {
    if (!selectedQuestion) return null;
    if (isNumericQuestion(selectedQuestion.type) && selectedQuestion.data && !Array.isArray(selectedQuestion.data)) {
      return selectedQuestion.data;
    }
    return null;
  }, [selectedQuestion]);

  const colors = COLOR_PALETTES[colorPalette] || COLOR_PALETTES.violet;

  // ─── Y-axis options depend on question type ───────────────────────────

  const yAxisOptions = useMemo(() => {
    const options = [{ label: 'Count', value: 'count' }];
    if (selectedQuestion && isCategoricalQuestion(selectedQuestion.type)) {
      options.push({ label: 'Percentage (%)', value: 'percentage' });
    }
    return options;
  }, [selectedQuestion]);

  const activeYKey = yAxisQuestion === 'percentage' && isCategoricalQuestion(selectedQuestion?.type || 'short_text')
    ? 'percentage'
    : 'count';

  // ─── Export ───────────────────────────────────────────────────────────

  const handleExportImage = useCallback(async () => {
    if (!plotRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(plotRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0b0914' : '#faf9ff',
        style: {
          padding: '32px',
          margin: '0',
          borderRadius: '0',
        },
      });

      const link = document.createElement('a');
      const qTitle = selectedQuestion?.title.replace(/[^a-z0-9]/gi, '_') || 'plot';
      link.download = `${survey?.title.replace(/[^a-z0-9]/gi, '_')}_${qTitle}_${plotType}.png`;
      link.href = dataUrl;
      link.click();

      addToast('Plot exported successfully', 'success');
    } catch (err) {
      addToast('Failed to export plot image', 'error');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, [survey, selectedQuestion, plotType, addToast]);

  // ─── Reset ────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setPlotType('bar');
    setYAxisQuestion('count');
    setColorPalette('violet');
    setShowStatsPanel(true);
    if (plottableQuestions.length > 0) {
      setXAxisQuestion(plottableQuestions[0].id);
    }
  }, [plottableQuestions]);

  // ─── Render Chart ─────────────────────────────────────────────────────

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-80 text-muted-foreground">
          <div className="text-center space-y-2">
            <Info className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-sm">No data available for this question</p>
          </div>
        </div>
      );
    }

    const tooltipStyle = {
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    };

    const yLabel = activeYKey === 'percentage' ? '%' : '';

    switch (plotType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: 11 } }}
              />
              <RechartsTooltip cursor={{ fill: 'var(--muted)', opacity: 0.3 }} contentStyle={tooltipStyle} />
              <Bar dataKey={activeYKey} radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'horizontal_bar':
        return (
          <ResponsiveContainer width="100%" height={Math.max(380, chartData.length * 44)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.4} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="label"
                type="category"
                width={120}
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip cursor={{ fill: 'var(--muted)', opacity: 0.3 }} contentStyle={tooltipStyle} />
              <Bar dataKey={activeYKey} radius={[0, 6, 6, 0]} maxBarSize={36}>
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={activeYKey}
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={130}
                innerRadius={plotType === 'donut' ? 60 : 0}
                paddingAngle={2}
                label={({ label, percent }: any) => `${label} (${(percent * 100).toFixed(1)}%)`}
                labelLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
              >
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--foreground)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey={activeYKey}
                stroke={colors[0]}
                strokeWidth={2.5}
                dot={{ fill: colors[0], stroke: 'var(--card)', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: colors[0], strokeWidth: 2, fill: 'var(--card)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--foreground)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey={activeYKey}
                stroke={colors[0]}
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={{ fill: colors[0], stroke: 'var(--card)', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="label"
                name="Category"
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                dataKey={activeYKey}
                name={activeYKey === 'percentage' ? 'Percentage' : 'Count'}
                tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chartData} fill={colors[0]}>
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Radar
                dataKey={activeYKey}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // ─── Loading / Empty ──────────────────────────────────────────────────

  if (isLoading || !survey || !analytics) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (analytics.totalResponses === 0) {
    return (
      <AppShell survey={survey}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Plot Builder</h2>
            <p className="text-muted-foreground mt-1">Configure and visualize your survey data</p>
          </div>
          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
            <p className="text-muted-foreground">Share your survey to start collecting data.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (plottableQuestions.length === 0) {
    return (
      <AppShell survey={survey}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Plot Builder</h2>
            <p className="text-muted-foreground mt-1">Configure and visualize your survey data</p>
          </div>
          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No plottable questions</h3>
            <p className="text-muted-foreground">
              This survey only has text-based questions. Add choice, rating, or number questions to visualize data.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────

  return (
    <AppShell survey={survey}>
      <div className="space-y-6" style={{ animation: 'rise-in 450ms ease-out both' }}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Plot Builder</h2>
            <p className="text-muted-foreground mt-1">
              Configure and export individual charts — {analytics.totalResponses} responses collected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} title="Reset to defaults">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
          {/* ── Controls Panel ────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Plot Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Plot Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {PLOT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPlotType(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                        plotType === opt.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background text-foreground border-border hover:bg-muted hover:border-primary/30'
                      }`}
                      title={opt.description}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Axis Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Axes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="X Axis (Question)"
                  value={xAxisQuestion}
                  onChange={(e) => setXAxisQuestion(e.target.value)}
                  options={plottableQuestions.map((q, i) => ({
                    label: `Q${i + 1}: ${q.title.length > 30 ? q.title.slice(0, 30) + '…' : q.title}`,
                    value: q.id,
                  }))}
                />
                <Select
                  label="Y Axis (Value)"
                  value={yAxisQuestion}
                  onChange={(e) => setYAxisQuestion(e.target.value)}
                  options={yAxisOptions}
                />
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Color Palette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(COLOR_PALETTES).map(([name, pal]) => (
                    <button
                      key={name}
                      onClick={() => setColorPalette(name)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 border ${
                        colorPalette === name
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30 bg-background'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {pal.slice(0, 5).map((c, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="capitalize text-muted-foreground">{name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  onClick={handleExportImage}
                  isLoading={isExporting}
                  disabled={chartData.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save Plot as Image
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── Visualization Panel ───────────────────────────────────── */}
          <div className="space-y-4">
            {/* Chart */}
            <Card>
              <div ref={plotRef}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {selectedQuestion?.title || 'Select a question'}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {PLOT_OPTIONS.find((o) => o.value === plotType)?.label} · {activeYKey === 'percentage' ? 'Percentage' : 'Count'} · {colorPalette} palette
                      </p>
                    </div>
                    {selectedQuestion && (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                        {selectedQuestion.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>{renderChart()}</CardContent>
              </div>
            </Card>

            {/* Summary Statistics */}
            {summaryStats && summaryStats.count > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => setShowStatsPanel(!showStatsPanel)}
                  >
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Summary Statistics
                    </CardTitle>
                    {showStatsPanel ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </CardHeader>
                {showStatsPanel && (
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <StatBox label="Count" value={summaryStats.count} />
                      {summaryStats.mean !== undefined && <StatBox label="Mean" value={summaryStats.mean} />}
                      {summaryStats.median !== undefined && <StatBox label="Median" value={summaryStats.median} />}
                      {summaryStats.min !== undefined && <StatBox label="Min" value={summaryStats.min} />}
                      {summaryStats.max !== undefined && <StatBox label="Max" value={summaryStats.max} />}
                      {summaryStats.stdDev !== undefined && <StatBox label="Std Dev" value={summaryStats.stdDev} />}
                      {summaryStats.mode && <StatBox label="Mode" value={summaryStats.mode} />}
                      {numericSummary && numericSummary.count !== undefined && (
                        <StatBox label="Total Answers" value={numericSummary.count} />
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Data Table Preview */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Data Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-auto rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground border-b border-border">Label</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-foreground border-b border-border">Count</th>
                          {chartData[0]?.percentage !== undefined && (
                            <th className="text-right px-4 py-2.5 font-semibold text-foreground border-b border-border">%</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-2 text-foreground">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: colors[i % colors.length] }}
                                />
                                {row.label}
                              </div>
                            </td>
                            <td className="text-right px-4 py-2 font-mono text-foreground">{row.count}</td>
                            {row.percentage !== undefined && (
                              <td className="text-right px-4 py-2 font-mono text-muted-foreground">{row.percentage}%</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/60 rounded-lg px-4 py-3 text-center border border-border/50">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold text-foreground truncate" title={String(value)}>
        {value}
      </div>
    </div>
  );
}
