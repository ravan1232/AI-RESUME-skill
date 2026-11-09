import React from 'react';
import { Card } from '../../components/common/Card';
import { BotMessageSquare } from 'lucide-react';

export const MockInterview = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <BotMessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Mock Interview Simulator</h1>
          <p className="text-sm text-slate-500">Scheduled for implementation in Phase 4</p>
        </div>
      </div>
      <Card>
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-700 text-base">Groq LLaMA Interview Evaluation</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-4">
            Practice technical and behavioral interview questions tailored to your desired job roles with instant AI feedback.
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Phase 4 Core Module
          </span>
        </div>
      </Card>
    </div>
  );
};

