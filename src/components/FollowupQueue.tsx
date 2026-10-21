import React from 'react';
import { Deal, User } from '../types';

interface FollowupQueueProps {
  deals: Deal[];
  currentUser: User;
  onScheduleFollowup: (dealId: string, nextAction: string, nextActionDate: string) => void;
  onLogActivity: (dealId: string, type: any, title: string, description: string) => void;
  onSelectDeal: (deal: Deal) => void;
}

export const FollowupQueue: React.FC<FollowupQueueProps> = () => {
  return (
    <div className="p-4 text-xs text-slate-300">
      Followup Queue Component (Use Next.js /queue/overdue, /queue/stale)
    </div>
  );
};
