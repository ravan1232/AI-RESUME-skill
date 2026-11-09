import React from 'react';
import { Card } from '../../components/common/Card';
import { Briefcase } from 'lucide-react';

export const JobMatcher = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Description Skill Gap Analyzer</h1>
          <p className="text-sm text-slate-500">Scheduled for implementation in Phase 2</p>
        </div>
      </div>
      <Card>
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-700 text-base">Placement Requirement Comparator</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-4">
            Compares JD requirements against extracted resume skills to calculate missing skills, generate personalized learning roadmaps, and initiate autonomous peer partner discovery.
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            Phase 2 Core Module
          </span>
        </div>
      </Card>
    </div>
  );
};

