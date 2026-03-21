import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  className = '',
  color = 'primary',
  duration = 600
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    teal: 'text-teal-600 dark:text-teal-400'
  };

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className={`${colorClasses[color] || colorClasses.primary} ${className} tabular-nums font-bold`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;