import React, { useState, useEffect, useMemo } from 'react';
import { 
  Code2, 
  Search, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Sparkles, 
  ChevronRight, 
  Building2, 
  BrainCircuit, 
  Layers, 
  Flame, 
  Target, 
  ArrowLeft, 
  BookOpen, 
  Bot, 
  Video, 
  FileText, 
  Award, 
  Zap, 
  Filter,
  X,
  Database,
  RefreshCw,
  PlaySquare,
  Globe,
  Tag,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { auth } from '../firebase';
import { 
  dsaPrepService, 
  DEFAULT_QUESTIONS, 
  DEFAULT_COMPANIES, 
  DEFAULT_TOPICS, 
  DEFAULT_DSA_SHEETS, 
  DEFAULT_RESOURCES, 
  DEFAULT_VIDEO_TOPICS, 
  DEFAULT_VIDEO_RESOURCES 
} from '../services/dsaPrepService';
import {
  DSAQuestionItem,
  DSAResourceItem,
  DSACompanyItem,
  DSASheetItem,
  DSATopicItem,
  DSAVideoResourceItem,
  DSAVideoTopicItem
} from '../types/dsaPrep';

// Helper function to normalize topic strings for alias and plural/singular matching
function normalizeTopic(topic: string): string {
  const t = (topic || '').trim().toLowerCase();
  if (!t) return '';
  const map: Record<string, string> = {
    'arrays': 'array',
    'array': 'array',
    'strings': 'string',
    'string': 'string',
    'trees': 'tree',
    'tree': 'tree',
    'graphs': 'graph',
    'graph': 'graph',
    'dp': 'dynamic programming',
    'dynamic programming': 'dynamic programming',
    'dynamic-programming': 'dynamic programming',
    'stacks': 'stack',
    'stack': 'stack',
    'queues': 'queue',
    'queue': 'queue',
    'stack & queue': 'stack',
    'matrices': 'matrix',
    'matrix': 'matrix',
    'linked lists': 'linked list',
    'linked list': 'linked list',
    'linkedlist': 'linked list',
    'binary search': 'binary search',
    'bst': 'bst',
    'binary search trees': 'bst',
    'binary search tree': 'bst',
    'heaps': 'heap',
    'heap': 'heap',
    'tries': 'trie',
    'trie': 'trie',
    'recursion': 'recursion',
    'backtracking': 'backtracking',
    'greedy': 'greedy',
    'sliding window': 'sliding window',
    'two pointer': 'two pointer',
    'two pointers': 'two pointer',
    'prefix sum': 'prefix sum',
    'bit manipulation': 'bit manipulation',
  };
  return map[t] || t;
}

function areTopicsMatching(topicA: string, topicB: string): boolean {
  if (!topicA || !topicB) return false;
  const a = topicA.trim().toLowerCase();
  const b = topicB.trim().toLowerCase();
  if (a === b) return true;
  const normA = normalizeTopic(topicA);
  const normB = normalizeTopic(topicB);
  if (normA === normB) return true;
  return normA.includes(normB) || normB.includes(normA);
}

export function DsaPrepHubTab() {
  // Data state from Firestore / Dataset (initialized with default datasets)
  const [questions, setQuestions] = useState<DSAQuestionItem[]>(() => 
    DEFAULT_QUESTIONS.map((q, idx) => ({ ...q, id: `q-${idx + 1}` }))
  );
  const [companies, setCompanies] = useState<DSACompanyItem[]>(() => 
    DEFAULT_COMPANIES.map((c, idx) => ({ ...c, id: `c-${idx + 1}` }))
  );
  const [topics, setTopics] = useState<DSATopicItem[]>(() => 
    DEFAULT_TOPICS.map((t, idx) => ({ ...t, id: `t-${idx + 1}` }))
  );
  const [sheets, setSheets] = useState<DSASheetItem[]>(() => 
    DEFAULT_DSA_SHEETS.map((s, idx) => ({ ...s, id: `s-${idx + 1}` }))
  );
  const [resources, setResources] = useState<DSAResourceItem[]>(() => 
    DEFAULT_RESOURCES.map((r, idx) => ({ ...r, id: `r-${idx + 1}` }))
  );
  const [videoTopics, setVideoTopics] = useState<DSAVideoTopicItem[]>(() => 
    DEFAULT_VIDEO_TOPICS.map((vt, idx) => ({ ...vt, id: `vt-${idx + 1}` }))
  );
  const [videoResources, setVideoResources] = useState<DSAVideoResourceItem[]>(() => 
    DEFAULT_VIDEO_RESOURCES.map((vr, idx) => ({ ...vr, id: `vr-${idx + 1}` }))
  );
  
  // User solved questions tracking
  const [solvedQuestionKeys, setSolvedQuestionKeys] = useState<Set<string>>(new Set());
  
  // Loading & Seeding state
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedNotification, setSeedNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Main Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'companies' | 'topics' | 'sheets' | 'resources' | 'videos'>('overview');
  
  // Drill-down selection states
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [selectedTopicName, setSelectedTopicName] = useState<string | null>(null);
  const [selectedPatternName, setSelectedPatternName] = useState<string | null>(null);

  // Question Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterPattern, setFilterPattern] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'solved' | 'unsolved'>('all');

  // AI Coach Modal State
  const [aiCoachModalOpen, setAiCoachModalOpen] = useState(false);
  const [aiCoachTopic, setAiCoachTopic] = useState('Array');
  const [aiCoachPrompt, setAiCoachPrompt] = useState('');
  const [aiCoachLoading, setAiCoachLoading] = useState(false);
  const [aiCoachResponse, setAiCoachResponse] = useState<string | null>(null);
  const [aiCoachError, setAiCoachError] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [
          fetchedQuestions,
          fetchedCompanies,
          fetchedTopics,
          fetchedSheets,
          fetchedResources,
          fetchedVideoTopics,
          fetchedVideoResources
        ] = await Promise.all([
          dsaPrepService.getQuestions(),
          dsaPrepService.getCompanies(),
          dsaPrepService.getTopics(),
          dsaPrepService.getDsaSheets(),
          dsaPrepService.getResources(),
          dsaPrepService.getVideoTopics(),
          dsaPrepService.getVideoResources()
        ]);

        if (isMounted) {
          setQuestions(fetchedQuestions);
          setCompanies(fetchedCompanies);
          setTopics(fetchedTopics);
          setSheets(fetchedSheets);
          setResources(fetchedResources);
          setVideoTopics(fetchedVideoTopics);
          setVideoResources(fetchedVideoResources);
        }

        // Fetch user solved items if logged in
        const user = auth.currentUser;
        if (user && isMounted) {
          const solvedList = await dsaPrepService.getUserSolvedQuestions(user.uid);
          setSolvedQuestionKeys(new Set(solvedList));
        }
      } catch (err) {
        console.error("Failed loading DSA Prep Hub data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  // Sync / Seed Dataset to Firestore Handler
  const handleSeedDataset = async () => {
    setSeeding(true);
    setSeedNotification(null);
    try {
      const res = await dsaPrepService.seedFirestoreDataset({ overwrite: false });
      setSeedNotification({
        type: res.success ? 'success' : 'error',
        message: res.message
      });

      // Reload updated data
      const [q, c, t, s, r, vt, vr] = await Promise.all([
        dsaPrepService.getQuestions(),
        dsaPrepService.getCompanies(),
        dsaPrepService.getTopics(),
        dsaPrepService.getDsaSheets(),
        dsaPrepService.getResources(),
        dsaPrepService.getVideoTopics(),
        dsaPrepService.getVideoResources()
      ]);
      setQuestions(q);
      setCompanies(c);
      setTopics(t);
      setSheets(s);
      setResources(r);
      setVideoTopics(vt);
      setVideoResources(vr);
    } catch (err: any) {
      setSeedNotification({
        type: 'error',
        message: err?.message || 'Error seeding dataset to Firestore'
      });
    } finally {
      setSeeding(false);
    }
  };

  // Toggle question solved
  const handleToggleSolved = async (questionTitle: string) => {
    const isCurrentlySolved = solvedQuestionKeys.has(questionTitle);
    const newSolvedSet = new Set(solvedQuestionKeys);

    if (isCurrentlySolved) {
      newSolvedSet.delete(questionTitle);
    } else {
      newSolvedSet.add(questionTitle);
    }
    setSolvedQuestionKeys(newSolvedSet);

    const user = auth.currentUser;
    if (user) {
      await dsaPrepService.toggleQuestionSolved(user.uid, questionTitle, !isCurrentlySolved);
    }
  };

  // Dynamic stats calculation
  const totalQuestionsCount = questions.length;
  const solvedQuestionsCount = questions.filter(q => solvedQuestionKeys.has(q.title)).length;
  const overallProgressPercent = totalQuestionsCount > 0 
    ? Math.round((solvedQuestionsCount / totalQuestionsCount) * 100) 
    : 0;

  // Extract unique patterns for dropdown
  const allPatterns = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.pattern) set.add(q.pattern);
    });
    return Array.from(set).sort();
  }, [questions]);

  // Extract unique topics for dropdown
  const allTopicNames = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    topics.forEach(t => {
      if (t.topic) set.add(t.topic);
    });
    return Array.from(set).sort();
  }, [questions, topics]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const isSolved = solvedQuestionKeys.has(q.title) || (!!q.id && solvedQuestionKeys.has(q.id));

      // Status Filter
      if (filterStatus === 'solved' && !isSolved) return false;
      if (filterStatus === 'unsolved' && isSolved) return false;

      // Difficulty Filter
      if (filterDifficulty.toLowerCase() !== 'all' && q.difficulty.toLowerCase() !== filterDifficulty.toLowerCase()) return false;

      // Topic Filter
      if (filterTopic.toLowerCase() !== 'all' && !areTopicsMatching(q.topic, filterTopic)) return false;

      // Pattern Filter
      if (filterPattern.toLowerCase() !== 'all' && (!q.pattern || q.pattern.toLowerCase() !== filterPattern.toLowerCase())) return false;

      // Company Filter
      if (filterCompany.toLowerCase() !== 'all') {
        const matchComp = q.company && q.company.some(c => c.toLowerCase() === filterCompany.toLowerCase());
        if (!matchComp) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesTopic = q.topic.toLowerCase().includes(query) || normalizeTopic(q.topic).includes(normalizeTopic(query));
        const matchesPattern = q.pattern ? q.pattern.toLowerCase().includes(query) : false;
        const matchesCompany = q.company ? q.company.some(c => c.toLowerCase().includes(query)) : false;
        const matchesPlatform = q.platform ? q.platform.toLowerCase().includes(query) : false;
        const matchesTags = q.tags ? q.tags.some(t => t.toLowerCase().includes(query)) : false;

        if (!matchesTitle && !matchesTopic && !matchesPattern && !matchesCompany && !matchesPlatform && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [questions, solvedQuestionKeys, filterStatus, filterDifficulty, filterTopic, filterPattern, filterCompany, searchQuery]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || 
      filterCompany.toLowerCase() !== 'all' || 
      filterTopic.toLowerCase() !== 'all' || 
      filterDifficulty.toLowerCase() !== 'all' || 
      filterPattern.toLowerCase() !== 'all' || 
      filterStatus.toLowerCase() !== 'all';
  }, [searchQuery, filterCompany, filterTopic, filterDifficulty, filterPattern, filterStatus]);

  // Reset all filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCompany('all');
    setFilterTopic('all');
    setFilterDifficulty('all');
    setFilterPattern('all');
    setFilterStatus('all');
    resetDrillDown();
  };

  // Filter handlers with auto-routing to questions view on active search/filter
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    resetDrillDown();
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }
  };

  const handleFilterCompanyChange = (val: string) => {
    setFilterCompany(val);
    resetDrillDown();
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }
  };

  const handleFilterTopicChange = (val: string) => {
    setFilterTopic(val);
    resetDrillDown();
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }
  };

  const handleFilterDifficultyChange = (val: string) => {
    setFilterDifficulty(val);
    resetDrillDown();
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }
  };

  const handleFilterPatternChange = (val: string) => {
    setFilterPattern(val);
    resetDrillDown();
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }
  };

  const handleFilterStatusChange = (val: 'all' | 'solved' | 'unsolved') => {
    setFilterStatus(val);
    resetDrillDown();
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }
  };

  // AI Coach open modal handler
  const openAiCoachModal = (topic?: string) => {
    if (topic) {
      setAiCoachTopic(topic);
    } else if (filterTopic !== 'all') {
      setAiCoachTopic(filterTopic);
    } else if (!aiCoachTopic) {
      setAiCoachTopic(allTopicNames[0] || 'Array');
    }
    setAiCoachError(null);
    setAiCoachModalOpen(true);
  };

  // AI Coach submit handler with authoritative topic propagation
  const handleAskAiCoach = async () => {
    const topicToUse = aiCoachTopic || (filterTopic !== 'all' ? filterTopic : 'Array');
    const promptToUse = aiCoachPrompt.trim();

    if (!promptToUse) {
      setAiCoachError('Please enter your question or doubt.');
      return;
    }

    setAiCoachLoading(true);
    setAiCoachError(null);

    try {
      const res = await fetch('/api/gemini/dsa/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: topicToUse,
          query: promptToUse,
          history: []
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiCoachResponse(data.text || `No guidance generated for ${topicToUse}.`);
      } else {
        const errText = await res.text();
        throw new Error(errText || 'Failed to fetch AI guidance.');
      }
    } catch (err: any) {
      console.error('Error in AI DSA Coach:', err);
      setAiCoachError(err.message || 'Unable to connect to AI Coach. Please try again.');
    } finally {
      setAiCoachLoading(false);
    }
  };

  // Reset drilldown
  const resetDrillDown = () => {
    setSelectedCompanyName(null);
    setSelectedTopicName(null);
    setSelectedPatternName(null);
  };

  // Company drilldown navigation handler
  const handleSelectCompanyDrilldown = (companyName: string) => {
    if (filterCompany !== 'all' && filterCompany.toLowerCase() !== companyName.toLowerCase()) {
      setFilterCompany('all');
    }
    setSelectedCompanyName(companyName);
  };

  return (
    <div id="dsa-prep-hub-view" className="space-y-8 animate-fadeIn text-left pb-16">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#111422] via-[#0d0f17] to-[#0a0c14] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="text-left max-w-xl space-y-2 z-10">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-400 font-medium w-fit">
            <Code2 className="w-3.5 h-3.5" />
            DSA Preparation Hub
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Master DSA & Top Companies</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Practice curated coding problems from top companies, explore sheets, video tutorials, and track your progress in Firestore.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSeedDataset}
              disabled={seeding}
              className="px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Seed or sync local dataset into Firestore collections"
            >
              <Database className="w-3.5 h-3.5" />
              {seeding ? "Syncing to Firestore..." : "Sync Dataset to Firestore"}
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0 z-10">
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Questions</span>
            <span className="text-lg font-black text-white mt-0.5 block">{solvedQuestionsCount} / {totalQuestionsCount}</span>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Solved</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Companies</span>
            <span className="text-lg font-black text-white mt-0.5 block">{companies.length}</span>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Tracked</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Sheets</span>
            <span className="text-lg font-black text-amber-400 mt-0.5 block">{sheets.length}</span>
            <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Curated Sheets</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Overall</span>
            <span className="text-lg font-black text-purple-400 mt-0.5 block">{overallProgressPercent}%</span>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${overallProgressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* SEED NOTIFICATION BANNER */}
      {seedNotification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
          seedNotification.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
        }`}>
          <span>{seedNotification.message}</span>
          <button onClick={() => setSeedNotification(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* NAVIGATION SUB-TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => { setActiveTab('overview'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'overview' && !selectedCompanyName && !selectedTopicName
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" /> Overview & Stats
        </button>

        <button
          onClick={() => { setActiveTab('questions'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'questions' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> All Questions ({questions.length})
        </button>

        <button
          onClick={() => { setActiveTab('companies'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'companies' || selectedCompanyName
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Companies ({companies.length})
        </button>

        <button
          onClick={() => { setActiveTab('sheets'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'sheets' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> DSA Sheets ({sheets.length})
        </button>

        <button
          onClick={() => { setActiveTab('resources'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'resources' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Learning Resources ({resources.length})
        </button>

        <button
          onClick={() => { setActiveTab('videos'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'videos' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> Video Playlists ({videoResources.length})
        </button>

        <button
          onClick={() => { setActiveTab('topics'); resetDrillDown(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'topics' || selectedTopicName
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> DSA Topics ({topics.length})
        </button>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-[#0d0f17] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search questions, topics, patterns, companies or tags (e.g., Two Sum, Sliding Window, Amazon, DP)..."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl pl-11 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => handleSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* DROPDOWN FILTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {/* Company Filter */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Company</label>
            <select
              value={filterCompany}
              onChange={(e) => handleFilterCompanyChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-purple-500"
            >
              <option value="all">All Companies</option>
              {companies.map(c => (
                <option key={c.slug || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Topic</label>
            <select
              value={filterTopic}
              onChange={(e) => handleFilterTopicChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-purple-500"
            >
              <option value="all">All Topics</option>
              {allTopicNames.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => handleFilterDifficultyChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-purple-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Pattern Filter */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Pattern</label>
            <select
              value={filterPattern}
              onChange={(e) => handleFilterPatternChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-purple-500"
            >
              <option value="all">All Patterns</option>
              {allPatterns.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 block mb-1 uppercase">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatusChange(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>
          </div>
        </div>

        {/* ACTIVE FILTER SUMMARY & RESET */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs animate-fadeIn">
            <span className="text-zinc-400 text-[11px]">
              Filters active &bull; <strong className="text-purple-400">{filteredQuestions.length}</strong> matching problem{filteredQuestions.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 hover:underline transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {selectedCompanyName ? (
        /* COMPANY DRILL DOWN VIEW */
        <div className="space-y-6 animate-fadeIn">
          <button 
            onClick={resetDrillDown}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-3 bg-zinc-900 rounded-lg border border-zinc-800 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Companies
          </button>

          <div className="bg-gradient-to-r from-zinc-900 via-[#0f111a] to-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white">{selectedCompanyName} Questions</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  Company Filter
                </span>
              </div>
              <p className="text-xs text-zinc-400">Problems asked in coding rounds at {selectedCompanyName}.</p>
            </div>
          </div>

          <QuestionTable 
            questionsList={filteredQuestions.filter(q => q.company && q.company.some(c => c.toLowerCase() === selectedCompanyName.toLowerCase()))}
            solvedSet={solvedQuestionKeys}
            onToggleSolved={handleToggleSolved}
          />
        </div>
      ) : activeTab === 'questions' ? (
        /* QUESTIONS TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              Practice Questions ({filteredQuestions.length})
            </h3>
          </div>
          <QuestionTable 
            questionsList={filteredQuestions}
            solvedSet={solvedQuestionKeys}
            onToggleSolved={handleToggleSolved}
          />
        </div>
      ) : activeTab === 'companies' ? (
        /* COMPANIES TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Companies ({companies.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(comp => {
              const compQuestions = questions.filter(q => q.company && q.company.some(c => c.toLowerCase() === comp.name.toLowerCase()));
              const solvedComp = compQuestions.filter(q => solvedQuestionKeys.has(q.title) || (!!q.id && solvedQuestionKeys.has(q.id))).length;
              const percent = compQuestions.length > 0 ? Math.round((solvedComp / compQuestions.length) * 100) : 0;

              return (
                <div key={comp.slug || comp.name} className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-purple-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{comp.name}</h4>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        {percent}%
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Total Questions:</span>
                      <span className="font-bold text-white">{compQuestions.length}</span>
                    </div>

                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectCompanyDrilldown(comp.name)}
                    className="w-full py-2 bg-zinc-900 hover:bg-purple-600/20 border border-zinc-800 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    View Questions ({compQuestions.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'sheets' ? (
        /* DSA SHEETS TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Curated DSA Practice Sheets ({sheets.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheets.map((sheet, idx) => (
              <div key={idx} className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-purple-500/40 transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase">
                      {sheet.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                      {sheet.problem_count} Problems
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{sheet.name}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{sheet.description}</p>

                  <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                      Creator: <strong className="text-zinc-200">{sheet.creator}</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                      Level: <strong className="text-zinc-200">{sheet.level}</strong>
                    </span>
                  </div>
                </div>

                <a
                  href={sheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-white font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  Open {sheet.platform} Sheet <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'resources' ? (
        /* LEARNING RESOURCES TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              DSA Learning & Practice Resources ({resources.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res, idx) => (
              <div key={idx} className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-amber-500/40 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                      {res.type}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">{res.platform}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{res.title}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{res.description}</p>
                </div>

                <a 
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-white font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  Access Resource <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'videos' ? (
        /* VIDEO RESOURCES TAB */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              Video Courses & Playlists ({videoResources.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoResources.map((vr, idx) => (
              <div key={idx} className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-indigo-500/40 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase">
                      {vr.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">{vr.language}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{vr.name}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{vr.description}</p>

                  <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                      Creator: <strong className="text-zinc-200">{vr.creator}</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                      Level: <strong className="text-zinc-200">{vr.level}</strong>
                    </span>
                  </div>
                </div>

                <a 
                  href={vr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-white font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  Watch Video Series <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            ))}
          </div>

          {/* VIDEO TOPICS BREAKDOWN */}
          <div className="pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Video Topic Coverage</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {videoTopics.map((vt, idx) => (
                <div key={idx} className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-white block">{vt.topic}</span>
                  <p className="text-[11px] text-zinc-400">{vt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'topics' ? (
        /* TOPICS TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              DSA Topics ({topics.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((top, idx) => {
              const topicQs = questions.filter(q => areTopicsMatching(q.topic, top.topic));
              const solvedTopic = topicQs.filter(q => solvedQuestionKeys.has(q.title)).length;
              const percent = topicQs.length > 0 ? Math.round((solvedTopic / topicQs.length) * 100) : 0;

              return (
                <div key={idx} className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-purple-500/40 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{top.topic}</h4>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {topicQs.length} Qs
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">{top.description}</p>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Completion</span>
                        <span className="text-indigo-400 font-bold">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFilterTopic(top.topic);
                        setActiveTab('questions');
                      }}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      Filter Questions <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openAiCoachModal(top.topic)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 shrink-0"
                      title={`Ask AI Coach for ${top.topic}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Coach
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MAIN OVERVIEW DASHBOARD */
        <div className="space-y-8 animate-fadeIn">
          
          {/* AI COACH BANNER */}
          <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-zinc-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Need guidance on a DSA topic?</h3>
              </div>
              <p className="text-xs text-zinc-300">Get instant pattern breakdowns, complexity explanations, and hints from AI Coach.</p>
            </div>

            <button 
              onClick={() => openAiCoachModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI Coach
            </button>
          </div>

          {/* TOP COMPANIES SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  Target Top Companies
                </h3>
                <p className="text-xs text-zinc-400">Focus practice on companies you are actively interviewing with.</p>
              </div>
              <button
                onClick={() => setActiveTab('companies')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                View All ({companies.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.slice(0, 6).map(comp => {
                const compQuestions = questions.filter(q => q.company && q.company.some(c => c.toLowerCase() === comp.name.toLowerCase()));
                const solvedComp = compQuestions.filter(q => solvedQuestionKeys.has(q.title) || (!!q.id && solvedQuestionKeys.has(q.id))).length;
                const percent = compQuestions.length > 0 ? Math.round((solvedComp / compQuestions.length) * 100) : 0;

                return (
                  <div key={comp.slug || comp.name} className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-purple-500/40 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{comp.name}</h4>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          {percent}%
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Available Questions:</span>
                        <span className="font-bold text-white">{compQuestions.length}</span>
                      </div>

                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSelectCompanyDrilldown(comp.name)}
                      className="w-full py-2 bg-zinc-900 hover:bg-purple-600/20 border border-zinc-800 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      View Questions ({compQuestions.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CURATED QUESTIONS TABLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  Curated DSA Practice Questions
                </h3>
                <p className="text-xs text-zinc-400">Browse questions, filter by difficulty, pattern, or company, and mark progress.</p>
              </div>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
                Showing {filteredQuestions.length} Questions
              </span>
            </div>

            <QuestionTable 
              questionsList={filteredQuestions} 
              solvedSet={solvedQuestionKeys}
              onToggleSolved={handleToggleSolved} 
            />
          </div>

        </div>
      )}

      {/* AI COACH MODAL */}
      {aiCoachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl animate-scaleIn">
            <button 
              onClick={() => setAiCoachModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI DSA Interview Coach</h3>
                <p className="text-xs text-zinc-400">Get instant guidance and concept clarification for any topic</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Target Topic / Category</label>
                <select 
                  value={aiCoachTopic}
                  onChange={(e) => {
                    setAiCoachTopic(e.target.value);
                    setAiCoachResponse(null);
                    setAiCoachError(null);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  {allTopicNames.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Your Question or Doubt</label>
                <textarea 
                  rows={3}
                  value={aiCoachPrompt}
                  onChange={(e) => {
                    setAiCoachPrompt(e.target.value);
                    if (aiCoachError) setAiCoachError(null);
                  }}
                  placeholder="e.g. what is indexing, or explain how to derive the optimal approach for two pointers..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {aiCoachError && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
                {aiCoachError}
              </div>
            )}

            {aiCoachLoading && (
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                <span className="text-xs text-zinc-300">
                  DSA Coach is analyzing your doubt for <strong className="text-indigo-400">{aiCoachTopic}</strong>...
                </span>
              </div>
            )}

            {aiCoachResponse && !aiCoachLoading && (
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Guidance for {aiCoachTopic}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(aiCoachResponse)}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs text-zinc-300 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                  {aiCoachResponse}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setAiCoachModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800"
              >
                Close
              </button>
              <button 
                disabled={aiCoachLoading}
                onClick={handleAskAiCoach}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                {aiCoachLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Ask AI Coach
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// REUSABLE QUESTION TABLE COMPONENT
function QuestionTable({ 
  questionsList, 
  solvedSet,
  onToggleSolved 
}: { 
  questionsList: DSAQuestionItem[]; 
  solvedSet: Set<string>;
  onToggleSolved: (title: string) => void;
}) {
  if (questionsList.length === 0) {
    return (
      <div className="bg-[#0d0f17] border border-zinc-800 rounded-xl p-8 text-center space-y-2">
        <p className="text-xs text-zinc-400">No questions matched your search/filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl overflow-x-auto shadow-inner">
      <table className="w-full text-left text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            <th className="py-3 px-4 w-12 text-center">Status</th>
            <th className="py-3 px-4">Problem Title</th>
            <th className="py-3 px-4">Topic / Pattern</th>
            <th className="py-3 px-4">Difficulty</th>
            <th className="py-3 px-4">Company Tags</th>
            <th className="py-3 px-4 text-right">Platform</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {questionsList.map((q, idx) => {
            const isSolved = solvedSet.has(q.title) || (!!q.id && solvedSet.has(q.id));

            return (
              <tr key={q.id || `q-${idx}`} className="hover:bg-zinc-900/40 transition-colors">
                {/* Solved Checkbox */}
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => onToggleSolved(q.title)}
                    title={isSolved ? "Mark as Unsolved" : "Mark as Solved"}
                    className="hover:scale-110 transition-transform"
                  >
                    {isSolved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                    )}
                  </button>
                </td>

                {/* Title */}
                <td className="py-3 px-4 font-bold text-white">
                  <span className={isSolved ? "line-through text-zinc-400" : "text-white"}>
                    {q.title}
                  </span>
                </td>

                {/* Topic & Pattern */}
                <td className="py-3 px-4 space-y-0.5">
                  <span className="block font-semibold text-zinc-300">{q.topic}</span>
                  {q.pattern && <span className="text-[10px] text-indigo-400 block">{q.pattern}</span>}
                </td>

                {/* Difficulty */}
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    q.difficulty.toLowerCase() === 'easy' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : q.difficulty.toLowerCase() === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {q.difficulty}
                  </span>
                </td>

                {/* Company Tags */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {q.company && q.company.slice(0, 3).map(comp => (
                      <span key={comp} className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">
                        {comp}
                      </span>
                    ))}
                    {q.company && q.company.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded">
                        +{q.company.length - 3}
                      </span>
                    )}
                  </div>
                </td>

                {/* External Solve Link */}
                <td className="py-3 px-4 text-right">
                  <a 
                    href={q.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    {q.platform || "Solve"} <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
