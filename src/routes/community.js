const express = require('express');
const router = express.Router();

// Import controllers
const communityController = require('../controllers/communityController');

// Import middleware
const { auth, optionalAuth, validate } = require('../middleware');

// Import validators
const {
  createQuestionValidator,
  updateQuestionValidator,
  getQuestionsValidator,
  createAnswerValidator,
  updateAnswerValidator,
  getAnswersValidator,
  searchValidator,
  idValidator
} = require('../validators/communityValidator');

// =============================================================================
// COMMUNITY QUESTIONS ROUTES
// =============================================================================

// Get all questions
router.get('/questions',
  validate(getQuestionsValidator),
  optionalAuth,
  communityController.getQuestions
);

// Get single question
router.get('/questions/:id',
  validate(idValidator),
  optionalAuth,
  communityController.getQuestion
);

// Create new question
router.post('/questions',
  validate(createQuestionValidator),
  auth,
  communityController.createQuestion
);

// Update question
router.put('/questions/:id',
  validate(updateQuestionValidator),
  auth,
  communityController.updateQuestion
);

// Delete question
router.delete('/questions/:id',
  validate(idValidator),
  auth,
  communityController.deleteQuestion
);

// =============================================================================
// COMMUNITY ANSWERS ROUTES
// =============================================================================

// Get answers for a question
router.get('/questions/:questionId/answers',
  validate(getAnswersValidator),
  optionalAuth,
  communityController.getAnswers
);

// Get single answer
router.get('/answers/:id',
  validate(idValidator),
  optionalAuth,
  communityController.getAnswer
);

// Create new answer
router.post('/questions/:questionId/answers',
  validate(createAnswerValidator),
  auth,
  communityController.createAnswer
);

// Update answer
router.put('/answers/:id',
  validate(updateAnswerValidator),
  auth,
  communityController.updateAnswer
);

// Delete answer
router.delete('/answers/:id',
  validate(idValidator),
  auth,
  communityController.deleteAnswer
);

// =============================================================================
// SEARCH ROUTES
// =============================================================================

// Search questions and answers
router.get('/search',
  validate(searchValidator),
  optionalAuth,
  communityController.search
);

module.exports = router; 