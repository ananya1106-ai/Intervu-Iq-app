import React from 'react';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Mic, 
  Calendar, 
  Target, 
  Layers, 
  Sparkles,
  FileText,
  User,
  Activity
} from 'lucide-react';
import { InterviewSessionData, getFormattedInterviewDate } from '../services/interviewService';

interface InterviewReportDetailProps {
  interview: InterviewSessionData & { id: string };
  onClose: () => void;
}

export const InterviewReportDetail: React.FC<InterviewReportDetailProps> = ({ interview, onClose }) => {
  const { feedback, questions, answers, role, interviewType, difficulty, createdAt, id } = interview;
  const dateStr = getFormattedInterviewDate(createdAt);

  const getScoreColor = (score: number) => {
    if (score >= 71) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 41) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const overallScore = feedback?.overallScore ?? 80;
  const communication = feedback?.communication ?? 80;
  const technicalKnowledge = feedback?.technicalKnowledge ?? 80;
  const confidence = feedback?.confidence ?? 80;
  const problemSolving = feedback?.problemSolving ?? 80;
  const strengths = feedback?.strengths || [];
  const weaknesses = feedback?.weaknesses || [];
  const improvements = feedback?.improvements || [];
  const finalFeedback = feedback?.finalFeedback || "Interview completed successfully.";

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Back Button and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <button
            onClick={onClose}
            className="mb-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to History & Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Interview Evaluation Report
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Target className="w-3.5 h-3.5" /> {role || 'Software Engineer'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-medium text-zinc-300">
              {interviewType || 'Mixed'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-medium text-zinc-300">
              {difficulty || 'Medium'} Tier
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Calendar className="w-3.5 h-3.5" /> {dateStr}
            </span>
          </div>
        </div>

        <div className="px-3 py-1.5 bg-[#141722] border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-400">
          ID: {id}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl">
        <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 pr-0 md:pr-6">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Overall Score</span>
          <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${getScoreColor(overallScore).border} ${getScoreColor(overallScore).bg}`}>
            <span className={`text-4xl font-extrabold ${getScoreColor(overallScore).text}`}>
              {overallScore}%
            </span>
          </div>
        </div>

        {/* Breakdown metrics */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Communication</span>
            <span className="text-xl font-bold text-white mt-1 block">{communication}%</span>
          </div>
          <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Technical</span>
            <span className="text-xl font-bold text-white mt-1 block">{technicalKnowledge}%</span>
          </div>
          <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Confidence</span>
            <span className="text-xl font-bold text-white mt-1 block">{confidence}%</span>
          </div>
          <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Problem Solving</span>
            <span className="text-xl font-bold text-white mt-1 block">{problemSolving}%</span>
          </div>
        </div>
      </div>

      {/* Evaluator Final Feedback */}
      <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-2">
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4" /> Evaluator Final Feedback
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed italic bg-[#141722] p-4 rounded-xl border border-zinc-800/80">
          "{finalFeedback}"
        </p>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Candidate Strengths
          </h3>
          <div className="space-y-2">
            {strengths.map((str, i) => (
              <div key={i} className="p-3 bg-[#141722] border border-emerald-500/20 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Areas for Growth
          </h3>
          <div className="space-y-2">
            {weaknesses.map((wk, i) => (
              <div key={i} className="p-3 bg-[#141722] border border-amber-500/20 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{wk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expression & Composure Biometric Analysis */}
      {interview.expressionSummary && (
        <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Expression & Composure Biometric Analysis
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
              {interview.expressionSummary.totalSamples || 'Recorded Session'} Landmark Telemetry
            </span>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Eye Contact</span>
              <span className="text-2xl font-bold text-indigo-400 mt-1 block font-mono">{interview.expressionSummary.averageEyeContact}%</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">Target: &gt;85% Direct Gaze</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Smile Ratio</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block font-mono">{interview.expressionSummary.averageSmile}%</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">Warm Demeanor Ratio</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Dominant Demeanor</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block font-mono">{interview.expressionSummary.dominantEmotion}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">Composure Profile</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Posture Alignment</span>
              <span className="text-lg font-bold text-white mt-1 block font-mono">{interview.expressionSummary.postureStatus}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">{interview.expressionSummary.totalBlinks} Blinks Monitored</span>
            </div>
          </div>

          {/* Qualitative Biometric Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Gaze Stability Assessment</span>
              <p className="text-zinc-300 leading-relaxed italic">"{interview.expressionSummary.eyeContactAssessment}"</p>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Non-Verbal Demeanor Summary</span>
              <p className="text-zinc-300 leading-relaxed italic">"{interview.expressionSummary.expressionFeedback}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Speech & Vocal Analysis */}
      {interview.speechAnalysis && (
        <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-4 h-4" /> Speech & Vocal Analysis
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
              {interview.speechAnalysis.responseDuration}s Audio Analyzed | {interview.speechAnalysis.speechActivityRatio || 75}% Active Ratio
            </span>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Speaking Pace</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">{interview.speechAnalysis.speakingRate} WPM</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">Target: 110 - 150 WPM</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Filler Words</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block font-mono">{interview.speechAnalysis.fillerWordCount}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">Target: &lt;3 / min</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Pause Control</span>
              <span className="text-2xl font-bold text-indigo-400 mt-1 block font-mono">{interview.speechAnalysis.pauseCount}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">Avg {interview.speechAnalysis.averagePauseDuration}s Pause</span>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Fluency Score</span>
              <span className="text-2xl font-bold text-purple-400 mt-1 block font-mono">{interview.speechAnalysis.fluencyScore}%</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">{interview.speechAnalysis.speechDuration}s Active Speech</span>
            </div>
          </div>

          {/* Filler Breakdown Chips */}
          {interview.speechAnalysis.fillerBreakdown && (
            <div className="bg-[#141722] p-3.5 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Filler Token Breakdown:</span>
              <span className="bg-[#090a0f] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[11px]">
                "um": <strong className="text-white">{interview.speechAnalysis.fillerBreakdown.um}</strong>
              </span>
              <span className="bg-[#090a0f] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[11px]">
                "uh": <strong className="text-white">{interview.speechAnalysis.fillerBreakdown.uh}</strong>
              </span>
              <span className="bg-[#090a0f] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[11px]">
                "like": <strong className="text-white">{interview.speechAnalysis.fillerBreakdown.like}</strong>
              </span>
              <span className="bg-[#090a0f] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[11px]">
                "actually": <strong className="text-white">{interview.speechAnalysis.fillerBreakdown.actually}</strong>
              </span>
              <span className="bg-[#090a0f] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[11px]">
                "basically": <strong className="text-white">{interview.speechAnalysis.fillerBreakdown.basically}</strong>
              </span>
              {interview.speechAnalysis.fillerBreakdown.youKnow > 0 && (
                <span className="bg-[#090a0f] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-[11px]">
                  "you know": <strong className="text-white">{interview.speechAnalysis.fillerBreakdown.youKnow}</strong>
                </span>
              )}
            </div>
          )}

          {/* Qualitative Vocal Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Pacing & Articulation</span>
              <p className="text-zinc-300 leading-relaxed italic">"{interview.speechAnalysis.fluencyAssessment}"</p>
            </div>
            <div className="bg-[#141722] p-4 rounded-xl border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Vocal Coach Feedback</span>
              <p className="text-zinc-300 leading-relaxed italic">"{interview.speechAnalysis.vocalFeedback}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Improvements */}
      <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Actionable Recommendations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {improvements.map((imp, i) => (
            <div key={i} className="p-3.5 bg-[#141722] border border-indigo-500/20 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>{imp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Questions & Candidate Spoken Transcripts */}
      <div className="bg-[#0d0f17] border border-zinc-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Mic className="w-4.5 h-4.5 text-emerald-400" /> Questions & Candidate Spoken Transcripts ({answers?.length || 0} Prompts)
        </h3>

        <div className="space-y-4">
          {answers && answers.length > 0 ? (
            answers.map((ans, idx) => {
              const matchedQ = questions?.find(q => q.id === ans.questionId) || questions?.[idx];
              return (
                <div key={idx} className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                    {matchedQ?.category && (
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-semibold uppercase">
                        {matchedQ.category}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    "{ans.question || matchedQ?.question}"
                  </h4>

                  {matchedQ?.suggestedPoints && matchedQ.suggestedPoints.length > 0 && (
                    <div className="bg-[#090a0f] p-3 rounded-lg border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Target Rubric Points</span>
                      {matchedQ.suggestedPoints.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[#090a0f] p-4 rounded-lg border border-zinc-800 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase font-bold mb-1">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Mic className="w-3 h-3" /> Candidate Spoken Transcript
                      </span>
                      {ans.answeredAt && <span>{ans.answeredAt}</span>}
                    </div>
                    <p className="text-zinc-300 leading-relaxed italic">
                      "{ans.transcript || 'No transcript recorded.'}"
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-zinc-500 italic">No question transcripts available for this interview session.</p>
          )}
        </div>
      </div>
    </div>
  );
};
