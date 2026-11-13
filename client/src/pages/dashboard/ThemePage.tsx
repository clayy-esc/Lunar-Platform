import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/useToast';
import api from '../../lib/api';
import { Survey } from '../../types';

type ThemeDraft = {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  layout: 'single_page' | 'one_at_a_time';
  roundness: 'sharp' | 'rounded' | 'pill';
  descriptionAlignment?: 'left' | 'right' | 'justified';
};

const palettes = [
  { id: 'lunar-navy', name: 'Lunar Navy', description: 'Clear, confident, and unmistakably Lunar.', swatches: ['#14214A', '#3B62C4', '#F4F6FD'], values: { primaryColor: '#3B62C4', backgroundColor: '#F4F6FD' } },
  { id: 'orchid-violet', name: 'Orchid Violet', description: 'A thoughtful violet for creative teams.', swatches: ['#542B9A', '#8B5CF6', '#F7F2FF'], values: { primaryColor: '#7C3AED', backgroundColor: '#FAF5FF' } },
  { id: 'oceanic-ice', name: 'Oceanic Ice', description: 'Fresh, open, and easy to read.', swatches: ['#075985', '#0284C7', '#EFF9FF'], values: { primaryColor: '#0284C7', backgroundColor: '#F0F9FF' } },
  { id: 'emerald-mint', name: 'Emerald Mint', description: 'Warm clarity with a positive signal.', swatches: ['#116149', '#1F9D6A', '#EFFBF5'], values: { primaryColor: '#1F9D6A', backgroundColor: '#F0FDF4' } },
  { id: 'custom', name: 'Custom', description: 'Make the colors your own.', swatches: ['#FFFFFF', '#3B62C4', '#F4F6FD'], values: { primaryColor: '#3B62C4', backgroundColor: '#F4F6FD' } },
] as const;

const getContrastRatio = (hex: string) => {
  const value = hex.replace('#', '');
  if (value.length !== 6) return 0;
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const luminance = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return (1.05 / (luminance + 0.05)).toFixed(2);
};

export const ThemePage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedPalette, setSelectedPalette] = useState('lunar-navy');
  const [theme, setTheme] = useState<ThemeDraft>({
    primaryColor: '#3B62C4',
    backgroundColor: '#F4F6FD',
    fontFamily: 'Open Sans',
    layout: 'single_page',
    roundness: 'rounded',
    descriptionAlignment: 'left',
  });

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await api.get(`/surveys/${surveyId}`);
        const current = res.data.survey as Survey;
        setSurvey(current);
        if (current.theme) {
          setTheme((previous) => ({
            ...previous,
            primaryColor: current.theme.primaryColor || '#3B62C4',
            backgroundColor: current.theme.backgroundColor || '#F4F6FD',
            fontFamily: current.theme.fontFamily || 'Open Sans',
            layout: current.theme.layout || 'single_page',
            roundness: current.theme.roundness || 'rounded',
            descriptionAlignment: current.theme.descriptionAlignment || 'left',
          }));
        }
      } catch {
        addToast('Failed to load theme settings', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvey();
  }, [addToast, navigate, surveyId]);

  const contrastRatio = useMemo(() => getContrastRatio(theme.primaryColor), [theme.primaryColor]);
  const contrastWarning = Number(contrastRatio) < 4.5;

  const updateTheme = (changes: Partial<ThemeDraft>) => {
    setTheme((current) => ({ ...current, ...changes }));
    if (changes.primaryColor || changes.backgroundColor) setSelectedPalette('custom');
  };

  const applyPalette = (palette: typeof palettes[number]) => {
    setSelectedPalette(palette.id);
    updateTheme(palette.values);
  };

  const resetTheme = () => {
    setSelectedPalette('lunar-navy');
    setTheme({
      primaryColor: '#3B62C4',
      backgroundColor: '#F4F6FD',
      fontFamily: 'Open Sans',
      layout: 'single_page',
      roundness: 'rounded',
      descriptionAlignment: 'left',
    });
  };

  const handleSave = async () => {
    if (!survey) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/surveys/${survey._id}`, {
        theme: {
          ...theme,
          lightPrimaryColor: theme.primaryColor,
          lightBackgroundColor: theme.backgroundColor,
          roundness: theme.roundness || 'rounded',
          descriptionAlignment: theme.descriptionAlignment || 'left',
        },
      });
      setSurvey(res.data.survey);
      addToast('Theme saved successfully', 'success');
    } catch {
      addToast('Failed to save theme', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !survey) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  const FONT_STACKS: Record<string, string> = {
    'Open Sans': "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
    'Aptos': "'Aptos', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    'Roboto': "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    'Arial': 'Arial, Helvetica, sans-serif',
    'Calibri': "'Calibri', 'Gill Sans MT', 'Gill Sans', Optima, 'Helvetica Neue', Arial, sans-serif",
    'Verdana': 'Verdana, Geneva, Tahoma, sans-serif',
    'Georgia': 'Georgia, Cambria, serif',
    'Times New Roman': "'Times New Roman', Times, Georgia, serif",
    'Plus Jakarta Sans': "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif",
    'Inter': "'Inter', 'Helvetica Neue', Arial, sans-serif",
    'system-ui': 'system-ui, sans-serif',
  };

  const previewRadius = theme.roundness === 'sharp' ? '4px' : theme.roundness === 'pill' ? '28px' : '16px';
  const previewAlign = theme.descriptionAlignment === 'right' ? 'right' : (theme.descriptionAlignment === 'justified' ? 'justify' : 'left');
  const previewAlignLast = previewAlign === 'right' ? 'right' : (previewAlign === 'justify' ? 'left' : 'auto');

  const previewStyle = {
    fontFamily: FONT_STACKS[theme.fontFamily] ?? `'${theme.fontFamily}', 'Helvetica Neue', Arial, sans-serif`,
    backgroundColor: theme.backgroundColor,
    ['--theme-accent' as string]: theme.primaryColor,
    ['--theme-radius' as string]: previewRadius,
    ['--description-align' as string]: previewAlign,
  } as React.CSSProperties;

  return (
    <AppShell survey={survey}>
      <div className="theme-page">
        <header className="theme-page-header">
          <div>
            <h1>Theme</h1>
            <p>Choose colors for your survey. The preview updates instantly.</p>
          </div>
          <div className="theme-header-actions">
            <Button variant="outline" onClick={resetTheme}>Reset to default</Button>
            <Button onClick={handleSave} isLoading={isSaving}>Save theme</Button>
          </div>
        </header>

        <div className="theme-workspace">
          <section className="theme-controls">
            <div className="theme-section">
              <h2>Color palette</h2>
              <div className="theme-palette-grid">
                {palettes.map((palette) => (
                  <button
                    type="button"
                    key={palette.id}
                    onClick={() => applyPalette(palette)}
                    className={`theme-palette-card ${selectedPalette === palette.id ? 'is-selected' : ''}`}
                  >
                    <span className="theme-swatch-row">
                      {palette.swatches.map((swatch) => (
                        <span key={swatch} style={{ backgroundColor: swatch }} />
                      ))}
                    </span>
                    <strong>{palette.name}</strong>
                    <small>{palette.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="theme-section">
              <h2>Custom colors</h2>
              <div className="theme-color-fields">
                <label>
                  Accent <input type="color" value={theme.primaryColor} onChange={(event) => updateTheme({ primaryColor: event.target.value })} />
                </label>
                <label>
                  Background <input type="color" value={theme.backgroundColor} onChange={(event) => updateTheme({ backgroundColor: event.target.value })} />
                </label>
              </div>
              {contrastWarning && (
                <p className="theme-contrast-warning" role="status">
                  This accent may not meet the 4.5:1 contrast recommendation on white. Try a darker color.
                </p>
              )}
            </div>

            <div className="theme-section">
              <h2>Font</h2>
              <div className="theme-choice-row">
                {(['Open Sans', 'Aptos', 'Roboto', 'Arial', 'Calibri', 'Verdana', 'Georgia', 'Times New Roman'] as const).map((font) => (
                  <button
                    type="button"
                    key={font}
                    onClick={() => updateTheme({ fontFamily: font })}
                    className={theme.fontFamily === font ? 'is-active' : ''}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            <div className="theme-section">
              <h2>Corner roundness</h2>
              <div className="theme-choice-row">
                {[['sharp', 'Sharp'], ['rounded', 'Rounded'], ['pill', 'Pill']].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => updateTheme({ roundness: value as ThemeDraft['roundness'] })}
                    className={theme.roundness === value ? 'is-active' : ''}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="theme-section">
              <h2>Description alignment</h2>
              <div className="theme-choice-row">
                <button
                  type="button"
                  onClick={() => updateTheme({ descriptionAlignment: 'left' })}
                  className={theme.descriptionAlignment === 'left' ? 'is-active' : ''}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme({ descriptionAlignment: 'right' })}
                  className={theme.descriptionAlignment === 'right' ? 'is-active' : ''}
                >
                  Right
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme({ descriptionAlignment: 'justified' })}
                  className={theme.descriptionAlignment === 'justified' ? 'is-active' : ''}
                >
                  Justified
                </button>
              </div>
            </div>

            <div className="theme-section">
              <h2>Layout</h2>
              <div className="theme-choice-row">
                {[['single_page', 'Single page'], ['one_at_a_time', 'One question at a time']].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => updateTheme({ layout: value as ThemeDraft['layout'] })}
                    className={theme.layout === value ? 'is-active' : ''}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="theme-preview-panel">
            <div className="theme-preview-toolbar">
              <div>
                <h2>Live preview</h2>
                <p>Respondent view</p>
              </div>
              <div className="theme-device-toggle">
                <button
                  type="button"
                  className={previewMode === 'desktop' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={previewMode === 'mobile' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className={`theme-preview-canvas ${previewMode}`} style={previewStyle}>
              <div className="theme-preview-survey" style={{ borderRadius: previewRadius }}>
                <div className="theme-preview-brand">
                  <img src="/favicon.png" alt="Lunar" />
                  <strong>Lunar</strong>
                  <span>✓ Secure response</span>
                </div>
                <div className="theme-preview-intro mb-2">
                  <h4 className="text-xs font-bold text-[#14214a] leading-tight mb-1 text-left">{survey.title || 'Survey Title'}</h4>
                  <p
                    className="text-[11px] text-[#5a6585] leading-relaxed"
                    style={{
                      textAlign: previewAlign,
                      textAlignLast: previewAlignLast,
                      textJustify: 'inter-word',
                      hyphens: 'auto',
                    }}
                  >
                    {survey.description || 'Thank you for taking the time to participate in our survey. Your feedback is valuable to us.'}
                  </p>
                </div>
                <div className="theme-preview-progress">
                  <span style={{ width: '42%', backgroundColor: theme.primaryColor }} />
                </div>
                <small style={{ color: theme.primaryColor }}>Question 1 of {Math.max(survey.questions.length, 1)}</small>
                <h3>{survey.questions[0]?.title || 'How did you hear about us?'}</h3>
                <div className="theme-preview-option is-selected" style={{ borderColor: theme.primaryColor, backgroundColor: `${theme.primaryColor}14` }}>
                  Very satisfied <span style={{ backgroundColor: theme.primaryColor }}>✓</span>
                </div>
                <div className="theme-preview-option">Satisfied <span>○</span></div>
                <button type="button" className="theme-preview-next">Next</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};
