import React from 'react';
import { Card } from '../../components/common/Card';
import { FileText, Sparkles, Upload, CheckCircle } from 'lucide-react';

export const ResumeAnalyzer = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Resume Extractor & ATS Scorer</h1>
          <p className="text-sm text-slate-500">Scheduled for implementation in Phase 2</p>
        </div>
      </div>

      <Card>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50">
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-base">PyPDF2 Extraction Engine Ready</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Upload your PDF resume to extract contact details, technical skills, projects, and receive an instant ATS score.
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Phase 2 Core Module
          </span>
        </div>
      </Card>
    </div>
  );
};

