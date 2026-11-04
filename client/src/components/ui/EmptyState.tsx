import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="empty-state flex flex-col items-center justify-center px-4 py-16 text-center">
      <img src="/favicon.png" alt="" aria-hidden="true" className="mb-4 h-16 w-16 object-contain drop-shadow-md" />
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2fa]">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-[#14214a]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-[#5d6985]">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
