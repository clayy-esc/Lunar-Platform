import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlignLeft, CheckSquare, CircleDot, Copy, GripVertical, ListFilter, MoreHorizontal, Plus, Radio, Star, Trash2, Type } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/ui/Spinner';
import { Switch } from '../../components/ui/Switch';
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown';
import { Survey, Question, QuestionType } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { nanoid } from 'nanoid';
import api from '../../lib/api';

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

const getQuestionType = (type: QuestionType) => questionTypes.find((item) => item.type === type);

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

  useEffect(() => {
    api.get(`/surveys/${surveyId}`).then((res) => setSurvey(res.data.survey)).catch(() => {
      addToast('Failed to load survey', 'error');
      navigate('/dashboard');
    }).finally(() => setIsLoading(false));
  }, [addToast, navigate, surveyId]);

  const selectedQuestion = survey?.questions[selectedIndex];
  const updateSurvey = (changes: Partial<Survey>) => {
    setSurvey((current) => current ? { ...current, ...changes } : current);
    setIsDirty(true);
    setSaveState('idle');
  };
  const updateQuestion = (index: number, changes: Partial<Question>) => {
    if (!survey) return;
    const questions = survey.questions.map((question, itemIndex) => itemIndex === index ? { ...question, ...changes } : question);
    updateSurvey({ questions });
  };

  const addQuestion = (type: QuestionType, displayType?: string) => {
    if (!survey) return;
    const isChoice = ['single_choice', 'multi_choice', 'dropdown'].includes(type);
    const question: Question = {
      id: nanoid(8),
      type,
      title: displayType === 'yes_no' ? 'Would you recommend this survey?' : displayType === 'nps' ? 'How likely are you to recommend us?' : type === 'short_text' ? 'What should we know?' : 'What matters most to you?',
      description: '',
      required: false,
      options: displayType === 'yes_no' ? ['Yes', 'No'] : isChoice ? ['A clear and simple experience'] : [],
      config: displayType === 'nps' ? { min: 0, max: 10, minLabel: 'Not likely', maxLabel: 'Very likely' } : type === 'rating' ? { max: 5 } : {},
      order: survey.questions.length,
    };
    updateSurvey({ questions: [...survey.questions, question] });
    setSelectedIndex(survey.questions.length);
  };

  const removeQuestion = (index: number) => {
    if (!survey) return;
    const questions = survey.questions.filter((_, itemIndex) => itemIndex !== index);
    updateSurvey({ questions });
    setSelectedIndex(Math.max(0, Math.min(index, questions.length - 1)));
  };

  const duplicateQuestion = (index: number) => {
    if (!survey) return;
    const copy = { ...survey.questions[index], id: nanoid(8), title: `${survey.questions[index].title} copy` };
    const questions = [...survey.questions];
    questions.splice(index + 1, 0, copy);
    updateSurvey({ questions });
    setSelectedIndex(index + 1);
  };

  const moveQuestion = (from: number, to: number) => {
    if (!survey || from === to) return;
    const questions = [...survey.questions];
    const [item] = questions.splice(from, 1);
    questions.splice(to, 0, item);
    updateSurvey({ questions: questions.map((question, index) => ({ ...question, order: index })) });
    setSelectedIndex(to);
  };

  const saveDraft = async () => {
    if (!survey || !isDirty) return;
    setSaveState('saving');
    try {
      await api.put(`/surveys/${survey._id}`, { title: survey.title, description: survey.description, questions: survey.questions, logic: survey.logic, theme: survey.theme, settings: survey.settings });
      setIsDirty(false);
      setSaveState('saved');
      setSavedAt(new Date());
      addToast('Draft saved', 'success');
    } catch (error: any) { setSaveState('error'); addToast(error.response?.data?.error || 'Failed to save draft', 'error'); }
  };

  useEffect(() => {
    if (!isDirty || !survey || isLoading) return;
    const timer = window.setTimeout(() => { void saveDraft(); }, 1500);
    return () => window.clearTimeout(timer);
  }, [isDirty, survey, isLoading]);

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
    const problems = [
      survey.questions.length === 0 ? 'Add at least one question.' : '',
      !survey.title.trim() ? 'Add a survey title.' : '',
      ...survey.questions.map((question, index) => !question.title.trim() ? `Add a title to question ${index + 1}.` : ''),
    ].filter(Boolean);
    if (problems.length) {
      addToast(problems.join(' '), 'error');
      const firstInvalid = survey.questions.findIndex((question) => !question.title.trim());
      if (firstInvalid >= 0) setSelectedIndex(firstInvalid);
      return;
    }
    setIsPublishing(true);
    try {
      if (isDirty) await saveDraft();
      const res = await api.post(`/surveys/${survey._id}/publish`);
      setSurvey(res.data.survey);
      setIsDirty(false);
      addToast('Survey published', 'success');
    } catch (error: any) { addToast(error.response?.data?.error || 'Failed to publish survey', 'error'); }
    finally { setIsPublishing(false); }
  };

  const unpublish = async () => {
    if (!survey || !window.confirm('Unpublish this survey? Respondents will no longer be able to answer it.')) return;
    setIsUnpublishing(true);
    try {
      const res = await api.post(`/surveys/${survey._id}/unpublish`);
      setSurvey(res.data.survey);
      addToast('Survey unpublished', 'success');
    } catch (error: any) { addToast(error.response?.data?.error || 'Failed to unpublish survey', 'error'); }
    finally { setIsUnpublishing(false); }
  };

  if (isLoading || !survey) return <AppShell><div className="flex h-full items-center justify-center py-20"><Spinner size="lg" /></div></AppShell>;

  return (
    <AppShell survey={survey} onPublish={publish} isPublishing={isPublishing} onUnpublish={unpublish} isUnpublishing={isUnpublishing} isDirty={isDirty} saveState={saveState} savedAt={savedAt} onTitleChange={(title) => updateSurvey({ title })} onSaveDraft={saveDraft}>
      <div className="builder-page">
        <div className="builder-columns">
          <aside className="builder-add-panel">
            <h2>Add question</h2>
            <p>Choose a question type to add it to your survey.</p>
            <div className="builder-type-list">
              {questionTypes.map(({ type, label, icon: Icon, displayType }) => <button key={label} type="button" onClick={() => addQuestion(type, displayType)}><Icon className="h-4 w-4" />{label}</button>)}
            </div>
          </aside>

          <main className="builder-canvas">
            <div className="builder-survey-intro">
              <textarea aria-label="Survey description" value={survey.description} onChange={(event) => updateSurvey({ description: event.target.value })} placeholder="Add a short description for respondents" />
            </div>
            {survey.questions.map((question, index) => {
              const isSelected = index === selectedIndex;
              const meta = getQuestionType(question.type);
              const Icon = meta?.icon || Type;
              return (
                <article key={question.id} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedIndex !== null) moveQuestion(draggedIndex, index); setDraggedIndex(null); }} onClick={() => setSelectedIndex(index)} className={`builder-question-card ${isSelected ? 'is-selected' : ''}`}>
                  <div className="builder-question-top">
                    <button type="button" className="builder-drag-handle" aria-label={`Reorder question ${index + 1}`}><GripVertical className="h-5 w-5" /></button>
                    <span className="builder-number">{index + 1}</span>
                    <input value={question.title} onChange={(event) => updateQuestion(index, { title: event.target.value })} onClick={(event) => event.stopPropagation()} aria-label={`Question ${index + 1} title`} />
                    <span className="builder-type-pill"><Icon className="h-3.5 w-3.5" />{meta?.label || 'Question'}</span>
                    <Dropdown trigger={<button type="button" aria-label={`Actions for question ${index + 1}`} className="builder-more" onClick={(event) => event.stopPropagation()}><MoreHorizontal className="h-5 w-5" /></button>}>
                      <DropdownItem onClick={() => duplicateQuestion(index)}><Copy className="mr-2 inline h-4 w-4" />Duplicate</DropdownItem>
                      <DropdownItem destructive onClick={() => removeQuestion(index)}><Trash2 className="mr-2 inline h-4 w-4" />Delete</DropdownItem>
                    </Dropdown>
                  </div>
                  <div className="builder-answer-preview">
                    {['single_choice', 'multi_choice', 'dropdown'].includes(question.type) ? question.options.map((option, optionIndex) => <div className="builder-option" key={optionIndex}><span className={question.type === 'multi_choice' ? 'checkbox' : 'radio'} />{option}</div>) : question.type === 'rating' ? <div className="builder-stars">{Array.from({ length: question.config?.max || 5 }, (_, star) => <Star key={star} />)}</div> : <div className="builder-placeholder">{question.type === 'long_text' ? 'Long answer response' : question.type === 'linear_scale' ? '0  1  2  3  4  5  6  7  8  9  10' : 'Short answer response'}</div>}
                    {['single_choice', 'multi_choice', 'dropdown'].includes(question.type) && <button type="button" className="builder-add-option" onClick={(event) => { event.stopPropagation(); updateQuestion(index, { options: [...question.options, `A helpful answer option`] }); }}><Plus className="h-4 w-4" />Add option</button>}
                  </div>
                </article>
              );
            })}
            <button type="button" className="builder-dropzone" onClick={() => addQuestion('single_choice')}><Plus className="h-5 w-5" />Add question</button>
          </main>

          <aside className="builder-settings-panel">
            <h2>Question settings</h2>
            {selectedQuestion ? <><label className="builder-setting-label">Question type<select value={selectedQuestion.type} onChange={(event) => updateQuestion(selectedIndex, { type: event.target.value as QuestionType })}>{questionTypes.slice(0, 6).map((item) => <option key={item.label} value={item.type}>{item.label}</option>)}</select></label><Switch label="Required" description="Respondents must answer" checked={selectedQuestion.required} onChange={(event) => updateQuestion(selectedIndex, { required: event.target.checked })} /><Switch label="Shuffle options" description="Show options in a different order" checked={Boolean(selectedQuestion.config?.shuffle)} onChange={(event) => updateQuestion(selectedIndex, { config: { ...selectedQuestion.config, shuffle: event.target.checked } })} /><button type="button" className="builder-delete-button" onClick={() => removeQuestion(selectedIndex)}><Trash2 className="h-4 w-4" />Delete question</button></> : <p className="text-sm text-[#6b7699]">Select a question to edit its settings.</p>}
          </aside>
        </div>
      </div>
    </AppShell>
  );
};
