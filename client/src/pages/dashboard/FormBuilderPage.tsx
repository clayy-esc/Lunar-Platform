import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  CircleDot,
  Copy,
  GripVertical,
  ListFilter,
  MoreHorizontal,
  Plus,
  Radio,
  Star,
  Trash2,
  Type,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/ui/Spinner';
import { Switch } from '../../components/ui/Switch';
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown';
import { Survey, Question, QuestionType, OptionItem } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { nanoid } from 'nanoid';
import api from '../../lib/api';
import { normalizeQuestion, createDefaultQuestion } from '../../components/builder/builderUtils';
import { QuestionEditor } from '../../components/builder/QuestionEditor';
import { QuestionPreview } from '../../components/builder/QuestionPreview';

const questionTypes: { type: QuestionType; label: string; icon: React.ElementType; displayType?: string }[] = [
  { type: 'single_choice', label: 'Multiple choice', icon: CircleDot },
  { type: 'multi_choice', label: 'Checkboxes', icon: CheckSquare },
  { type: 'short_text', label: 'Short answer', icon: Type },
  { type: 'long_text', label: 'Long answer', icon: AlignLeft },
  { type: 'rating', label: 'Rating scale', icon: Star },
  { type: 'dropdown', label: 'Dropdown', icon: ListFilter },
  { type: 'single_choice', label: 'Yes/No', icon: Radio, displayType: 'yes_no' },
  { type: 'linear_scale', label: 'Net promoter score', icon: Star, displayType: 'nps' },
];

const getQuestionType = (type: QuestionType, displayType?: string) => {
  if (displayType === 'yes_no') return questionTypes.find((item) => item.displayType === 'yes_no');
  if (displayType === 'nps') return questionTypes.find((item) => item.displayType === 'nps');
  return questionTypes.find((item) => item.type === type) || questionTypes[0];
};

export const FormBuilderPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const recentlyDeletedRef = useRef<{ question: Question; index: number } | null>(null);

  useEffect(() => {
    api
      .get(`/surveys/${surveyId}`)
      .then((res) => {
        const rawSurvey = res.data.survey;
        const normalizedQuestions = (rawSurvey.questions || []).map((q: any, i: number) =>
          normalizeQuestion(q, i)
        );
        setSurvey({ ...rawSurvey, questions: normalizedQuestions });
      })
      .catch(() => {
        addToast('Failed to load survey', 'error');
        navigate('/dashboard');
      })
      .finally(() => setIsLoading(false));
  }, [addToast, navigate, surveyId]);

  const selectedQuestion = survey?.questions[selectedIndex];

  // The single updateQuestion action that updates immutably and marks dirty
  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setSurvey((current) => {
      if (!current) return current;
      const questions = current.questions.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...patch };
        if (patch.placeholder !== undefined || patch.rating !== undefined || patch.nps !== undefined) {
          updated.config = {
            ...updated.config,
            placeholder: updated.placeholder ?? updated.config?.placeholder,
            min: updated.nps ? 0 : updated.rating ? 1 : updated.config?.min,
            max: updated.rating?.max ?? (updated.nps ? 10 : updated.config?.max),
            minLabel: updated.nps?.minLabel ?? updated.rating?.minLabel ?? updated.config?.minLabel,
            maxLabel: updated.nps?.maxLabel ?? updated.rating?.maxLabel ?? updated.config?.maxLabel,
          };
        }
        return updated;
      });
      return { ...current, questions };
    });
    setIsDirty(true);
    setSaveState('idle');
  };

  const updateSurvey = (changes: Partial<Survey>) => {
    setSurvey((current) => (current ? { ...current, ...changes } : current));
    setIsDirty(true);
    setSaveState('idle');
  };

  const addQuestion = (type: QuestionType, displayType?: string) => {
    if (!survey) return;
    const newQ = createDefaultQuestion(type, displayType, survey.questions.length);
    updateSurvey({ questions: [...survey.questions, newQ] });
    setSelectedIndex(survey.questions.length);
  };

  const removeQuestion = (index: number) => {
    if (!survey) return;
    const questionToRemove = survey.questions[index];
    recentlyDeletedRef.current = { question: questionToRemove, index };

    const questions = survey.questions.filter((_, itemIndex) => itemIndex !== index);
    updateSurvey({ questions });
    setSelectedIndex(Math.max(0, Math.min(index, questions.length - 1)));

    addToast(`Deleted "${questionToRemove.title || 'Question'}"`, 'info', {
      label: 'Undo',
      onClick: () => {
        if (recentlyDeletedRef.current) {
          const { question, index: restoreIdx } = recentlyDeletedRef.current;
          setSurvey((curr) => {
            if (!curr) return curr;
            const restored = [...curr.questions];
            restored.splice(restoreIdx, 0, question);
            return { ...curr, questions: restored };
          });
          setIsDirty(true);
          setSelectedIndex(restoreIdx);
          addToast('Question restored', 'success');
        }
      },
    });
  };

  const duplicateQuestion = (index: number) => {
    if (!survey) return;
    const src = survey.questions[index];
    const newOptions: OptionItem[] = (src.options || []).map((opt) => ({
      id: nanoid(8),
      label: typeof opt === 'string' ? opt : opt.label,
    }));

    const copy: Question = {
      ...src,
      id: nanoid(8),
      title: `${src.title || 'Untitled question'} (Copy)`,
      options: newOptions,
      order: index + 1,
    };

    const questions = [...survey.questions];
    questions.splice(index + 1, 0, copy);
    updateSurvey({
      questions: questions.map((q, i) => ({ ...q, order: i })),
    });
    setSelectedIndex(index + 1);
    addToast('Question duplicated', 'success');
  };

  const moveQuestion = (from: number, to: number) => {
    if (!survey || from === to || to < 0 || to >= survey.questions.length) return;
    const questions = [...survey.questions];
    const [item] = questions.splice(from, 1);
    questions.splice(to, 0, item);
    updateSurvey({
      questions: questions.map((q, index) => ({ ...q, order: index })),
    });
    setSelectedIndex(to);
  };

  const changeQuestionType = (id: string, newType: QuestionType) => {
    if (!survey) return;
    const currentQ = survey.questions.find((q) => q.id === id);
    if (!currentQ) return;

    const isCurrentChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(
      currentQ.type
    );
    const isNewChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(newType);

    if (isCurrentChoice && !isNewChoice && currentQ.options && currentQ.options.length > 0) {
      const confirmSwitch = window.confirm('Switching type will remove your answer options. Continue?');
      if (!confirmSwitch) return;
    }

    const patch: Partial<Question> = {
      type: newType,
      displayType: undefined,
    };

    if (!isNewChoice) {
      patch.options = [];
    } else if (currentQ.options.length === 0) {
      patch.options = [
        { id: nanoid(8), label: 'Option 1' },
        { id: nanoid(8), label: 'Option 2' },
      ];
    }

    if (newType === 'rating') {
      patch.rating = {
        max: 5,
        style: 'star',
        minLabel: 'Not satisfied',
        maxLabel: 'Very satisfied',
      };
    } else if (newType === 'linear_scale' || newType === 'nps') {
      patch.nps = {
        minLabel: 'Not likely',
        maxLabel: 'Extremely likely',
      };
    } else if (newType === 'short_text' || newType === 'short_answer') {
      patch.placeholder = 'Type your answer';
    } else if (newType === 'long_text' || newType === 'long_answer') {
      patch.placeholder = 'Type your answer here...';
    }

    updateQuestion(id, patch);
  };

  const saveDraft = useCallback(async () => {
    if (!survey || !isDirty) return;
    setSaveState('saving');
    try {
      await api.put(`/surveys/${survey._id}`, {
        title: survey.title,
        description: survey.description,
        questions: survey.questions,
        logic: survey.logic,
        theme: survey.theme,
        settings: survey.settings,
      });
      setIsDirty(false);
      setSaveState('saved');
      setSavedAt(new Date());
    } catch (error: any) {
      setSaveState('error');
      addToast(error.response?.data?.error || 'Failed to save draft', 'error');
    }
  }, [survey, isDirty, addToast]);

  useEffect(() => {
    if (!isDirty || !survey || isLoading) return;
    const timer = window.setTimeout(() => {
      void saveDraft();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isDirty, survey, isLoading, saveDraft]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveDraft();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  const publish = async () => {
    if (!survey) return;

    // Strict validation on Publish
    const problems: { msg: string; qIndex?: number }[] = [];

    if (!survey.title.trim()) {
      problems.push({ msg: 'Survey title cannot be empty.' });
    }

    if (survey.questions.length === 0) {
      problems.push({ msg: 'Add at least one question.' });
    }

    survey.questions.forEach((q, idx) => {
      if (!q.title.trim()) {
        problems.push({ msg: `Question ${idx + 1} must have a title.`, qIndex: idx });
      }

      const isChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(q.type);
      if (isChoice && (!q.displayType || q.displayType !== 'yes_no')) {
        const opts = q.options || [];
        if (opts.length < 2) {
          problems.push({ msg: `Question ${idx + 1} must have at least 2 options.`, qIndex: idx });
        }
        const hasEmpty = opts.some((o) => (typeof o === 'string' ? o : o.label).trim() === '');
        if (hasEmpty) {
          problems.push({ msg: `Question ${idx + 1} has an empty option label.`, qIndex: idx });
        }
        const labels = opts.map((o) => (typeof o === 'string' ? o : o.label).trim().toLowerCase());
        const hasDuplicates = new Set(labels).size !== labels.length;
        if (hasDuplicates) {
          problems.push({ msg: `Question ${idx + 1} contains duplicate option labels.`, qIndex: idx });
        }
      }
    });

    if (problems.length > 0) {
      addToast(problems[0].msg, 'error');
      if (typeof problems[0].qIndex === 'number') {
        setSelectedIndex(problems[0].qIndex);
        const el = document.getElementById(`question-card-${survey.questions[problems[0].qIndex].id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsPublishing(true);
    try {
      if (isDirty) await saveDraft();
      const res = await api.post(`/surveys/${survey._id}/publish`);
      setSurvey(res.data.survey);
      setIsDirty(false);
      addToast('Survey published successfully!', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to publish survey', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublish = async () => {
    if (!survey || !window.confirm('Unpublish this survey? Respondents will no longer be able to answer it.')) return;
    setIsUnpublishing(true);
    try {
      const res = await api.post(`/surveys/${survey._id}/unpublish`);
      setSurvey(res.data.survey);
      addToast('Survey unpublished', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to unpublish survey', 'error');
    } finally {
      setIsUnpublishing(false);
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

  return (
    <AppShell
      survey={survey}
      onPublish={publish}
      isPublishing={isPublishing}
      onUnpublish={unpublish}
      isUnpublishing={isUnpublishing}
      isDirty={isDirty}
      saveState={saveState}
      savedAt={savedAt}
      onTitleChange={(title) => updateSurvey({ title })}
      onSaveDraft={saveDraft}
    >
      <div className="builder-page">
        <div className="builder-columns">
          {/* Add Question Palette (Left sidebar) */}
          <aside className="builder-add-panel">
            <h2>Add question</h2>
            <p>Choose a question type to add it to your survey.</p>
            <div className="builder-type-list">
              {questionTypes.map(({ type, label, icon: Icon, displayType }) => (
                <button key={label} type="button" onClick={() => addQuestion(type, displayType)}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </aside>

          {/* Canvas (Center) */}
          <main className="builder-canvas">
            <div className="builder-survey-intro">
              <textarea
                aria-label="Survey description"
                value={survey.description}
                onChange={(event) => updateSurvey({ description: event.target.value })}
                placeholder="Add a short description for respondents"
              />
            </div>

            {survey.questions.map((question, index) => {
              const isSelected = index === selectedIndex;
              const meta = getQuestionType(question.type, question.displayType);
              const Icon = meta?.icon || Type;

              return (
                <article
                  key={question.id}
                  id={`question-card-${question.id}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null) moveQuestion(draggedIndex, index);
                    setDraggedIndex(null);
                  }}
                  onClick={() => setSelectedIndex(index)}
                  className={`builder-question-card ${isSelected ? 'is-selected ring-2 ring-blue-500' : ''}`}
                >
                  <div className="builder-question-top">
                    <button
                      type="button"
                      className="builder-drag-handle"
                      aria-label={`Reorder question ${index + 1}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <span className="builder-number">{index + 1}</span>

                    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center">
                        <input
                          value={question.title}
                          onChange={(event) => updateQuestion(question.id, { title: event.target.value })}
                          placeholder="Type your question title here..."
                          aria-label={`Question ${index + 1} title`}
                          className="w-full border-0 bg-transparent text-[16px] font-extrabold text-[#14214a] outline-none placeholder:text-slate-400 focus:ring-0"
                        />
                        {question.required && (
                          <span className="text-red-500 font-extrabold ml-1 text-sm select-none" title="Required question">
                            *
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <input
                          value={question.description || ''}
                          onChange={(event) => updateQuestion(question.id, { description: event.target.value })}
                          placeholder="Add a description or instructions (optional)"
                          aria-label={`Question ${index + 1} description`}
                          className="w-full mt-1 border-0 bg-transparent text-xs text-slate-500 outline-none placeholder:text-slate-400 focus:ring-0"
                        />
                      )}
                    </div>

                    <span className="builder-type-pill shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                      {meta?.label || 'Question'}
                    </span>

                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          aria-label={`Actions for question ${index + 1}`}
                          className="builder-more"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      }
                    >
                      <DropdownItem onClick={() => duplicateQuestion(index)}>
                        <Copy className="mr-2 inline h-4 w-4" />
                        Duplicate
                      </DropdownItem>
                      {index > 0 && (
                        <DropdownItem onClick={() => moveQuestion(index, index - 1)}>
                          <ArrowUp className="mr-2 inline h-4 w-4" />
                          Move up
                        </DropdownItem>
                      )}
                      {index < survey.questions.length - 1 && (
                        <DropdownItem onClick={() => moveQuestion(index, index + 1)}>
                          <ArrowDown className="mr-2 inline h-4 w-4" />
                          Move down
                        </DropdownItem>
                      )}
                      <DropdownItem destructive onClick={() => removeQuestion(index)}>
                        <Trash2 className="mr-2 inline h-4 w-4" />
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>

                  {/* Render QuestionEditor when card is selected, QuestionPreview when unselected */}
                  {isSelected ? (
                    <QuestionEditor
                      question={question}
                      onUpdate={(patch) => updateQuestion(question.id, patch)}
                    />
                  ) : (
                    <QuestionPreview question={question} />
                  )}
                </article>
              );
            })}

            <button
              type="button"
              className="builder-dropzone"
              onClick={() => addQuestion('single_choice')}
            >
              <Plus className="h-5 w-5" />
              Add question
            </button>
          </main>

          {/* Settings Panel (Right sidebar) */}
          <aside className="builder-settings-panel">
            <h2>Question settings</h2>
            {selectedQuestion ? (
              <>
                <label className="builder-setting-label">
                  Question type
                  <select
                    value={selectedQuestion.displayType || selectedQuestion.type}
                    onChange={(event) => changeQuestionType(selectedQuestion.id, event.target.value as QuestionType)}
                  >
                    {questionTypes.map((item) => (
                      <option key={item.label} value={item.displayType || item.type}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <Switch
                  label="Required"
                  description="Respondents must answer"
                  checked={selectedQuestion.required}
                  onChange={(event) => updateQuestion(selectedQuestion.id, { required: event.target.checked })}
                />

                {['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(
                  selectedQuestion.type
                ) &&
                  selectedQuestion.displayType !== 'yes_no' && (
                    <>
                      <Switch
                        label="Shuffle options"
                        description="Show options in a different order"
                        checked={Boolean(selectedQuestion.shuffle || selectedQuestion.config?.shuffle)}
                        onChange={(event) =>
                          updateQuestion(selectedQuestion.id, {
                            shuffle: event.target.checked,
                            config: { ...selectedQuestion.config, shuffle: event.target.checked },
                          })
                        }
                      />
                      <Switch
                        label='Allow "Other"'
                        description="Let respondents type an unlisted answer"
                        checked={Boolean(selectedQuestion.allowOther)}
                        onChange={(event) => updateQuestion(selectedQuestion.id, { allowOther: event.target.checked })}
                      />
                    </>
                  )}

                <button
                  type="button"
                  className="builder-delete-button"
                  onClick={() => removeQuestion(selectedIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete question
                </button>
              </>
            ) : (
              <p className="text-sm text-[#6b7699]">Select a question to edit its settings.</p>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
};
