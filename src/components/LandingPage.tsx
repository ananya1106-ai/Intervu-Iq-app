import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Video, 
  FileText, 
  BrainCircuit, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Mic, 
  Smile, 
  HelpCircle, 
  ChevronDown, 
  Users, 
  Award, 
  Star,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { PageType } from '../types';
import { IntervuIqLogo } from './IntervuIqLogo';
import { auth } from '../firebase';
import { startRazorpayCheckout, PaymentVerificationResponse, PaymentPlanId } from '../services/razorpayService';

interface LandingPageProps {
  onNavigate: (page: PageType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Razorpay Checkout State for Pricing buttons
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkingOutPlan, setCheckingOutPlan] = useState<PaymentPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentVerificationResponse | null>(null);
  const [authPromptPlan, setAuthPromptPlan] = useState<{ planId: PaymentPlanId; name: string; price: string } | null>(null);

  const handleSelectPlan = (planId: PaymentPlanId) => {
    setCheckoutError(null);

    // If candidate is not authenticated yet, prompt them to sign in
    if (!auth.currentUser) {
      setAuthPromptPlan({
        planId,
        name: planId === 'advanced' ? 'Advanced Interview' : 'Standard Interview',
        price: planId === 'advanced' ? '₹29' : '₹15',
      });
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

  const stats = [
    { value: '94%', label: 'Offer Success Rate', desc: 'Seniors & juniors securing target roles' },
    { value: '18,000+', label: 'Interviews Prep Session', desc: 'Mock interviews powered by our coach' },
    { value: '45%', label: 'Salary Jump Average', desc: 'Reported by alumni in high-growth tech' },
    { value: '4.9/5', label: 'User Satisfaction Score', desc: 'Rated by 10,000+ tech professionals' }
  ];

  const features = [
    {
      icon: <Video className="w-6 h-6 text-emerald-400" />,
      title: 'Real-time Video Mock Interviews',
      desc: 'Interactive live session with dynamic AI interviewers tailoring technical & behavioral questions based on your background.'
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-indigo-400" />,
      title: 'Biometric Expression Mesh',
      desc: 'Advanced on-camera landmark detection monitoring posture, smile index, eye contact, and nerve triggers in real time.'
    },
    {
      icon: <Mic className="w-6 h-6 text-purple-400" />,
      title: 'Speech & Verbal Coaching',
      desc: 'Live voice analytics parsing speaking speed, voice confidence, and identifying exact filler words (um, like, actually).'
    },
    {
      icon: <FileText className="w-6 h-6 text-amber-400" />,
      title: 'Instant ATS Resume Grading',
      desc: 'Upload your resume and immediately scan against specific target roles to identify keywords gap, structure issues, and AI tips.'
    },
    {
      icon: <Layers className="w-6 h-6 text-rose-400" />,
      title: 'Personalized Roadmap Generator',
      desc: 'Our engine identifies key weakness vectors across system design, DSA, or behavioral frameworks, and builds custom paths.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-sky-400" />,
      title: 'Interactive Analytics Center',
      desc: 'Track metrics history, view daily streaks, share verified readiness badges, and monitor your placement probability score.'
    }
  ];

  const faqs = [
    {
      question: 'How does the AI interviewer generate questions?',
      answer: 'Our AI analyzes your uploaded resume and selected job description to create custom questions. In technical mode, it structures graph/algorithmic questions, while in behavioral mode, it structures scenario-based frameworks like STAR.'
    },
    {
      question: 'Is my camera or voice data stored on your servers?',
      answer: 'Absolutely not. All camera frame rendering, speech recognition, and facial expression calculations are processed entirely locally in your browser. We prioritize absolute user privacy above all else.'
    },
    {
      question: 'Can I use this for non-tech roles?',
      answer: 'Yes! While our primary engine is heavily optimized for engineering, product, and designer roles, the behavioral coaching and communication models work exceptionally well for any customer-facing or professional role.'
    },
    {
      question: 'What is the "Placement Readiness Score"?',
      answer: 'It is a comprehensive biometric and cognitive score modeled after elite FAANG hiring rubrics. It aggregates technical accuracy, speech speed, eye contact consistency, and resume keyword match into an objective 0-100 index.'
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-[#090a0f] text-zinc-100 overflow-x-hidden font-sans">
      {/* HEADER NAVBAR */}
      <nav id="navbar" className="sticky top-0 z-50 bg-[#090a0f]/80 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 select-none cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onNavigate('landing')}>
            <IntervuIqLogo size="lg" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#biometrics" className="hover:text-white transition-colors">Biometric Engine</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              id="nav-login-btn"
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Log In
            </button>
            <button 
              id="nav-signup-btn"
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/40 hover:shadow-emerald-500/15"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-24 pb-20 px-6">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-emerald-400 font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Next-Gen Biometric Interview Simulator
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-8"
          >
            Master Your Next Interview with{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 bg-clip-text text-transparent">
              Biometric AI Coaching
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            An elite SaaS platform that trains body language, speech metrics, resume structure, and core skills simultaneously. Get live behavioral tracking, voice tempo guides, and custom DSA/System Design roadmaps in a unified mock playground.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20"
          >
            <button 
              id="hero-primary-cta"
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-zinc-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 group hover:scale-[1.02]"
            >
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              id="hero-secondary-cta"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
            >
              Explore Dashboard Demo
            </button>
          </motion.div>

          {/* Floating UI Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative rounded-2xl border border-zinc-800 bg-[#0e1017] p-4 shadow-2xl shadow-emerald-950/20"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span>INTERVU IQ • Active Interview Prep Module</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Feed Active
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Interviewer Visual */}
              <div className="md:col-span-8 aspect-video bg-[#141722] rounded-xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=400"
                  alt="AI Interviewer"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-zinc-900/90 border border-zinc-800 text-xs text-indigo-400 rounded-lg flex items-center gap-1.5 z-20">
                  <Award className="w-3.5 h-3.5" />
                  Interviewer: Dr. Sofia (FAANG Director AI)
                </div>
                <div className="absolute bottom-4 left-4 text-left z-20">
                  <p className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Active Prompt</p>
                  <p className="text-sm font-semibold text-white mt-1">"Why do you prefer optimistic updates for complex real-time React UI state?"</p>
                </div>
              </div>

              {/* Landmark biometric mesh simulated */}
              <div className="md:col-span-4 bg-[#141722] p-4 rounded-xl flex flex-col justify-between text-left">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                    <Smile className="w-4 h-4 text-emerald-400" /> Biometric Feedback
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>Confidence Level</span>
                        <span className="text-emerald-400">88%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>Eye Contact Ratio</span>
                        <span className="text-indigo-400">92%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-400 h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>WPM Speed</span>
                        <span className="text-amber-400">128 (Perfect)</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-3 mt-4 text-xs text-zinc-500">
                  ⚡ Local Browser Rendering Engine
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUSTED COMPANIES */}
      <section id="companies" className="border-y border-zinc-900 bg-zinc-950/40 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-widest mb-8">Alumni secured offers at elite global teams</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
            <span className="text-lg font-extrabold text-zinc-400 font-mono">GOOGLE</span>
            <span className="text-lg font-extrabold text-zinc-400 font-mono">META</span>
            <span className="text-lg font-extrabold text-zinc-400 font-mono">STRIPE</span>
            <span className="text-lg font-extrabold text-zinc-400 font-mono">AMAZON</span>
            <span className="text-lg font-extrabold text-zinc-400 font-mono">VERCEL</span>
            <span className="text-lg font-extrabold text-zinc-400 font-mono">MICROSOFT</span>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO GRID */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-3">Comprehensive Suite</h2>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">6 Specialized Training Modules</p>
            <p className="text-zinc-400 max-w-2xl mx-auto">Everything you need to transform your placement metrics. Analyze content, tone, syntax, structure, and physical composure all at once.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5 }}
                className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 transition-all shadow-xl hover:shadow-emerald-950/5 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-zinc-800/30 rounded-bl-full group-hover:scale-110 transition-transform" />
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl w-fit mb-5">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section id="stats" className="bg-[#0b0c14] border-y border-zinc-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <p className="text-4xl sm:text-5xl font-extrabold text-white bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm font-semibold text-zinc-200">{stat.label}</p>
                <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="biometrics" className="py-24 px-6 bg-gradient-to-b from-[#090a0f] to-[#040508]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-3">Structured Success</h2>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">How INTERVU IQ Prepares You</p>
            <p className="text-zinc-400 max-w-2xl mx-auto">From direct uploader to comprehensive certification, experience a unified pipeline built to landing elite technical offers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-transparent -translate-y-1/2 hidden md:block z-0" />
            
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl relative z-10 backdrop-blur-sm">
              <span className="text-3xl font-extrabold text-zinc-700 block mb-4">01</span>
              <h3 className="text-lg font-bold text-white mb-2">Upload Resume</h3>
              <p className="text-sm text-zinc-400">Our ATS analyzer rates your resume structure, keyword completeness, and custom missing tech stacks instantly.</p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl relative z-10 backdrop-blur-sm">
              <span className="text-3xl font-extrabold text-emerald-500 block mb-4">02</span>
              <h3 className="text-lg font-bold text-white mb-2">Simulate Interview</h3>
              <p className="text-sm text-zinc-400">Join full behavioral or tech sessions with local browser face trackers, voice analyzers, and transcript tools active.</p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl relative z-10 backdrop-blur-sm">
              <span className="text-3xl font-extrabold text-zinc-700 block mb-4">03</span>
              <h3 className="text-lg font-bold text-white mb-2">Review Biometrics</h3>
              <p className="text-sm text-zinc-400">View real-time filler word counts, eye posture metrics, facial micro-expressions, and sentence coherence scorecards.</p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl relative z-10 backdrop-blur-sm">
              <span className="text-3xl font-extrabold text-indigo-500 block mb-4">04</span>
              <h3 className="text-lg font-bold text-white mb-2">Earn Roadmaps</h3>
              <p className="text-sm text-zinc-400">Recalibrate weak algorithms, build mock projects on suggested stacks, and secure custom progress certification badges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION - 15 FREE INTERVIEWS + PAY-PER-INTERVIEW MODEL */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-900 bg-[#08090e]">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Main Pricing Header */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-semibold text-emerald-400 tracking-widest block mb-3">Transparent Launch Pricing</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              15 Free Interviews First. Then Pay Only When You Practice.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Start with 15 complete AI mock interviews at zero cost. After your trial, practice on demand with transparent per-interview pricing and no compulsory monthly subscriptions.
            </p>
          </div>

          {/* 1. FREE TRIAL SPOTLIGHT BANNER */}
          <div className="bg-[#0d0f17] border border-zinc-800/90 rounded-2xl p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-purple-500/5 to-transparent pointer-events-none rounded-bl-full" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Free Trial Tier · ₹0</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Experience IntervuIQ for Free
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
                  Explore every major AI interview preparation feature before you pay. Complete 15 full-length mock interviews and use all core modules with zero commitment.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">15 free completed AI mock interviews</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>AI Mock Interview simulator</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ATS Resume Analyzer</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Speech & Vocal Coach</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Expression Tracker</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>DSA Prep Hub and AI DSA Coach</span>
                  </div>
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Performance Analytics and Personalized Roadmap</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#141722] border border-zinc-800 p-6 sm:p-8 rounded-xl flex flex-col justify-between text-left space-y-6">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Candidate Access</span>
                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-4xl font-extrabold text-white">₹0</span>
                    <span className="text-xs text-zinc-400">/ 15 full sessions</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Test your verbal communication, system design, algorithm explanations, and biometric composure at your own pace.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => onNavigate('register')}
                    className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-zinc-500 text-center">
                    No payment required to get started.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PAY-PER-INTERVIEW SECTION */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs uppercase font-semibold text-purple-400 tracking-widest block mb-2">On-Demand Practice</span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Pay Only When You Practice
              </h3>
              <p className="text-zinc-400 text-sm">
                No compulsory monthly subscription. Choose the interview you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Standard Interview Card */}
              <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-7 flex flex-col justify-between text-left hover:border-zinc-700 transition-colors">
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Standard Session</span>
                    <h4 className="text-xl font-bold text-white mt-1">Standard Interview</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Ideal for rapid drills, baseline score checks, and recurring self-evaluations.
                    </p>
                  </div>

                  <div className="border-y border-zinc-800/80 py-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white font-mono tabular-nums">₹15</span>
                      <span className="text-xs text-zinc-400">per interview</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-1">Single session purchase · No recurring charge</span>
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

              {/* Advanced Interview Card (Subtly highlighted) */}
              <div className="bg-[#0d0f17] border border-purple-500/40 rounded-2xl p-7 flex flex-col justify-between text-left relative shadow-lg shadow-purple-950/20">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">In-Depth Assessment</span>
                      <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Deep Feedback</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mt-1">Advanced Interview</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Comprehensive simulation with deep answer evaluations, cadence insights, and precision remediation.
                    </p>
                  </div>

                  <div className="border-y border-zinc-800/80 py-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white font-mono tabular-nums">₹29</span>
                      <span className="text-xs text-zinc-400">per interview</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-1">Single session purchase · No recurring charge</span>
                  </div>

                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span className="font-semibold text-white">Everything included in Standard</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>More detailed interview feedback across all 10 responses</span>
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

            {/* Checkout Error Message */}
            {checkoutError && (
              <div className="max-w-lg mx-auto p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start justify-between text-xs text-rose-300 text-left">
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
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Proposed launch pricing disclaimer */}
            <p className="text-xs text-zinc-500 text-center max-w-lg mx-auto">
              Prices are proposed launch prices and can be configured before release.
            </p>
          </div>

          {/* 3. INSTITUTION PLANS */}
          <div className="bg-[#0b0c13] border border-zinc-800/80 rounded-2xl p-8 sm:p-10 text-left max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Colleges & Training Programs</span>
                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Prepare Your Entire Campus
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Equip engineering departments, placement cells, and career bootcamps with institution-level student access, cohort performance tracking, and placement analytics.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-400 pt-2">
                  <span>· Batch student onboarding</span>
                  <span>· Campus placement readiness tracking</span>
                  <span>· Shared performance reports</span>
                </div>
              </div>

              <div className="shrink-0">
                <button 
                  onClick={() => {
                    const el = document.getElementById('contact-institution-dialog');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = 'mailto:institutions@intervuiq.com?subject=Campus%20Inquiry';
                    }
                  }}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-6 border-t border-zinc-900 bg-gradient-to-b from-[#090a0f] to-[#06070a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-3">Frequently Asked</h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">Answers to Core Queries</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all"
                >
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex justify-between items-center text-left"
                  >
                    <span className="font-semibold text-white flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section id="final-cta" className="relative py-24 px-6 border-t border-zinc-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to Land Your Target FAANG Offer?</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed text-sm sm:text-base">
            Get instant setup. No credit card required to simulate your first resume scan or technical mock interview question loop.
          </p>
          <button 
            id="footer-final-cta-btn"
            onClick={() => onNavigate('register')}
            className="px-8 py-4 text-base font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Create Your Free Account Now
          </button>
        </div>
      </section>

      {/* COMPREHENSIVE FOOTER */}
      <footer id="footer" className="border-t border-zinc-900 bg-[#06070a] py-16 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          {/* Column 1: Brand & newsletter */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <IntervuIqLogo size="md" />
            </div>
            <p className="leading-relaxed">
              Elevating tech candidate readiness with instant biometric expression grids, vocal analytics, and dynamic mock interview pipelines. Built fully responsive and privacy-centric.
            </p>
            <div className="space-y-2.5 pt-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Subscribe to our Product Log</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="alex.rivera@stanford.edu"
                  className="bg-zinc-900/80 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg w-full focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={() => alert('Thanks for subscribing!')}
                  className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold px-3 py-2 rounded-lg"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-semibold text-zinc-300 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-zinc-300 transition-colors">Mock Interviewer</a></li>
              <li><a href="#features" className="hover:text-zinc-300 transition-colors">ATS Grading</a></li>
              <li><a href="#biometrics" className="hover:text-zinc-300 transition-colors">Expression Grid</a></li>
              <li><a href="#features" className="hover:text-zinc-300 transition-colors">Speech Coach</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-semibold text-zinc-300 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Hiring Index</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">STAR Framework</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">DSA Cheat Sheet</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">System Design Wiki</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-semibold text-zinc-300 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-300 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Privacy Vault</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Security Audit</a></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-semibold text-zinc-300 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">Biometric Disclaim</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-colors">GDPR / CCPA Info</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
          <p>© 2026 INTERVU IQ Inc. All browser-calculated outputs are secure and locally contained.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-300">Twitter</a>
            <a href="#" className="hover:text-zinc-300">GitHub</a>
            <a href="#" className="hover:text-zinc-300">LinkedIn</a>
          </div>
        </div>
      </footer>

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
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Payment Verified</span>
                <h3 className="text-lg font-bold text-white leading-tight">Interview Session Added!</h3>
              </div>
            </div>

            <div className="bg-[#141722] border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Plan Selected:</span>
                <span className="text-white font-semibold">{paymentReceipt.planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Payment ID:</span>
                <span className="text-zinc-300 font-mono text-[11px]">{paymentReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Order ID:</span>
                <span className="text-zinc-300 font-mono text-[11px]">{paymentReceipt.orderId}</span>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-800 pt-2 font-medium">
                <span className="text-zinc-300">Credits Granted:</span>
                <span className="text-emerald-400 font-bold">+{paymentReceipt.creditsGranted} Interview Session</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Your payment has been cryptographically verified and your interview session credit has been credited to your account.
            </p>

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
                  onNavigate('overview');
                }}
                className="flex-1 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT REQUIRED MODAL FOR UNLOGGED-IN BUYERS */}
      {authPromptPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-left space-y-5 shadow-2xl relative">
            <button
              onClick={() => setAuthPromptPlan(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Account Required</span>
              <h3 className="text-lg font-bold text-white">Sign In to Complete Purchase</h3>
              <p className="text-xs text-zinc-400">
                You selected the <strong className="text-white">{authPromptPlan.name} ({authPromptPlan.price})</strong>. Please log in or register so your purchased interview credit is linked directly to your profile.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthPromptPlan(null);
                  onNavigate('login');
                }}
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                Log In to Continue Checkout
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthPromptPlan(null);
                  onNavigate('register');
                }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all border border-zinc-700/60 cursor-pointer flex items-center justify-center gap-2"
              >
                Create Free Account First
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
