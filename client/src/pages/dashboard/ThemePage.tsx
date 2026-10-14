import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Survey } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import api from '../../lib/api';
import { ArrowUpRight, Layers3, Layout, Palette, Sparkles, Type } from 'lucide-react';

type ThemeDraft = {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  layout: string;
};

const curatedPalettes = [
  {
    id: 'ethereal-indigo',
    name: 'Ethereal Indigo',
    description: 'Crisp indigo and frosted pearlescent glass matching our flagship design.',
    swatches: ['#4f46e5', '#818cf8', '#f6f8fc'],
    values: { primaryColor: '#4f46e5', backgroundColor: '#f6f8fc', fontFamily: 'Manrope' },
  },
  {
    id: 'orchid-violet',
    name: 'Orchid Violet',
    description: 'Radiant cosmic violet with luminous light-tech surfaces.',
    swatches: ['#7c3aed', '#c084fc', '#faf5ff'],
    values: { primaryColor: '#7c3aed', backgroundColor: '#faf5ff', fontFamily: 'Inter' },
  },
  {
    id: 'oceanic-cyan',
    name: 'Oceanic Ice',
    description: 'Electric cyan accent with crystalline glass styling.',
    swatches: ['#0284c7', '#38bdf8', '#f0f9ff'],
    values: { primaryColor: '#0284c7', backgroundColor: '#f0f9ff', fontFamily: 'Manrope' },
  },
  {
    id: 'emerald-mint',
    name: 'Emerald Mint',
    description: 'High-clarity mint green accent with clean editorial white.',
    swatches: ['#059669', '#34d399', '#f0fdf4'],
    values: { primaryColor: '#059669', backgroundColor: '#f0fdf4', fontFamily: 'Manrope' },
  },
  {
    id: 'obsidian-slate',
    name: 'Obsidian Slate',
    description: 'Minimalist luxury monochrome with stark typography.',
    swatches: ['#09090b', '#64748b', '#f8fafc'],
    values: { primaryColor: '#09090b', backgroundColor: '#f8fafc', fontFamily: 'Inter' },
  },
];

export const ThemePage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [theme, setTheme] = useState<ThemeDraft>({
    primaryColor: '#4f46e5',
    backgroundColor: '#f6f8fc',
    fontFamily: 'Manrope',
    layout: 'single_page'
  });
  const [selectedPalette, setSelectedPalette] = useState('ethereal-indigo');

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await api.get(`/surveys/${surveyId}`);
        const s = res.data.survey;
        setSurvey(s);
        if (s.theme) {
          setTheme({
            primaryColor: s.theme.primaryColor || s.theme.lightPrimaryColor || '#4f46e5',
            backgroundColor: s.theme.backgroundColor || s.theme.lightBackgroundColor || '#f6f8fc',
            fontFamily: s.theme.fontFamily || 'Manrope',
            layout: s.theme.layout || 'single_page'
          });
        }
      } catch {
        addToast('Failed to load theme settings', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvey();
  }, [surveyId, navigate, addToast]);

  const handleSave = async () => {
    if (!survey) return;
    setIsSaving(true);
    try {
      const themeToSave = {
        primaryColor: theme.primaryColor,
        backgroundColor: theme.backgroundColor,
        lightPrimaryColor: theme.primaryColor,
        lightBackgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        layout: theme.layout,
      };
      const res = await api.put(`/surveys/${survey._id}`, { theme: themeToSave });
      setSurvey(res.data.survey);
      addToast('Theme saved successfully', 'success');
    } catch {
      addToast('Failed to save theme', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const applyPalette = (palette: typeof curatedPalettes[number]) => {
    setTheme({ ...theme, ...palette.values });
    setSelectedPalette(palette.id);
  };

  if (isLoading || !survey) {
    return <AppShell><div className="flex h-full items-center justify-center py-20"><Spinner size="lg" /></div></AppShell>;
  }

  return (
    <AppShell survey={survey}>
      <div className="flex h-full gap-8">
        {/* Editor Controls */}
        <div className="w-96 shrink-0 space-y-6 overflow-y-auto pb-8 pr-2">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 shadow-xs">
              <Sparkles className="h-3 w-3" />
              Theme & Styling
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Visual Direction</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Customize the accent colors, typography, and page layout. Live preview updates instantly.
            </p>
          </div>

          <Card className="rounded-3xl border-slate-200/80 bg-white/80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-extrabold text-slate-900">
                <Layers3 className="mr-2 h-4 w-4 text-indigo-600" /> Curated Palettes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 pt-0">
              {curatedPalettes.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => applyPalette(palette)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                    selectedPalette === palette.id
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200/80 bg-white/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {palette.swatches.map((swatch) => (
                        <span key={swatch} className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: swatch }} />
                      ))}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{palette.name}</span>
                  </div>
                  <span className="block text-[11px] leading-relaxed text-slate-500">{palette.description}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 bg-white/80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-extrabold text-slate-900">
                <Palette className="w-4 h-4 mr-2 text-indigo-600" /> Color Accent & Surfaces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Primary Accent Color</label>
                <div className="flex gap-2.5">
                  <Input 
                    type="color" 
                    value={theme.primaryColor} 
                    onChange={(e) => {
                      setTheme({ ...theme, primaryColor: e.target.value });
                      setSelectedPalette('');
                    }} 
                    className="w-12 h-11 p-1 cursor-pointer rounded-xl"
                  />
                  <Input 
                    type="text" 
                    value={theme.primaryColor} 
                    onChange={(e) => {
                      setTheme({ ...theme, primaryColor: e.target.value });
                      setSelectedPalette('');
                    }}
                    className="uppercase font-mono text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Page Background Color</label>
                <div className="flex gap-2.5">
                  <Input 
                    type="color" 
                    value={theme.backgroundColor} 
                    onChange={(e) => {
                      setTheme({ ...theme, backgroundColor: e.target.value });
                      setSelectedPalette('');
                    }} 
                    className="w-12 h-11 p-1 cursor-pointer rounded-xl"
                  />
                  <Input 
                    type="text" 
                    value={theme.backgroundColor} 
                    onChange={(e) => {
                      setTheme({ ...theme, backgroundColor: e.target.value });
                      setSelectedPalette('');
                    }}
                    className="uppercase font-mono text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 bg-white/80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-extrabold text-slate-900">
                <Type className="w-4 h-4 mr-2 text-indigo-600" /> Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Select 
                label="Font Family"
                value={theme.fontFamily}
                onChange={(e) => setTheme({...theme, fontFamily: e.target.value})}
                options={[
                  { label: 'Manrope (Modern & Clean)', value: 'Manrope' },
                  { label: 'Inter (High Legibility)', value: 'Inter' },
                  { label: 'Roboto (Geometric)', value: 'Roboto' },
                  { label: 'Merriweather (Editorial Serif)', value: 'Merriweather' },
                  { label: 'DM Mono (Technical)', value: 'DM Mono' },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 bg-white/80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-extrabold text-slate-900">
                <Layout className="w-4 h-4 mr-2 text-indigo-600" /> Survey Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Select 
                label="Question Presentation"
                value={theme.layout}
                onChange={(e) => setTheme({...theme, layout: e.target.value})}
                options={[
                  { label: 'Single Page (Seamless Flow)', value: 'single_page' },
                  { label: 'Step by Step (One Question at a Time)', value: 'one_at_a_time' },
                ]}
              />
            </CardContent>
          </Card>

          <Button onClick={handleSave} isLoading={isSaving} size="lg" className="w-full rounded-full">
            Save Theme Settings
          </Button>
        </div>

        {/* Live Preview Pane */}
        <div 
          className="public-survey-shell hidden flex-1 overflow-y-auto rounded-3xl border border-slate-200/80 p-6 lg:block lg:p-8 backdrop-blur-xl transition-all duration-300"
          style={{
            fontFamily: theme.fontFamily,
            ['--survey-primary' as any]: theme.primaryColor,
            ['--survey-bg' as any]: theme.backgroundColor,
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--survey-primary)' }}>Respondent Preview</span>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">Live simulation of the respondent experience</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-xs">
              {theme.layout === 'single_page' ? 'Single Page' : 'Step-by-Step'}
            </span>
          </div>

          <div className="public-survey-card mx-auto max-w-2xl rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-300">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/70 pb-4">
              <div>
                <span className="public-survey-badge mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <span>✦</span> Survey Preview
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{survey.title}</h1>
              </div>
              <span className="text-xs font-bold text-slate-400">1 of 3</span>
            </div>

            <p className="mb-6 text-xs text-slate-500 leading-relaxed">
              {survey.description || 'Survey description and respondent guidance will appear here.'}
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                <span className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--survey-primary)' }}>Question 1</span>
                <h3 className="text-base font-extrabold text-slate-900 mb-3">
                  {survey.questions[0]?.title || 'How would you rate our new interface?'}
                </h3>
                <div className="space-y-2">
                  {['Very Satisfied', 'Satisfied', 'Neutral'].map((opt, i) => (
                    <div 
                      key={opt} 
                      className={`public-survey-option flex items-center justify-between rounded-xl border p-3 text-xs font-semibold transition-all ${
                        i === 0 
                          ? 'is-selected text-slate-900' 
                          : 'border-slate-200/80 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span 
                          className={`mr-2.5 flex h-4 w-4 items-center justify-center rounded-full ${
                            i === 0 ? 'text-white' : 'border border-slate-300'
                          }`}
                          style={i === 0 ? { backgroundColor: 'var(--survey-primary)' } : undefined}
                        >
                          {i === 0 && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        {opt}
                      </div>
                      <ArrowUpRight className="h-3 w-3" style={i === 0 ? { color: 'var(--survey-primary)' } : { color: '#94a3b8' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                type="button"
                className="public-survey-btn-primary px-6 py-2.5 text-xs font-bold"
              >
                Continue
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
