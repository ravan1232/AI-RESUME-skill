import React from 'react';
import { Card } from '../../components/common/Card';
import { Award } from 'lucide-react';

export const Assessments = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skill Assessments & Verification</h1>
          <p className="text-sm text-slate-500">Scheduled for implementation in Phase 4</p>
        </div>
      </div>
      <Card>
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-700 text-base">Placement Verification Engine</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-4">
            Take timed MCQ technical assessments to verify skills acquired during peer exchanges and raise your overall placement score.
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Phase 4 Core Module
          </span>
        </div>
      </Card>
    </div>
  );
};

