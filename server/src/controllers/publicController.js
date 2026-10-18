const Survey = require('../models/Survey');
const Response = require('../models/Response');

exports.getSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({
      publicSlug: req.params.slug,
    }).select('title description questions logic theme settings publicSlug status');

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or no longer available.' });
    }

    if (survey.status === 'draft') {
      return res.status(403).json({ error: 'This survey is currently in draft mode and has not been published yet.' });
    }

    if (survey.status === 'closed') {
      return res.status(403).json({ error: 'This survey is closed and is no longer accepting responses.' });
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ survey });
  } catch (err) {
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({
      publicSlug: req.params.slug,
      status: 'published',
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or no longer accepting responses' });
    }

    const { answers, completionTime, fingerprint } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    // Duplicate submission check
    if (!survey.settings.allowMultipleSubmissions && fingerprint) {
      const existing = await Response.findOne({
        surveyId: survey._id,
        'metadata.fingerprint': fingerprint,
      });
      if (existing) {
        return res.status(409).json({ error: 'You have already submitted this survey' });
      }
    }

    // Determine active questions based on branching logic
    const answerMap = new Map();
    for (const a of answers) {
      answerMap.set(a.questionId, a.value);
    }

    const evaluateCondition = (rule, answer) => {
      if (answer === undefined || answer === null || answer === '') return false;
      const valStr = String(rule.value ?? '').trim().toLowerCase();

      if (Array.isArray(answer)) {
        if (answer.length === 0) return false;
        const lowerAnswers = answer.map((item) => String(item ?? '').trim().toLowerCase());
        switch (rule.condition) {
          case 'equals': return lowerAnswers.includes(valStr);
          case 'not_equals': return !lowerAnswers.includes(valStr);
          case 'contains': return lowerAnswers.some((item) => item.includes(valStr));
          default: return false;
        }
      }

      const ansStr = String(answer ?? '').trim().toLowerCase();
      switch (rule.condition) {
        case 'equals': return ansStr === valStr;
        case 'not_equals': return ansStr !== valStr;
        case 'contains': return ansStr.includes(valStr);
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
        default: return false;
      }
    };

    const activeQuestions = [];
    const visited = new Set();
    let currentIdx = 0;

    while (currentIdx < survey.questions.length) {
      const q = survey.questions[currentIdx];
      if (visited.has(q.id)) break;
      visited.add(q.id);
      activeQuestions.push(q);

      const val = answerMap.get(q.id);
      const hasAnswer =
        val !== undefined &&
        val !== null &&
        val !== '' &&
        (!Array.isArray(val) || val.length > 0);

      const rules = survey.logic?.filter((r) => r.sourceQuestionId === q.id) || [];
      let nextTarget = null;

      if (hasAnswer) {
        for (const rule of rules) {
          if (evaluateCondition(rule, val)) {
            nextTarget = rule.targetQuestionId;
            break;
          }
        }
      }

      if (nextTarget === 'end') {
        break;
      } else if (nextTarget) {
        const targetIndex = survey.questions.findIndex((item) => item.id === nextTarget);
        if (targetIndex > currentIdx) {
          currentIdx = targetIndex;
          continue;
        }
      }

      currentIdx += 1;
    }

    // Validate required questions only for active questions on the branch
    const requiredQuestions = activeQuestions.filter((q) => q.required);
    for (const rq of requiredQuestions) {
      const answerVal = answerMap.get(rq.id);
      if (
        answerVal === null ||
        answerVal === undefined ||
        answerVal === '' ||
        (Array.isArray(answerVal) && answerVal.length === 0)
      ) {
        return res.status(400).json({
          error: `Question "${rq.title}" is required`,
          questionId: rq.id,
        });
      }
    }

    const activeQuestionIds = new Set(activeQuestions.map((q) => q.id));
    const validAnswers = answers.filter((a) => activeQuestionIds.has(a.questionId));

    const response = await Response.create({
      surveyId: survey._id,
      userId: survey.userId,
      answers: validAnswers,
      metadata: {
        completionTime: completionTime || null,
        fingerprint: fingerprint || null,
      },
    });

    await Survey.findByIdAndUpdate(survey._id, { $inc: { responseCount: 1 } });

    res.status(201).json({ message: 'Response submitted successfully', id: response._id });
  } catch (err) {
    next(err);
  }
};
