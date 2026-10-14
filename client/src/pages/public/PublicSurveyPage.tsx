import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Survey, LogicRule, SurveyTheme } from '../../types';
import api from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Sparkles } from 'lucide-react';

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
      <div className="public-survey-loading flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="public-survey-shell flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/90 bg-white/85 p-8 text-center shadow-xl backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <span>!</span>
          </div>
          <h2 className="mb-2 text-xl font-extrabold text-slate-900">Survey Unavailable</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const configuredTheme: SurveyTheme = survey.theme || {
    primaryColor: '#4f46e5',
    backgroundColor: '#f6f8fc',
    fontFamily: 'Manrope',
    layout: 'single_page',
    customCSS: '',
  };

  const primaryColor = configuredTheme.lightPrimaryColor || configuredTheme.primaryColor || '#4f46e5';
  const fontFamily = configuredTheme.fontFamily || 'Manrope';
  const currentQ = survey.questions[currentQuestionIndex];
  const isSinglePage = configuredTheme.layout === 'single_page';
  const isLastQuestion = getNextQuestionIndex(currentQuestionIndex) === 'end';
  const progress = isSinglePage ? 100 : ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const progressLabel = isSinglePage ? `${survey.questions.length} questions` : `Question ${currentQuestionIndex + 1} of ${survey.questions.length}`;

  // Validation for multi-step
  const currentAnswer = answers[currentQ?.id];
  const isAnswerValid = currentQ?.required 
    ? (currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '' && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true))
    : true;

  const renderQuestionInputs = (question: Survey['questions'][number]) => (
    <div className="public-survey-answer mt-6">
      {['short_text', 'number', 'date'].includes(question.type) && (
        <input
          type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
          value={answers[question.id] || ''}
          onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
          placeholder="Type your response here..."
          className="public-survey-input h-14 w-full rounded-2xl px-5 text-base sm:text-lg text-slate-900 shadow-xs focus:outline-none"
        />
      )}

      {question.type === 'long_text' && (
        <textarea
          value={answers[question.id] || ''}
          onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
          placeholder="Share your detailed response..."
          rows={4}
          className="public-survey-input min-h-36 w-full resize-y rounded-2xl p-5 text-base text-slate-900 shadow-xs focus:outline-none"
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
                className={`public-survey-option group flex cursor-pointer items-center justify-between rounded-2xl p-4 sm:p-5 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/15'
                    : 'border-slate-200/80 bg-white/70 hover:bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center min-w-0 pr-4">
                  <div
                    className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center transition-all ${
                      isMulti ? 'rounded-xl' : 'rounded-full'
                    } ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-300 bg-white group-hover:border-indigo-400'
                    }`}
                  >
                    {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </div>
                  <span className={`text-base leading-snug ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                    {opt}
                  </span>
                </div>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                  isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-slate-100'
                }`}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
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
          className="public-survey-input h-14 w-full rounded-2xl px-5 text-base text-slate-900 shadow-xs focus:outline-none"
        >
          <option value="" disabled>Select an option from list</option>
          {question.options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {question.type === 'linear_scale' && (
        <div className="py-2">
          <div className="mb-4 flex justify-between px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>{question.config?.minLabel || 'Min'}</span>
            <span>{question.config?.maxLabel || 'Max'}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {Array.from({ length: (question.config?.max || 5) - (question.config?.min || 1) + 1 }, (_, i) => i + (question.config?.min || 1)).map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setAnswers({...answers, [question.id]: val})}
                className={`public-survey-scale h-13 w-13 rounded-2xl text-lg font-extrabold transition-all sm:h-14 sm:w-14 ${
                  answers[question.id] === val
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105'
                    : 'text-slate-800 hover:border-indigo-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {question.type === 'rating' && (
        <div className="flex flex-wrap items-center gap-3 py-2">
          {Array.from({ length: question.config?.max || 5 }, (_, i) => i + 1).map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setAnswers({...answers, [question.id]: val})}
              className="group rounded-2xl p-2.5 transition-all hover:scale-110 focus:outline-none"
            >
              <svg
                className="h-10 w-10 sm:h-12 sm:w-12 transition-colors"
                fill={(answers[question.id] || 0) >= val ? primaryColor : '#f1f5f9'}
                stroke={(answers[question.id] || 0) >= val ? primaryColor : '#cbd5e1'}
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
      <div className="public-survey-shell flex min-h-screen items-center justify-center p-4 sm:p-6" style={{ fontFamily }}>
        <div className="public-survey-card w-full max-w-lg rounded-3xl p-8 sm:p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-md shadow-indigo-600/10">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span>✓</span> Response Completed
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Thank you!</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Your response has been securely verified and saved.</p>
          {isPreview && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-semibold text-amber-800">
              Preview Mode: Response was simulated and not saved to database.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`public-survey-shell flex flex-col ${isSinglePage || isPreview ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'}`} style={{ fontFamily }}>
      {/* Top Progress Tracker */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-slate-200/50">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className={`flex flex-1 flex-col items-center p-4 pt-12 sm:p-6 sm:pt-14 lg:p-8 lg:pt-16 ${isSinglePage || isPreview ? 'justify-start' : 'min-h-0 justify-center'}`}>
        <div className="w-full max-w-3xl">
          
          {/* Header Banner */}
          <div className="mb-8 flex items-end justify-between gap-6 pb-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 shadow-xs">
                <Sparkles className="h-3 w-3" />
                Live Survey
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {survey.title}
              </h1>
              {survey.description && (
                <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-500">{survey.description}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-xs">
                {progressLabel}
              </span>
            </div>
          </div>

          {isSinglePage ? (
            <div className="public-survey-card rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-10 lg:p-12 space-y-12">
                {survey.questions.map((question, index) => (
                  <section key={question.id} className={index > 0 ? 'border-t border-slate-200/70 pt-10' : ''}>
                    <div className="mb-4">
                      <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                        Question {index + 1}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                        {question.title}
                        {question.required && <span className="ml-1 text-indigo-600">*</span>}
                      </h3>
                      {question.description && (
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{question.description}</p>
                      )}
                    </div>
                    {renderQuestionInputs(question)}
                  </section>
                ))}
              </div>
              <div className="flex items-center justify-end border-t border-slate-200/70 bg-slate-50/60 px-6 py-5 sm:px-10">
                <div className="flex items-center gap-4">
                  {validationError && <p className="text-xs font-bold text-rose-600">{validationError}</p>}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn-flagship px-8 py-3.5 text-sm"
                  >
                    Submit Response
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="public-survey-card rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="mb-4">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Step {currentQuestionIndex + 1}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    {currentQ.title}
                    {currentQ.required && <span className="ml-1 text-indigo-600">*</span>}
                  </h3>
                  {currentQ.description && (
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{currentQ.description}</p>
                  )}
                </div>

                {renderQuestionInputs(currentQ)}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/60 px-6 py-5 sm:px-10">
                <Button 
                  variant="secondary" 
                  onClick={handlePrevious} 
                  disabled={history.length === 0 || isSubmitting}
                  className="rounded-full px-5 text-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <button 
                  onClick={handleNext} 
                  disabled={!isAnswerValid || isSubmitting}
                  className="btn-flagship px-8 py-3.5 text-sm"
                >
                  {isLastQuestion ? 'Submit Response' : 'Continue'}
                  {isLastQuestion ? <Check className="ml-2 h-4 w-4" /> : <ArrowUpRight className="ml-2 h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center pb-8 opacity-60 hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>✦</span> Powered by <strong className="text-slate-700">SurveyNexus</strong>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
