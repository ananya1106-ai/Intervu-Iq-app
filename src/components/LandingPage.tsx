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
  Star 
} from 'lucide-react';
import { PageType } from '../types';
import { IntervuIqLogo } from './IntervuIqLogo';

interface LandingPageProps {
  onNavigate: (page: PageType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-3">Flexible Models</h2>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">Transparent Symmetrical Pricing</p>
            <p className="text-zinc-400 max-w-2xl mx-auto">Get absolute access. Scale your capabilities as your target roles and interviews approach.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-300">Basic Tier</h3>
                <p className="text-zinc-500 text-sm mt-1">Perfect for casual self-assessment</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-zinc-500 text-sm"> / forever</span>
                </div>
                <div className="space-y-3.5 text-sm text-zinc-400 border-t border-zinc-800 pt-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2 Basic Mock Sessions / mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Standard Resume ATS Check</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600">
                    <ShieldCheck className="w-4 h-4 text-zinc-600" />
                    <span>No Live Camera Landmarks</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600">
                    <ShieldCheck className="w-4 h-4 text-zinc-600" />
                    <span>No Speech Filler-word Counter</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('register')}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-all mt-8"
              >
                Sign Up Free
              </button>
            </div>

            {/* Pro Tier (Popular) */}
            <div className="bg-zinc-900/60 border-2 border-emerald-500/60 p-8 rounded-2xl relative flex flex-col justify-between shadow-lg shadow-emerald-500/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-zinc-900 text-xs font-extrabold rounded-full uppercase tracking-wider">Most Popular</span>
              <div>
                <h3 className="text-lg font-bold text-white">Full-Stack Pro</h3>
                <p className="text-emerald-400 text-sm mt-1">For serious active job hunters</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$24</span>
                  <span className="text-zinc-500 text-sm"> / month</span>
                </div>
                <div className="space-y-3.5 text-sm text-zinc-300 border-t border-zinc-800/80 pt-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-white">Unlimited Full Mock Sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Unlimited ATS Resume Grading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Live Webcam Expression Mesh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Filler-word Audio Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Personalized DSA & Design Roadmap</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('register')}
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-xl font-bold transition-all shadow-md shadow-emerald-950/40 mt-8"
              >
                Access Pro Account
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-300">University & Org</h3>
                <p className="text-zinc-500 text-sm mt-1">For placement teams & bootcamps</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$189</span>
                  <span className="text-zinc-500 text-sm"> / month</span>
                </div>
                <div className="space-y-3.5 text-sm text-zinc-400 border-t border-zinc-800 pt-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Everything in Pro for up to 50 users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>SaaS Placement Command Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Custom Enterprise Question Bank</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Direct HR Link Export</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('register')}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-all mt-8"
              >
                Contact Institution Team
              </button>
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
    </div>
  );
};
