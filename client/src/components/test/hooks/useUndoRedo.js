import { useState, useCallback } from 'react';

const useUndoRedo = (initialState = []) => {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  // SAFE: Always return initialState type if undefined
  const current = history[index] !== undefined ? history[index] : initialState;
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const push = useCallback((newState) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, index + 1);
      const limited = trimmed.length >= 50 ? trimmed.slice(1) : trimmed;
      return [...limited, newState];
    });
    setIndex(prev => {
      // Recalculate based on what history will be
      return Math.min(prev + 1, 49);
    });
  }, [index]);

  const undo = useCallback(() => {
    if (canUndo) setIndex(prev => prev - 1);
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) setIndex(prev => prev + 1);
  }, [canRedo]);

  const reset = useCallback((state) => {
    const resetState = state !== undefined ? state : initialState;
    setHistory([resetState]);
    setIndex(0);
  }, [initialState]);

  return { current, push, undo, redo, canUndo, canRedo, reset };
};

export default useUndoRedo;