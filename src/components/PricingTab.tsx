import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowRight,
  HelpCircle,
  Video,
  Flame
} from 'lucide-react';
import { auth } from '../firebase';
import { getUserDocument, getUserCreditBalance, UserCreditBalance } from '../services/userService';
import { getUserInterviews } from '../services/interviewService';
import { 
  startRazorpayCheckout, 
  PaymentPlanId, 
  PaymentVerificationResponse 
} from '../services/razorpayService';
import { PageType } from '../types';

interface PricingTabProps {
  onNavigateTab: (tab: PageType) => void;
}

export const PricingTab: React.FC<PricingTabProps> = ({ onNavigateTab }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkingOutPlan, setCheckingOutPlan] = useState<PaymentPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentVerificationResponse | null>(null);
  const [creditBalance, setCreditBalance] = useState<UserCreditBalance>(() => getUserCreditBalance(null, 0));
  const [loadingData, setLoadingData] = useState(true);

  const fetchUserData = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const [userDoc, interviewsList] = await Promise.all([
          getUserDocument(uid).catch(() => null),
          getUserInterviews(uid).catch(() => [])
        ]);

        const bal = getUserCreditBalance(userDoc, Array.isArray(interviewsList) ? interviewsList.length : 0);
        setCreditBalance(bal);
      } catch (err) {
        console.warn("Could not load user credits/interviews in PricingTab:", err);
      } finally {
        setLoadingData(false);
      }
    } else {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleSelectPlan = (planId: PaymentPlanId) => {
    setCheckoutError(null);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setCheckoutError("Please log in to your IntervuIQ account before initiating payment.");
      return;
    }

    setIsCheckingOut(true);
    setCheckingOutPlan(planId);

    startRazorpayCheckout({
      planId,
      onSuccess: (result) => {
        setIsCheckingOut(false);
        setCheckingOutPlan(null);
        setPaymentReceipt(result);
        // Refresh authoritative Firestore user document and balance immediately
        fetchUserData();
      },
      onError: (errMsg) => {
        setIsCheckingOut(false);
        setCheckingOutPlan(null);
        setCheckoutError(errMsg);
      },
      onDismiss: () => {
        setIsCheckingOut(false);
        setCheckingOutPlan(null);
      },
    });
  };

  const freeProgress = Math.min(100, Math.round((creditBalance.freeTrialUsed / creditBalance.totalFreeAllowance) * 100));

  return (
    <div id="pricing-tab-view" className="space-y-8 text-left max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#111422] via-[#0d0f17] to-[#0a0c14] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Launch Pricing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            15 Free Interviews First. Then Pay Only When You Practice.
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Practice mock interviews on demand. No monthly commitments, recurring charges, or hidden subscriptions. Each purchase provides immediate session credits linked securely to your account.
          </p>
        </div>

        {/* Balance Card */}
        <div className="flex items-center gap-4 bg-[#141722] border border-zinc-800 p-4 rounded-xl shrink-0">
          <CreditCard className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Available Balance</span>
            <span className="text-xl font-extrabold text-white font-mono tabular-nums">
              {loadingData ? "..." : `${creditBalance.totalAvailable} Interview${creditBalance.totalAvailable === 1 ? '' : 's'}`}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">
              {creditBalance.freeTrialRemaining} Free + {creditBalance.purchasedCredits} Purchased
            </span>
          </div>
        </div>
      </div>

      {/* Account Credit & Free Trial Status Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trial Status Card */}
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Free Trial Allocation
            </span>
            <span className="text-emerald-400 font-mono tabular-nums font-bold">
              {creditBalance.freeTrialUsed} / {creditBalance.totalFreeAllowance} Used
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${freeProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>{creditBalance.freeTrialRemaining > 0 ? `${creditBalance.freeTrialRemaining} free session${creditBalance.freeTrialRemaining > 1 ? 's' : ''} available` : 'Free trial completed'}</span>
            <span>{freeProgress}% Consumed</span>
          </div>
        </div>

        {/* Purchased Credits Active Card */}
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">Active On-Demand Credits</span>
            <p className="text-xs text-zinc-400">
              {creditBalance.purchasedCredits > 0 
                ? `You have ${creditBalance.purchasedCredits} paid interview session credit${creditBalance.purchasedCredits > 1 ? 's' : ''} ready to use anytime (${creditBalance.totalAvailable} total available).`
                : `No paid credits active. ${creditBalance.freeTrialRemaining > 0 ? `${creditBalance.freeTrialRemaining} free trial sessions remaining.` : 'Choose Standard (₹15) or Advanced (₹29) below to add sessions.'}`}
            </p>
          </div>
          {creditBalance.totalAvailable > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('mock-interview')}
              className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Practice Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Checkout Error Message */}
      {checkoutError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start justify-between text-xs text-rose-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Payment Checkout Notice</p>
              <p className="mt-0.5 text-zinc-300">{checkoutError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutError(null)}
            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Dual Pricing Cards */}
      <div className="space-y-4">
        <div>
          <span className="text-xs uppercase font-semibold text-emerald-400 tracking-widest block">Pay-Per-Interview</span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Choose Your Interview Session Tier</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Standard Interview Card (₹15) */}
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-7 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Standard Session</span>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">Core Drills</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">Standard Interview</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Ideal for rapid technical drills, baseline scoring, and regular self-evaluations.
                </p>
              </div>

              <div className="border-y border-zinc-800/80 py-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">₹15</span>
                  <span className="text-xs text-zinc-400">per interview session</span>
                </div>
                <span className="text-[11px] text-zinc-500 block mt-1">Single session purchase · 1500 paise · No recurring charges</span>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>AI-powered mock interview tailored to role & level</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Interview performance score (0–100 index)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Essential feedback and improvement suggestions</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Speech transcript recording & answer review</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="button"
                id="btn-choose-standard-pricing"
                disabled={isCheckingOut}
                onClick={() => handleSelectPlan('standard')}
                className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-750 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-zinc-700/60 flex items-center justify-center gap-2 shadow-sm"
              >
                {isCheckingOut && checkingOutPlan === 'standard' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Opening Razorpay Checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Choose Standard — ₹15</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Advanced Interview Card (₹29) */}
          <div className="bg-[#0d0f17] border border-purple-500/40 rounded-2xl p-7 flex flex-col justify-between relative shadow-lg shadow-purple-950/20">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">In-Depth Assessment</span>
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Recommended</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">Advanced Interview</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Comprehensive simulation with deep answer evaluation, communication cadence, and precision coaching.
                </p>
              </div>

              <div className="border-y border-zinc-800/80 py-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">₹29</span>
                  <span className="text-xs text-zinc-400">per interview session</span>
                </div>
                <span className="text-[11px] text-zinc-500 block mt-1">Single session purchase · 2900 paise · No recurring charges</span>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-white">Everything included in Standard</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>More detailed interview feedback across all responses</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Communication and answer-quality insights (WPM & filler words)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Personalized improvement suggestions and weak-spot remediation</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="button"
                id="btn-choose-advanced-pricing"
                disabled={isCheckingOut}
                onClick={() => handleSelectPlan('advanced')}
                className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2"
              >
                {isCheckingOut && checkingOutPlan === 'advanced' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Opening Razorpay Checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 fill-zinc-950" />
                    <span>Choose Advanced — ₹29</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Payment Methods Guarantee */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            100% Secure Checkout powered by <strong>Razorpay Standard Checkout</strong>. Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets.
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono shrink-0">Razorpay Test & Live Mode Supported</span>
      </div>

      {/* PAYMENT SUCCESS MODAL RECEIPT */}
      {paymentReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 text-left space-y-5 shadow-2xl relative">
            <button
              onClick={() => setPaymentReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Payment Verified
              </span>
              <h3 className="text-xl font-bold text-white">Interview Session Added!</h3>
              <p className="text-xs text-zinc-400">
                You have successfully unlocked <strong className="text-white">{paymentReceipt.planName}</strong>.
              </p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Plan Tier:</span>
                <span className="text-white font-semibold">{paymentReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Paid:</span>
                <span className="text-white font-mono font-bold">
                  {paymentReceipt.planId === 'advanced' ? '₹29' : '₹15'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Credits Granted:</span>
                <span className="text-emerald-400 font-bold">+{paymentReceipt.creditsGranted || 1} Session</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-500">Payment ID:</span>
                <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[180px]">{paymentReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Order ID:</span>
                <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[180px]">{paymentReceipt.orderId}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPaymentReceipt(null)}
                className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentReceipt(null);
                  onNavigateTab('mock-interview');
                }}
                className="flex-1 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <span>Start Mock Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
