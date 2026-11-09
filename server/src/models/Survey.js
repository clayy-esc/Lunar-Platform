const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'short_text', 'long_text', 'single_choice', 'multi_choice',
      'rating', 'linear_scale', 'dropdown', 'date', 'number',
      'multiple_choice', 'checkboxes', 'short_answer', 'long_answer',
      'yes_no', 'nps',
    ],
  },
  title: { type: String, required: true, default: 'Untitled Question' },
  description: { type: String, default: '' },
  required: { type: Boolean, default: false },
  options: [{ type: Schema.Types.Mixed }],
  allowOther: { type: Boolean, default: false },
  shuffle: { type: Boolean, default: false },
  placeholder: { type: String },
  maxLength: { type: Number },
  rating: {
    max: { type: Number },
    style: { type: String },
    minLabel: { type: String },
    maxLabel: { type: String },
  },
  yesNo: {
    yesLabel: { type: String },
    noLabel: { type: String },
    allowNA: { type: Boolean },
    naLabel: { type: String },
  },
  nps: {
    minLabel: { type: String },
    maxLabel: { type: String },
  },
  config: {
    min: { type: Number },
    max: { type: Number },
    minLabel: { type: String },
    maxLabel: { type: String },
    step: { type: Number },
    placeholder: { type: String },
    shuffle: { type: Boolean },
  },
  order: { type: Number, required: true },
}, { _id: false, strict: false });

const logicRuleSchema = new Schema({
  id: { type: String, required: true },
  sourceQuestionId: { type: String, required: true },
  condition: {
    type: String,
    required: true,
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
  },
  value: { type: Schema.Types.Mixed, required: true },
  targetQuestionId: { type: String, required: true },
}, { _id: false });

const surveySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled Survey',
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  },
  publicSlug: {
    type: String,
    unique: true,
    sparse: true,
  },
  questions: [questionSchema],
  logic: [logicRuleSchema],
  theme: {
    primaryColor: { type: String, default: '#6366f1' },
    backgroundColor: { type: String, default: '#ffffff' },
    mode: { type: String, enum: ['light', 'dark'], default: 'light' },
    lightPrimaryColor: { type: String, default: '#6366f1' },
    lightBackgroundColor: { type: String, default: '#ffffff' },
    darkPrimaryColor: { type: String, default: '#818cf8' },
    darkBackgroundColor: { type: String, default: '#0f172a' },
    fontFamily: { type: String, default: 'Inter' },
    layout: {
      type: String,
      enum: ['single_page', 'one_at_a_time'],
      default: 'single_page',
    },
    descriptionAlignment: {
      type: String,
      enum: ['left', 'right', 'justified'],
      default: 'left',
    },
    customCSS: { type: String, default: '' },
  },
  settings: {
    allowMultipleSubmissions: { type: Boolean, default: false },
    showProgressBar: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    thankYouMessage: { type: String, default: 'Thank you for your response!' },
  },
  responseCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

surveySchema.index({ userId: 1, createdAt: -1 });

surveySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

surveySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Survey', surveySchema);
