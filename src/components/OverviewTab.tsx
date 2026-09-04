import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Award, 
  Mic, 
  FileText, 
  Video, 
  ArrowRight, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Flame,
  Target,
  BarChart2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { UserProfile, RoadmapNode, PageType } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '../firebase';
import { getUserAtsData } from '../services/atsService';
import { InterviewSessionData, getFormattedInterviewDate } from '../services/interviewService';

interface OverviewTabProps {
  user: UserProfile;
  interviews: (InterviewSessionData & { id: string })[];
  roadmap: RoadmapNode[];
  onNavigateTab: (tab: PageType) => void;
  onSelectInterviewDetail: (interview: InterviewSessionData & { id: string }) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  user, 
  interviews = [], 
  roadmap = [], 
  onNavigateTab,
  onSelectInterviewDetail 
}) => {
  const [atsScore, setAtsScore] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAtsScore = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const atsData = await getUserAtsData(uid);
          if (atsData && typeof atsData.score === 'number' && isMounted) {
            setAtsScore(atsData.score);
          }
        } catch (err) {
          console.error("Error fetching ATS score in OverviewTab:", err);
        }
      }
    };

    fetchAtsScore();

    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u?.uid) {
        fetchAtsScore();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const totalInterviews = interviews.length;
  const hasInterviews = totalInterviews > 0;

  // Calculate real performance stats from Firestore data
  const overallScores = interviews.map(i => i.feedback?.overallScore ?? 0);
  const avgScore = hasInterviews ? Math.round(overallScores.reduce((a, b) => a + b, 0) / totalInterviews) : 0;
  const bestScore = hasInterviews ? Math.max(...overallScores) : 0;
  const latestScore = hasInterviews ? (interviews[0]?.feedback?.overallScore ?? 0) : 0;

  // Calculate category averages
  const avgComm = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.communication ?? 0), 0) / totalInterviews) : 0;
  const avgTech = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.technicalKnowledge ?? 0), 0) / totalInterviews) : 0;
  const avgConf = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.confidence ?? 0), 0) / totalInterviews) : 0;
  const avgProb = hasInterviews ? Math.round(interviews.reduce((a, b) => a + (b.feedback?.problemSolving ?? 0), 0) / totalInterviews) : 0;

  // Count interviews completed this month
  const now = new Date();
  const completedThisMonth = interviews.filter(i => {
    if (!i.createdAt) return false;
    const d = typeof i.createdAt.toDate === 'function' ? i.createdAt.toDate() : new Date(i.createdAt.seconds ? i.createdAt.seconds * 1000 : i.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Real chart data reversed (oldest first to newest)
  const chartData = interviews.slice().reverse().map((item) => ({
    name: getFormattedInterviewDate(item.createdAt),
    score: item.feedback?.overallScore ?? 0,
    role: item.role || 'Software Engineer'
  }));

  const nextMilestone = roadmap.find(node => node.status === 'unlocked') || roadmap[0];

  return (
    <div id="overview-tab-container" className="space-y-8 text-left">
      {/* WELCOME MOTIVATIONAL HERO */}
      <div className="bg-gradient-to-r from-[#111422] via-[#0d0f17] to-[#0a0c14] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium w-fit mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI Placement Calibration Engine Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Targeting <span className="text-white font-medium">{user.targetRole || 'Software Engineer'}</span>. You have completed <span className="text-emerald-400 font-bold">{totalInterviews} mock interview sessions</span> in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#161a29]/80 border border-zinc-800/50 p-4 rounded-xl">
          <Flame className="w-6 h-6 text-orange-500 animate-bounce" />
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Completed Sessions</span>
            <span className="text-lg font-extrabold text-white">{totalInterviews} Sessions Saved</span>
          </div>
        </div>
      </div>

      {/* METRICS ROW (REAL FIRESTORE DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Interviews */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-5 rounded-2xl text-left flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Interviews</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{totalInterviews}</span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {completedThisMonth} completed this month
          </span>
        </div>

        {/* Average Interview Score */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-5 rounded-2xl text-left flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Average Score</span>
              <span className="text-3xl font-extrabold text-white block mt-1">
                {hasInterviews ? `${avgScore}%` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">
            {hasInterviews ? `Mean of ${totalInterviews} sessions` : 'No sessions recorded'}
          </span>
        </div>

        {/* Best Interview Score */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-5 rounded-2xl text-left flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Best Score</span>
              <span className="text-3xl font-extrabold text-emerald-400 block mt-1">
                {hasInterviews ? `${bestScore}%` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">
            {hasInterviews ? `Latest score: ${latestScore}%` : 'No sessions recorded'}
          </span>
        </div>

        {/* ATS Resume Grade */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-5 rounded-2xl text-left flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">ATS Resume Grade</span>
              {atsScore !== null ? (
                <span className={`text-3xl font-extrabold block mt-1 ${atsScore <= 40 ? 'text-rose-400' : atsScore <= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {atsScore}/100
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateTab('resume-analyzer')}
                  className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Resume</span>
                </button>
              )}
            </div>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-500 block truncate">
            {user.resumeFileName ? `File: ${user.resumeFileName}` : 'No resume uploaded'}
          </span>
        </div>
      </div>

      {/* SCORE BREAKDOWN METRICS (If interviews exist) */}
      {hasInterviews && (
        <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" /> Historical Category Score Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Communication</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{avgComm}%</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Technical</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{avgTech}%</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Confidence</span>
              <span className="text-2xl font-extrabold text-purple-400 mt-1 block">{avgConf}%</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Problem Solving</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{avgProb}%</span>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS & RECENT WORK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Real Performance Analytics Trend */}
        <div className="lg:col-span-8 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 text-left">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Real Interview Score Trend
              </h3>
              <p className="text-xs text-zinc-500">
                {hasInterviews ? 'Tracked scores from your completed Firestore interview sessions over time.' : 'Complete an interview to display score trends.'}
              </p>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            {hasInterviews ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0e111a', border: '1px solid #27272a', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                    itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-3 p-6 bg-[#141722]/40 rounded-xl border border-zinc-800/60 max-w-sm">
                <Video className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">No interview history data recorded yet.</p>
                <button
                  onClick={() => onNavigateTab('mock-interview')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Start Mock Interview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recommended learning card */}
        {nextMilestone && (
          <div className="lg:col-span-4 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between text-left">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-indigo-400" /> Priority Roadmap Goal
              </h3>
              
              <div className="bg-[#141722]/60 border border-zinc-800 p-4 rounded-xl mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1.5">
                  <Clock className="w-3.5 h-3.5" /> Next Goal
                </div>
                <h4 className="text-sm font-bold text-white mb-2 leading-snug">{nextMilestone.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {nextMilestone.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Key Learning Resources</span>
                {nextMilestone.resources?.map((res, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#090a0f] px-3 py-2 rounded-lg border border-zinc-800/40 text-xs">
                    <span className="text-zinc-300 truncate max-w-[180px]">{res.title}</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{res.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              id="roadmap-quick-link"
              onClick={() => onNavigateTab('roadmap')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-6 shadow-md shadow-indigo-950/20 cursor-pointer"
            >
              Launch Roadmap Path <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* COMPLETED INTERVIEW SESSION LOGS OR EMPTY STATE */}
      <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 text-left">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Video className="w-4.5 h-4.5 text-emerald-400" /> Completed Firestore Interview Logs ({totalInterviews})
          </h3>
          {hasInterviews && (
            <button
              onClick={() => onNavigateTab('performance')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasInterviews ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold text-left">Date</th>
                  <th className="pb-3 font-semibold text-left">Type</th>
                  <th className="pb-3 font-semibold text-left">Target Role</th>
                  <th className="pb-3 font-semibold text-center">Difficulty</th>
                  <th className="pb-3 font-semibold text-center">Score</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {interviews.map((int) => {
                  const score = int.feedback?.overallScore ?? 0;
                  return (
                    <tr key={int.id} className="hover:bg-[#141722]/50 transition-colors group">
                      <td className="py-3.5 font-medium text-xs text-zinc-300">
                        {getFormattedInterviewDate(int.createdAt)}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
                          {int.interviewType || 'Mixed'}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-zinc-400 font-semibold">
                        {int.role || 'Software Engineer'}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-400 font-semibold">
                          {int.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`font-extrabold ${score >= 71 ? 'text-emerald-400' : score >= 41 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {score}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => onSelectInterviewDetail(int)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs rounded-xl font-semibold transition-all cursor-pointer"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                Start your first AI mock interview session. Your responses and evaluation will be saved directly to Firestore and displayed here.
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
    </div>
  );
};
