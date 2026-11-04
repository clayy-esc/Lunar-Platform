import React, { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { OptionItem, Question } from '../../types';
import { getSuggestedOptions } from './builderUtils';
import { GripVertical, Plus, X, Sparkles, Star } from 'lucide-react';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onUpdate }) => {
  const isChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(question.type);
  const isYesNo = question.type === 'yes_no' || question.displayType === 'yes_no';
  const isMulti = question.type === 'multi_choice' || question.type === 'checkboxes';
  const isDropdown = question.type === 'dropdown';
  const isShortText = question.type === 'short_text' || question.type === 'short_answer';
  const isLongText = question.type === 'long_text' || question.type === 'long_answer';
  const isRating = question.type === 'rating';
  const isLinearOrNps = question.type === 'linear_scale' || question.type === 'nps' || question.displayType === 'nps';

  const [announcement, setAnnouncement] = useState('');
  const [draggedOptionIdx, setDraggedOptionIdx] = useState<number | null>(null);
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const options: OptionItem[] = (question.options || []).map((opt) =>
    typeof opt === 'string' ? { id: nanoid(8), label: opt } : opt
  );

  const announce = (msg: string) => {
    setAnnouncement(msg);
    setTimeout(() => setAnnouncement(''), 3000);
  };

  // Option operations
  const updateOptionLabel = (idx: number, newLabel: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], label: newLabel };
    onUpdate({ options: next });
  };

  const addOptionBelow = (idx?: number, customLabel?: string) => {
    const label = customLabel || `Option ${options.length + 1}`;
    const newOpt: OptionItem = { id: nanoid(8), label };
    const next = [...options];
    const insertAt = typeof idx === 'number' ? idx + 1 : next.length;
    next.splice(insertAt, 0, newOpt);
    onUpdate({ options: next });
    announce(`Added ${label}`);

    setTimeout(() => {
      const el = optionInputRefs.current[insertAt];
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      announce('At least 2 options are needed');
      return;
    }
    const removedLabel = options[idx]?.label || `Option ${idx + 1}`;
    const next = options.filter((_, i) => i !== idx);
    onUpdate({ options: next });
    announce(`${removedLabel} removed`);

    const nextFocusIdx = Math.max(0, idx - 1);
    setTimeout(() => {
      optionInputRefs.current[nextFocusIdx]?.focus();
    }, 50);
  };

  const moveOption = (from: number, to: number) => {
    if (from === to || to < 0 || to >= options.length) return;
    const next = [...options];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onUpdate({ options: next });
    announce(`Moved ${item.label} to position ${to + 1}`);

    setTimeout(() => {
      optionInputRefs.current[to]?.focus();
    }, 50);
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveOption(idx, idx - 1);
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveOption(idx, idx + 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addOptionBelow(idx);
    } else if (e.key === 'Backspace' && options[idx].label === '' && options.length > 2) {
      e.preventDefault();
      removeOption(idx);
    } else if (e.key === 'ArrowUp' && (e.currentTarget.selectionStart === 0 || e.currentTarget.selectionStart === e.currentTarget.selectionEnd)) {
      if (idx > 0) {
        e.preventDefault();
        optionInputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowDown' && (e.currentTarget.selectionEnd === e.currentTarget.value.length || e.currentTarget.selectionStart === e.currentTarget.selectionEnd)) {
      if (idx < options.length - 1) {
        e.preventDefault();
        optionInputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
    const text = e.clipboardData.getData('text');
    if (text && text.includes('\n')) {
      e.preventDefault();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const next = [...options];
        next[idx] = { ...next[idx], label: lines[0] };
        const additional = lines.slice(1).map((line) => ({ id: nanoid(8), label: line }));
        next.splice(idx + 1, 0, ...additional);
        onUpdate({ options: next });
        announce(`Pasted ${lines.length} options`);
      }
    }
  };

  const suggested = getSuggestedOptions(question.title);

  const applySuggestedOptions = () => {
    if (!suggested) return;
    const next = suggested.map((label) => ({ id: nanoid(8), label }));
    onUpdate({ options: next });
    announce('Applied suggested options');
  };

  // Check for duplicates
  const labelsCount = options.reduce<Record<string, number>>((acc, o) => {
    const k = o.label.trim().toLowerCase();
    if (k) acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="builder-answer-editor space-y-4 pt-3" onClick={(e) => e.stopPropagation()}>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Choice Types (Multiple choice, Checkboxes, Dropdown) */}
      {isChoice && !isYesNo && (
        <div className="space-y-2">
          {suggested && options.length <= 2 && (
            <button
              type="button"
              onClick={applySuggestedOptions}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Use suggested options ({suggested.length})
            </button>
          )}

          <div className="space-y-1.5">
            {options.map((opt, idx) => {
              const isDuplicate = labelsCount[opt.label.trim().toLowerCase()] > 1;
              const isEmpty = opt.label.trim() === '';

              return (
                <div
                  key={opt.id}
                  draggable
                  onDragStart={() => setDraggedOptionIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedOptionIdx !== null) moveOption(draggedOptionIdx, idx);
                    setDraggedOptionIdx(null);
                  }}
                  className="group flex flex-col rounded-xl border border-transparent p-1 transition-all hover:bg-slate-50 focus-within:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="cursor-grab text-slate-300 hover:text-slate-600 active:cursor-grabbing p-1"
                      aria-label={`Drag to reorder option ${idx + 1}`}
                      tabIndex={-1}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    <span
                      className={`shrink-0 ${
                        isMulti
                          ? 'h-4 w-4 rounded border border-slate-300 bg-white'
                          : isDropdown
                          ? 'flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600'
                          : 'h-4 w-4 rounded-full border border-slate-300 bg-white'
                      }`}
                    >
                      {isDropdown && idx + 1}
                    </span>

                    <div className="relative flex-1">
                      <input
                        ref={(el) => {
                          optionInputRefs.current[idx] = el;
                        }}
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateOptionLabel(idx, e.target.value)}
                        onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                        onPaste={(e) => handlePaste(e, idx)}
                        placeholder={`Option ${idx + 1}`}
                        aria-label={`Option ${idx + 1}`}
                        className={`h-9 w-full rounded-lg border bg-white px-2.5 text-[15px] font-medium text-slate-800 transition-colors focus:outline-none focus:ring-2 ${
                          isEmpty
                            ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-200'
                            : isDuplicate
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      disabled={options.length <= 2}
                      aria-label={`Remove option ${idx + 1}`}
                      title={options.length <= 2 ? 'At least 2 options are needed' : `Remove option ${idx + 1}`}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors ${
                        options.length <= 2
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Inline errors */}
                  {(isEmpty || isDuplicate) && (
                    <div className="ml-14 text-xs font-semibold text-red-500">
                      {isEmpty ? "Option text can't be empty" : 'Duplicate option label'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls below options list */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <button
              type="button"
              onClick={() => addOptionBelow()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </button>

            {!question.allowOther && (
              <button
                type="button"
                onClick={() => onUpdate({ allowOther: true })}
                className="font-semibold text-slate-600 hover:text-blue-600 hover:underline"
              >
                Add &quot;Other&quot;
              </button>
            )}

            {options.length <= 2 && (
              <span className="text-slate-400 font-medium">At least 2 options are needed</span>
            )}
          </div>

          {question.allowOther && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-2.5 text-xs text-slate-600">
              <span className="font-semibold">Other (respondent types an answer)</span>
              <button
                type="button"
                onClick={() => onUpdate({ allowOther: false })}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Remove Other option"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Yes / No Type */}
      {isYesNo && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500">Choice labels:</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
              <span className="text-xs font-bold text-slate-400">1</span>
              <input
                type="text"
                value={question.yesNo?.yesLabel ?? 'Yes'}
                onChange={(e) =>
                  onUpdate({
                    yesNo: {
                      yesLabel: e.target.value,
                      noLabel: question.yesNo?.noLabel ?? 'No',
                      allowNA: question.yesNo?.allowNA,
                      naLabel: question.yesNo?.naLabel,
                    },
                  })
                }
                placeholder="Yes"
                aria-label="Yes label"
                className="h-8 w-24 rounded-lg px-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
              <span className="text-xs font-bold text-slate-400">2</span>
              <input
                type="text"
                value={question.yesNo?.noLabel ?? 'No'}
                onChange={(e) =>
                  onUpdate({
                    yesNo: {
                      yesLabel: question.yesNo?.yesLabel ?? 'Yes',
                      noLabel: e.target.value,
                      allowNA: question.yesNo?.allowNA,
                      naLabel: question.yesNo?.naLabel,
                    },
                  })
                }
                placeholder="No"
                aria-label="No label"
                className="h-8 w-24 rounded-lg px-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {question.yesNo?.allowNA && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                <span className="text-xs font-bold text-slate-400">3</span>
                <input
                  type="text"
                  value={question.yesNo?.naLabel ?? 'N/A'}
                  onChange={(e) =>
                    onUpdate({
                      yesNo: {
                        yesLabel: question.yesNo?.yesLabel ?? 'Yes',
                        noLabel: question.yesNo?.noLabel ?? 'No',
                        allowNA: true,
                        naLabel: e.target.value,
                      },
                    })
                  }
                  placeholder="N/A"
                  aria-label="N/A label"
                  className="h-8 w-24 rounded-lg px-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(question.yesNo?.allowNA)}
              onChange={(e) =>
                onUpdate({
                  yesNo: {
                    yesLabel: question.yesNo?.yesLabel ?? 'Yes',
                    noLabel: question.yesNo?.noLabel ?? 'No',
                    allowNA: e.target.checked,
                    naLabel: question.yesNo?.naLabel ?? 'N/A',
                  },
                })
              }
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            Include N/A (Not Applicable) option
          </label>
        </div>
      )}

      {/* Short Text and Long Text Types */}
      {(isShortText || isLongText) && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Placeholder text</label>
              <input
                type="text"
                value={question.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder={isLongText ? 'e.g. Type your feedback here...' : 'e.g. Type your answer'}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Max length (characters)</label>
              <input
                type="number"
                value={question.maxLength || ''}
                onChange={(e) => onUpdate({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No limit"
                min={1}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-bold uppercase text-slate-400 mb-1.5">Live respondent preview:</div>
            {isShortText ? (
              <div className="builder-placeholder max-w-md">
                {question.placeholder || 'Type your answer'}
              </div>
            ) : (
              <div className="builder-placeholder h-20 max-w-lg leading-relaxed">
                {question.placeholder || 'Type your answer here...'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Scale Type */}
      {isRating && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Scale size</label>
              <div className="flex gap-2">
                {[5, 7, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        rating: {
                          max: num as 5 | 7 | 10,
                          style: question.rating?.style || 'star',
                          minLabel: question.rating?.minLabel,
                          maxLabel: question.rating?.maxLabel,
                        },
                      })
                    }
                    className={`h-9 flex-1 rounded-xl border text-xs font-extrabold transition-all ${
                      (question.rating?.max || 5) === num
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    1 to {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Display style</label>
              <div className="flex gap-2">
                {(['star', 'number', 'emoji'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        rating: {
                          max: question.rating?.max || 5,
                          style,
                          minLabel: question.rating?.minLabel,
                          maxLabel: question.rating?.maxLabel,
                        },
                      })
                    }
                    className={`h-9 flex-1 rounded-xl border text-xs font-bold capitalize transition-all ${
                      (question.rating?.style || 'star') === style
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {style === 'star' ? '★ Stars' : style === 'number' ? '123 Numbers' : '😊 Emojis'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Lowest score label</label>
              <input
                type="text"
                value={question.rating?.minLabel ?? 'Not satisfied'}
                onChange={(e) =>
                  onUpdate({
                    rating: {
                      max: question.rating?.max || 5,
                      style: question.rating?.style || 'star',
                      minLabel: e.target.value,
                      maxLabel: question.rating?.maxLabel,
                    },
                  })
                }
                placeholder="e.g. Not satisfied"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Highest score label</label>
              <input
                type="text"
                value={question.rating?.maxLabel ?? 'Very satisfied'}
                onChange={(e) =>
                  onUpdate({
                    rating: {
                      max: question.rating?.max || 5,
                      style: question.rating?.style || 'star',
                      minLabel: question.rating?.minLabel,
                      maxLabel: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Very satisfied"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-2">
            <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">Live respondent preview:</div>
            <div className="flex items-center gap-2">
              {Array.from({ length: question.rating?.max || 5 }, (_, i) => i + 1).map((val) => {
                const style = question.rating?.style || 'star';
                if (style === 'number') {
                  return (
                    <span
                      key={val}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700"
                    >
                      {val}
                    </span>
                  );
                }
                if (style === 'emoji') {
                  const emojis = ['😠', '🙁', '😐', '😊', '😍', '🤩', '🥳', '🙌', '🔥', '💯'];
                  return (
                    <span key={val} className="text-2xl opacity-80">
                      {emojis[Math.min(val - 1, emojis.length - 1)]}
                    </span>
                  );
                }
                return <Star key={val} className="h-6 w-6 text-amber-400 fill-amber-400" />;
              })}
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mt-2 max-w-sm">
              <span>{question.rating?.minLabel || 'Not satisfied'}</span>
              <span>{question.rating?.maxLabel || 'Very satisfied'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Net Promoter Score (NPS) / Linear scale Type */}
      {isLinearOrNps && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">0 - Lowest score label</label>
              <input
                type="text"
                value={question.nps?.minLabel ?? 'Not likely'}
                onChange={(e) =>
                  onUpdate({
                    nps: {
                      minLabel: e.target.value,
                      maxLabel: question.nps?.maxLabel ?? 'Extremely likely',
                    },
                  })
                }
                placeholder="Not likely"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">10 - Highest score label</label>
              <input
                type="text"
                value={question.nps?.maxLabel ?? 'Extremely likely'}
                onChange={(e) =>
                  onUpdate({
                    nps: {
                      minLabel: question.nps?.minLabel ?? 'Not likely',
                      maxLabel: e.target.value,
                    },
                  })
                }
                placeholder="Extremely likely"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-2">
            <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">Live respondent preview (0 - 10 scale):</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, i) => (
                <span
                  key={i}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
                >
                  {i}
                </span>
              ))}
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mt-2 max-w-sm">
              <span>{question.nps?.minLabel || 'Not likely'}</span>
              <span>{question.nps?.maxLabel || 'Extremely likely'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
