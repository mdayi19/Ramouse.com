

import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import Icon from './Icon';

interface ToastContainerProps {
  messages: ToastMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

const Toast: React.FC<{ message: ToastMessage; onDismiss: () => void }> = ({ message, onDismiss }) => {
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);

  useEffect(() => {
    const duration = 5000;
    const intervalTime = 10;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => Math.max(0, prev - step));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (progress <= 0) {
      onDismiss();
    }
  }, [progress, onDismiss]);

  const baseClasses = 'relative w-full max-w-sm overflow-hidden rounded-xl shadow-2xl flex items-center space-x-4 rtl:space-x-reverse animate-in fade-in slide-in-from-top-5 duration-300 border backdrop-blur-md z-[100] transition-all hover:scale-[1.02]';

  const typeStyles = {
    success: {
      container: 'bg-white/95 dark:bg-slate-800/95 border-l-4 border-l-green-500 border-slate-200 dark:border-slate-700',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      iconColor: 'text-green-600 dark:text-green-400',
      iconName: 'CheckCircle'
    },
    error: {
      container: 'bg-white/95 dark:bg-slate-800/95 border-l-4 border-l-red-500 border-slate-200 dark:border-slate-700',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      iconName: 'AlertCircle'
    },
    info: {
      container: 'bg-white/95 dark:bg-slate-800/95 border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconName: 'Info'
    },
  };

  const style = typeStyles[message.type] || typeStyles.info;

  return (
    <div
      className={`${baseClasses} ${style.container}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/20 dark:bg-black/20 rtl:rotate-180">
        <div
          className={`h-full transition-all ease-linear ${message.type === 'success' ? 'bg-green-500' : message.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={`flex-shrink-0 p-2 ml-3 rtl:ml-0 rtl:mr-3 my-3 rounded-full ${style.iconBg} ${style.iconColor}`}>
        <Icon name={style.iconName as any} className="w-5 h-5" />
      </div>
      <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug">
        {message.message}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Icon name="X" className="w-4 h-4" />
      </button>
    </div>
  );
};


const ToastContainer: React.FC<ToastContainerProps> = ({ messages, setMessages }) => {
  const dismissToast = (id: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return (
    <div className="fixed top-24 right-0 sm:right-6 w-full max-w-sm z-[100] space-y-3 px-4 sm:px-0">
      {messages.map(msg => (
        <Toast key={msg.id} message={msg} onDismiss={() => dismissToast(msg.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;