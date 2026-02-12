import React, { useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';

const TestTimer = ({ 
  initialSeconds, 
  onTimeUp, 
  onTick,
  autoStart = true,
  language = 'hi'
}) => {
  const {
    seconds,
    isRunning,
    isCritical,
    isWarning,
    formattedTime,
    timeComponents,
    start,
    pause,
    resume
  } = useTimer(initialSeconds, onTimeUp, autoStart);

  // Report time to parent on each tick
  useEffect(() => {
    if (onTick) {
      onTick(seconds);
    }
  }, [seconds, onTick]);

  const getTimerStyle = () => {
    if (isCritical) {
      return 'bg-red-100 text-red-700 border-red-300 animate-pulse';
    }
    if (isWarning) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
    return 'bg-white text-gray-800 border-gray-200';
  };

  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-mono text-lg font-bold
      transition-colors duration-300
      ${getTimerStyle()}
    `}>
      {isCritical ? (
        <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
      
      <div className="flex items-center">
        {timeComponents.hours > 0 && (
          <>
            <span className="w-8 text-center">{String(timeComponents.hours).padStart(2, '0')}</span>
            <span className="mx-1">:</span>
          </>
        )}
        <span className="w-8 text-center">{String(timeComponents.minutes).padStart(2, '0')}</span>
        <span className="mx-1">:</span>
        <span className="w-8 text-center">{String(timeComponents.seconds).padStart(2, '0')}</span>
      </div>

      {isCritical && (
        <span className="text-xs font-normal ml-2">
          {language === 'hi' ? 'समय समाप्त हो रहा है!' : 'Running out!'}
        </span>
      )}
    </div>
  );
};

export default TestTimer;