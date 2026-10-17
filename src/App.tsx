import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ensureUserDocument, getUserDocument, updateUserDocument } from './services/userService';
import { getUserInterviews } from './services/interviewService';
import { generateAndFetchRoadmap } from './services/roadmapService';
import { PageType, UserProfile, ResumeAnalysisResult, RoadmapNode } from './types';
import { 
  INITIAL_USER, 
  INITIAL_ROADMAP 
} from './data';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { OverviewTab } from './components/OverviewTab';
import { MockInterviewTab } from './components/MockInterviewTab';
import { ResumeAnalyzerTab } from './components/ResumeAnalyzerTab';
import { FacialAnalysisTab } from './components/FacialAnalysisTab';
import { SpeechCoachTab } from './components/SpeechCoachTab';
import { PerformanceTab } from './components/PerformanceTab';
import { RoadmapTab } from './components/RoadmapTab';
import { ProfileSettingsTab } from './components/ProfileSettingsTab';
import { DSARecommendationsTab } from './components/DSARecommendationsTab';
import { DsaPrepHubTab } from './components/DsaPrepHubTab';
import { IntervuIqLogo } from './components/IntervuIqLogo';
import { 
  Sparkles, 
  LayoutDashboard, 
  Video, 
  FileText, 
  Smile, 
  Mic, 
  TrendingUp, 
  Award, 
  User, 
  LogOut,
  Menu,
  X,
  Bell,
  Flame,
  Cpu,
  Code2,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [page, setPage] = useState<PageType>('landing');
  const [activeTab, setActiveTab] = useState<PageType>('dashboard');
  
  // Responsive sidebar mobile overlay state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Application Shared State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>(INITIAL_ROADMAP);

  const fetchUserInterviews = async (uid: string) => {
    try {
      const data = await getUserInterviews(uid);
      setInterviews(data);
      setUser(prev => ({
        ...prev,
        interviewsCompleted: data.length
      }));
    } catch (err) {
      console.error("Error loading user interviews from Firestore:", err);
    }
  };

  // Handle new mock interview completion
  const handleSessionSaved = async (newSession: any) => {
    const currentUser = auth.currentUser;
    if (currentUser?.uid) {
      await fetchUserInterviews(currentUser.uid);
      // Automatically adapt the personalized roadmap in Firestore for the new interview session
      generateAndFetchRoadmap(currentUser.uid).catch(err => {
        console.error("Error adapting roadmap after session saved:", err);
      });
    } else {
      setInterviews(prev => [newSession, ...prev]);
    }

    // Dynamic readiness calibration
    setUser(prev => ({
      ...prev,
      interviewsCompleted: prev.interviewsCompleted + 1,
      placementReadiness: Math.min(100, prev.placementReadiness + 4)
    }));
  };

  // Handle resume uploading
  const handleAddResumeAnalysis = (result: ResumeAnalysisResult) => {
    setUser(prev => ({
      ...prev,
      resumeUploaded: true,
      resumeFileName: result.fileName,
      placementReadiness: Math.min(100, prev.placementReadiness + 6)
    }));
  };

  // Toggle learning roadmap completion
  const handleToggleRoadmapNode = (id: string) => {
    setRoadmap(prev => {
      const index = prev.findIndex(node => node.id === id);
      if (index === -1) return prev;

      const updated = [...prev];
      const node = updated[index];
      const nextStatus = node.status === 'completed' ? 'unlocked' : 'completed';
      
      updated[index] = { ...node, status: nextStatus };

      // If completing, unlock the next node in timeline sequence
      if (nextStatus === 'completed' && index < updated.length - 1) {
        if (updated[index + 1].status === 'locked') {
          updated[index + 1] = { ...updated[index + 1], status: 'unlocked' };
        }
      }

      // If marking incomplete, re-lock downstream items
      if (nextStatus === 'unlocked') {
        for (let i = index + 1; i < updated.length; i++) {
          updated[i] = { ...updated[i], status: 'locked' };
        }
      }

      return updated;
    });

    // Calibrate placement score based on topics completed
    setUser(prev => {
      const isFinishing = roadmap.find(n => n.id === id)?.status !== 'completed';
      const offset = isFinishing ? 5 : -5;
      return {
        ...prev,
        placementReadiness: Math.max(20, Math.min(100, prev.placementReadiness + offset))
      };
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const docData = await ensureUserDocument(firebaseUser.uid, {
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User')
          });
          
          const defaultAvatar = INITIAL_USER.avatar;
          
          setUser(prev => ({
            ...prev,
            email: docData.email || firebaseUser.email || prev.email,
            name: docData.fullName || prev.name,
            targetRole: docData.targetRole || prev.targetRole,
            avatar: docData.profilePhotoUrl || defaultAvatar
          }));

          // Fetch real Firestore interviews
          await fetchUserInterviews(firebaseUser.uid);
        } catch (err) {
          console.error("Error fetching user document/interviews from Firestore:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updated }));
    if (auth.currentUser?.uid) {
      const updates: Record<string, any> = {};
      if (updated.name !== undefined) updates.fullName = updated.name;
      if (updated.targetRole !== undefined) updates.targetRole = updated.targetRole;
      if (updated.avatar !== undefined) {
        updates.profilePhotoUrl = (updated.avatar === INITIAL_USER.avatar || !updated.avatar) ? null : updated.avatar;
      }

      if (Object.keys(updates).length > 0) {
        updateUserDocument(auth.currentUser.uid, updates).catch(err => console.error("Error updating Firestore user doc:", err));
      }
    }
  };

  const handleLoginSuccess = (userName: string, targetRole: string) => {
    setUser(prev => ({
      ...prev,
      name: userName,
      targetRole: targetRole,
      email: auth.currentUser?.email || prev.email
    }));
    setPage('dashboard');
    setActiveTab('dashboard');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
    setPage('login');
    setMobileSidebarOpen(false);
  };

  // Sidebar link renderers
  const sidebarLinks = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'mock-interview', label: 'AI Mock Interview', icon: <Video className="w-4 h-4" /> },
    { id: 'resume-analyzer', label: 'ATS Resume Grade', icon: <FileText className="w-4 h-4" /> },
    { id: 'facial-analysis', label: 'Expression tracker', icon: <Smile className="w-4 h-4" /> },
    { id: 'speech-coach', label: 'Speech & Vocal Coach', icon: <Mic className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance progress', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Personalized Roadmap', icon: <Award className="w-4 h-4" /> },
    { id: 'dsa-prep', label: 'DSA Prep Hub', icon: <Code2 className="w-4 h-4" /> },
    { id: 'dsa-recommendations', label: 'DSA Recommendations', icon: <Cpu className="w-4 h-4" /> },
    { id: 'profile', label: 'Settings & Profile', icon: <User className="w-4 h-4" /> }
  ];

  // Render correct nested tab view
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <OverviewTab 
            user={user} 
            interviews={interviews} 
            roadmap={roadmap} 
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectInterviewDetail={(int) => {
              setSelectedInterview(int);
              setActiveTab('performance');
            }}
          />
        );
      case 'mock-interview':
        return <MockInterviewTab onSessionSaved={handleSessionSaved} />;
      case 'resume-analyzer':
        return <ResumeAnalyzerTab onAddAnalysis={handleAddResumeAnalysis} />;
      case 'facial-analysis':
        return <FacialAnalysisTab />;
      case 'speech-coach':
        return <SpeechCoachTab />;
      case 'performance':
        return (
          <PerformanceTab 
            interviews={interviews} 
            selectedInterview={selectedInterview}
            onClearSelectedInterview={() => setSelectedInterview(null)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            />
        );
      case 'roadmap':
        return <RoadmapTab onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'dsa-prep':
        return <DsaPrepHubTab />;
      case 'dsa-recommendations':
        return <DSARecommendationsTab />;
      case 'profile':
        return <ProfileSettingsTab user={user} onUpdateUser={handleUpdateProfile} />;
      default:
        return <div className="text-zinc-500 text-sm">Target module is pending setup.</div>;
    }
  };

  // If on Landing Page
  if (page === 'landing') {
    return <LandingPage onNavigate={(p) => setPage(p)} />;
  }

  // If on Authentication screens
  if (page === 'login' || page === 'register' || page === 'forgot-password') {
    return (
      <AuthScreens 
        initialMode={page === 'login' ? 'login' : page === 'register' ? 'register' : 'forgot-password'} 
        onNavigate={(p) => setPage(p)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ELSE: MAIN LOGGED-IN SYSTEM DESKTOP WRAPPER
  return (
    <div id="app-viewport" className="min-h-screen bg-[#07080c] text-zinc-100 flex overflow-hidden font-sans">
      
      {/* DESKTOP SIDEBAR PANEL */}
      <aside id="sidebar-desktop" className="hidden lg:flex flex-col justify-between w-64 bg-[#0d0f17] border-r border-zinc-800/80 p-5 shrink-0 h-screen sticky top-0">
        <div className="space-y-8 text-left">
          {/* Sidebar Brand header */}
          <div 
            onClick={() => setPage('landing')}
            className="flex items-center gap-3 select-none cursor-pointer group py-1 hover:opacity-90 transition-opacity"
          >
            <IntervuIqLogo size="md" />
          </div>

          {/* Navigation link list */}
          <nav className="space-y-1.5">
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-3 mb-2">Systems Hub</span>
            {sidebarLinks.map((link) => {
              const isSelected = activeTab === link.id;
              return (
                <button 
                  key={link.id}
                  onClick={() => setActiveTab(link.id as PageType)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold' : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                >
                  {link.icon}
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Free Trial Status Card */}
          <div className="bg-[#141722] border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Free Trial
              </span>
              <span className="text-emerald-400 font-mono tabular-nums font-bold">
                {Math.min(15, interviews.length)}/15 Free
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                style={{ width: `${Math.min(100, Math.round((Math.min(15, interviews.length) / 15) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500">
              <span>{Math.max(0, 15 - interviews.length)} remaining</span>
              <button 
                type="button"
                onClick={() => {
                  setPage('landing');
                  setTimeout(() => {
                    const el = document.getElementById('pricing');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer details */}
        <div className="space-y-4 pt-4 border-t border-zinc-800 text-left">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.avatar} 
              alt="User Avatar"
              className="w-9 h-9 rounded-xl object-cover border border-zinc-700"
            />
            <div className="truncate max-w-[130px]">
              <span className="block text-xs font-bold text-white truncate leading-tight">{user.name}</span>
              <span className="text-[10px] text-zinc-500 truncate block mt-0.5">{user.email}</span>
            </div>
          </div>

          <button 
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-xs text-zinc-400 hover:text-white font-bold rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out Workspace
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header id="mobile-header" className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl lg:hidden hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 select-none">
              <span className="text-sm font-bold text-white tracking-tight uppercase border border-zinc-800 px-2.5 py-1 rounded-lg bg-zinc-900">
                {sidebarLinks.find(link => link.id === activeTab)?.label || 'System Workspace'}
              </span>
            </div>
          </div>

          {/* Quick Header metric logs */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trial: <strong className="font-mono tabular-nums">{Math.min(15, interviews.length)}/15</strong> Free</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>4 Days Streak</span>
            </div>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            </button>
          </div>
        </header>

        {/* MAIN EMBED TAB SCENE */}
        <main id="main-content-viewport" className="p-6 sm:p-8 max-w-7xl w-full mx-auto pb-16">
          {renderActiveTab()}
        </main>
      </div>

      {/* MOBILE OVERLAY DRAWER SIDEBAR */}
      {mobileSidebarOpen && (
        <div id="sidebar-mobile-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex">
          <div className="w-64 bg-[#0d0f17] h-full p-5 flex flex-col justify-between border-r border-zinc-800 relative">
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-900 border border-zinc-850 text-zinc-400 rounded-lg hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6 text-left mt-4 overflow-y-auto">
              <div 
                onClick={() => {
                  setPage('landing');
                  setMobileSidebarOpen(false);
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <IntervuIqLogo size="md" />
              </div>

              {/* Mobile Drawer Free Trial Status Card */}
              <div className="bg-[#141722] border border-zinc-800/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Free Trial
                  </span>
                  <span className="text-emerald-400 font-mono tabular-nums font-bold">
                    {Math.min(15, interviews.length)}/15
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((Math.min(15, interviews.length) / 15) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  {Math.max(0, 15 - interviews.length)} free interviews remaining
                </span>
              </div>

              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const isSelected = activeTab === link.id;
                  return (
                    <button 
                      key={link.id}
                      onClick={() => {
                        setActiveTab(link.id as PageType);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold' : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                    >
                      {link.icon}
                      {link.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800 text-left">
              <div className="flex items-center gap-3 px-2">
                <img 
                  src={user.avatar} 
                  alt="User Avatar"
                  className="w-9 h-9 rounded-xl object-cover border border-zinc-700"
                />
                <div className="truncate max-w-[130px]">
                  <span className="block text-xs font-bold text-white truncate leading-tight">{user.name}</span>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="w-full py-2.5 bg-zinc-900 text-xs text-zinc-400 hover:text-white font-bold rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
