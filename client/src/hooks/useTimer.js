import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Timer hook for test countdown
 * @param {number} initialSeconds - Initial time in seconds
 * @param {Function} onTimeUp - Callback when time is up
 * @param {boolean} autoStart - Auto start timer
 */
export const useTimer = (initialSeconds, onTimeUp, autoStart = false) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Update callback ref when it changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Start timer
  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  // Reset timer
  const reset = useCallback((newSeconds = initialSeconds) => {
    setSeconds(newSeconds);
    setIsRunning(false);
    setIsPaused(false);
  }, [initialSeconds]);

  // Set time
  const setTime = useCallback((newSeconds) => {
    setSeconds(newSeconds);
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (onTimeUpRef.current) {
              onTimeUpRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback(() => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, [seconds]);

  // Get time components
  const getTimeComponents = useCallback(() => {
    return {
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60
    };
  }, [seconds]);

  // Check if time is critical (less than 5 minutes)
  const isCritical = seconds < 300 && seconds > 0;

  // Check if time is warning (less than 10 minutes)
  const isWarning = seconds < 600 && seconds >= 300;

  return {
    seconds,
    isRunning,
    isPaused,
    isCritical,
    isWarning,
    formattedTime: formatTime(),
    timeComponents: getTimeComponents(),
    start,
    pause,
    resume,
    reset,
    setTime
  };
};

export default useTimer;