import React, { useEffect, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';

const TestTimer = ({
  initialSeconds,
  onTimeUp,
  onTick,
  autoStart = true,
  language = 'hi',
  compact = false
}) => {
  const { seconds, isCritical, isWarning, timeComponents } = useTimer(initialSeconds, onTimeUp, autoStart);

  useEffect(() => {
    if (onTick) onTick(seconds);
  }, [seconds, onTick]);

  const pad = (n) => String(n).padStart(2, '0');

  const timerClass = useMemo(() => {
    if (isCritical) return 'from-red-600 to-red-700 shadow-red-500/30 animate-pulse';
    if (isWarning) return 'from-amber-500 to-amber-600 shadow-amber-500/20';
    return 'from-emerald-500 to-emerald-600 shadow-emerald-500/20';
  }, [isCritical, isWarning]);

  if (compact) {
    return (
      <span className={`font-mono text-sm font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
        {timeComponents.hours > 0 && `${pad(timeComponents.hours)}:`}
        {pad(timeComponents.minutes)}:{pad(timeComponents.seconds)}
      </span>
    );
  }

  return (
    <div className={`
      inline-flex items-center gap-2.5 px-4 py-2 rounded-xl 
      bg-gradient-to-r ${timerClass}
      shadow-lg text-white font-mono select-none
    `}>
      {isCritical ? (
        <AlertTriangle className="w-4 h-4 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 opacity-80" />
      )}
      <div className="flex items-baseline gap-0.5 text-lg font-bold tracking-wider">
        {timeComponents.hours > 0 && (
          <>
            <span className="w-6 text-center">{pad(timeComponents.hours)}</span>
            <span className="text-white/60 text-sm">:</span>
          </>
        )}
        <span className="w-6 text-center">{pad(timeComponents.minutes)}</span>
        <span className="text-white/60 text-sm">:</span>
        <span className="w-6 text-center">{pad(timeComponents.seconds)}</span>
      </div>
      {isCritical && (
        <span className="text-[10px] font-sans font-medium opacity-90 ml-1 hidden sm:inline">
          {language === 'hi' ? 'जल्दी करें!' : 'Hurry!'}
        </span>
      )}
    </div>
  );
};

export default TestTimer;