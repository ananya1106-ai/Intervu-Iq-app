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
  CheckCircle,
  Flame,
  Target,
  BarChart2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Info,
  X,
  Layers,
  Loader2
} from 'lucide-react';
import { UserProfile, RoadmapNode, PageType } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '../firebase';
import { getUserAtsData } from '../services/atsService';
import { InterviewSessionData, getFormattedInterviewDate } from '../services/interviewService';
import { startRazorpayCheckout, PaymentVerificationResponse } from '../services/razorpayService';
import { getUserDocument, getUserCreditBalance, UserCreditBalance, UserDocument } from '../services/userService';

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
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentVerificationResponse | null>(null);
  
  // Interactive preview toggle allowing evaluation of the exhausted state
  const [previewExhausted, setPreviewExhausted] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    planId: 'standard' | 'advanced';
    name: string;
    price: string;
    amountInRupees: number;
    features: string[];
  } | null>(null);

  // Authoritative additive credit and trial balance
  const creditBalance = getUserCreditBalance(userDoc, interviews.length);

  const TOTAL_FREE_INTERVIEWS = creditBalance.totalFreeAllowance;
  const trialCompleted = previewExhausted ? TOTAL_FREE_INTERVIEWS : creditBalance.freeTrialUsed;
  const trialRemaining = previewExhausted ? 0 : creditBalance.freeTrialRemaining;
  const purchasedCredits = creditBalance.purchasedCredits;
  const totalAvailable = previewExhausted ? purchasedCredits : creditBalance.totalAvailable;
  const trialProgressPercent = Math.min(100, Math.round((trialCompleted / TOTAL_FREE_INTERVIEWS) * 100));
  const isTrialExhausted = previewExhausted || (creditBalance.isTrialExhausted && purchasedCredits === 0);

  useEffect(() => {
    let isMounted = true;
    const fetchUserDataAndAts = async () => {
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

        try {
          const docData = await getUserDocument(uid);
          if (docData && isMounted) {
            setUserDoc(docData);
          }
        } catch (userDocErr) {
          console.warn("Notice: could not load user profile document in OverviewTab:", userDocErr);
        }
      }
    };

    fetchUserDataAndAts();

    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u?.uid) {
        fetchUserDataAndAts();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleBuyPlan = (planId: 'standard' | 'advanced') => {
    setCheckoutError(null);
    setIsCheckingOut(true);

    startRazorpayCheckout({
      planId,
      onSuccess: (result) => {
        setIsCheckingOut(false);
        setSelectedPlanModal(null);
        setPaymentReceipt(result);
        // Refresh authoritative Firestore user document and balance immediately
        const uid = auth.currentUser?.uid;
        if (uid) {
          getUserDocument(uid).then(d => {
            if (d) setUserDoc(d);
          }).catch(console.warn);
        }
      },
      onError: (errMsg) => {
        setIsCheckingOut(false);
        setCheckoutError(errMsg);
      },
      onDismiss: () => {
        setIsCheckingOut(false);
      },
    });
  };

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
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Placement Calibration Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Targeting <span className="text-white font-medium">{user.targetRole || 'Software Engineer'}</span>. You have completed <span className="text-emerald-400 font-bold font-mono tabular-nums">{totalInterviews} mock interview sessions</span> in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#161a29]/80 border border-zinc-800/50 p-4 rounded-xl">
          <Flame className="w-6 h-6 text-orange-500" />
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Completed Sessions</span>
            <span className="text-lg font-extrabold text-white font-mono tabular-nums">{totalInterviews} Sessions Saved</span>
          </div>
        </div>
      </div>

      {/* PREMIUM TRIAL-STATUS SECTION NEAR TOP */}
      <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {!isTrialExhausted ? (
          /* ACTIVE TRIAL STATE */
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Active Plan</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs text-zinc-400">Zero Payment Required</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Your IntervuIQ Free Trial
                </h2>
                <p className="text-xs text-zinc-400">
                  Full access to all 10 modules: AI Mock Interviews, ATS grading, voice coaching, and roadmap.
                </p>
              </div>

              {/* Action Buttons & Preview Toggle */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewExhausted(true)}
                  className="px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Test how the dashboard looks once all 15 free interviews are used"
                >
                  Preview Exhausted State
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('mock-interview')}
                  className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4 fill-zinc-950" />
                  <span>Start a Mock Interview</span>
                </button>
              </div>
            </div>

            {/* Progress Bar & Counters */}
            <div className="bg-[#141722] border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <span className="font-semibold text-white">
                  <strong className="text-emerald-400 font-mono tabular-nums">{trialCompleted}</strong> of <strong className="font-mono tabular-nums">{TOTAL_FREE_INTERVIEWS}</strong> free interviews completed
                </span>
                <span className="text-zinc-400 font-medium">
                  <strong className="text-emerald-400 font-mono tabular-nums">{trialRemaining}</strong> free interviews remaining
                </span>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${trialProgressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>
                  {purchasedCredits > 0 
                    ? `Total Available: ${totalAvailable} (${trialRemaining} Free + ${purchasedCredits} Paid)`
                    : `Trial Progress: ${trialProgressPercent}%`}
                </span>
                <span>Next: Pay-per-interview (₹15 Standard / ₹29 Advanced)</span>
              </div>
            </div>
          </div>
        ) : (
          /* TRIAL EXHAUSTED STATE — PAY-PER-INTERVIEW EMPTY STATE */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-purple-400 tracking-wider">Free Trial Complete</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs text-zinc-400">15/15 Sessions Completed</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Your 15 free interviews are complete
                </h2>
                <p className="text-xs text-zinc-400">
                  15 free interviews first. Then pay only when you practice — no compulsory monthly subscriptions.
                </p>
              </div>

              {previewExhausted && (
                <button
                  type="button"
                  onClick={() => setPreviewExhausted(false)}
                  className="px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors cursor-pointer self-start sm:self-center"
                >
                  Return to Active Trial
                </button>
              )}
            </div>

            {/* Pay-Per-Interview Dual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standard Interview Option */}
              <div className="bg-[#141722] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-bold text-white text-sm">Standard Interview</h3>
                    <span className="text-lg font-extrabold text-white font-mono tabular-nums">₹15 <span className="text-xs font-normal text-zinc-400">/ session</span></span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Fast AI interview drill with performance score and fundamental improvement notes.
                  </p>
                  <ul className="text-xs text-zinc-300 space-y-2 pt-1">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>AI-powered mock interview</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Interview performance score</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Essential feedback & suggestions</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlanModal({
                    planId: 'standard',
                    name: 'Standard Interview',
                    price: '₹15',
                    amountInRupees: 15,
                    features: [
                      'AI-powered mock interview',
                      'Interview performance score',
                      'Essential feedback and improvement suggestions'
                    ]
                  })}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all border border-zinc-700/60 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Choose Standard — ₹15</span>
                </button>
              </div>

              {/* Advanced Interview Option */}
              <div className="bg-[#141722] border border-purple-500/40 rounded-xl p-5 flex flex-col justify-between space-y-4 relative shadow-sm shadow-purple-950/20">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">Advanced Interview</h3>
                      <span className="text-[10px] text-purple-300 font-semibold">Recommended</span>
                    </div>
                    <span className="text-lg font-extrabold text-white font-mono tabular-nums">₹29 <span className="text-xs font-normal text-zinc-400">/ session</span></span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    In-depth simulation with full answer-quality analytics and communication metrics.
                  </p>
                  <ul className="text-xs text-zinc-300 space-y-2 pt-1">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-semibold text-white">Everything included in Standard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>More detailed interview feedback</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Communication and answer-quality insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Personalized improvement suggestions</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlanModal({
                    planId: 'advanced',
                    name: 'Advanced Interview',
                    price: '₹29',
                    amountInRupees: 29,
                    features: [
                      'Everything included in Standard',
                      'More detailed interview feedback',
                      'Communication and answer-quality insights',
                      'Personalized improvement suggestions'
                    ]
                  })}
                  className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Choose Advanced — ₹29</span>
                </button>
              </div>
            </div>

            {/* Display Purchased Sessions Balance if user has active credits */}
            {purchasedCredits > 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    You have <strong className="text-white">{purchasedCredits} purchased session credit{purchasedCredits > 1 ? 's' : ''}</strong> active on your account.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('mock-interview')}
                  className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Start Practice
                </button>
              </div>
            )}

            {/* Error banner if checkout failed */}
            {checkoutError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start justify-between text-xs text-red-300">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Payment Notice</p>
                    <p className="mt-0.5 text-zinc-300">{checkoutError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutError(null)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 text-center">
              Razorpay Standard Checkout with instant order verification and payment status.
            </p>
          </div>
        )}
      </div>

      {/* RAZORPAY CHECKOUT MODAL */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-left space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                if (!isCheckingOut) setSelectedPlanModal(null);
              }}
              disabled={isCheckingOut}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Razorpay Checkout</span>
              <h3 className="text-xl font-bold text-white">{selectedPlanModal.name}</h3>
              <p className="text-2xl font-extrabold text-white font-mono tabular-nums">{selectedPlanModal.price} <span className="text-xs font-normal text-zinc-400">/ single session</span></p>
            </div>

            <div className="space-y-2 border-y border-zinc-800/80 py-4 text-xs text-zinc-300">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Session Capabilities Included:</span>
              {selectedPlanModal.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-2.5 text-xs text-zinc-400">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                100% Secure Payment via <strong>Razorpay Standard Checkout</strong> (UPI, Cards, NetBanking, Wallets).
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => setSelectedPlanModal(null)}
                className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-800 cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => handleBuyPlan(selectedPlanModal.planId)}
                className="flex-1 py-3 bg-emerald-400 hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Opening Razorpay...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 fill-zinc-950" />
                    <span>Pay {selectedPlanModal.price} Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY PAYMENT SUCCESS CONFIRMATION RECEIPT MODAL */}
      {paymentReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 text-left space-y-5 shadow-2xl relative">
            <button
              onClick={() => setPaymentReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Payment Verified</span>
                <h3 className="text-lg font-bold text-white">Purchase Successful!</h3>
              </div>
            </div>

            <div className="bg-[#141722] border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Plan Purchased:</span>
                <span className="text-white font-semibold">{paymentReceipt.planName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Payment ID:</span>
                <span className="text-zinc-300 font-mono text-[11px]">{paymentReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Order ID:</span>
                <span className="text-zinc-300 font-mono text-[11px]">{paymentReceipt.orderId}</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>Credit Granted:</span>
                <span className="text-emerald-400 font-bold">+{paymentReceipt.creditsGranted} Interview Session</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Your payment has been cryptographically verified and 1 interview session credit has been added to your account.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentReceipt(null)}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-800 cursor-pointer"
              >
                Close Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentReceipt(null);
                  onNavigateTab('mock-interview');
                }}
                className="flex-1 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
              >
                <Video className="w-4 h-4 fill-zinc-950" />
                <span>Start Mock Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
