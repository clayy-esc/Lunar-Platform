import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Survey, LogicRule, SurveyTheme } from '../../types';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2 } from 'lucide-react';

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

  useEffect(() => {
    if (survey?.title) {
      document.title = `${survey.title} - Lunar`;
    }
    return () => {
      document.title = 'Lunar';
    };
  }, [survey?.title]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  const evaluateRule = (rule: LogicRule, answer: any): boolean => {
    if (answer === undefined || answer === null || answer === '') return false;

    const valStr = String(rule.value ?? '').trim().toLowerCase();

    if (Array.isArray(answer)) {
      if (answer.length === 0) return false;
      const lowerAnswers = answer.map((a) => String(a ?? '').trim().toLowerCase());
      switch (rule.condition) {
        case 'equals':
          return lowerAnswers.includes(valStr);
        case 'not_equals':
          return !lowerAnswers.includes(valStr);
        case 'contains':
          return lowerAnswers.some((a) => a.includes(valStr));
        default:
          return false;
      }
    }

    const ansStr = String(answer ?? '').trim().toLowerCase();

    switch (rule.condition) {
      case 'equals':
        return ansStr === valStr;
      case 'not_equals':
        return ansStr !== valStr;
      case 'contains':
        return ansStr.includes(valStr);
      case 'greater_than': {
        const numAns = Number(answer);
        const numVal = Number(rule.value);
        return !isNaN(numAns) && !isNaN(numVal) && numAns > numVal;
      }
      case 'less_than': {
        const numAns = Number(answer);
        const numVal = Number(rule.value);
        return !isNaN(numAns) && !isNaN(numVal) && numAns < numVal;
      }
      default:
        return false;
    }
  };

  const getVisibleQuestions = (
    questions: Survey['questions'],
    logicRules: LogicRule[],
    currentAnswers: Record<string, any>
  ): Survey['questions'] => {
    if (!questions || questions.length === 0) return [];
    
    const visible: Survey['questions'] = [];
    const visited = new Set<string>();
    let currentIdx = 0;

    while (currentIdx < questions.length) {
      const q = questions[currentIdx];
      if (visited.has(q.id)) break;
      visited.add(q.id);
      visible.push(q);

      const answer = currentAnswers[q.id];
      const isAnswered =
        answer !== undefined &&
        answer !== null &&
        answer !== '' &&
        (!Array.isArray(answer) || answer.length > 0);

      // Check if this question has matching logic rule
      const rules = logicRules?.filter((r) => r.sourceQuestionId === q.id) || [];
      let nextTarget: string | null = null;

      if (isAnswered) {
        for (const rule of rules) {
          if (evaluateRule(rule, answer)) {
            nextTarget = rule.targetQuestionId;
            break;
          }
        }
      }

      if (nextTarget === 'end') {
        // Jumped to end: stop adding downstream questions
        break;
      } else if (nextTarget) {
        const targetIndex = questions.findIndex((item) => item.id === nextTarget);
        if (targetIndex > currentIdx) {
          currentIdx = targetIndex;
          continue;
        }
      }

      currentIdx += 1;
    }

    return visible;
  };

  const isSinglePage = survey?.theme?.layout !== 'one_at_a_time';

  const visibleQuestions = useMemo(() => {
    if (!survey?.questions) return [];
    if (!isSinglePage) return survey.questions;
    return getVisibleQuestions(survey.questions, survey.logic || [], answers);
  }, [survey?.questions, survey?.logic, isSinglePage, answers]);

  const getNextQuestionIndex = (currentIndex: number): number | 'end' => {
    if (!survey) return 'end';

    const currentQ = survey.questions[currentIndex];
    if (!currentQ) return 'end';

    const rulesForQuestion = survey.logic?.filter((r) => r.sourceQuestionId === currentQ.id) || [];
    const answer = answers[currentQ.id];

    for (const rule of rulesForQuestion) {
      const match = evaluateRule(rule, answer);
      if (match) {
        if (rule.targetQuestionId === 'end') return 'end';
        const targetIndex = survey.questions.findIndex((q) => q.id === rule.targetQuestionId);
        return targetIndex !== -1 ? targetIndex : 'end';
      }
    }

    if (currentIndex + 1 < survey.questions.length) return currentIndex + 1;
    return 'end';
  };

  const handleSubmit = async () => {
    if (isSinglePage) {
      const missingRequired = visibleQuestions.find((question) => {
        const answer = answers[question.id];
        return (
          question.required &&
          (answer === undefined ||
            answer === null ||
            answer === '' ||
            (Array.isArray(answer) && answer.length === 0))
        );
      });

      if (missingRequired) {
        setValidationError(`Please answer required question: "${missingRequired.title}" before submitting.`);
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
      const activeQuestionIds = new Set((isSinglePage ? visibleQuestions : survey.questions).map((q) => q.id));
      const formattedAnswers = Object.entries(answers)
        .filter(([questionId]) => activeQuestionIds.has(questionId))
        .map(([questionId, value]) => ({ questionId, value }));

      await api.post(`/public/survey/${slug}/submit`, { answers: formattedAnswers });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!isAnswerValid) {
      setValidationError('Please answer this required question before continuing.');
      return;
    }

    setValidationError(null);
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

  useEffect(() => {
    const question = survey?.questions[currentQuestionIndex];
    const answer = question ? answers[question.id] : undefined;
    const answerIsValid = !question?.required
      || (answer !== undefined && answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0));

    if (isSinglePage || isSubmitted || !survey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && answerIsValid && !isSubmitting) {
        event.preventDefault();
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // handleNext intentionally uses the latest answer state from this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentQuestionIndex, isSinglePage, isSubmitting, isSubmitted, survey]);

  if (isLoading) {
    return (
      <div className="public-survey-loading public-survey-shell flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#dce3f2] border-t-[#4169b2]" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="public-survey-shell flex min-h-screen flex-col items-center justify-center p-4">
        <div className="public-survey-card public-survey-state-card w-full max-w-[620px] p-8 text-center sm:p-12">
          <img src="/favicon.png" alt="Lunar owl" className="mx-auto mb-5 h-20 w-20 object-contain drop-shadow-md" />
          <h2 className="mb-2 text-2xl font-extrabold text-[#14214a]">
            {error === "This survey is currently closed." ? "This survey isn't accepting responses." : 'Survey unavailable'}
          </h2>
          <p className="text-sm leading-relaxed text-[#5d6985]">
            {error === "This survey is currently closed." ? 'The survey owner has closed this survey for now.' : error}
          </p>
          <p className="mt-8 text-xs font-semibold text-[#98a2b8]">Powered by Lunar</p>
        </div>
      </div>
    );
  }

  const configuredTheme: SurveyTheme = survey.theme || {
    primaryColor: '#4169b2',
    backgroundColor: '#fff9f0',
    fontFamily: 'Plus Jakarta Sans',
    layout: 'single_page',
    customCSS: '',
  };

  const primaryColor = configuredTheme.primaryColor || configuredTheme.lightPrimaryColor || '#4169b2';
  const backgroundColor = configuredTheme.backgroundColor || configuredTheme.lightBackgroundColor || '#fff9f0';
  const fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";
  const currentQ = survey.questions[currentQuestionIndex];
  const isLastQuestion = getNextQuestionIndex(currentQuestionIndex) === 'end';
  const answeredCount = visibleQuestions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;
  const progress = isSinglePage
    ? (visibleQuestions.length > 0 ? (answeredCount / visibleQuestions.length) * 100 : 100)
    : ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const progressLabel = isSinglePage
    ? `${answeredCount} of ${visibleQuestions.length} answered`
    : `Question ${currentQuestionIndex + 1} of ${survey.questions.length}`;

  const isShortDesc = (survey.description || '').trim().length < 120;
  const descAlign = configuredTheme.descriptionAlignment || (isShortDesc ? 'left' : 'justify');

  const themeStyle: React.CSSProperties = {
    fontFamily,
    ['--survey-primary' as any]: primaryColor,
    ['--survey-bg' as any]: backgroundColor,
    ['--description-align' as any]: descAlign,
  };

  // Validation for multi-step
  const currentAnswer = answers[currentQ?.id];
  const isAnswerValid = currentQ?.required 
    ? (currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '' && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true))
    : true;

  const renderQuestionInputs = (question: Survey['questions'][number]) => {
    const isSingleChoice = ['single_choice', 'multiple_choice', 'yes_no'].includes(question.type);
    const isMultiChoice = ['multi_choice', 'checkboxes'].includes(question.type);
    const isShortText = ['short_text', 'short_answer', 'number', 'date'].includes(question.type);
    const isLongText = ['long_text', 'long_answer'].includes(question.type);
    const isLinearOrNps = ['linear_scale', 'nps'].includes(question.type);
    const isDropdown = question.type === 'dropdown';
    const isRating = question.type === 'rating';

    // Normalize options
    let rawOptions = question.options || [];
    if (question.type === 'yes_no' || question.displayType === 'yes_no') {
      const yesLabel = question.yesNo?.yesLabel || 'Yes';
      const noLabel = question.yesNo?.noLabel || 'No';
      rawOptions = [{ id: 'opt_yes', label: yesLabel }, { id: 'opt_no', label: noLabel }];
      if (question.yesNo?.allowNA) {
        rawOptions.push({ id: 'opt_na', label: question.yesNo?.naLabel || 'N/A' });
      }
    }

    const placeholderText = question.placeholder || question.config?.placeholder || (isLongText ? "Share your detailed response..." : "Type your response here...");

    return (
      <div className="public-survey-answer mt-6">
        {isShortText && (
          <input
            type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
            placeholder={placeholderText}
            maxLength={question.maxLength}
            className="public-survey-input h-14 w-full rounded-2xl px-5 text-base sm:text-lg text-slate-900 shadow-xs focus:outline-none"
          />
        )}

        {isLongText && (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
            placeholder={placeholderText}
            maxLength={question.maxLength}
            rows={4}
            className="public-survey-input min-h-36 w-full resize-y rounded-2xl p-5 text-base text-slate-900 shadow-xs focus:outline-none"
          />
        )}

        {(isSingleChoice || isMultiChoice) && (
          <div className="space-y-3">
            {rawOptions.map((opt, i) => {
              const optLabel = typeof opt === 'string' ? opt : (opt?.label ?? '');
              const optId = typeof opt === 'string' ? `opt_${i}` : (opt?.id ?? `opt_${i}`);
              const isSelected = isMultiChoice
                ? (answers[question.id] || []).includes(optLabel)
                : answers[question.id] === optLabel;

              return (
                <label
                  key={optId}
                  className={`public-survey-option group flex cursor-pointer items-center justify-between rounded-2xl p-4 sm:p-5 transition-all ${
                    isSelected ? 'is-selected' : 'border-slate-200/80 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center min-w-0 pr-4">
                    <div
                      className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center transition-all ${
                        isMultiChoice ? 'rounded-xl' : 'rounded-full'
                      } ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'border border-slate-300 bg-white'
                      }`}
                      style={isSelected ? { backgroundColor: 'var(--survey-primary)' } : undefined}
                    >
                      {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                    </div>
                    <span className={`text-base leading-snug ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                      {optLabel}
                    </span>
                  </div>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                      isSelected ? 'opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-slate-100'
                    }`}
                    style={isSelected ? {
                      backgroundColor: 'color-mix(in srgb, var(--survey-primary) 14%, transparent)',
                      color: 'var(--survey-primary)'
                    } : undefined}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type={isMultiChoice ? "checkbox" : "radio"}
                    name={question.id}
                    value={optLabel}
                    className="sr-only"
                    checked={isSelected}
                    onChange={(e) => {
                      if (isMultiChoice) {
                        const curr = answers[question.id] || [];
                        if (e.target.checked) setAnswers({...answers, [question.id]: [...curr, optLabel]});
                        else setAnswers({...answers, [question.id]: curr.filter((val: string) => val !== optLabel)});
                      } else {
                        setAnswers({...answers, [question.id]: optLabel});
                      }
                    }}
                  />
                </label>
              );
            })}

            {question.allowOther && (
              <div className="pt-1">
                <label
                  className={`public-survey-option group flex cursor-pointer flex-col gap-2 rounded-2xl p-4 sm:p-5 transition-all ${
                    (isMultiChoice ? (answers[question.id] || []).some((v: string) => v.startsWith('Other: ')) : String(answers[question.id] || '').startsWith('Other: '))
                      ? 'is-selected'
                      : 'border-slate-200/80 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <div
                      className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center transition-all ${
                        isMultiChoice ? 'rounded-xl' : 'rounded-full'
                      } ${
                        (isMultiChoice ? (answers[question.id] || []).some((v: string) => v.startsWith('Other: ')) : String(answers[question.id] || '').startsWith('Other: '))
                          ? 'text-white shadow-xs'
                          : 'border border-slate-300 bg-white'
                      }`}
                      style={(isMultiChoice ? (answers[question.id] || []).some((v: string) => v.startsWith('Other: ')) : String(answers[question.id] || '').startsWith('Other: ')) ? { backgroundColor: 'var(--survey-primary)' } : undefined}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <span className="text-base font-semibold text-slate-800">Other</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Please specify..."
                    value={
                      isMultiChoice
                        ? ((answers[question.id] || []).find((v: string) => v.startsWith('Other: ')) || '').replace('Other: ', '')
                        : (String(answers[question.id] || '').startsWith('Other: ') ? String(answers[question.id]).replace('Other: ', '') : '')
                    }
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const otherVal = e.target.value ? `Other: ${e.target.value}` : 'Other: ';
                      if (isMultiChoice) {
                        const curr = (answers[question.id] || []).filter((v: string) => !v.startsWith('Other: '));
                        setAnswers({...answers, [question.id]: [...curr, otherVal]});
                      } else {
                        setAnswers({...answers, [question.id]: otherVal});
                      }
                    }}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {isDropdown && (
          <select
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
            className="public-survey-input h-14 w-full rounded-2xl px-5 text-base text-slate-900 shadow-xs focus:outline-none"
          >
            <option value="" disabled>Select an option from list</option>
            {rawOptions.map((opt, i) => {
              const optLabel = typeof opt === 'string' ? opt : (opt?.label ?? '');
              const optId = typeof opt === 'string' ? `opt_${i}` : (opt?.id ?? `opt_${i}`);
              return <option key={optId} value={optLabel}>{optLabel}</option>;
            })}
          </select>
        )}

        {isLinearOrNps && (
          <div className="py-2">
            <div className="mb-4 flex justify-between px-2 text-[13px] font-semibold text-slate-500">
              <span>{question.nps?.minLabel || question.config?.minLabel || 'Not likely'}</span>
              <span>{question.nps?.maxLabel || question.config?.maxLabel || 'Extremely likely'}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {Array.from(
                { length: question.type === 'nps' || question.displayType === 'nps' ? 11 : ((question.config?.max || 5) - (question.config?.min || 1) + 1) },
                (_, i) => (question.type === 'nps' || question.displayType === 'nps' ? i : i + (question.config?.min || 1))
              ).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAnswers({...answers, [question.id]: val})}
                  className={`public-survey-scale h-11 w-11 sm:h-12 sm:w-12 rounded-2xl text-base sm:text-lg font-extrabold transition-all ${
                    answers[question.id] === val
                      ? 'is-selected'
                      : 'text-slate-800'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRating && (
          <div className="py-2">
            <div className="flex flex-wrap items-center gap-3">
              {Array.from({ length: question.rating?.max || question.config?.max || 5 }, (_, i) => i + 1).map(val => {
                const style = question.rating?.style || 'star';
                const isSelected = (answers[question.id] || 0) >= val;
                const isExact = answers[question.id] === val;

                if (style === 'number') {
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswers({...answers, [question.id]: val})}
                      className={`h-12 w-12 rounded-2xl text-lg font-extrabold transition-all border ${
                        isExact
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                      style={isExact ? { backgroundColor: 'var(--survey-primary)', borderColor: 'var(--survey-primary)' } : undefined}
                    >
                      {val}
                    </button>
                  );
                }

                if (style === 'emoji') {
                  const emojis = ['😠', '🙁', '😐', '😊', '😍', '🤩', '🥳', '🙌', '🔥', '💯'];
                  const emojiChar = emojis[Math.min(val - 1, emojis.length - 1)];
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswers({...answers, [question.id]: val})}
                      className={`text-3xl sm:text-4xl p-2 rounded-2xl transition-all hover:scale-125 ${
                        isExact ? 'scale-125 bg-blue-50' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {emojiChar}
                    </button>
                  );
                }

                // Default: Star
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswers({...answers, [question.id]: val})}
                    className="group rounded-2xl p-2 transition-all hover:scale-110 focus:outline-none"
                    aria-label={`${val} star`}
                  >
                    <svg
                      className="h-10 w-10 sm:h-12 sm:w-12 transition-colors"
                      fill={isSelected ? 'var(--survey-primary)' : '#f1f5f9'}
                      stroke={isSelected ? 'var(--survey-primary)' : '#cbd5e1'}
                      viewBox="0 0 24 24" strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                );
              })}
            </div>
            {(question.rating?.minLabel || question.rating?.maxLabel || question.config?.minLabel || question.config?.maxLabel) && (
              <div className="mt-2 flex justify-between px-2 text-xs font-semibold text-slate-500">
                <span>{question.rating?.minLabel || question.config?.minLabel || ''}</span>
                <span>{question.rating?.maxLabel || question.config?.maxLabel || ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <div className="public-survey-shell flex min-h-screen items-center justify-center p-4 sm:p-6" style={themeStyle}>
        {configuredTheme.customCSS && <style>{configuredTheme.customCSS}</style>}
        <div className="public-survey-card public-survey-state-card w-full max-w-[620px] p-8 text-center sm:p-12">
          <img src="/favicon.png" alt="Lunar owl waving" className="mx-auto mb-5 h-20 w-20 object-contain drop-shadow-md" />
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl shadow-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--survey-primary) 12%, white)',
              borderColor: 'color-mix(in srgb, var(--survey-primary) 25%, transparent)',
              color: 'var(--survey-primary)',
              borderWidth: 1,
            }}
          >
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="public-survey-badge mb-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold">
            <span>✓</span> Response completed
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#14214a]">Thanks for your response</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5d6985]">
            {survey.settings?.thankYouMessage || 'Your response has been securely saved.'}
          </p>
          {isPreview && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-semibold text-amber-800">
              Preview Mode: Response was simulated and not saved to database.
            </div>
          )}
          <p className="mt-8 text-xs font-semibold text-[#98a2b8]">Powered by Lunar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-survey-shell flex min-h-screen flex-col overflow-y-auto" style={themeStyle}>
      {configuredTheme.customCSS && <style>{configuredTheme.customCSS}</style>}

      <div className="flex flex-1 flex-col items-center p-4 pt-10 pb-12 sm:p-6 sm:pt-12 sm:pb-16 lg:p-8 lg:pt-14 lg:pb-16 justify-start">
        <div className={`w-full max-w-[620px] ${isSinglePage ? '' : 'my-auto'}`}>
          {/* Brand Row */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.png" alt="Lunar mascot" className="h-9 w-9 object-contain drop-shadow-sm" />
              <span className="text-[16px] font-bold tracking-tight text-[#14214a]">Lunar</span>
            </div>
            <span className="public-survey-secure-badge"><span aria-hidden="true">✓</span> Secure response</span>
          </div>
          
          {/* Title and Description Block */}
          <div className="mb-6">
            <h1 className="text-[28px] sm:text-[32px] md:text-[40px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#14214a] mb-4 [text-wrap:balance]">
              {survey.title}
            </h1>
            {survey.description && (
              <p lang="en" className="survey-description">
                {survey.description}
              </p>
            )}
          </div>

          {/* Progress Tracker */}
          {survey.settings?.showProgressBar !== false && (
            <div className="mb-8 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce3f2] bg-white px-3 py-1 text-[13px] font-semibold text-[#3b62c4] shadow-xs">
                  {progressLabel}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-full overflow-hidden rounded-full bg-[#e3e8f6]"
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%`, backgroundColor: 'var(--survey-primary, #3b62c4)' }}
                />
              </div>
            </div>
          )}

          {isSinglePage ? (
            <div className="public-survey-card rounded-3xl overflow-hidden">
              <div className="space-y-12 p-6 sm:p-10 lg:p-12">
                {visibleQuestions.map((question, index) => (
                  <section key={question.id} className={index > 0 ? 'border-t border-slate-200/70 pt-10' : ''}>
                    <div className="mb-4">
                      <span className="mb-2 block text-[13px] font-semibold" style={{ color: 'var(--survey-primary)' }}>
                        Question {index + 1}
                      </span>
                      <h2 className="text-xl font-extrabold leading-snug text-[#172342] sm:text-2xl">
                        {question.title}
                        {question.required && <span className="ml-1" style={{ color: 'var(--survey-primary)' }}>*</span>}
                      </h2>
                      {question.description && (
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{question.description}</p>
                      )}
                    </div>
                    {renderQuestionInputs(question)}
                  </section>
                ))}
              </div>
              <div className="flex items-center justify-end border-t border-[#e4e9f3] bg-[#f8faff] px-6 py-5 sm:px-10">
                <div className="flex items-center gap-4">
                  {validationError && <p role="alert" className="text-xs font-bold text-[#d9534f]">{validationError}</p>}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="public-survey-btn-primary px-8 py-3.5 text-sm"
                  >
                    Submit response
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="public-survey-card rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="mb-4">
                  <div className="public-survey-badge mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold">
                    Step {currentQuestionIndex + 1}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    {currentQ.title}
                    {currentQ.required && <span className="ml-1" style={{ color: 'var(--survey-primary)' }}>*</span>}
                  </h2>
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
                  Back
                </Button>
                
                <button 
                  onClick={handleNext} 
                  disabled={isSubmitting}
                  className="public-survey-btn-primary px-8 py-3.5 text-sm"
                >
                  {isLastQuestion ? 'Submit response' : 'Next'}
                  {isLastQuestion ? <Check className="ml-2 h-4 w-4" /> : <ArrowUpRight className="ml-2 h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center pb-8 opacity-60 hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>✦</span> Powered by <strong className="text-slate-700">Lunar</strong>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
