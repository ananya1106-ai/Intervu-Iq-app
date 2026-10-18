import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Sparkles, 
  Play, 
  Square, 
  RefreshCw, 
  ChevronRight, 
  Award, 
  BookOpen, 
  Volume2, 
  Info,
  CheckCircle2,
  MessageSquare,
  Clock,
  CheckSquare,
  AlertCircle,
  Check,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Target,
  FileText,
  User,
  ArrowRight,
  Activity
} from 'lucide-react';
import { auth } from '../firebase';
import { 
  getUserInterviewProfile, 
  generateInterviewQuestions, 
  saveInterviewSession, 
  getUserInterviews,
  InterviewQuestionItem, 
  AnswerItem, 
  EvaluationResultData,
  UserInterviewProfile 
} from '../services/interviewService';
import { 
  getUserDocument, 
  getUserCreditBalance, 
  consumeUserInterviewCredit, 
  UserCreditBalance 
} from '../services/userService';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { evaluateInterviewSession } from '../services/interviewFeedbackService';
import { FacialMetrics, ExpressionSummaryData, SpeechAnalysisData, FillerBreakdown, PageType } from '../types';
import { startLandmarkTrackingEngine, aggregateExpressionSummary } from '../services/expressionTrackerService';
import { 
  LiveSpeechAnalyzer, 
  QuestionSpeechSample, 
  extractFillerWords, 
  aggregateInterviewSpeechAnalysis 
} from '../services/speechAnalysisService';

interface MockInterviewTabProps {
  onSessionSaved?: (sessionData: any) => void;
  onNavigateTab?: (tab: PageType) => void;
}

export const MockInterviewTab: React.FC<MockInterviewTabProps> = ({ onSessionSaved, onNavigateTab }) => {
  // Phase state: 'setup' | 'active' | 'evaluating' | 'result'
  const [phase, setPhase] = useState<'setup' | 'active' | 'evaluating' | 'result'>('setup');
  const [creditBalance, setCreditBalance] = useState<UserCreditBalance | null>(null);

  // Candidate profile from Firestore
  const [candidateProfile, setCandidateProfile] = useState<UserInterviewProfile>({
    fullName: 'Candidate',
    targetRole: 'Software Engineer',
    resume: null,
    ats: null
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Setup options
  const [interviewType, setInterviewType] = useState<'HR' | 'Technical' | 'Behavioral' | 'Mixed'>('Mixed');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [interviewTier, setInterviewTier] = useState<'Standard' | 'Advanced'>('Advanced');

  // Questions and Progress
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Media & Recording state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Question countdown timer (120 seconds per question)
  const QUESTION_TIME_LIMIT = 120;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);

  // Final evaluation result
  const [evaluation, setEvaluation] = useState<EvaluationResultData | null>(null);
  const [savedInterviewId, setSavedInterviewId] = useState<string | null>(null);
  const [expressionSummary, setExpressionSummary] = useState<ExpressionSummaryData | null>(null);
  const [speechAnalysis, setSpeechAnalysis] = useState<SpeechAnalysisData | null>(null);

  // Real-time Speech Analysis Telemetry
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveWpm, setLiveWpm] = useState(125);
  const [liveFillerStats, setLiveFillerStats] = useState<{ count: number; breakdown: FillerBreakdown }>({
    count: 0,
    breakdown: { um: 0, uh: 0, like: 0, actually: 0, basically: 0, youKnow: 0 }
  });
  const liveSpeechAnalyzerRef = useRef<LiveSpeechAnalyzer | null>(null);
  const questionSpeechSamplesRef = useRef<QuestionSpeechSample[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Real-time Facial Expression Telemetry State
  const [facialMetrics, setFacialMetrics] = useState<FacialMetrics>({
    emotion: 'Focused',
    eyeContactPercent: 92,
    smilePercent: 15,
    blinkCount: 0,
    postureStatus: 'Good'
  });
  const facialSamplesRef = useRef<FacialMetrics[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkEngineCleanupRef = useRef<(() => void) | null>(null);
  const animationRef = useRef<number | null>(null);
  const isGradingOrFinishedRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const speechTimeoutRef = useRef<any>(null);

  // 1. Load candidate profile and accurate credit balance from Firestore on mount
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const [prof, userDoc, interviewsList] = await Promise.all([
            getUserInterviewProfile(user.uid),
            getUserDocument(user.uid).catch(() => null),
            getUserInterviews(user.uid).catch(() => [])
          ]);
          setCandidateProfile(prof);
          const bal = getUserCreditBalance(userDoc, Array.isArray(interviewsList) ? interviewsList.length : 0);
          setCreditBalance(bal);
        } catch (err) {
          console.warn("Notice: could not load profile or credit balance in MockInterviewTab:", err);
        }
      }
      setLoadingProfile(false);
    }
    loadProfile();
  }, []);

  // 2. Attach video stream & start landmark tracking engine when active
  useEffect(() => {
    if (phase === 'active' && isCamOn) {
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const timer = setTimeout(() => {
        if (landmarkCanvasRef.current) {
          if (landmarkEngineCleanupRef.current) landmarkEngineCleanupRef.current();
          landmarkEngineCleanupRef.current = startLandmarkTrackingEngine({
            canvas: landmarkCanvasRef.current,
            isActive: true,
            onMetricsUpdate: (newMetrics) => {
              setFacialMetrics(newMetrics);
              facialSamplesRef.current.push(newMetrics);
            }
          });
        }
      }, 150);

      return () => clearTimeout(timer);
    } else {
      if (landmarkEngineCleanupRef.current) {
        landmarkEngineCleanupRef.current();
        landmarkEngineCleanupRef.current = null;
      }
    }
  }, [phase, isCamOn, stream]);

  // 3. Question timer interval
  useEffect(() => {
    let timer: any = null;
    if (phase === 'active' && !isGradingOrFinishedRef.current && timeLeft > 0) {
      timer = setInterval(() => {
        if (isGradingOrFinishedRef.current) {
          if (timer) clearInterval(timer);
          return;
        }
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'active' && !isGradingOrFinishedRef.current && timeLeft === 0) {
      // Auto-advance if time expires and interview is active
      handleNextQuestion();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, timeLeft]);

  // Clean up media tracks, question audio & speech recognition on unmount
  useEffect(() => {
    return () => {
      isGradingOrFinishedRef.current = true;
      stopQuestionAudio();
      stopMedia();
      speechRecognitionService.stopListening();
    };
  }, []);

  // Stop pending question speech audio and browser speech synthesis
  const stopQuestionAudio = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Start webcam / microphone
  const startMedia = async () => {
    setSimulationNotice(null);
    let timeoutId = setTimeout(() => {
      console.warn('Camera request timed out inside sandbox, running biometric simulation.');
      setSimulationNotice('Camera restricted in iframe sandbox. Displaying active simulation.');
    }, 1500);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported on this device.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      clearTimeout(timeoutId);
      setStream(mediaStream);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Camera access blocked or unavailable in preview. Running simulation mode.', err);
      setSimulationNotice('Webcam blocked in sandbox. Live biometric scanner active!');
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setSimulationNotice(null);
  };

  // Text-to-Speech question reader
  const speakQuestion = (text: string) => {
    if (isGradingOrFinishedRef.current || phase !== 'active') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const prefVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Sofia') || v.name.includes('Female'));
      if (prefVoice) utterance.voice = prefVoice;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Waveform canvas animation
  const startWaveform = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();

      const sliceWidth = canvas.width / 40;
      let x = 0;

      for (let i = 0; i < 40; i++) {
        const amp = isRecordingAnswer
          ? Math.sin(Date.now() * 0.05 + i * 0.3) * 14 + Math.random() * 6
          : Math.sin(Date.now() * 0.005 + i * 0.1) * 3;
        const y = canvas.height / 2 + amp;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }
      ctx.stroke();
    };

    draw();
  };

  // Start Interview Action
  const handleStartInterview = async () => {
    setIsGeneratingQuestions(true);
    facialSamplesRef.current = [];
    questionSpeechSamplesRef.current = [];
    setSpeechAnalysis(null);
    setLiveWpm(125);
    setLiveFillerStats({
      count: 0,
      breakdown: { um: 0, uh: 0, like: 0, actually: 0, basically: 0, youKnow: 0 }
    });

    try {
      const generatedQ = await generateInterviewQuestions({
        role: candidateProfile.targetRole,
        difficulty,
        type: interviewType,
        resumeText: candidateProfile.resume?.fileName || "",
        atsData: candidateProfile.ats
      });

      isGradingOrFinishedRef.current = false;
      isEvaluatingRef.current = false;
      stopQuestionAudio();

      setQuestions(generatedQ);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTranscript('');
      setInterimTranscript('');
      setTimeLeft(QUESTION_TIME_LIMIT);

      await startMedia();
      startWaveform();

      setPhase('active');
      setIsGeneratingQuestions(false);

      // Speak first question safely
      speechTimeoutRef.current = setTimeout(() => {
        if (isGradingOrFinishedRef.current) return;
        if (generatedQ.length > 0) {
          speakQuestion(generatedQ[0].question);
        }
      }, 800);
    } catch (err) {
      console.error('Failed to start interview:', err);
      setIsGeneratingQuestions(false);
    }
  };

  // Start recording spoken answer for current question
  const handleStartAnswerRecording = () => {
    if (isGradingOrFinishedRef.current || phase !== 'active') return;
    speechRecognitionService.resetTranscript();
    setTranscript('');
    setInterimTranscript('');
    setIsRecordingAnswer(true);
    recordingStartTimeRef.current = Date.now();

    // Start Live Speech & Audio Analyzer
    if (liveSpeechAnalyzerRef.current) {
      liveSpeechAnalyzerRef.current.stop('', questions[currentQuestionIndex]?.id || 1);
    }

    const analyzer = new LiveSpeechAnalyzer({
      stream,
      onVolumeChange: (vol) => setLiveVolume(vol)
    });
    analyzer.start();
    liveSpeechAnalyzerRef.current = analyzer;

    speechRecognitionService.startListening({
      onResult: (res) => {
        if (isGradingOrFinishedRef.current) return;
        setTranscript(res.final);
        setInterimTranscript(res.interim);

        const combinedText = (res.final + ' ' + res.interim).trim();
        const fillers = extractFillerWords(combinedText);
        setLiveFillerStats(fillers);

        const wordsCount = combinedText ? combinedText.split(/\s+/).length : 0;
        const elapsedMinutes = recordingStartTimeRef.current
          ? Math.max(0.1, (Date.now() - recordingStartTimeRef.current) / 60000)
          : 0.1;
        const instantaneousWpm = Math.min(220, Math.max(60, Math.round(wordsCount / elapsedMinutes)));
        setLiveWpm(instantaneousWpm);
      },
      onError: (err) => {
        console.warn('Speech recognition notice:', err);
      }
    });
  };

  // Stop recording answer for current question
  const handleStopAnswerRecording = () => {
    const finalTxt = speechRecognitionService.stopListening();
    setIsRecordingAnswer(false);
    setInterimTranscript('');
    setLiveVolume(0);

    const fullTranscript = (finalTxt || transcript).trim();
    if (finalTxt) {
      setTranscript(finalTxt);
    }

    if (liveSpeechAnalyzerRef.current) {
      const sample = liveSpeechAnalyzerRef.current.stop(fullTranscript, questions[currentQuestionIndex]?.id || 1);
      questionSpeechSamplesRef.current.push(sample);
      liveSpeechAnalyzerRef.current = null;
    }
  };

  // Next Question Action
  const handleNextQuestion = () => {
    // Guard against re-entry or execution during grading
    if (isGradingOrFinishedRef.current || phase !== 'active') {
      return;
    }

    // Stop current speech audio immediately
    stopQuestionAudio();

    // Lock current answer transcript
    const currentQ = questions[currentQuestionIndex];
    const finalAnswerText = (transcript + ' ' + interimTranscript).trim();

    // If still actively recording, stop audio analyzer and save sample
    if (liveSpeechAnalyzerRef.current) {
      const sample = liveSpeechAnalyzerRef.current.stop(finalAnswerText, currentQ?.id || 1);
      questionSpeechSamplesRef.current.push(sample);
      liveSpeechAnalyzerRef.current = null;
    }

    const newAnswer: AnswerItem = {
      questionId: currentQ?.id || currentQuestionIndex + 1,
      question: currentQ?.question || '',
      transcript: finalAnswerText,
      answeredAt: new Date().toLocaleTimeString()
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // Stop recording for current question
    speechRecognitionService.stopListening();
    setIsRecordingAnswer(false);
    setTranscript('');
    setInterimTranscript('');
    setLiveVolume(0);
    setLiveFillerStats({
      count: 0,
      breakdown: { um: 0, uh: 0, like: 0, actually: 0, basically: 0, youKnow: 0 }
    });

    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setTimeLeft(QUESTION_TIME_LIMIT);
      
      speechTimeoutRef.current = setTimeout(() => {
        if (isGradingOrFinishedRef.current) return;
        if (questions[nextIdx]) {
          speakQuestion(questions[nextIdx].question);
        }
      }, 500);
    } else {
      // Finished all 10 questions -> immediately mark grading state and transition
      isGradingOrFinishedRef.current = true;
      finishAndEvaluateInterview(updatedAnswers);
    }
  };

  // Finish interview early or after Q10
  const finishAndEvaluateInterview = async (finalAnswers: AnswerItem[]) => {
    if (isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;
    isGradingOrFinishedRef.current = true;
    stopQuestionAudio();
    setPhase('evaluating');
    stopMedia();
    speechRecognitionService.stopListening();
    setLiveVolume(0);

    if (liveSpeechAnalyzerRef.current) {
      const sample = liveSpeechAnalyzerRef.current.stop(
        (transcript + ' ' + interimTranscript).trim(),
        questions[currentQuestionIndex]?.id || 1
      );
      questionSpeechSamplesRef.current.push(sample);
      liveSpeechAnalyzerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (landmarkEngineCleanupRef.current) {
      landmarkEngineCleanupRef.current();
      landmarkEngineCleanupRef.current = null;
    }

    // Compute aggregated facial/expression biometric summary
    const expSummary = aggregateExpressionSummary(facialSamplesRef.current);
    setExpressionSummary(expSummary);

    // Compute aggregated speech & vocal analysis summary
    const speechSummary = aggregateInterviewSpeechAnalysis(
      questionSpeechSamplesRef.current,
      finalAnswers
    );
    setSpeechAnalysis(speechSummary);

    try {
      const evalResult = await evaluateInterviewSession({
        role: candidateProfile.targetRole,
        difficulty,
        type: interviewType,
        questions,
        answers: finalAnswers,
        resumeText: candidateProfile.resume?.fileName || "",
        atsData: candidateProfile.ats
      });

      setEvaluation(evalResult);

      // Save to Firestore: users/{uid}/interviews/{interviewId}
      const user = auth.currentUser;
      if (user) {
        const newInterviewId = await saveInterviewSession(user.uid, {
          role: candidateProfile.targetRole || 'Software Engineer',
          interviewType,
          difficulty,
          questions,
          answers: finalAnswers,
          feedback: evalResult,
          expressionSummary: expSummary,
          speechAnalysis: speechSummary
        });
        setSavedInterviewId(newInterviewId);

        if (onSessionSaved) {
          onSessionSaved({
            id: newInterviewId,
            date: new Date().toLocaleDateString(),
            role: candidateProfile.targetRole,
            type: interviewType,
            durationSeconds: 300,
            overallScore: evalResult.overallScore,
            metrics: {
              communication: evalResult.communication,
              technical: evalResult.technicalKnowledge,
              confidence: evalResult.confidence,
              bodyLanguage: expSummary.averageEyeContact,
              speech: speechSummary.fluencyScore
            },
            questionsAnswered: finalAnswers.map(a => ({
              question: a.question,
              transcript: a.transcript,
              feedback: evalResult.finalFeedback,
              score: evalResult.overallScore
            }))
          });
        }
      }

      setPhase('result');
    } catch (err) {
      console.error('Error during interview evaluation:', err);
      setPhase('result');
    }
  };

  // Helper score color
  const getScoreColor = (score: number) => {
    if (score >= 71) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 41) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  return (
    <div id="mock-interview-tab" className="space-y-6 text-left">
      {/* 1. SETUP PHASE */}
      {phase === 'setup' && (
        <div id="setup-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Setup Options */}
          <div className="lg:col-span-8 bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                <Sparkles className="w-4 h-4" /> AI Placement Interview Simulator
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Configure Mock Interview</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Select your parameters below. Gemini will generate 10 personalized questions using your profile, resume, and ATS strengths. Answer verbally via your microphone while your webcam stays active.
              </p>
            </div>

            {/* Candidate Context Card from Firestore */}
            <div className="bg-[#141722] border border-zinc-800 p-4.5 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Candidate Firestore Profile</span>
              {loadingProfile ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Loading candidate background...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#090a0f] p-3 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Candidate Name</span>
                    <span className="font-bold text-white block mt-0.5">{candidateProfile.fullName || 'Candidate'}</span>
                  </div>
                  <div className="bg-[#090a0f] p-3 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Target Role</span>
                    <span className="font-bold text-emerald-400 block mt-0.5">{candidateProfile.targetRole}</span>
                  </div>
                  <div className="bg-[#090a0f] p-3 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">ATS Resume Analysis</span>
                    <span className="font-bold text-white block mt-0.5">
                      {candidateProfile.ats ? `${candidateProfile.ats.score}/100 Score` : 'No ATS Data Yet'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Select Interview Type */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">1. Select Interview Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'HR', label: 'HR Round', desc: 'Behavioral & background' },
                  { id: 'Technical', label: 'Technical', desc: 'Architecture & code' },
                  { id: 'Behavioral', label: 'Behavioral', desc: 'STAR method' },
                  { id: 'Mixed', label: 'Mixed Round', desc: 'Comprehensive mix' }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setInterviewType(item.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                      interviewType === item.id 
                        ? 'border-emerald-500/60 bg-[#141722] shadow-md shadow-emerald-500/5' 
                        : 'border-zinc-800/80 bg-[#090a0f] hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-white text-xs block">{item.label}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Difficulty */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">2. Select Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Easy', label: 'Easy Tier', desc: 'Entry level core concepts' },
                  { id: 'Medium', label: 'Medium Tier', desc: 'Mid-level trade-offs' },
                  { id: 'Hard', label: 'Hard Tier', desc: 'Senior architectural depth' }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setDifficulty(item.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                      difficulty === item.id 
                        ? 'border-indigo-500/60 bg-[#141722] shadow-md shadow-indigo-500/5' 
                        : 'border-zinc-800/80 bg-[#090a0f] hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-white text-xs block">{item.label}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Choose Interview Tier (Standard vs Advanced) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">3. Select Interview Tier</label>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Included in your free trial
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Tier */}
                <div
                  onClick={() => setInterviewTier('Standard')}
                  className={`p-4 rounded-xl border cursor-pointer text-left transition-all relative ${
                    interviewTier === 'Standard'
                      ? 'border-emerald-500/70 bg-[#141722] shadow-md shadow-emerald-500/5'
                      : 'border-zinc-800/80 bg-[#090a0f] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-bold text-white text-xs">Standard Interview</span>
                    <span className="text-xs font-extrabold text-white font-mono tabular-nums">₹15 <span className="text-[10px] font-normal text-zinc-500">per interview</span></span>
                  </div>
                  <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded mb-2">
                    Included in your free trial
                  </span>
                  <ul className="text-[11px] text-zinc-400 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      <span>10 AI-generated interview questions</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      <span>Interview performance score (0-100)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      <span>Essential feedback & suggestions</span>
                    </li>
                  </ul>
                </div>

                {/* Advanced Tier */}
                <div
                  onClick={() => setInterviewTier('Advanced')}
                  className={`p-4 rounded-xl border cursor-pointer text-left transition-all relative ${
                    interviewTier === 'Advanced'
                      ? 'border-purple-500/70 bg-[#141722] shadow-md shadow-purple-950/20'
                      : 'border-zinc-800/80 bg-[#090a0f] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">Advanced Interview</span>
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider">Deep</span>
                    </div>
                    <span className="text-xs font-extrabold text-white font-mono tabular-nums">₹29 <span className="text-[10px] font-normal text-zinc-500">per interview</span></span>
                  </div>
                  <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded mb-2">
                    Included in your free trial
                  </span>
                  <ul className="text-[11px] text-zinc-400 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      <span className="text-zinc-200 font-medium">Everything included in Standard</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      <span>Deep answer-quality & communication analytics</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      <span>Speech cadence (WPM) & filler-word breakdown</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      <span>Personalized improvement roadmap items</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#090a0f] border border-zinc-800/60 rounded-xl flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>You will receive <strong>10 personalized questions</strong> based on your profile. Verbal answers recorded live.</span>
              </div>
              <span className="text-emerald-400 font-semibold shrink-0 hidden sm:inline-block">₹0 Trial Cost</span>
            </div>

            <button
              id="start-interview-btn"
              onClick={handleStartInterview}
              disabled={isGeneratingQuestions}
              className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 disabled:bg-zinc-800 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer text-sm"
            >
              {isGeneratingQuestions ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Gemini is generating 10 personalized questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-zinc-950" />
                  <span>Start 10-Question AI Mock Interview ({interviewTier})</span>
                </>
              )}
            </button>
          </div>

          {/* Right Info Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 space-y-5 text-left">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Trial Session Active</span>
                </div>
                <h3 className="text-base font-bold text-white">Session Overview</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Tier: <strong className="text-white">{interviewTier} Interview</strong> (Proposed ₹{interviewTier === 'Standard' ? '15' : '29'}/session)
                </p>
                <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 font-medium">
                  Covered by your 15-interview free trial. No charges will be applied.
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-4 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Evaluation Metrics</span>
                <div className="p-2.5 bg-[#141722] rounded-lg border border-zinc-800 text-zinc-300 flex items-center justify-between">
                  <span>Communication Clarity</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">0-100</span>
                </div>
                <div className="p-2.5 bg-[#141722] rounded-lg border border-zinc-800 text-zinc-300 flex items-center justify-between">
                  <span>Technical Knowledge</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">0-100</span>
                </div>
                <div className="p-2.5 bg-[#141722] rounded-lg border border-zinc-800 text-zinc-300 flex items-center justify-between">
                  <span>Confidence & Pace</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">0-100</span>
                </div>
                <div className="p-2.5 bg-[#141722] rounded-lg border border-zinc-800 text-zinc-300 flex items-center justify-between">
                  <span>Problem Solving</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">0-100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE PHASE */}
      {phase === 'active' && currentQ && (
        <div id="active-interview-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Stage */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header Bar */}
              <div className="px-6 py-4 bg-[#111422] border-b border-zinc-800 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <div className="flex items-center gap-4 text-zinc-400 font-medium">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase">
                    {currentQ.category}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="font-mono text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 h-1.5">
                <div 
                  className="bg-emerald-400 h-1.5 transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Question Card */}
                <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl text-left relative">
                  <button
                    onClick={() => speakQuestion(currentQ.question)}
                    className="absolute top-4 right-4 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-emerald-400 transition-all cursor-pointer"
                    title="Read Question Out Loud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="block text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
                    Question {currentQuestionIndex + 1} Prompt
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white pr-10 leading-snug">
                    "{currentQ.question}"
                  </h3>
                </div>

                {/* Rubric Suggestions */}
                <div className="bg-[#090a0f] border border-zinc-800/80 p-5 rounded-xl space-y-2.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Key Rubric Criteria
                  </span>
                  <div className="space-y-2">
                    {currentQ.suggestedPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Speech Recognition Transcript Box */}
                <div className="bg-[#090a0f]/80 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Spoken Answer Transcript
                    </span>
                    {isRecordingAnswer ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                        <Mic className="w-3 h-3" /> Recording Spoken Answer
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium">
                        Microphone Ready
                      </span>
                    )}
                  </div>

                  <div className="h-28 overflow-y-auto pr-2 text-xs text-zinc-300 space-y-2 scrollbar-thin">
                    <p className="leading-relaxed">
                      {transcript || <span className="text-zinc-600 italic">Click 'Start Answer' and speak into your microphone...</span>}
                      {interimTranscript && <span className="text-emerald-400/80 italic font-mono"> {interimTranscript}</span>}
                    </p>
                  </div>

                  {/* Waveform canvas */}
                  <canvas ref={canvasRef} width="400" height="28" className="w-full h-7 block bg-zinc-950/60 rounded-lg border border-zinc-800/40" />

                  {/* Live Vocal Coach Sub-Panel during active recording */}
                  <div className="bg-[#090a0f] border border-zinc-800/80 p-3.5 rounded-lg space-y-2.5 text-xs text-left">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                        <Activity className="w-3.5 h-3.5" /> Live Vocal Coach Heuristics
                      </span>
                      <span className="font-mono text-zinc-400">
                        Mic Signal: <strong className="text-emerald-400">{liveVolume}%</strong>
                      </span>
                    </div>

                    {/* Microphone Volume level bar */}
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                        style={{ width: `${liveVolume}%` }}
                      />
                    </div>

                    {/* Live Speed & Filler Indicators */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-[#141722] p-2 rounded-lg border border-zinc-800 text-center">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Speaking Pace</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">{liveWpm} WPM</span>
                        <span className="text-[8px] text-zinc-500">Target: 110-150</span>
                      </div>
                      <div className="bg-[#141722] p-2 rounded-lg border border-zinc-800 text-center">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Verbal Fillers</span>
                        <span className="text-xs font-bold text-rose-400 font-mono mt-0.5 block">{liveFillerStats.count}</span>
                        <span className="text-[8px] text-zinc-500">um, uh, like...</span>
                      </div>
                      <div className="bg-[#141722] p-2 rounded-lg border border-zinc-800 text-center">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Cadence</span>
                        <span className={`text-xs font-bold font-mono mt-0.5 block ${liveWpm > 165 ? 'text-amber-400' : liveWpm < 95 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                          {liveWpm > 165 ? 'Fast' : liveWpm < 95 ? 'Thoughtful' : 'Optimal'}
                        </span>
                        <span className="text-[8px] text-zinc-500">Vocal flow</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answer Recording Controls & Next Question */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-800">
                  {!isRecordingAnswer ? (
                    <button
                      onClick={handleStartAnswerRecording}
                      className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <Mic className="w-4 h-4" /> Start Spoken Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleStopAnswerRecording}
                      className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-zinc-950" /> Stop Answer Recording
                    </button>
                  )}

                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    <span>{currentQuestionIndex < questions.length - 1 ? 'Save Answer & Next Question' : 'Complete All Questions & Grade'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Camera & Expression Tracker Preview Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" /> Expression & Landmark Tracker
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                  TRACKING LIVE
                </span>
              </div>

              {/* Live Webcam & Landmark Canvas Display */}
              <div className="aspect-video bg-[#090a0f] rounded-xl border border-zinc-800 relative overflow-hidden flex items-center justify-center">
                {simulationNotice && (
                  <div className="absolute top-2 left-2 right-2 z-20 px-2 py-1 bg-indigo-950/90 border border-indigo-500/30 rounded text-[9px] text-indigo-200 font-medium shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>{simulationNotice}</span>
                  </div>
                )}

                {isCamOn ? (
                  <>
                    {stream ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1] opacity-80"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c16] via-[#090a10] to-[#040508] flex flex-col items-center justify-center p-4 text-center">
                        <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse mb-2" />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Biometric Scanner</span>
                      </div>
                    )}
                    {/* Landmark tracking overlay canvas */}
                    <canvas
                      ref={landmarkCanvasRef}
                      width="480"
                      height="270"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 scale-x-[-1]"
                    />
                  </>
                ) : (
                  <div className="text-xs text-zinc-500 flex flex-col items-center gap-2">
                    <VideoOff className="w-6 h-6 text-zinc-600" />
                    <span>Camera Muted</span>
                  </div>
                )}
              </div>

              {/* Live Expression Telemetry Box */}
              {isCamOn && (
                <div className="bg-[#141722] border border-zinc-800/80 p-3.5 rounded-xl space-y-2.5 text-xs text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-medium">Composure & Pose</span>
                    <span className="font-bold text-emerald-400 text-[11px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {facialMetrics.emotion}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Eye Contact Stability</span>
                      <span className="font-bold text-indigo-400 font-mono">{facialMetrics.eyeContactPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: `${facialMetrics.eyeContactPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Smile Frequency</span>
                      <span className="font-bold text-amber-400 font-mono">{facialMetrics.smilePercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${facialMetrics.smilePercent}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span>Posture Status: <strong className="text-white">{facialMetrics.postureStatus}</strong></span>
                    <span>Blinks: <strong className="text-white font-mono">{facialMetrics.blinkCount}</strong></span>
                  </div>
                </div>
              )}

              {/* Live Speech & Vocal Coach Sidebar Widget */}
              <div className="bg-[#141722] border border-zinc-800/80 p-3.5 rounded-xl space-y-2.5 text-xs text-left">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Vocal Coach Stream
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${isRecordingAnswer ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse' : 'text-zinc-500 bg-zinc-900'}`}>
                    {isRecordingAnswer ? 'ANALYZING' : 'IDLE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#090a0f] p-2 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Live Pace</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">{liveWpm} WPM</span>
                  </div>
                  <div className="bg-[#090a0f] p-2 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Fillers</span>
                    <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">{liveFillerStats.count}</span>
                  </div>
                </div>

                {/* Verbal Fillers active tags */}
                <div className="pt-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1.5">Active Token Tally</span>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      um/uh: <strong className="text-white">{liveFillerStats.breakdown.um + liveFillerStats.breakdown.uh}</strong>
                    </span>
                    <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      like: <strong className="text-white">{liveFillerStats.breakdown.like}</strong>
                    </span>
                    <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      actually: <strong className="text-white">{liveFillerStats.breakdown.actually}</strong>
                    </span>
                    <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      basically: <strong className="text-white">{liveFillerStats.breakdown.basically}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera & Mic Quick Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCamOn(!isCamOn)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isCamOn ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  {isCamOn ? 'Cam On' : 'Cam Off'}
                </button>
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isMicOn ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  {isMicOn ? 'Mic On' : 'Mic Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EVALUATING LOADING PHASE */}
      {phase === 'evaluating' && (
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Evaluating Interview Transcripts with Gemini...</h3>
          <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
            Gemini is grading all 10 speech answers against technical criteria, communication clarity, problem-solving methodology, and confidence. Saving session to Firestore...
          </p>
        </div>
      )}

      {/* 4. RESULT PHASE */}
      {phase === 'result' && evaluation && (
        <div id="interview-result-page" className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
                <CheckCircle2 className="w-4 h-4" /> Interview Completed & Saved to Firestore
              </div>
              <h2 className="text-2xl font-bold text-white">ATS Mock Interview Report</h2>
              <p className="text-xs text-zinc-400">Target Role: {candidateProfile.targetRole} ({interviewType} - {difficulty})</p>
            </div>
            {savedInterviewId && (
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400">
                Session ID: {savedInterviewId.slice(0, 10)}...
              </span>
            )}
          </div>

          {/* 1. Overall Score Badge */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#141722] border border-zinc-800 p-6 rounded-xl">
            <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 pr-0 md:pr-6">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Overall Score</span>
              <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${getScoreColor(evaluation.overallScore).border} ${getScoreColor(evaluation.overallScore).bg}`}>
                <span className={`text-4xl font-extrabold ${getScoreColor(evaluation.overallScore).text}`}>
                  {evaluation.overallScore}%
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Communication</span>
                <span className="text-xl font-bold text-white mt-1 block">{evaluation.communication}%</span>
              </div>
              <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Technical</span>
                <span className="text-xl font-bold text-white mt-1 block">{evaluation.technicalKnowledge}%</span>
              </div>
              <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Confidence</span>
                <span className="text-xl font-bold text-white mt-1 block">{evaluation.confidence}%</span>
              </div>
              <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Problem Solving</span>
                <span className="text-xl font-bold text-white mt-1 block">{evaluation.problemSolving}%</span>
              </div>
            </div>
          </div>

          {/* 2. Final Feedback Summary */}
          <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" /> Evaluator Final Feedback
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              "{evaluation.finalFeedback}"
            </p>
          </div>

          {/* 3. Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Candidate Strengths
              </h3>
              <div className="space-y-2">
                {evaluation.strengths.map((str, i) => (
                  <div key={i} className="p-3 bg-[#090a0f] border border-emerald-500/20 rounded-lg text-xs text-zinc-300 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Areas for Growth
              </h3>
              <div className="space-y-2">
                {evaluation.weaknesses.map((wk, i) => (
                  <div key={i} className="p-3 bg-[#090a0f] border border-amber-500/20 rounded-lg text-xs text-zinc-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{wk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Expression & Composure Biometric Analysis */}
          {expressionSummary && (
            <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Expression & Composure Biometric Analysis
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                  {expressionSummary.totalSamples || 'Live Session'} Landmark Samples
                </span>
              </div>

              {/* Expression metrics cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Eye Contact</span>
                  <span className="text-xl font-bold text-indigo-400 mt-1 block font-mono">{expressionSummary.averageEyeContact}%</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">Recruiter Target: &gt;85%</span>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Smile Ratio</span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block font-mono">{expressionSummary.averageSmile}%</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">Warm Demeanor</span>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Dominant Pose</span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block font-mono">{expressionSummary.dominantEmotion}</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">Composure Score</span>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Posture Alignment</span>
                  <span className="text-base font-bold text-white mt-1 block font-mono">{expressionSummary.postureStatus}</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">{expressionSummary.totalBlinks} Blinks Recorded</span>
                </div>
              </div>

              {/* Qualitative Biometric Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Gaze Stability Assessment</span>
                  <p className="text-zinc-300 leading-relaxed italic">"{expressionSummary.eyeContactAssessment}"</p>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Non-Verbal Demeanor Summary</span>
                  <p className="text-zinc-300 leading-relaxed italic">"{expressionSummary.expressionFeedback}"</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Speech & Vocal Analysis */}
          {speechAnalysis && (
            <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Speech & Vocal Analysis
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                  {speechAnalysis.responseDuration}s Audio Analyzed | {speechAnalysis.speechActivityRatio || 75}% Active Ratio
                </span>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Speaking Pace</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block font-mono">{speechAnalysis.speakingRate} WPM</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">Target: 110 - 150 WPM</span>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Filler Words</span>
                  <span className="text-xl font-bold text-rose-400 mt-1 block font-mono">{speechAnalysis.fillerWordCount}</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">Benchmark: &lt;3 / min</span>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Pause Control</span>
                  <span className="text-xl font-bold text-indigo-400 mt-1 block font-mono">{speechAnalysis.pauseCount}</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">Avg {speechAnalysis.averagePauseDuration}s Pause</span>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Fluency Score</span>
                  <span className="text-xl font-bold text-purple-400 mt-1 block font-mono">{speechAnalysis.fluencyScore}%</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">{speechAnalysis.speechDuration}s Active Speech</span>
                </div>
              </div>

              {/* Filler Breakdown Chips */}
              {speechAnalysis.fillerBreakdown && (
                <div className="bg-[#090a0f] p-3 rounded-lg border border-zinc-800/60 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Filler Breakdown:</span>
                  <span className="bg-[#141722] border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                    "um": <strong className="text-white">{speechAnalysis.fillerBreakdown.um}</strong>
                  </span>
                  <span className="bg-[#141722] border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                    "uh": <strong className="text-white">{speechAnalysis.fillerBreakdown.uh}</strong>
                  </span>
                  <span className="bg-[#141722] border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                    "like": <strong className="text-white">{speechAnalysis.fillerBreakdown.like}</strong>
                  </span>
                  <span className="bg-[#141722] border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                    "actually": <strong className="text-white">{speechAnalysis.fillerBreakdown.actually}</strong>
                  </span>
                  <span className="bg-[#141722] border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                    "basically": <strong className="text-white">{speechAnalysis.fillerBreakdown.basically}</strong>
                  </span>
                  {speechAnalysis.fillerBreakdown.youKnow > 0 && (
                    <span className="bg-[#141722] border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                      "you know": <strong className="text-white">{speechAnalysis.fillerBreakdown.youKnow}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Qualitative Vocal Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Pacing & Articulation</span>
                  <p className="text-zinc-300 leading-relaxed italic">"{speechAnalysis.fluencyAssessment}"</p>
                </div>
                <div className="bg-[#090a0f] p-3.5 rounded-lg border border-zinc-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Vocal Coach Feedback</span>
                  <p className="text-zinc-300 leading-relaxed italic">"{speechAnalysis.vocalFeedback}"</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Improvement Suggestions */}
          <div className="bg-[#141722] border border-zinc-800 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Actionable Improvement Suggestions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {evaluation.improvements.map((imp, i) => (
                <div key={i} className="p-3.5 bg-[#090a0f] border border-indigo-500/20 rounded-lg text-xs text-zinc-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Restart Button */}
          <button
            onClick={() => {
              isGradingOrFinishedRef.current = false;
              isEvaluatingRef.current = false;
              stopQuestionAudio();
              setPhase('setup');
              setEvaluation(null);
            }}
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-xl transition-all cursor-pointer text-sm"
          >
            Start Another Mock Interview Session
          </button>
        </div>
      )}
    </div>
  );
};
