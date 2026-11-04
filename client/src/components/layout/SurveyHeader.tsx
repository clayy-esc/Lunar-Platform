import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Survey } from '../../types';
import { useToast } from '../ui/useToast';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SurveyHeaderProps {
  survey: Survey;
  isDirty?: boolean;
  saveState?: SaveState;
  savedAt?: Date | null;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  onTitleChange?: (title: string) => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
}

export const SurveyHeader: React.FC<SurveyHeaderProps> = ({
  survey,
  isDirty = false,
  saveState = 'idle',
  savedAt,
  isPublishing,
  isUnpublishing,
  onTitleChange,
  onSaveDraft,
  onPublish,
  onUnpublish,
}) => {
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(survey.title);

  useEffect(() => setTitle(survey.title), [survey.title]);

  const commitTitle = () => {
    const nextTitle = title.trim();
    if (nextTitle && nextTitle !== survey.title) onTitleChange?.(nextTitle);
    setTitle(nextTitle || survey.title);
    setIsEditing(false);
  };

  const liveUrl = survey.publicSlug ? `${window.location.origin}/s/${survey.publicSlug}` : '';
  const saveLabel = saveState === 'saving' ? 'Saving…' : 'Save draft';
  const autosaveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Couldn’t save. Retry' : isDirty ? 'Unsaved changes' : savedAt ? 'Saved just now' : 'All changes saved';

  return (
    <header className="survey-header">
      <div className="survey-header-left">
        <div className="survey-header-title">
          <div className="survey-header-eyebrow">Survey workspace</div>
          {isEditing ? <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onBlur={commitTitle} onKeyDown={(event) => {
            if (event.key === 'Enter') commitTitle();
            if (event.key === 'Escape') { setTitle(survey.title); setIsEditing(false); }
          }} aria-label="Survey title" /> : <button type="button" onClick={() => onTitleChange && setIsEditing(true)} className="survey-header-name" title={onTitleChange ? 'Edit survey title' : survey.title}>{survey.title}</button>}
        </div>
        <span className={`survey-status-pill ${survey.status === 'published' ? 'published' : 'draft'}`}><span />{survey.status === 'published' ? 'Published' : 'Draft'}</span>
      </div>
      <div className="survey-header-actions">
        <button type="button" className={`survey-autosave ${saveState === 'error' ? 'is-error' : ''}`} onClick={saveState === 'error' ? onSaveDraft : undefined}>{saveState === 'saved' || !isDirty ? <Check className="h-3.5 w-3.5" /> : null}{autosaveLabel}</button>
        {survey.status === 'published' && liveUrl && <><a className="survey-live-link" href={liveUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /><span>Open live link</span></a><button type="button" className="survey-copy-link" aria-label="Copy live link" title="Copy live link" onClick={async () => { try { await navigator.clipboard.writeText(liveUrl); addToast('Link copied', 'success'); } catch { addToast('Unable to copy link', 'error'); } }}><Copy className="h-4 w-4" /></button></>}
        {onSaveDraft && <Button variant="outline" disabled={!isDirty || saveState === 'saving'} onClick={onSaveDraft}>{saveLabel}</Button>}
        {survey.status === 'published' ? <Button variant="outline" onClick={onUnpublish} isLoading={isUnpublishing}>Unpublish</Button> : <Button onClick={onPublish} isLoading={isPublishing}>{isPublishing ? 'Publishing…' : 'Publish'}</Button>}
      </div>
    </header>
  );
};
