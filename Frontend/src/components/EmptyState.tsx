import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <div className="text-center py-12 px-6 bg-slate-100 dark:bg-darkbg/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
      {icon && <div className="mb-4">{icon}</div>}
      {title && <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>}
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
