'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Search, Loader2, Code, FunctionSquare, Boxes, AlertCircle,
  ChevronDown, ChevronUp, FileText, Brain
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface AnalysisData {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  languages: Record<string, number>;
  topFunctions?: Array<{ name: string; language: string }>;
  topClasses?: Array<{ name: string; language: string }>;
}

interface AnalysisResultsProps {
  repoId: string;
  onAskAI?: (question: string) => void;
}

export function AnalysisResults({ repoId, onAskAI }: AnalysisResultsProps) {
  const [question, setQuestion] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    languages: true,
    functions: false,
    classes: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['analysis', repoId],
    queryFn: async () => {
      const res = await apiClient.get(`/repos/${repoId}/analysis`);
      return res.data.data as AnalysisData;
    },
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && onAskAI) {
      onAskAI(question);
      setQuestion('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick AI Question Bar */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-xl p-4">
        <form onSubmit={handleAskQuestion} className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2.5">
            <Brain size={18} className="text-purple-400 flex-shrink-0" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about this codebase..."
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors"
          >
            Ask AI
          </button>
        </form>
      </div>

      {/* Analysis Summary */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-gray-400 p-8">
          <Loader2 size={18} className="animate-spin" />
          <p>Loading analysis results...</p>
        </div>
      ) : !data ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          <AlertCircle size={24} className="mx-auto mb-2 text-yellow-500" />
          <p>No analysis data available yet. Repository might still be processing.</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: 'Files', value: data.totalFiles, color: 'text-blue-400' },
              { icon: FunctionSquare, label: 'Functions', value: data.totalFunctions, color: 'text-green-400' },
              { icon: Boxes, label: 'Classes', value: data.totalClasses, color: 'text-yellow-400' },
              { icon: Code, label: 'Languages', value: Object.keys(data.languages).length, color: 'text-purple-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={color} />
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{formatNumber(value)}</p>
              </div>
            ))}
          </div>

          {/* Languages Breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('languages')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-white">
                <Code size={16} className="text-blue-400" />
                Languages Used
              </div>
              {expandedSections.languages ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </button>

            {expandedSections.languages && (
              <div className="border-t border-gray-800 px-4 py-3">
                <div className="space-y-2">
                  {Object.entries(data.languages).map(([lang, count]) => (
                    <div key={lang} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{lang}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-gray-800 rounded-full w-32">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${Math.max(
                                10,
                                (count / Math.max(...Object.values(data.languages))) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-gray-500 w-8 text-right">{formatNumber(count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Functions */}
          {data.topFunctions && data.topFunctions.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('functions')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 font-medium text-white">
                  <FunctionSquare size={16} className="text-green-400" />
                  Top {data.topFunctions.length} Functions
                </div>
                {expandedSections.functions ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSections.functions && (
                <div className="border-t border-gray-800 max-h-64 overflow-y-auto">
                  {data.topFunctions.map((func, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 border-b border-gray-800 last:border-b-0 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-mono truncate">{func.name}</p>
                        <span className="text-xs text-gray-500">{func.language}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top Classes */}
          {data.topClasses && data.topClasses.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('classes')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 font-medium text-white">
                  <Boxes size={16} className="text-yellow-400" />
                  Top {data.topClasses.length} Classes
                </div>
                {expandedSections.classes ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSections.classes && (
                <div className="border-t border-gray-800 max-h-64 overflow-y-auto">
                  {data.topClasses.map((cls, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 border-b border-gray-800 last:border-b-0 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-mono truncate">{cls.name}</p>
                        <span className="text-xs text-gray-500">{cls.language}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
