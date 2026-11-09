import { nanoid } from 'nanoid';
import { OptionItem, Question, QuestionType } from '../../types';

export const normalizeOptions = (options: any[] = []): OptionItem[] => {
  if (!Array.isArray(options)) return [];
  return options.map((opt, i) => {
    if (typeof opt === 'string') {
      return { id: nanoid(8), label: opt };
    }
    if (typeof opt === 'object' && opt !== null) {
      return {
        id: opt.id || nanoid(8),
        label: typeof opt.label === 'string' ? opt.label : String(opt.label ?? `Option ${i + 1}`),
      };
    }
    return { id: nanoid(8), label: `Option ${i + 1}` };
  });
};

export const normalizeQuestion = (q: any, index: number = 0): Question => {
  const isChoice = ['single_choice', 'multi_choice', 'dropdown', 'multiple_choice', 'checkboxes'].includes(q.type);
  const isYesNo = q.type === 'yes_no' || q.displayType === 'yes_no';
  const isNps = q.type === 'nps' || q.displayType === 'nps';
  const isRating = q.type === 'rating';
  const isText = ['short_text', 'long_text', 'short_answer', 'long_answer'].includes(q.type);

  let rawOptions = normalizeOptions(q.options);

  // Fix seeded filler if title has "age" and option is generic filler
  const titleLower = String(q.title || '').toLowerCase();
  if (titleLower.includes('age') && (rawOptions.length === 0 || rawOptions.some(o => o.label.includes('clear and simple') || o.label.includes('helpful answer')))) {
    rawOptions = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'].map(label => ({
      id: nanoid(8),
      label,
    }));
  } else if (isChoice && rawOptions.length === 0) {
    rawOptions = [
      { id: nanoid(8), label: 'Option 1' },
      { id: nanoid(8), label: 'Option 2' },
    ];
  } else if (isChoice && rawOptions.length === 1 && (rawOptions[0].label.includes('clear and simple') || rawOptions[0].label.includes('helpful answer'))) {
    rawOptions = [
      { id: nanoid(8), label: 'Option 1' },
      { id: nanoid(8), label: 'Option 2' },
    ];
  }

  const ratingConfig = isRating ? {
    max: (q.rating?.max || q.config?.max || 5) as 5 | 7 | 10,
    style: (q.rating?.style || 'star') as 'star' | 'number' | 'emoji',
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
    id: q.id || nanoid(8),
    type: q.type as QuestionType,
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
      shuffle: Boolean(q.shuffle || q.config?.shuffle),
    },
    displayType: q.displayType,
    order: typeof q.order === 'number' ? q.order : index,
  };
};


export const createDefaultQuestion = (type: QuestionType, displayType?: string, currentCount: number = 0): Question => {
  const order = currentCount;
  const id = nanoid(8);

  if (displayType === 'yes_no' || type === 'yes_no') {
    return {
      id,
      type: 'single_choice',
      displayType: 'yes_no',
      title: 'Would you recommend this?',
      description: '',
      required: false,
      options: [
        { id: nanoid(8), label: 'Yes' },
        { id: nanoid(8), label: 'No' },
      ],
      yesNo: {
        yesLabel: 'Yes',
        noLabel: 'No',
        allowNA: false,
        naLabel: 'N/A',
      },
      order,
    };
  }

  if (displayType === 'nps' || type === 'nps' || type === 'linear_scale') {
    return {
      id,
      type: 'linear_scale',
      displayType: 'nps',
      title: 'How likely are you to recommend us to a friend or colleague?',
      description: '',
      required: false,
      options: [],
      nps: {
        minLabel: 'Not likely',
        maxLabel: 'Extremely likely',
      },
      config: {
        min: 0,
        max: 10,
        minLabel: 'Not likely',
        maxLabel: 'Extremely likely',
      },
      order,
    };
  }

  if (type === 'rating') {
    return {
      id,
      type: 'rating',
      title: 'How would you rate your experience?',
      description: '',
      required: false,
      options: [],
      rating: {
        max: 5,
        style: 'star',
        minLabel: 'Not satisfied',
        maxLabel: 'Very satisfied',
      },
      config: {
        min: 1,
        max: 5,
        minLabel: 'Not satisfied',
        maxLabel: 'Very satisfied',
      },
      order,
    };
  }

  if (type === 'short_text' || type === 'short_answer') {
    return {
      id,
      type: 'short_text',
      title: 'What should we know?',
      description: '',
      required: false,
      placeholder: 'Type your answer',
      options: [],
      config: {
        placeholder: 'Type your answer',
      },
      order,
    };
  }

  if (type === 'long_text' || type === 'long_answer') {
    return {
      id,
      type: 'long_text',
      title: 'Do you have any additional feedback?',
      description: '',
      required: false,
      placeholder: 'Type your answer here...',
      options: [],
      config: {
        placeholder: 'Type your answer here...',
      },
      order,
    };
  }

  if (type === 'dropdown') {
    return {
      id,
      type: 'dropdown',
      title: 'Please select an option',
      description: '',
      required: false,
      options: [
        { id: nanoid(8), label: 'Option 1' },
        { id: nanoid(8), label: 'Option 2' },
      ],
      order,
    };
  }

  if (type === 'multi_choice' || type === 'checkboxes') {
    return {
      id,
      type: 'multi_choice',
      title: 'Select all that apply',
      description: '',
      required: false,
      options: [
        { id: nanoid(8), label: 'Option 1' },
        { id: nanoid(8), label: 'Option 2' },
      ],
      order,
    };
  }

  // Default: single_choice / multiple_choice
  return {
    id,
    type: 'single_choice',
    title: 'What matters most to you?',
    description: '',
    required: false,
    options: [
      { id: nanoid(8), label: 'Option 1' },
      { id: nanoid(8), label: 'Option 2' },
    ],
    order,
  };
};

