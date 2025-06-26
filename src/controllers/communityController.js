const { CommunityQuestion, CommunityAnswer } = require('../models');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { validationResult } = require('express-validator');

// =============================================================================
// COMMUNITY QUESTIONS CONTROLLERS
// =============================================================================

/**
 * Get all community questions with pagination
 * GET /api/community/questions
 */
const getQuestions = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'approved',
      product,
      author,
      search
    } = req.query;

    // Build query filters
    const query = { status };
    
    if (product) query.product = product;
    if (author) query.author = author;
    
    // Add text search if provided
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [questions, totalCount] = await Promise.all([
      CommunityQuestion.find(query)
        .populate('author', 'firstName lastName avatar email')
        .populate('product', 'name slug logoUrl')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      CommunityQuestion.countDocuments(query)
    ]);

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      total: totalCount,
      limit: parseInt(limit)
    };

    return res.status(200).json(apiResponse.success({ 
      questions, 
      pagination 
    }, 'Questions retrieved successfully'));

  } catch (error) {
    console.error('Get questions error:', error);
    next(error);
  }
};

/**
 * Get single question with detailed information
 * GET /api/community/questions/:id
 */
const getQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { id } = req.params;
    
    const question = await CommunityQuestion.findById(id)
      .populate('author', 'firstName lastName avatar email')
      .populate('product', 'name slug logoUrl');

    if (!question) {
      return next(new ApiError('Question not found', 'QUESTION_NOT_FOUND', 404));
    }

    return res.status(200).json(apiResponse.success(question, 'Question retrieved successfully'));

  } catch (error) {
    console.error('Get question error:', error);
    next(error);
  }
};

/**
 * Create new community question
 * POST /api/community/questions
 */
const createQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { title, product } = req.body;
    
    const questionData = {
      title,
      author: req.user._id
    };

    if (product) questionData.product = product;

    const question = new CommunityQuestion(questionData);
    await question.save();

    const populatedQuestion = await CommunityQuestion.findById(question._id)
      .populate('author', 'firstName lastName avatar email')
      .populate('product', 'name slug logoUrl');

    return res.status(201).json(apiResponse.success(populatedQuestion, 'Question created successfully'));

  } catch (error) {
    console.error('Create question error:', error);
    next(error);
  }
};

/**
 * Update community question (only by author)
 * PUT /api/community/questions/:id
 */
const updateQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { id } = req.params;
    const { title } = req.body;

    const question = await CommunityQuestion.findById(id);
    
    if (!question) {
      return next(new ApiError('Question not found', 'QUESTION_NOT_FOUND', 404));
    }

    // Check if user is the author
    if (question.author.toString() !== req.user._id.toString()) {
      return next(new ApiError('You can only edit your own questions', 'FORBIDDEN', 403));
    }

    // Update fields
    if (title) question.title = title;

    await question.save();

    const updatedQuestion = await CommunityQuestion.findById(id)
      .populate('author', 'firstName lastName avatar email')
      .populate('product', 'name slug logoUrl');

    return res.status(200).json(apiResponse.success(updatedQuestion, 'Question updated successfully'));

  } catch (error) {
    console.error('Update question error:', error);
    next(error);
  }
};

/**
 * Delete community question (only by author)
 * DELETE /api/community/questions/:id
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await CommunityQuestion.findById(id);
    
    if (!question) {
      return next(new ApiError('Question not found', 'QUESTION_NOT_FOUND', 404));
    }

    // Check if user is the author or admin
    if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError('You can only delete your own questions', 'FORBIDDEN', 403));
    }

    // Delete associated answers first
    await CommunityAnswer.deleteMany({ question: id });
    
    // Delete the question
    await CommunityQuestion.findByIdAndDelete(id);

    return res.status(200).json(apiResponse.success({}, 'Question deleted successfully'));

  } catch (error) {
    console.error('Delete question error:', error);
    next(error);
  }
};

// Voting functionality removed in simplified version

// =============================================================================
// COMMUNITY ANSWERS CONTROLLERS
// =============================================================================

/**
 * Get all answers for a question with pagination
 * GET /api/community/questions/:questionId/answers
 */
const getAnswers = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { questionId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'approved'
    } = req.query;

    // Check if question exists
    const question = await CommunityQuestion.findById(questionId);
    if (!question) {
      return next(new ApiError('Question not found', 'QUESTION_NOT_FOUND', 404));
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [answers, totalCount] = await Promise.all([
      CommunityAnswer.find({ question: questionId, status })
        .populate('author', 'firstName lastName avatar email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      CommunityAnswer.countDocuments({ question: questionId, status })
    ]);

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      total: totalCount,
      limit: parseInt(limit)
    };

    return res.status(200).json(apiResponse.success({ 
      answers, 
      pagination 
    }, 'Answers retrieved successfully'));

  } catch (error) {
    console.error('Get answers error:', error);
    next(error);
  }
};

/**
 * Get single answer
 * GET /api/community/answers/:id
 */
const getAnswer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { id } = req.params;
    
    const answer = await CommunityAnswer.findById(id)
      .populate('author', 'firstName lastName avatar email')
      .populate('question', 'title');

    if (!answer) {
      return next(new ApiError('Answer not found', 'ANSWER_NOT_FOUND', 404));
    }

    return res.status(200).json(apiResponse.success(answer, 'Answer retrieved successfully'));

  } catch (error) {
    console.error('Get answer error:', error);
    next(error);
  }
};

/**
 * Create new answer for a question
 * POST /api/community/questions/:questionId/answers
 */
const createAnswer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { questionId } = req.params;
    const { content } = req.body;

    // Check if question exists and is not closed
    const question = await CommunityQuestion.findById(questionId);
    if (!question) {
      return next(new ApiError('Question not found', 'QUESTION_NOT_FOUND', 404));
    }

    if (question.status === 'closed') {
      return next(new ApiError('This question is closed for new answers', 'QUESTION_CLOSED', 403));
    }

    const answerData = {
      content,
      question: questionId,
      author: req.user._id
    };

    const answer = new CommunityAnswer(answerData);
    await answer.save();

    const populatedAnswer = await CommunityAnswer.findById(answer._id)
      .populate('author', 'firstName lastName avatar email');

    return res.status(201).json(apiResponse.success(populatedAnswer, 'Answer created successfully'));

  } catch (error) {
    console.error('Create answer error:', error);
    next(error);
  }
};

/**
 * Update answer (only by author)
 * PUT /api/community/answers/:id
 */
const updateAnswer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const { id } = req.params;
    const { content } = req.body;

    const answer = await CommunityAnswer.findById(id);
    
    if (!answer) {
      return next(new ApiError('Answer not found', 'ANSWER_NOT_FOUND', 404));
    }

    // Check if user is the author
    if (answer.author.toString() !== req.user._id.toString()) {
      return next(new ApiError('You can only edit your own answers', 'FORBIDDEN', 403));
    }

    // Update content
    answer.content = content;
    await answer.save();

    const updatedAnswer = await CommunityAnswer.findById(id)
      .populate('author', 'firstName lastName avatar email');

    return res.status(200).json(apiResponse.success(updatedAnswer, 'Answer updated successfully'));

  } catch (error) {
    console.error('Update answer error:', error);
    next(error);
  }
};

/**
 * Delete answer (only by author)
 * DELETE /api/community/answers/:id
 */
const deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const answer = await CommunityAnswer.findById(id);
    
    if (!answer) {
      return next(new ApiError('Answer not found', 'ANSWER_NOT_FOUND', 404));
    }

    // Check if user is the author or admin
    if (answer.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError('You can only delete your own answers', 'FORBIDDEN', 403));
    }

    // Delete the answer
    await CommunityAnswer.findByIdAndDelete(id);

    return res.status(200).json(apiResponse.success({}, 'Answer deleted successfully'));

  } catch (error) {
    console.error('Delete answer error:', error);
    next(error);
  }
};

// Voting and best answer functionality removed in simplified version

/**
 * Search questions and answers
 * GET /api/community/search
 */
const search = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Validation failed', 'VALIDATION_ERROR', 400, errors.array()));
    }

    const {
      q: searchQuery,
      type = 'both',
      page = 1,
      limit = 10
    } = req.query;

    const results = { questions: [], answers: [] };
    const skip = (page - 1) * limit;

    if (type === 'questions' || type === 'both') {
      const questions = await CommunityQuestion.find({
        title: { $regex: searchQuery, $options: 'i' },
        status: 'approved'
      })
      .populate('author', 'firstName lastName avatar')
      .populate('product', 'name logoUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      results.questions = questions;
    }

    if (type === 'answers' || type === 'both') {
      const answers = await CommunityAnswer.find({
        content: { $regex: searchQuery, $options: 'i' },
        status: 'approved'
      })
      .populate('author', 'firstName lastName avatar')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      results.answers = answers;
    }

    return res.status(200).json(apiResponse.success(results, 'Search completed successfully'));

  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
};

module.exports = {
  // Question controllers
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  
  // Answer controllers
  getAnswers,
  getAnswer,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  
  // Utility controllers
  search
}; 