import React, { createContext, useContext, useReducer, useCallback } from 'react';
import attemptService from '../services/attemptService';

// Initial State
const initialState = {
  // Test Info
  test: null,
  attempt: null,
  questions: [],
  
  // Current State
  currentIndex: 0,
  selectedAnswer: -1,
  
  // Answer tracking
  answers: [],
  
  // Timer
  remainingTime: 0,
  
  // UI State
  language: 'hi',
  isSubmitting: false,
  showSubmitModal: false,
  
  // Status
  status: 'idle', // idle | loading | active | paused | submitted | error
  error: null
};

// Action Types
const ACTIONS = {
  SET_TEST: 'SET_TEST',
  SET_ATTEMPT: 'SET_ATTEMPT',
  SET_QUESTIONS: 'SET_QUESTIONS',
  SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
  SET_ANSWER: 'SET_ANSWER',
  UPDATE_ANSWER: 'UPDATE_ANSWER',
  TOGGLE_MARK_REVIEW: 'TOGGLE_MARK_REVIEW',
  CLEAR_RESPONSE: 'CLEAR_RESPONSE',
  SET_REMAINING_TIME: 'SET_REMAINING_TIME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_STATUS: 'SET_STATUS',
  SET_ERROR: 'SET_ERROR',
  SHOW_SUBMIT_MODAL: 'SHOW_SUBMIT_MODAL',
  HIDE_SUBMIT_MODAL: 'HIDE_SUBMIT_MODAL',
  SET_SUBMITTING: 'SET_SUBMITTING',
  MARK_VISITED: 'MARK_VISITED',
  RESET: 'RESET'
};

// Reducer
const testReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_TEST:
      return { ...state, test: action.payload };
    
    case ACTIONS.SET_ATTEMPT:
      return { 
        ...state, 
        attempt: action.payload,
        answers: action.payload?.answers || [],
        remainingTime: action.payload?.remainingTime || 0,
        currentIndex: action.payload?.currentQuestionIndex || 0
      };
    
    case ACTIONS.SET_QUESTIONS:
      return { ...state, questions: action.payload };
    
    case ACTIONS.SET_CURRENT_INDEX:
      return { ...state, currentIndex: action.payload };
    
    case ACTIONS.SET_ANSWER: {
      const newAnswers = [...state.answers];
      const index = action.payload.index;
      if (newAnswers[index]) {
        newAnswers[index] = {
          ...newAnswers[index],
          selectedAnswer: action.payload.answer,
          visited: true,
          answeredAt: new Date()
        };
      }
      return { ...state, answers: newAnswers };
    }
    
    case ACTIONS.UPDATE_ANSWER: {
      const newAnswers = [...state.answers];
      const idx = newAnswers.findIndex(
        a => a.questionId === action.payload.questionId
      );
      if (idx !== -1) {
        newAnswers[idx] = { ...newAnswers[idx], ...action.payload.data };
      }
      return { ...state, answers: newAnswers };
    }
    
    case ACTIONS.TOGGLE_MARK_REVIEW: {
      const newAnswers = [...state.answers];
      const index = action.payload;
      if (newAnswers[index]) {
        newAnswers[index] = {
          ...newAnswers[index],
          markedForReview: !newAnswers[index].markedForReview
        };
      }
      return { ...state, answers: newAnswers };
    }
    
    case ACTIONS.CLEAR_RESPONSE: {
      const newAnswers = [...state.answers];
      const index = action.payload;
      if (newAnswers[index]) {
        newAnswers[index] = {
          ...newAnswers[index],
          selectedAnswer: -1,
          answeredAt: null
        };
      }
      return { ...state, answers: newAnswers };
    }
    
    case ACTIONS.SET_REMAINING_TIME:
      return { ...state, remainingTime: action.payload };
    
    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload };
    
    case ACTIONS.SET_STATUS:
      return { ...state, status: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, status: 'error' };
    
    case ACTIONS.SHOW_SUBMIT_MODAL:
      return { ...state, showSubmitModal: true };
    
    case ACTIONS.HIDE_SUBMIT_MODAL:
      return { ...state, showSubmitModal: false };
    
    case ACTIONS.SET_SUBMITTING:
      return { ...state, isSubmitting: action.payload };
    
    case ACTIONS.MARK_VISITED: {
      const newAnswers = [...state.answers];
      const index = action.payload;
      if (newAnswers[index] && !newAnswers[index].visited) {
        newAnswers[index] = { 
          ...newAnswers[index], 
          visited: true,
          visitedAt: new Date()
        };
      }
      return { ...state, answers: newAnswers };
    }
    
    case ACTIONS.RESET:
      return initialState;
    
    default:
      return state;
  }
};

// Create Context
const TestContext = createContext(null);

// Provider Component
export const TestProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testReducer, initialState);

  // Initialize test
  const initializeTest = useCallback((test, attempt) => {
    console.log('Initializing test:', test?.title, 'Attempt:', attempt?._id);
    
    dispatch({ type: ACTIONS.SET_TEST, payload: test });
    dispatch({ type: ACTIONS.SET_QUESTIONS, payload: test?.questions || [] });
    dispatch({ type: ACTIONS.SET_ATTEMPT, payload: attempt });
    dispatch({ type: ACTIONS.SET_STATUS, payload: 'active' });
    
    // Set initial remaining time
    if (attempt?.remainingTime) {
      dispatch({ type: ACTIONS.SET_REMAINING_TIME, payload: attempt.remainingTime });
    } else if (test?.duration) {
      dispatch({ type: ACTIONS.SET_REMAINING_TIME, payload: test.duration * 60 });
    }
  }, []);

  // Navigate to question
  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < state.questions.length) {
      dispatch({ type: ACTIONS.SET_CURRENT_INDEX, payload: index });
      dispatch({ type: ACTIONS.MARK_VISITED, payload: index });
      
      // Mark as visited on server (fire and forget)
      if (state.attempt && state.questions[index]) {
        attemptService.markVisited(state.attempt._id, state.questions[index]._id)
          .catch(err => console.error('Failed to mark visited:', err));
      }
    }
  }, [state.questions, state.attempt]);

  // Select answer
  const selectAnswer = useCallback(async (answer) => {
    const currentQuestion = state.questions[state.currentIndex];
    if (!currentQuestion || !state.attempt) {
      console.error('Cannot select answer - no question or attempt');
      return;
    }

    // Update local state immediately
    dispatch({ 
      type: ACTIONS.SET_ANSWER, 
      payload: { index: state.currentIndex, answer } 
    });

    // Save to server
    try {
      await attemptService.saveAnswer(
        state.attempt._id,
        currentQuestion._id,
        answer,
        0
      );
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  }, [state.currentIndex, state.questions, state.attempt]);

  // Toggle mark for review
  const toggleMarkForReview = useCallback(async () => {
    const currentQuestion = state.questions[state.currentIndex];
    if (!currentQuestion || !state.attempt) return;

    // Update local state immediately
    dispatch({ type: ACTIONS.TOGGLE_MARK_REVIEW, payload: state.currentIndex });

    // Save to server
    try {
      await attemptService.toggleMarkForReview(
        state.attempt._id,
        currentQuestion._id
      );
    } catch (error) {
      console.error('Failed to toggle mark for review:', error);
    }
  }, [state.currentIndex, state.questions, state.attempt]);

  // Clear response
  const clearResponse = useCallback(async () => {
    const currentQuestion = state.questions[state.currentIndex];
    if (!currentQuestion || !state.attempt) return;

    // Update local state immediately
    dispatch({ type: ACTIONS.CLEAR_RESPONSE, payload: state.currentIndex });

    // Save to server
    try {
      await attemptService.saveAnswer(
        state.attempt._id,
        currentQuestion._id,
        -1,
        0
      );
    } catch (error) {
      console.error('Failed to clear response:', error);
    }
  }, [state.currentIndex, state.questions, state.attempt]);

  // Save and next
  const saveAndNext = useCallback(() => {
    if (state.currentIndex < state.questions.length - 1) {
      goToQuestion(state.currentIndex + 1);
    }
  }, [state.currentIndex, state.questions.length, goToQuestion]);

  // Previous question
  const previousQuestion = useCallback(() => {
    if (state.currentIndex > 0) {
      goToQuestion(state.currentIndex - 1);
    }
  }, [state.currentIndex, goToQuestion]);

  // Show submit modal
  const openSubmitModal = useCallback(() => {
    dispatch({ type: ACTIONS.SHOW_SUBMIT_MODAL });
  }, []);

  // Hide submit modal
  const closeSubmitModal = useCallback(() => {
    dispatch({ type: ACTIONS.HIDE_SUBMIT_MODAL });
  }, []);

  // Submit test - FIXED VERSION
  const submitTest = useCallback(async () => {
    if (!state.attempt) {
      console.error('Cannot submit - no attempt found');
      return { success: false, error: 'No attempt found' };
    }

    const attemptId = state.attempt._id;
    console.log('Submitting test, Attempt ID:', attemptId);

    dispatch({ type: ACTIONS.SET_SUBMITTING, payload: true });

    try {
      const response = await attemptService.submitAttempt(
        attemptId,
        state.remainingTime
      );
      
      console.log('Submit API Response:', response);
      
      dispatch({ type: ACTIONS.SET_STATUS, payload: 'submitted' });
      dispatch({ type: ACTIONS.HIDE_SUBMIT_MODAL });
      
      // Return success with attemptId
      return {
        success: true,
        attemptId: attemptId,
        data: response.data || response
      };
    } catch (error) {
      console.error('Submit test error:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [state.attempt, state.remainingTime]);

  // Change language
  const setLanguage = useCallback((lang) => {
    dispatch({ type: ACTIONS.SET_LANGUAGE, payload: lang });
    localStorage.setItem('netprep-language', lang);
  }, []);

  // Update remaining time
  const updateRemainingTime = useCallback((time) => {
    dispatch({ type: ACTIONS.SET_REMAINING_TIME, payload: time });
  }, []);

  // Reset test
  const resetTest = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  // Get current question
  const currentQuestion = state.questions[state.currentIndex] || null;
  const currentAnswer = state.answers[state.currentIndex] || null;

  // Get status summary
  const getStatusSummary = useCallback(() => {
    const summary = {
      total: state.answers.length,
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      answeredAndMarked: 0,
      notVisited: 0
    };

    state.answers.forEach(answer => {
      if (!answer || !answer.visited) {
        summary.notVisited++;
      } else if (answer.selectedAnswer !== -1 && answer.markedForReview) {
        summary.answeredAndMarked++;
      } else if (answer.markedForReview) {
        summary.markedForReview++;
      } else if (answer.selectedAnswer !== -1) {
        summary.answered++;
      } else {
        summary.notAnswered++;
      }
    });

    return summary;
  }, [state.answers]);

  // Get answer statuses for palette
  const getAnswerStatuses = useCallback(() => {
    return state.answers.map(answer => {
      if (!answer || !answer.visited) {
        return 'not_visited';
      } else if (answer.selectedAnswer !== -1 && answer.markedForReview) {
        return 'answered_marked';
      } else if (answer.markedForReview) {
        return 'marked';
      } else if (answer.selectedAnswer !== -1) {
        return 'answered';
      } else {
        return 'not_answered';
      }
    });
  }, [state.answers]);

  const value = {
    // State
    ...state,
    currentQuestion,
    currentAnswer,
    
    // Computed
    getStatusSummary,
    getAnswerStatuses,
    
    // Actions
    initializeTest,
    goToQuestion,
    selectAnswer,
    toggleMarkForReview,
    clearResponse,
    saveAndNext,
    previousQuestion,
    openSubmitModal,
    closeSubmitModal,
    submitTest,
    setLanguage,
    updateRemainingTime,
    resetTest
  };

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  );
};

// Custom hook to use test context
export const useTestContext = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
};

export default TestContext;