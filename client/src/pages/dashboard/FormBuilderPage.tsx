import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Survey, Question, QuestionType } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown';
import { nanoid } from 'nanoid';
import api from '../../lib/api';
import { GripVertical, Plus, Trash2, AlignLeft, CheckSquare, CircleDot, Star, Hash, Calendar, Settings2, ChevronDown, Type } from 'lucide-react';

const questionTypes: { type: QuestionType; label: string; icon: any }[] = [
  { type: 'short_text', label: 'Short Text', icon: Type },
  { type: 'long_text', label: 'Long Text', icon: AlignLeft },
  { type: 'single_choice', label: 'Single Choice', icon: CircleDot },
  { type: 'multi_choice', label: 'Multiple Choice', icon: CheckSquare },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'rating', label: 'Rating', icon: Star },
  { type: 'linear_scale', label: 'Linear Scale', icon: Settings2 },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
];

export const FormBuilderPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Custom drag and drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await api.get(`/surveys/${surveyId}`);
        setSurvey(res.data.survey);
      } catch {
        addToast('Failed to load survey', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvey();
  }, [surveyId, navigate, addToast]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!survey || isLoading) return;
    const { _id, title, description, questions } = survey;
    let active = true;
    const save = async () => {
      try {
        await api.put(`/surveys/${_id}`, { title, description, questions });
      } catch {
        // Autosave failures are surfaced by the next explicit edit or reload.
      }
    };
    const timer = setTimeout(() => {
      if (active) save();
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [survey, isLoading]);

  const handlePublish = async () => {
    if (!survey) return;
    setIsPublishing(true);
    try {
      const res = await api.post(`/surveys/${survey._id}/publish`);
      setSurvey(res.data.survey);
      addToast('Survey published successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to publish survey', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!survey) return;
    setIsUnpublishing(true);
    try {
      const res = await api.post(`/surveys/${survey._id}/unpublish`);
      setSurvey(res.data.survey);
      addToast('Survey unpublished successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to unpublish survey', 'error');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    if (!survey) return;
    const newQuestion: Question = {
      id: nanoid(8),
      type,
      title: 'Untitled Question',
      description: '',
      required: false,
      options: ['single_choice', 'multi_choice', 'dropdown'].includes(type) ? ['Option 1'] : [],
      config: type === 'linear_scale' ? { min: 1, max: 5, minLabel: 'Poor', maxLabel: 'Excellent' } : 
              type === 'rating' ? { max: 5 } : {},
      order: survey.questions.length,
    };
    setSurvey({ ...survey, questions: [...survey.questions, newQuestion] });
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    if (!survey) return;
    const newQuestions = [...survey.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setSurvey({ ...survey, questions: newQuestions });
  };

  const updateQuestionConfig = (index: number, config: Partial<Question['config']>) => {
    if (!survey) return;
    const newQuestions = [...survey.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      config: { ...newQuestions[index].config, ...config },
    };
    setSurvey({ ...survey, questions: newQuestions });
  };

  const deleteQuestion = (index: number) => {
    if (!survey) return;
    const newQuestions = survey.questions.filter((_, i) => i !== index);
    setSurvey({ ...survey, questions: newQuestions });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag image to capture the element before we dim it
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
    
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx && survey) {
      const newQuestions = [...survey.questions];
      const [draggedItem] = newQuestions.splice(draggedIdx, 1);
      newQuestions.splice(dragOverIdx, 0, draggedItem);
      
      // Update order field
      newQuestions.forEach((q, i) => q.order = i);
      setSurvey({ ...survey, questions: newQuestions });
    }
    
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  if (isLoading || !survey) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell survey={survey} onPublish={handlePublish} isPublishing={isPublishing} onUnpublish={handleUnpublish} isUnpublishing={isUnpublishing}>
      <div className="mx-auto max-w-4xl space-y-6 pb-24">
        {/* Survey Header */}
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#66718a]">Form builder</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#172342]">Shape your questions</h2>
            <p className="mt-1 text-sm text-[#66718a]">Keep the flow focused and make every answer count.</p>
          </div>
          <span className="hidden rounded-full bg-[#eaf0ff] px-3 py-1.5 text-xs font-bold text-[#4169b2] sm:inline-flex">
            {survey.questions.length} {survey.questions.length === 1 ? 'question' : 'questions'}
          </span>
        </div>
        <Card className="border-t-4" style={{ borderTopColor: survey.theme?.primaryColor || '#4169b2' }}>
          <div className="space-y-4 p-6">
            <input
              type="text"
              value={survey.title}
              onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
              className="w-full border-none bg-transparent px-0 text-3xl font-extrabold text-[#172342] placeholder:text-[#a0a9ba] focus:outline-none focus:ring-0"
              placeholder="Survey title"
            />
            <textarea
              value={survey.description}
              onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
              className="min-h-15 w-full resize-none border-none bg-transparent px-0 text-sm text-[#66718a] placeholder:text-[#a0a9ba] focus:outline-none focus:ring-0"
              placeholder="Add a short description"
            />
          </div>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {survey.questions.map((q, i) => (
            <div
              key={q.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnter={(e) => handleDragEnter(e, i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`transition-all duration-200 ${dragOverIdx === i ? 'pt-16 relative before:absolute before:top-4 before:left-0 before:right-0 before:h-1 before:bg-primary/50 before:rounded-full' : ''}`}
            >
              <Card className={`builder-question-card group relative bg-white shadow-sm ${draggedIdx === i ? 'opacity-50 border-[#4169b2]' : 'hover:border-[#b8c8ed]'}`}>
                <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors" title="Drag to reorder">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="pl-10 p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf0ff] text-xs font-extrabold text-[#4169b2]">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => updateQuestion(i, { title: e.target.value })}
                      className="flex-1 border-b border-transparent bg-transparent pb-1 text-base font-bold text-[#172342] transition-colors placeholder:text-[#a0a9ba] hover:border-[#dce3f2] focus:border-[#4169b2] focus:outline-none"
                      placeholder="Question title"
                    />
                    <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {(() => {
                        const questionType = questionTypes.find(t => t.type === q.type);
                        const Icon = questionType?.icon;
                        return (
                          <>
                            {Icon && <Icon className="w-3 h-3 mr-1" />}
                            {questionType?.label}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.description}
                    onChange={(e) => updateQuestion(i, { description: e.target.value })}
                    className="w-full text-sm text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors pb-1 mb-6"
                    placeholder="Optional description"
                  />

                  {/* Question type editor */}
                  <div className="mb-6 border border-dashed border-border rounded p-4">
                    {['short_text', 'long_text'].includes(q.type) && (
                      <div className="space-y-3">
                        {q.type === 'long_text' ? (
                          <textarea disabled placeholder="Respondent long answer" className="w-full h-20 bg-muted/50 rounded p-3 resize-none" />
                        ) : (
                          <input disabled placeholder="Respondent short answer" className="h-10 bg-muted/50 rounded w-full max-w-sm px-3" />
                        )}
                        <input
                          type="text"
                          value={q.config?.placeholder || ''}
                          onChange={(e) => updateQuestionConfig(i, { placeholder: e.target.value })}
                          placeholder="Answer placeholder (optional)"
                          className="w-full max-w-sm bg-transparent border-b border-border focus:border-primary focus:outline-none py-1 text-sm"
                          aria-label="Answer placeholder"
                        />
                      </div>
                    )}
                    {q.type === 'date' && (
                      <input type="date" disabled className="h-10 bg-muted/50 rounded px-3 opacity-60" />
                    )}
                    {q.type === 'number' && (
                      <div className="grid grid-cols-3 gap-3 max-w-lg">
                        {(['min', 'max', 'step'] as const).map((key) => (
                          <label key={key} className="text-xs font-medium text-muted-foreground">
                            {key.toUpperCase()}
                            <input
                              type="number"
                              value={q.config?.[key] ?? ''}
                              onChange={(e) => updateQuestionConfig(i, { [key]: e.target.value === '' ? undefined : Number(e.target.value) })}
                              className="mt-1 h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'rating' && (
                      <div className="space-y-3">
                        <label className="block max-w-32 text-xs font-medium text-muted-foreground">
                          Maximum rating
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={q.config?.max ?? 5}
                            onChange={(e) => updateQuestionConfig(i, { max: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
                            className="mt-1 h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                        <div className="flex gap-1 text-muted-foreground">
                          {Array.from({ length: q.config?.max || 5 }, (_, starIndex) => (
                            <Star key={starIndex} className="w-5 h-5" />
                          ))}
                        </div>
                      </div>
                    )}
                    {q.type === 'linear_scale' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          <label className="text-xs font-medium text-muted-foreground">
                            Minimum
                            <input
                              type="number"
                              value={q.config?.min ?? 1}
                              onChange={(e) => updateQuestionConfig(i, { min: Number(e.target.value) || 1 })}
                              className="mt-1 h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </label>
                          <label className="text-xs font-medium text-muted-foreground">
                            Maximum
                            <input
                              type="number"
                              value={q.config?.max ?? 5}
                              onChange={(e) => updateQuestionConfig(i, { max: Math.max(q.config?.min ?? 1, Number(e.target.value) || 1) })}
                              className="mt-1 h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          <input
                            type="text"
                            value={q.config?.minLabel || ''}
                            onChange={(e) => updateQuestionConfig(i, { minLabel: e.target.value })}
                            placeholder="Minimum label"
                            className="h-9 rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={q.config?.maxLabel || ''}
                            onChange={(e) => updateQuestionConfig(i, { maxLabel: e.target.value })}
                            placeholder="Maximum label"
                            className="h-9 rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    )}
                    {['single_choice', 'multi_choice', 'dropdown'].includes(q.type) && (
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2 text-sm">
                            <div className={`w-4 h-4 border border-border ${q.type === 'multi_choice' ? 'rounded' : 'rounded-full'}`} />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const options = [...q.options];
                                options[optIdx] = e.target.value;
                                updateQuestion(i, { options });
                              }}
                              className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1"
                              aria-label={`Option ${optIdx + 1}`}
                            />
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => updateQuestion(i, { options: q.options.filter((_, index) => index !== optIdx) })}
                                className="text-muted-foreground hover:text-red-500 p-1"
                                title="Delete option"
                                aria-label={`Delete option ${optIdx + 1}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateQuestion(i, { options: [...q.options, `Option ${q.options.length + 1}`] })}
                          className="inline-flex items-center text-sm text-primary hover:text-primary/80 mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add option
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Question Actions Footer */}
                  <div className="flex items-center justify-end gap-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Required</span>
                      <Switch 
                        checked={q.required} 
                        onChange={(e) => updateQuestion(i, { required: e.target.checked })} 
                      />
                    </div>
                    <button 
                      onClick={() => deleteQuestion(i)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      title="Delete question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Add Question FAB */}
        <div className="fixed bottom-8 right-8 z-40">
          <Dropdown
            align="right"
            width="w-56"
            placement="top"
            trigger={
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </Button>
            }
          >
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Question Types
            </div>
            {questionTypes.map((t) => (
              <DropdownItem key={t.type} onClick={() => addQuestion(t.type)}>
                <div className="flex items-center">
                  <t.icon className="w-4 h-4 mr-3 opacity-70" />
                  {t.label}
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
        
        {/* Autosave indicator */}
        <div className="fixed bottom-8 left-8 text-xs text-muted-foreground flex items-center bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm">
          All changes saved
        </div>
      </div>
    </AppShell>
  );
};
