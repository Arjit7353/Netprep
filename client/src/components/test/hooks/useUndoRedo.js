import { useState, useCallback, useRef } from 'react';

const useUndoRedo = (initialState = []) => {
  // ✅ Single state object — history और index एक साथ update होंगे
  const [state, setState] = useState({
    history: [initialState],
    index: 0,
  });

  const current = state.history[state.index] !== undefined
    ? state.history[state.index]
    : initialState;

  const canUndo = state.index > 0;
  const canRedo = state.index < state.history.length - 1;

  const push = useCallback((newState) => {
    setState(prev => {
      // ✅ prev.index use करो — stale closure problem नहीं होगी
      const trimmed = prev.history.slice(0, prev.index + 1);
      const limited = trimmed.length >= 50 ? trimmed.slice(1) : trimmed;
      const newHistory = [...limited, newState];
      return {
        history: newHistory,
        index: newHistory.length - 1, // ✅ always correct
      };
    });
  }, []); // ✅ कोई dependency नहीं — हमेशा fresh

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.index <= 0) return prev;
      return { ...prev, index: prev.index - 1 };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.index >= prev.history.length - 1) return prev;
      return { ...prev, index: prev.index + 1 };
    });
  }, []);

  const reset = useCallback((newState) => {
    setState({
      history: [newState !== undefined ? newState : initialState],
      index: 0,
    });
  }, []); // ✅ initialState dependency हटाई

  return { current, push, undo, redo, canUndo, canRedo, reset };
};

export default useUndoRedo;