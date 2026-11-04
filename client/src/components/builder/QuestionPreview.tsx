import React from 'react';
import { Question, OptionItem } from '../../types';
import { Star } from 'lucide-react';

interface QuestionPreviewProps {
  question: Question;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question }) => {
  const isChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(question.type);
  const isYesNo = question.type === 'yes_no' || question.displayType === 'yes_no';
  const isMulti = question.type === 'multi_choice' || question.type === 'checkboxes';
  const isDropdown = question.type === 'dropdown';
  const isShortText = question.type === 'short_text' || question.type === 'short_answer';
  const isLongText = question.type === 'long_text' || question.type === 'long_answer';
  const isRating = question.type === 'rating';
  const isLinearOrNps = question.type === 'linear_scale' || question.type === 'nps' || question.displayType === 'nps';

  const options: OptionItem[] = (question.options || []).map((opt, i) =>
    typeof opt === 'string' ? { id: `opt_${i}`, label: opt } : opt
  );

  return (
    <div className="builder-answer-preview">
      {isYesNo && (
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            <span className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
            {question.yesNo?.yesLabel || 'Yes'}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            <span className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
            {question.yesNo?.noLabel || 'No'}
          </div>
          {question.yesNo?.allowNA && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
              <span className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
              {question.yesNo?.naLabel || 'N/A'}
            </div>
          )}
        </div>
      )}

      {isChoice && !isYesNo && !isDropdown && (
        <div className="space-y-1.5 pt-1">
          {options.map((opt, idx) => (
            <div key={opt.id || idx} className="builder-option flex items-center gap-2.5 py-1 text-sm text-slate-700">
              <span className={isMulti ? 'checkbox' : 'radio'} />
              <span>{opt.label || `Option ${idx + 1}`}</span>
            </div>
          ))}
          {question.allowOther && (
            <div className="builder-option flex items-center gap-2.5 py-1 text-sm text-slate-500 italic">
              <span className={isMulti ? 'checkbox' : 'radio'} />
              <span>Other (respondent types an answer)</span>
            </div>
          )}
        </div>
      )}

      {isDropdown && (
        <div className="pt-1">
          <div className="flex h-10 w-full max-w-sm items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <span>Select an option...</span>
            <span className="text-xs text-slate-400">▼</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {options.length} options configured
          </div>
        </div>
      )}

      {isShortText && (
        <div className="builder-placeholder max-w-md">
          {question.placeholder || 'Type your answer'}
        </div>
      )}

      {isLongText && (
        <div className="builder-placeholder h-20 max-w-lg leading-relaxed">
          {question.placeholder || 'Type your answer here...'}
        </div>
      )}

      {isRating && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: question.rating?.max || 5 }, (_, i) => i + 1).map((val) => {
              const style = question.rating?.style || 'star';
              if (style === 'number') {
                return (
                  <span
                    key={val}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600"
                  >
                    {val}
                  </span>
                );
              }
              if (style === 'emoji') {
                const emojis = ['😠', '🙁', '😐', '😊', '😍', '🤩', '🥳', '🙌', '🔥', '💯'];
                return (
                  <span key={val} className="text-lg opacity-80">
                    {emojis[Math.min(val - 1, emojis.length - 1)]}
                  </span>
                );
              }
              return <Star key={val} className="h-5 w-5 text-amber-400 fill-amber-400" />;
            })}
          </div>
          {(question.rating?.minLabel || question.rating?.maxLabel) && (
            <div className="flex max-w-xs justify-between text-[11px] font-medium text-slate-400">
              <span>{question.rating?.minLabel}</span>
              <span>{question.rating?.maxLabel}</span>
            </div>
          )}
        </div>
      )}

      {isLinearOrNps && (
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <span
                key={i}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600"
              >
                {i}
              </span>
            ))}
          </div>
          {(question.nps?.minLabel || question.nps?.maxLabel) && (
            <div className="flex max-w-xs justify-between text-[11px] font-medium text-slate-400">
              <span>{question.nps?.minLabel || 'Not likely'}</span>
              <span>{question.nps?.maxLabel || 'Extremely likely'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

