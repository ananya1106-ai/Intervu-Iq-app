import React, { useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  User, 
  Clock, 
  Calendar,
  Sparkles,
  Video,
  Target,
  BarChart2,
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { InterviewSessionData, getFormattedInterviewDate } from '../services/interviewService';
import { InterviewReportDetail } from './InterviewReportDetail';
import { PageType } from '../types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface PerformanceTabProps {
  interviews: (InterviewSessionData & { id: string })[];
  selectedInterview?: (InterviewSessionData & { id: string }) | null;
  onClearSelectedInterview?: () => void;
  onNavigateTab: (tab: PageType) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ 
  interviews = [], 
  selectedInterview: externalSelectedInterview = null,
  onClearSelectedInterview,
  onNavigateTab 
}) => {
  const [internalSelected, setInternalSelected] = useState<(InterviewSessionData & { id: string }) | null>(null);

  const activeDetail = externalSelectedInterview || internalSelected;

  const handleCloseDetail = () => {
    setInternalSelected(null);
    if (onClearSelectedInterview) {
      onClearSelectedInterview();
    }
  };

  // If viewing a report, render InterviewReportDetail
  if (activeDetail) {
    return (
      <InterviewReportDetail 
        interview={activeDetail} 
        onClose={handleCloseDetail} 
      />
    );
  }

  const totalInterviews = interviews.length;
  const hasInterviews = totalInterviews > 0;

  // Calculate real performance stats
  const overallScores = interviews.map(i => i.feedback?.overallScore ?? 0);
  const avgScore = hasInterviews ? Math.round(overallScores.reduce((a, b) => a + b, 0) / totalInterviews) : 0;
  const bestScore = hasInterviews ? Math.max(...overallScores) : 0;
  const latestScore = hasInterviews ? (interviews[0]?.feedback?.overallScore ?? 0) : 0;

  // Category averages
  const avgComm = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.communication ?? 0), 0) / totalInterviews) : 0;
  const avgTech = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.technicalKnowledge ?? 0), 0) / totalInterviews) : 0;
  const avgConf = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.confidence ?? 0), 0) / totalInterviews) : 0;
  const avgProb = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.problemSolving ?? 0), 0) / totalInterviews) : 0;

  // Historical trend data (oldest first)
  const historyData = interviews.slice().reverse().map((item) => ({
    name: getFormattedInterviewDate(item.createdAt),
    overall: item.feedback?.overallScore ?? 0,
    technical: item.feedback?.technicalKnowledge ?? 0,
    communication: item.feedback?.communication ?? 0,
    confidence: item.feedback?.confidence ?? 0,
    problemSolving: item.feedback?.problemSolving ?? 0
  }));

  // Radar chart data for the most recent interview session
  const latestSession = interviews[0];
  const radarData = latestSession ? [
    { subject: 'Technical', A: latestSession.feedback?.technicalKnowledge ?? 80, fullMark: 100 },
    { subject: 'Communication', A: latestSession.feedback?.communication ?? 80, fullMark: 100 },
    { subject: 'Confidence', A: latestSession.feedback?.confidence ?? 80, fullMark: 100 },
    { subject: 'Problem Solving', A: latestSession.feedback?.problemSolving ?? 80, fullMark: 100 },
    { subject: 'Overall', A: latestSession.feedback?.overallScore ?? 80, fullMark: 100 }
  ] : [
    { subject: 'Technical', A: 0, fullMark: 100 },
    { subject: 'Communication', A: 0, fullMark: 100 },
    { subject: 'Confidence', A: 0, fullMark: 100 },
    { subject: 'Problem Solving', A: 0, fullMark: 100 },
    { subject: 'Overall', A: 0, fullMark: 100 }
  ];

  const badges = [
    { id: 'bd-1', title: 'STAR Method Practitioner', desc: 'Structured behavioral answers with clear Situation, Task, Action, Result framing.', icon: <Award className="w-5 h-5 text-emerald-400" />, unlocked: totalInterviews >= 1 },
    { id: 'bd-2', title: 'Technical Mastery', desc: 'Achieved 80%+ score in a technical interview round.', icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />, unlocked: bestScore >= 80 },
    { id: 'bd-3', title: 'Consistency Champion', desc: 'Completed 3 or more mock sessions in Firestore.', icon: <Sparkles className="w-5 h-5 text-amber-400" />, unlocked: totalInterviews >= 3 },
    { id: 'bd-4', title: 'Eloquence Master', desc: 'Scored 85%+ in communication and vocal pitch parameters.', icon: <Flame className="w-5 h-5 text-rose-400" />, unlocked: avgComm >= 85 }
  ];

  return (
    <div id="performance-tab-container" className="space-y-8 text-left animate-fadeIn">
      {/* SECTION TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Interview History & Performance Dashboard</h2>
          <p className="text-xs text-zinc-400">Track past mock sessions, view evaluation reports, and monitor progress trends.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#111422] border border-zinc-800 px-4 py-2 rounded-xl">
          <Video className="w-4.5 h-4.5 text-emerald-400" />
          <span className="text-xs text-zinc-300 font-semibold">{totalInterviews} Saved Sessions</span>
        </div>
      </div>

      {/* DASHBOARD STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0d0f17] border border-zinc-800 p-4.5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Interviews</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{totalInterviews}</span>
        </div>
        <div className="bg-[#0d0f17] border border-zinc-800 p-4.5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Average Score</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
            {hasInterviews ? `${avgScore}%` : '--'}
          </span>
        </div>
        <div className="bg-[#0d0f17] border border-zinc-800 p-4.5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Best Score</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            {hasInterviews ? `${bestScore}%` : '--'}
          </span>
        </div>
        <div className="bg-[#0d0f17] border border-zinc-800 p-4.5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 uppercase font-bold block">Latest Score</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
            {hasInterviews ? `${latestScore}%` : '--'}
          </span>
        </div>
      </div>

      {/* SCORE BREAKDOWN METRICS */}
      {hasInterviews && (
        <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" /> Metric Averages Across All Sessions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Communication</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{avgComm}%</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Technical Knowledge</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{avgTech}%</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Confidence</span>
              <span className="text-2xl font-extrabold text-purple-400 mt-1 block">{avgConf}%</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Problem Solving</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{avgProb}%</span>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS BENTO GRID */}
      {hasInterviews && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Radar Chart (Latest Session) */}
          <div className="lg:col-span-4 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 text-left">
            <h3 className="text-sm font-bold text-white mb-1">Latest Session Radar</h3>
            <p className="text-xs text-zinc-500 mb-4">Skill vector mapping from your most recent interview.</p>
            
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" fontSize={8} />
                  <Radar name="Candidate" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart (Score Trajectory Over Time) */}
          <div className="lg:col-span-8 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 text-left">
            <h3 className="text-sm font-bold text-white mb-1">Performance Progress Trajectory</h3>
            <p className="text-xs text-zinc-500 mb-4">Historical score progression over saved mock sessions.</p>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0e111a', border: '1px solid #27272a', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="overall" stroke="#10b981" strokeWidth={3} name="Overall Score" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="technical" stroke="#6366f1" strokeWidth={1.5} name="Technical" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="communication" stroke="#c084fc" strokeWidth={1.5} name="Communication" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW HISTORY CARDS SECTION */}
      <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 text-left space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Interview History ({totalInterviews})
            </h3>
            <p className="text-xs text-zinc-500">Fetched directly from Firestore (`users/{'{uid}'}/interviews`). Click any session to view its saved evaluation report.</p>
          </div>
        </div>

        {hasInterviews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviews.map((int) => {
              const score = int.feedback?.overallScore ?? 0;
              const dateStr = getFormattedInterviewDate(int.createdAt);

              return (
                <div 
                  key={int.id}
                  onClick={() => setInternalSelected(int)}
                  className="bg-[#141722] hover:bg-[#1a1f30] border border-zinc-800 hover:border-emerald-500/40 p-5 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {dateStr}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-zinc-400" />
                        <span>{int.role || 'Software Engineer'}</span>
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-semibold text-zinc-300">
                          {int.interviewType || 'Mixed'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-semibold text-zinc-400">
                          {int.difficulty || 'Medium'} Tier
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Overall Score</span>
                      <span className={`text-xl font-extrabold ${score >= 71 ? 'text-emerald-400' : score >= 41 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {score}%
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white border border-indigo-500/30 text-xs rounded-xl font-semibold transition-all flex items-center gap-1"
                    >
                      <span>View Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="py-12 px-6 text-center bg-[#141722]/30 rounded-xl border border-zinc-800/60 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500">
              <Video className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">No interviews completed yet.</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Complete your first AI mock interview to generate real performance history, score breakdown metrics, and a skill radar.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('mock-interview')}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-2"
            >
              <Video className="w-4 h-4 fill-zinc-950" />
              <span>Start Mock Interview</span>
            </button>
          </div>
        )}
      </div>

      {/* BADGES SECTION */}
      <div className="text-left">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" /> Milestone Verification Badges
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <div 
              key={badge.id}
              className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-44 transition-all ${badge.unlocked ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-950/20 border-zinc-900/50 opacity-40'}`}
            >
              <div>
                <div className={`p-3 rounded-xl w-fit mb-4 ${badge.unlocked ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-900 border border-zinc-900'}`}>
                  {badge.icon}
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">{badge.title}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{badge.desc}</p>
              </div>
              
              <span className={`text-[10px] font-bold uppercase tracking-wider block mt-4 ${badge.unlocked ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
