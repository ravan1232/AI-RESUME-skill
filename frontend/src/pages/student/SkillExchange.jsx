import React from 'react';
import { Card } from '../../components/common/Card';
import { Users2 } from 'lucide-react';

export const SkillExchange = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <Users2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Peer Skill Exchange & Matchmaker</h1>
          <p className="text-sm text-slate-500">Scheduled for implementation in Phase 3</p>
        </div>
      </div>
      <Card>
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-700 text-base">Autonomous Peer Matching Engine</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-4">
            Connects missing skills with student teachers, manages exchange requests, learning sessions, and peer ratings.
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            Phase 3 Core Module
          </span>
        </div>
      </Card>
    </div>
  );
};

