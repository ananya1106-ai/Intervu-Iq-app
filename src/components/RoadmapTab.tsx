import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  CirclePlay,
  FileCode2,
  ExternalLink,
  RefreshCw,
  Target,
  Code2,
  HelpCircle,
  AlertCircle,
  FileSearch,
  MessageSquareCode
} from 'lucide-react';
import { auth } from '../firebase';
import { RoadmapMilestone, RoadmapData, PageType } from '../types';
import { generateAndFetchRoadmap, updateMilestoneStatusInFirestore } from '../services/roadmapService';

function formatLastUpdated(lastUpdated: any): string {
  if (!lastUpdated) return '';
  let date: Date;
  if (typeof lastUpdated?.toDate === 'function') {
    date = lastUpdated.toDate();
  } else if (lastUpdated?.seconds) {
    date = new Date(lastUpdated.seconds * 1000);
  } else {
    date = new Date(lastUpdated);
  }
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RoadmapTabProps {
  onNavigateTab?: (tab: PageType) => void;
}

export const RoadmapTab: React.FC<RoadmapTabProps> = ({ onNavigateTab }) => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapMilestone | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmptyState, setIsEmptyState] = useState<boolean>(false);

  const uid = auth.currentUser?.uid;

  // Load roadmap on mount or uid change
  const loadRoadmap = async (forceRegenerate: boolean = false) => {
    if (!uid) {
      setIsLoading(false);
      setIsEmptyState(true);
      return;
    }

    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await generateAndFetchRoadmap(uid, forceRegenerate);
      if (!data || !data.milestones || data.milestones.length === 0) {
        setIsEmptyState(true);
        setRoadmapData(null);
        setSelectedMilestone(null);
      } else {
        setIsEmptyState(false);
        setRoadmapData(data);
        // Default to first incomplete or first milestone
        const firstIncomplete = data.milestones.find(m => m.status !== 'COMPLETED' && m.status !== 'completed') || data.milestones[0];
        setSelectedMilestone(firstIncomplete);
      }
    } catch (err: any) {
      console.error("Error loading roadmap:", err);
      setError("Failed to generate or load your personalized roadmap. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    loadRoadmap(false);
  }, [uid]);

  // Handle milestone status toggle
  const handleToggleStatus = async (milestoneId: string, nextStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!uid || !roadmapData) return;

    // Optimistic UI update
    const updatedMilestones = roadmapData.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, status: nextStatus };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter(m => m.status === 'COMPLETED' || m.status === 'completed').length;
    const overallProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    const updatedData: RoadmapData = {
      ...roadmapData,
      milestones: updatedMilestones,
      completedCount,
      overallProgress
    };

    setRoadmapData(updatedData);
    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone({ ...selectedMilestone, status: nextStatus });
    }

    // Persist to Firestore
    try {
      await updateMilestoneStatusInFirestore(uid, milestoneId, nextStatus);
    } catch (err) {
      console.error("Error saving milestone update to Firestore:", err);
    }
  };

  // Calculating overall statistics
  const milestones = roadmapData?.milestones || [];
  const completedCount = milestones.filter(m => m.status === 'COMPLETED' || m.status === 'completed').length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  // Render Skeleton Loading State
  if (isLoading) {
    return (
      <div className="space-y-8 text-left animate-pulse">
        <div className="bg-gradient-to-r from-[#111422] to-[#0d0f17] border border-zinc-800 rounded-2xl p-8 flex justify-between items-center h-32">
          <div className="space-y-3 w-2/3">
            <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
            <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
            <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
          </div>
          <div className="w-16 h-16 bg-zinc-800 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl h-24"></div>
            ))}
          </div>
          <div className="lg:col-span-5 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 h-[460px]"></div>
        </div>
      </div>
    );
  }

  // Render Empty State if no interviews and no ATS analysis exist
  if (isEmptyState) {
    return (
      <div className="bg-gradient-to-br from-[#111422] via-[#0d0f17] to-[#090a0f] border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 my-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Generate Your Personalized Roadmap</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            Your Placement Roadmap is calibrated using real skill gaps detected from your ATS Resume Analysis and Mock Interview sessions.
          </p>
        </div>

        <div className="bg-[#141722]/60 p-5 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 max-w-lg mx-auto text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-400">
            <Target className="w-4 h-4" /> How to activate your roadmap:
          </div>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Run an ATS Resume Scan to extract target role keywords</li>
            <li>Complete a 10-question Mock Interview round</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button 
            id="empty-roadmap-analyze-resume"
            onClick={() => onNavigateTab?.('resume-analyzer')}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30"
          >
            <FileSearch className="w-4 h-4" />
            Analyze Resume
          </button>
          
          <button 
            id="empty-roadmap-start-interview"
            onClick={() => onNavigateTab?.('mock-interview')}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-2"
          >
            <MessageSquareCode className="w-4 h-4" />
            Start Mock Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="roadmap-tab-container" className="space-y-8 text-left">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-[#111422] via-[#0d0f17] to-[#0a0c14] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="text-left max-w-xl space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-400 font-medium w-fit">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Data-Driven Adaptive Path
            </div>

            {roadmapData?.lastProcessedInterviewId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium w-fit shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Updated after latest interview
                {roadmapData?.lastUpdated && (
                  <span className="text-zinc-400 text-[10px] ml-1 font-mono">
                    ({formatLastUpdated(roadmapData.lastUpdated)})
                  </span>
                )}
              </div>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Personalized Placement Roadmap</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Calibrated specifically for <span className="text-indigo-300 font-semibold">{roadmapData?.targetRole || 'Software Engineer'}</span> to bridge gaps from your ATS resume scan and mock interview metrics.
          </p>
        </div>

        {/* Dynamic Progress indicator & Regenerate button */}
        <div className="flex flex-wrap items-center gap-4 z-10">
          <div className="flex items-center gap-4 bg-[#141722]/70 border border-zinc-800/80 p-4 rounded-xl min-w-[200px]">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="transparent" stroke="#1c2135" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="transparent" stroke="#6366f1" strokeWidth="4" 
                  strokeDasharray={2 * Math.PI * 20} 
                  strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)} 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-400 font-mono">
                {progressPercent}%
              </div>
            </div>
            
            <div className="text-left">
              <span className="block text-[10px] text-zinc-500 uppercase font-semibold">Overall Path</span>
              <span className="text-sm font-bold text-white block mt-0.5">{completedCount} of {milestones.length} Completed</span>
            </div>
          </div>

          <button
            id="regenerate-roadmap-btn"
            onClick={() => loadRoadmap(true)}
            disabled={isRegenerating}
            className="px-4 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
            title="Recalibrate roadmap with latest ATS and Mock Interview results"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-indigo-400' : ''}`} />
            {isRegenerating ? 'Recalibrating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* DUAL WORKSPACE: ROADMAP TIMELINE & DETAIL VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Roadmap Step List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Milestone Pipeline ({milestones.length} Modules)</h3>
          </div>
          
          <div className="space-y-4 relative pl-4 border-l border-zinc-800">
            {milestones.map((milestone, index) => {
              const isSelected = selectedMilestone?.id === milestone.id;
              const isCompleted = milestone.status === 'COMPLETED' || milestone.status === 'completed';
              const isInProgress = milestone.status === 'IN_PROGRESS' || milestone.status === 'unlocked';

              const difficultyColor = milestone.difficulty === 'Hard' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : milestone.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

              return (
                <div 
                  key={milestone.id}
                  onClick={() => setSelectedMilestone(milestone)}
                  className={`p-5 rounded-2xl border transition-all relative cursor-pointer select-none ${isSelected ? 'bg-[#141722] border-indigo-500/50 shadow-lg shadow-indigo-950/20' : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/60'}`}
                >
                  {/* Timeline bullet indicator */}
                  <span className={`absolute -left-[25px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-indigo-500 border-indigo-500' : isInProgress ? 'bg-[#090a0f] border-indigo-400 animate-pulse' : 'bg-[#090a0f] border-zinc-700'}`} />

                  <div className="flex justify-between items-start gap-4">
                    <div className="text-left space-y-1.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                          Milestone 0{milestone.milestoneNumber || index + 1} • {milestone.category}
                        </span>
                        {milestone.difficulty && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${difficultyColor}`}>
                            {milestone.difficulty}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-white leading-tight">{milestone.title}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{milestone.description}</p>
                    </div>

                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg block" title="Completed">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : isInProgress ? (
                        <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg block animate-pulse" title="In Progress">
                          <Clock className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-lg block" title="Not Started">
                          <Clock className="w-4 h-4 opacity-50" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Active Practice Details Panel */}
        <div className="lg:col-span-5 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-fit min-h-[480px]">
          {selectedMilestone ? (
            <div className="space-y-5 text-left">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Selected Training Unit</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Module 0{selectedMilestone.milestoneNumber}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">{selectedMilestone.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{selectedMilestone.description}</p>
              </div>

              {/* WHY SELECTED CALLOUT */}
              {selectedMilestone.whySelected && (
                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-400 text-[11px] uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" /> Why This Module Was Selected:
                  </span>
                  <p className="text-[11px] leading-relaxed text-indigo-200/90">{selectedMilestone.whySelected}</p>
                </div>
              )}

              {/* Specifications block */}
              <div className="grid grid-cols-3 gap-2 bg-[#141722]/60 p-3.5 rounded-xl border border-zinc-800/80 text-xs">
                <div>
                  <span className="block text-zinc-500 font-medium text-[10px] mb-0.5">Est. Practice</span>
                  <span className="font-bold text-white font-mono text-[11px]">{selectedMilestone.estimatedMinutes} mins</span>
                </div>
                <div>
                  <span className="block text-zinc-500 font-medium text-[10px] mb-0.5">Category</span>
                  <span className="font-bold text-white truncate block text-[11px]">{selectedMilestone.category}</span>
                </div>
                <div>
                  <span className="block text-zinc-500 font-medium text-[10px] mb-0.5">Difficulty</span>
                  <span className="font-bold text-indigo-300 text-[11px]">{selectedMilestone.difficulty || 'Medium'}</span>
                </div>
              </div>

              {/* Required Skills Badges */}
              {selectedMilestone.requiredSkills && selectedMilestone.requiredSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Key Target Competencies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMilestone.requiredSkills.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical Task */}
              {selectedMilestone.practicalTask && (
                <div className="bg-[#090a0f] p-3.5 rounded-xl border border-zinc-800/70 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" /> Practical Task
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{selectedMilestone.practicalTask}</p>
                </div>
              )}

              {/* Interview Practice Questions */}
              {selectedMilestone.interviewQuestions && selectedMilestone.interviewQuestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Questions To Prepare
                  </span>
                  <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside bg-[#090a0f] p-3 rounded-xl border border-zinc-800/50">
                    {selectedMilestone.interviewQuestions.map((q, idx) => (
                      <li key={idx} className="leading-normal text-zinc-300/90">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resource Checklist list */}
              {selectedMilestone.resources && selectedMilestone.resources.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Required Practice & Study Links</span>
                  <div className="space-y-2">
                    {selectedMilestone.resources.map((res, i) => {
                      const searchUrl = res.url || `https://www.google.com/search?q=${encodeURIComponent(res.title)}`;
                      return (
                        <div key={i} className="flex justify-between items-center bg-[#090a0f] p-3 rounded-xl border border-zinc-800/50 text-xs">
                          <div className="flex items-center gap-2.5 text-zinc-300">
                            {res.type === 'video' ? <CirclePlay className="w-4 h-4 text-rose-400 flex-shrink-0" /> : <FileCode2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            <span className="font-medium truncate max-w-[190px]">{res.title}</span>
                          </div>
                          <a 
                            href={searchUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold text-[11px]"
                          >
                            Launch <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Toggle Action Buttons */}
              <div className="pt-2">
                {selectedMilestone.status === 'COMPLETED' || selectedMilestone.status === 'completed' ? (
                  <button 
                    id="milestone-mark-incomplete"
                    onClick={() => handleToggleStatus(selectedMilestone.id, 'NOT_STARTED')}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all flex items-center justify-center gap-2"
                  >
                    Mark Milestone as Incomplete
                  </button>
                ) : selectedMilestone.status === 'IN_PROGRESS' || selectedMilestone.status === 'unlocked' ? (
                  <button 
                    id="milestone-mark-completed"
                    onClick={() => handleToggleStatus(selectedMilestone.id, 'COMPLETED')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20"
                  >
                    Mark Milestone as Completed <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      id="milestone-start-learning"
                      onClick={() => handleToggleStatus(selectedMilestone.id, 'IN_PROGRESS')}
                      className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl transition-all"
                    >
                      Start Learning
                    </button>
                    <button 
                      id="milestone-mark-completed-direct"
                      onClick={() => handleToggleStatus(selectedMilestone.id, 'COMPLETED')}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      Mark Complete <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500 text-xs">
              Select any milestone card on the left timeline pipeline to view training specs and study links.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
