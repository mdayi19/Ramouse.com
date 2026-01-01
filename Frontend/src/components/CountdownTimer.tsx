
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, className = '' }) => {
  const calculateTimeLeft = () => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) return null;

    const difference = +date - +new Date();

    if (difference <= 0) return null;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!timeLeft) {
    return (
      <div className={`flex items-center gap-1 bg-gray-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm ${className}`}>
        <span>انتهى العرض</span>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  if (days > 0) {
    return (
      <div className={`flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm ${className}`}>
        <Icon name="Clock" className="w-3 h-3" />
        <span>بقي {days} يوم</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm animate-pulse ${className}`}>
      <Icon name="Timer" className="w-3 h-3" />
      <span dir="ltr" className="font-mono tracking-wider">
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

export default CountdownTimer;
