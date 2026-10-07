import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Survey, LogicRule, SurveyTheme } from '../../types';
import api from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';

export const PublicSurveyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        let endpoint = `/public/survey/${slug}`;
        if (isPreview) {
          const id = slug?.replace('preview-', '');
          endpoint = `/surveys/${id}`;
        }

        const res = await api.get(endpoint, { params: { themeVersion: Date.now() } });
        const fetchedSurvey = res.data.survey;

        if (!isPreview && fetchedSurvey.status && fetchedSurvey.status !== 'published') {
          setError('This survey is currently closed.');
        } else {
          setSurvey(fetchedSurvey);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Survey not found or is no longer available.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvey();
  }, [slug, isPreview]);

  const getNextQuestionIndex = (currentIndex: number): number | 'end' => {
    if (!survey) return 'end';

    const currentQ = survey.questions[currentIndex];
    if (!currentQ) return 'end';

    const rulesForQuestion = survey.logic?.filter(r => r.sourceQuestionId === currentQ.id) || [];
    const answer = answers[currentQ.id];

    for (const rule of rulesForQuestion) {
      const match = evaluateRule(rule, answer);
      if (match) {
        if (rule.targetQuestionId === 'end') return 'end';
        const targetIndex = survey.questions.findIndex(q => q.id === rule.targetQuestionId);
        return targetIndex !== -1 ? targetIndex : 'end';
      }
    }

    if (currentIndex + 1 < survey.questions.length) return currentIndex + 1;
    return 'end';
  };

  const evaluateRule = (rule: LogicRule, answer: any): boolean => {
    if (answer === undefined || answer === null) return false;

    const ansStr = String(answer).toLowerCase();
    const valStr = String(rule.value).toLowerCase();

    switch (rule.condition) {
      case 'equals': return ansStr === valStr;
      case 'not_equals': return ansStr !== valStr;
      case 'contains': return ansStr.includes(valStr);
      case 'greater_than': return Number(answer) > Number(rule.value);
      case 'less_than': return Number(answer) < Number(rule.value);
      default: return false;
    }
  };

  const handleNext = () => {
    const nextIdx = getNextQuestionIndex(currentQuestionIndex);
    if (nextIdx === 'end') {
      handleSubmit();
    } else {
      setHistory([...history, currentQuestionIndex]);
      setCurrentQuestionIndex(nextIdx);
    }
  };

  const handlePrevious = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const prevIdx = newHistory.pop()!;
      setHistory(newHistory);
      setCurrentQuestionIndex(prevIdx);
    }
  };

  const handleSubmit = async () => {
    const isSinglePage = survey?.theme?.layout === 'single_page';
    if (isSinglePage) {
      const missingRequired = survey?.questions.find((question) => {
        const answer = answers[question.id];
        return question.required && (answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0));
      });

      if (missingRequired) {
        setValidationError('Please answer all required questions before submitting.');
        return;
      }
    }

    setValidationError(null);
    if (isPreview) {
      setIsSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      await api.post(`/public/survey/${slug}/submit`, { answers: formattedAnswers });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="public-survey-loading flex min-h-screen items-center justify-center" style={{ backgroundColor: '#faf9ff' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: '#e5ddf4', borderTopColor: '#5120a4' }} />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ backgroundColor: '#faf9ff' }}>
        <div className="w-full max-w-md rounded-2xl border p-8 text-center shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5ddf4' }}>
          <h2 className="mb-2 text-xl font-bold" style={{ color: '#171329' }}>Survey unavailable</h2>
          <p style={{ color: '#665c83' }}>{error}</p>
        </div>
      </div>
    );
  }

  const configuredTheme: SurveyTheme = survey.theme || {
    primaryColor: '#5120a4',
    backgroundColor: '#faf9ff',
    fontFamily: 'Manrope',
    layout: 'single_page',
    customCSS: '',
  };
  const isDarkTheme = configuredTheme.mode === 'dark';
  const theme = {
    ...configuredTheme,
    primaryColor: isDarkTheme
      ? configuredTheme.darkPrimaryColor || '#a78bfa'
      : configuredTheme.lightPrimaryColor || configuredTheme.primaryColor,
    backgroundColor: isDarkTheme
      ? configuredTheme.darkBackgroundColor || '#09090b'
      : configuredTheme.lightBackgroundColor || configuredTheme.backgroundColor,
  };

  // Premium Glassmorphism Palette
  const surfaceColor = isDarkTheme ? 'rgba(24, 24, 27, 0.65)' : 'rgba(255, 255, 255, 0.85)';
  const backdropBlur = 'blur(24px)';
  const textColor = isDarkTheme ? '#f4f4f5' : '#18181b';
  const mutedTextColor = isDarkTheme ? '#a1a1aa' : '#71717a';
  const controlBorderColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const inputBgColor = isDarkTheme ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.6)';
  const footerBgColor = isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(244, 244, 245, 0.4)';
  const scaleDefaultBg = isDarkTheme ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
  const cardShadow = isDarkTheme ? '0 24px 48px -12px rgba(0, 0, 0, 0.5)' : '0 24px 48px -12px rgba(0, 0, 0, 0.05)';

  const currentQ = survey.questions[currentQuestionIndex];
  const isSinglePage = theme.layout === 'single_page';
  const isLastQuestion = getNextQuestionIndex(currentQuestionIndex) === 'end';
  const progress = isSinglePage ? 100 : ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const progressLabel = isSinglePage ? `${survey.questions.length} questions` : `${currentQuestionIndex + 1} of ${survey.questions.length}`;

  // Validation
  const currentAnswer = answers[currentQ?.id];
  const isAnswerValid = currentQ?.required 
    ? (currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '' && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true))
    : true;

  const renderQuestionInputs = (question: Survey['questions'][number]) => (
    <div className="public-survey-answer mt-8">
      {['short_text', 'number', 'date'].includes(question.type) && (
        <input
          type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
          value={answers[question.id] || ''}
          onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
          placeholder="Enter your answer"
          className="public-survey-input w-full border-b-2 bg-transparent py-3 px-0 text-xl focus:border-b-2 focus:outline-none transition-colors"
          style={{ '--tw-ring-color': theme.primaryColor, color: textColor, borderBottomColor: answers[question.id] ? theme.primaryColor : controlBorderColor } as any}
        />
      )}

      {question.type === 'long_text' && (
        <textarea
          value={answers[question.id] || ''}
          onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
          placeholder="Enter your answer"
          className="public-survey-input min-h-37.5 w-full resize-y rounded-2xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all shadow-inner"
          style={{ '--tw-ring-color': theme.primaryColor, color: textColor, backgroundColor: inputBgColor, border: `1px solid ${controlBorderColor}` } as any}
        />
      )}

      {(question.type === 'single_choice' || question.type === 'multi_choice') && (
        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const isMulti = question.type === 'multi_choice';
            const isSelected = isMulti
              ? (answers[question.id] || []).includes(opt)
              : answers[question.id] === opt;

            return (
              <label
                key={i}
                className="public-survey-option group flex cursor-pointer items-center rounded-2xl border p-4 transition-all hover:shadow-md"
                style={{ backgroundColor: isSelected ? `${theme.primaryColor}1a` : inputBgColor, borderColor: isSelected ? theme.primaryColor : controlBorderColor }}
              >
                <div
                  className={`w-6 h-6 mr-4 flex items-center justify-center transition-colors ${isMulti ? 'rounded-md' : 'rounded-full'}`}
                  style={{
                    border: `2px solid ${isSelected ? theme.primaryColor : controlBorderColor}`,
                    backgroundColor: isSelected ? theme.primaryColor : 'transparent'
                  }}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
                <span className={`text-base ${isSelected ? 'font-bold' : 'font-medium'}`} style={{ color: textColor }}>{opt}</span>
                <span className="ml-auto text-xs font-bold opacity-0 transition-opacity group-hover:opacity-60" style={{ color: theme.primaryColor }}>Select</span>
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={question.id}
                  value={opt}
                  className="sr-only"
                  checked={isSelected}
                  onChange={(e) => {
                    if (isMulti) {
                      const curr = answers[question.id] || [];
                      if (e.target.checked) setAnswers({...answers, [question.id]: [...curr, opt]});
                      else setAnswers({...answers, [question.id]: curr.filter((val: string) => val !== opt)});
                    } else {
                      setAnswers({...answers, [question.id]: opt});
                    }
                  }}
                />
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'dropdown' && (
        <select
          value={answers[question.id] || ''}
          onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
          className="public-survey-input w-full appearance-none rounded-2xl p-4 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-inner"
          style={{ '--tw-ring-color': theme.primaryColor, color: textColor, backgroundColor: inputBgColor, border: `1px solid ${controlBorderColor}` } as any}
        >
          <option value="" disabled>Select an option</option>
          {question.options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {question.type === 'linear_scale' && (
        <div className="py-4">
          <div className="flex justify-between text-sm font-medium mb-6 px-2" style={{ color: mutedTextColor }}>
            <span>{question.config?.minLabel || 'Min'}</span>
            <span>{question.config?.maxLabel || 'Max'}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            {Array.from({ length: (question.config?.max || 5) - (question.config?.min || 1) + 1 }, (_, i) => i + (question.config?.min || 1)).map(val => (
              <button
                key={val}
                onClick={() => setAnswers({...answers, [question.id]: val})}
                className="public-survey-scale h-12 w-12 rounded-2xl text-lg font-bold transition-all transform hover:-translate-y-1 hover:shadow-lg focus:outline-none sm:h-14 sm:w-14"
                style={{ backgroundColor: answers[question.id] === val ? theme.primaryColor : scaleDefaultBg, border: `1px solid ${controlBorderColor}`, color: answers[question.id] === val ? '#ffffff' : textColor, transform: answers[question.id] === val ? 'scale(1.1)' : undefined }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {question.type === 'rating' && (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: question.config?.max || 5 }, (_, i) => i + 1).map(val => (
            <button
              key={val}
              onClick={() => setAnswers({...answers, [question.id]: val})}
              className="rounded-2xl p-2 transition-transform transform hover:-translate-y-1 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': theme.primaryColor } as any}
            >
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 transition-colors"
                fill={(answers[question.id] || 0) >= val ? theme.primaryColor : 'none'}
                stroke={(answers[question.id] || 0) >= val ? theme.primaryColor : controlBorderColor}
                viewBox="0 0 24 24" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily, color: textColor }}>
        <div className="max-w-lg w-full p-10 rounded-2xl shadow-xl text-center border-t-8 animate-in zoom-in-95 fade-in duration-700 ease-out fill-mode-forwards" style={{ backgroundColor: surfaceColor, backdropFilter: backdropBlur, WebkitBackdropFilter: backdropBlur, borderTopColor: theme.primaryColor, boxShadow: cardShadow }}>
          <CheckCircle2 className="w-16 h-16 mx-auto mb-6 animate-in zoom-in-50 spin-in-12 fade-in delay-200 duration-500 ease-out fill-mode-both" style={{ color: theme.primaryColor }} />
          <h2 className="text-2xl font-bold mb-2 animate-in slide-in-from-bottom-4 fade-in delay-300 duration-500 ease-out fill-mode-both" style={{ color: textColor }}>Thank you!</h2>
          <p className="animate-in slide-in-from-bottom-2 fade-in delay-[400ms] duration-500 ease-out fill-mode-both" style={{ color: mutedTextColor }}>Your response has been recorded.</p>
          {isPreview && (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 animate-in fade-in delay-[500ms] duration-500 fill-mode-both">
              Note: You are in Preview Mode. This submission was not saved to the database.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`public-survey-shell flex flex-col transition-colors duration-500 ${isSinglePage || isPreview ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'}`} style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily, color: textColor }}>
      {/* Progress Bar */}
      <div className="public-survey-progress fixed top-0 left-0 right-0 z-50 h-1.5" style={{ backgroundColor: `${theme.primaryColor}22` }}>
        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }} />
      </div>

      <div className={`public-survey-content flex flex-1 flex-col items-center p-4 pt-12 sm:p-6 sm:pt-14 lg:p-8 lg:pt-16 ${isSinglePage || isPreview ? 'justify-start' : 'min-h-0 justify-center'}`}>
        <div className="w-full max-w-3xl">
          <div className="mb-10 flex items-end justify-between gap-6 border-b pb-6" style={{ borderColor: controlBorderColor }}>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ color: textColor }}>{survey.title}</h1>
              {survey.description && (
                <p className="mt-3 max-w-2xl text-base leading-7 whitespace-pre-wrap" style={{ color: mutedTextColor }}>{survey.description}</p>
              )}
            </div>
            <p className="shrink-0 text-sm font-semibold" style={{ color: theme.primaryColor }}>{progressLabel}</p>
          </div>

          {isSinglePage ? (
            <div className="public-survey-card overflow-hidden rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ backgroundColor: surfaceColor, backdropFilter: backdropBlur, WebkitBackdropFilter: backdropBlur, border: `1px solid ${controlBorderColor}`, boxShadow: cardShadow }}>
              <div className="p-6 sm:p-10 lg:p-12">
                {survey.questions.map((question, index) => (
                  <section key={question.id} className={index > 0 ? 'mt-12 border-t pt-10' : ''} style={index > 0 ? { borderColor: controlBorderColor } : undefined}>
                    <div className="mb-8">
                      <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: textColor }}>
                        {question.title}
                        {question.required && <span className="ml-1" style={{ color: theme.primaryColor }}>*</span>}
                      </h3>
                      {question.description && (
                        <p className="mt-2" style={{ color: mutedTextColor }}>{question.description}</p>
                      )}
                    </div>
                    {renderQuestionInputs(question)}
                  </section>
                ))}
              </div>
              <div className="public-survey-footer flex items-center justify-end border-t px-6 py-5 sm:px-10" style={{ backgroundColor: footerBgColor, borderColor: controlBorderColor }}>
                <div className="flex items-center gap-4">
                  {validationError && <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>{validationError}</p>}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="rounded-xl px-6 py-2.5 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-90"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Submit
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
          <div className="public-survey-card overflow-hidden rounded-2xl animate-in fade-in slide-in-from-right-8 duration-500" style={{ backgroundColor: surfaceColor, backdropFilter: backdropBlur, WebkitBackdropFilter: backdropBlur, border: `1px solid ${controlBorderColor}`, boxShadow: cardShadow }}>
            <div className="p-6 sm:p-10 lg:p-12">
              
              <div className="mb-8">
                <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: textColor }}>
                  {currentQ.title}
                  {currentQ.required && <span className="ml-1" style={{ color: theme.primaryColor }}>*</span>}
                </h3>
                {currentQ.description && (
                  <p className="mt-2" style={{ color: mutedTextColor }}>{currentQ.description}</p>
                )}
              </div>

              {/* Question Inputs */}
              {renderQuestionInputs(currentQ)}

            </div>
            
            {/* Action Footer */}
            <div className="public-survey-footer flex items-center justify-between border-t px-6 py-5 sm:px-10" style={{ backgroundColor: footerBgColor, borderColor: controlBorderColor }}>
              <Button 
                variant="ghost" 
                onClick={handlePrevious} 
                disabled={history.length === 0 || isSubmitting}
                className="rounded-xl px-3 hover:opacity-80"
                style={{ color: mutedTextColor }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                onClick={handleNext} 
                disabled={!isAnswerValid || isSubmitting}
                isLoading={isSubmitting}
                className="rounded-xl px-6 py-2.5 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isLastQuestion ? 'Submit' : 'Next'}
                {isLastQuestion ? <Check className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
          )}
          
          <div className="mt-8 text-center pb-8 opacity-50 hover:opacity-100 transition-opacity">
            <a href="https://surveynexus.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-semibold" style={{ color: mutedTextColor }}>
              Powered by <img src="/favicon.svg" className="w-4 h-4 ml-1.5 mr-1" alt="SurveyNexus" /> <span className="tracking-tight">SurveyNexus</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
