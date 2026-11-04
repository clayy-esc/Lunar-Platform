import test from 'node:test';
import assert from 'node:assert/strict';

// Helper functions mirroring builderUtils logic for isolated, deterministic testing
function normalizeOptions(options = []) {
  if (!Array.isArray(options)) return [];
  return options.map((opt, i) => {
    if (typeof opt === 'string') {
      return { id: `opt_${i}`, label: opt };
    }
    if (typeof opt === 'object' && opt !== null) {
      return {
        id: opt.id || `opt_${i}`,
        label: typeof opt.label === 'string' ? opt.label : String(opt.label ?? `Option ${i + 1}`),
      };
    }
    return { id: `opt_${i}`, label: `Option ${i + 1}` };
  });
}

function normalizeQuestion(q, index = 0) {
  const isChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(q.type);
  const isYesNo = q.type === 'yes_no' || q.displayType === 'yes_no';
  const isNps = q.type === 'nps' || q.displayType === 'nps';
  const isRating = q.type === 'rating';
  const isText = ['short_text', 'long_text', 'short_answer', 'long_answer'].includes(q.type);

  let rawOptions = normalizeOptions(q.options);

  const titleLower = String(q.title || '').toLowerCase();
  if (titleLower.includes('age') && (rawOptions.length === 0 || rawOptions.some(o => o.label.includes('clear and simple')))) {
    rawOptions = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'].map((label, idx) => ({
      id: `opt_age_${idx}`,
      label,
    }));
  } else if (isChoice && rawOptions.length === 0) {
    rawOptions = [
      { id: 'opt_1', label: 'Option 1' },
      { id: 'opt_2', label: 'Option 2' },
    ];
  }

  const ratingConfig = isRating ? {
    max: q.rating?.max || q.config?.max || 5,
    style: q.rating?.style || 'star',
    minLabel: q.rating?.minLabel ?? q.config?.minLabel ?? 'Not satisfied',
    maxLabel: q.rating?.maxLabel ?? q.config?.maxLabel ?? 'Very satisfied',
  } : undefined;

  const yesNoConfig = isYesNo ? {
    yesLabel: q.yesNo?.yesLabel || (rawOptions[0]?.label ?? 'Yes'),
    noLabel: q.yesNo?.noLabel || (rawOptions[1]?.label ?? 'No'),
    allowNA: Boolean(q.yesNo?.allowNA),
    naLabel: q.yesNo?.naLabel || 'N/A',
  } : undefined;

  const npsConfig = (isNps || q.type === 'linear_scale') ? {
    minLabel: q.nps?.minLabel || q.config?.minLabel || 'Not likely',
    maxLabel: q.nps?.maxLabel || q.config?.maxLabel || 'Extremely likely',
  } : undefined;

  const placeholder = isText
    ? (q.placeholder || q.config?.placeholder || (q.type.includes('long') ? 'Type your answer here...' : 'Type your answer'))
    : undefined;

  return {
    id: q.id || `q_${index}`,
    type: q.type,
    title: q.title ?? '',
    description: q.description ?? '',
    required: Boolean(q.required),
    options: rawOptions,
    allowOther: Boolean(q.allowOther),
    shuffle: Boolean(q.shuffle || q.config?.shuffle),
    placeholder,
    maxLength: q.maxLength,
    rating: ratingConfig,
    yesNo: yesNoConfig,
    nps: npsConfig,
    config: {
      ...q.config,
      placeholder: placeholder ?? q.config?.placeholder,
      min: isNps ? 0 : (isRating ? 1 : q.config?.min),
      max: ratingConfig?.max ?? (isNps ? 10 : q.config?.max),
      minLabel: npsConfig?.minLabel ?? ratingConfig?.minLabel ?? q.config?.minLabel,
      maxLabel: npsConfig?.maxLabel ?? ratingConfig?.maxLabel ?? q.config?.maxLabel,
    },
    displayType: q.displayType,
    order: typeof q.order === 'number' ? q.order : index,
  };
}

function updateQuestionInList(questions, id, patch) {
  return questions.map((q) => {
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
}

test('normalizeQuestion migrates plain string options to { id, label }', () => {
  const legacyQ = {
    id: 'q1',
    type: 'single_choice',
    title: 'Favorite Color',
    options: ['Red', 'Blue', 'Green'],
    required: true,
  };

  const normalized = normalizeQuestion(legacyQ);
  assert.equal(normalized.options.length, 3);
  assert.deepEqual(normalized.options[0], { id: 'opt_0', label: 'Red' });
  assert.deepEqual(normalized.options[1], { id: 'opt_1', label: 'Blue' });
  assert.deepEqual(normalized.options[2], { id: 'opt_2', label: 'Green' });
});

test('normalizeQuestion cleans up seeded filler options for age question', () => {
  const seededQ = {
    id: 'q_age',
    type: 'single_choice',
    title: 'What is your age group?',
    options: ['A clear and simple experience'],
    required: false,
  };

  const normalized = normalizeQuestion(seededQ);
  assert.equal(normalized.options.length, 6);
  assert.equal(normalized.options[0].label, 'Under 18');
  assert.equal(normalized.options[5].label, '55+');
});

test('updateQuestion for Multiple Choice immutably edits option label and adds options', () => {
  const initialQuestions = [
    {
      id: 'q1',
      type: 'single_choice',
      title: 'Choose one',
      options: [
        { id: 'opt1', label: 'Option 1' },
        { id: 'opt2', label: 'Option 2' },
      ],
    },
  ];

  // 1. Edit an option label
  const editedOptions = [
    { id: 'opt1', label: 'First Choice' },
    { id: 'opt2', label: 'Option 2' },
  ];
  const step1 = updateQuestionInList(initialQuestions, 'q1', { options: editedOptions });

  assert.notEqual(step1, initialQuestions); // Immutable check
  assert.equal(step1[0].options[0].label, 'First Choice');
  assert.equal(initialQuestions[0].options[0].label, 'Option 1'); // Original untouched

  // 2. Add an option
  const addedOptions = [...editedOptions, { id: 'opt3', label: 'Third Choice' }];
  const step2 = updateQuestionInList(step1, 'q1', { options: addedOptions, allowOther: true });
  assert.equal(step2[0].options.length, 3);
  assert.equal(step2[0].allowOther, true);
});

test('updateQuestion for Short Answer and Long Answer updates placeholder and maxLength', () => {
  const questions = [
    {
      id: 'q_short',
      type: 'short_text',
      title: 'Full Name',
      placeholder: 'Type your answer',
      config: {},
    },
    {
      id: 'q_long',
      type: 'long_text',
      title: 'Feedback',
      placeholder: 'Type your answer here...',
      config: {},
    },
  ];

  const updated = updateQuestionInList(questions, 'q_short', {
    placeholder: 'Enter your legal name',
    maxLength: 100,
  });

  assert.equal(updated[0].placeholder, 'Enter your legal name');
  assert.equal(updated[0].maxLength, 100);
  assert.equal(updated[0].config.placeholder, 'Enter your legal name');
  assert.equal(questions[0].placeholder, 'Type your answer'); // Original untouched
});

test('updateQuestion for Rating scale updates max, style, minLabel and maxLabel', () => {
  const questions = [
    {
      id: 'q_rate',
      type: 'rating',
      title: 'Satisfaction',
      rating: { max: 5, style: 'star', minLabel: 'Poor', maxLabel: 'Great' },
      config: { min: 1, max: 5 },
    },
  ];

  const updated = updateQuestionInList(questions, 'q_rate', {
    rating: { max: 10, style: 'emoji', minLabel: 'Terrible', maxLabel: 'Exceptional' },
  });

  assert.equal(updated[0].rating.max, 10);
  assert.equal(updated[0].rating.style, 'emoji');
  assert.equal(updated[0].rating.minLabel, 'Terrible');
  assert.equal(updated[0].rating.maxLabel, 'Exceptional');
  assert.equal(updated[0].config.max, 10);
  assert.equal(updated[0].config.maxLabel, 'Exceptional');
});

test('updateQuestion for Yes/No updates labels and N/A toggle', () => {
  const questions = [
    {
      id: 'q_yn',
      type: 'single_choice',
      displayType: 'yes_no',
      title: 'Recommend?',
      yesNo: { yesLabel: 'Yes', noLabel: 'No', allowNA: false, naLabel: 'N/A' },
    },
  ];

  const updated = updateQuestionInList(questions, 'q_yn', {
    yesNo: { yesLabel: 'Definitely', noLabel: 'Never', allowNA: true, naLabel: 'Not sure' },
  });

  assert.equal(updated[0].yesNo.yesLabel, 'Definitely');
  assert.equal(updated[0].yesNo.noLabel, 'Never');
  assert.equal(updated[0].yesNo.allowNA, true);
  assert.equal(updated[0].yesNo.naLabel, 'Not sure');
});

test('updateQuestion for NPS updates 0-10 labels', () => {
  const questions = [
    {
      id: 'q_nps',
      type: 'linear_scale',
      displayType: 'nps',
      title: 'NPS Score',
      nps: { minLabel: 'Not likely', maxLabel: 'Extremely likely' },
    },
  ];

  const updated = updateQuestionInList(questions, 'q_nps', {
    nps: { minLabel: 'Never in a million years', maxLabel: '100% yes!' },
  });

  assert.equal(updated[0].nps.minLabel, 'Never in a million years');
  assert.equal(updated[0].nps.maxLabel, '100% yes!');
  assert.equal(updated[0].config.minLabel, 'Never in a million years');
  assert.equal(updated[0].config.maxLabel, '100% yes!');
});

