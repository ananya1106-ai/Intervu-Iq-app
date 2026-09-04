import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Terminal, 
  ChevronRight, 
  BookOpen, 
  Video, 
  Cpu, 
  Send, 
  Code2, 
  HelpCircle, 
  Clock, 
  TrendingUp, 
  Award,
  Zap,
  CheckCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DSAProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity: string;
  spaceComplexity: string;
  conceptHint: string;
  leetcodeLink: string;
}

interface DSAResource {
  title: string;
  type: 'video' | 'article' | 'practice';
  url: string;
}

interface DSATrack {
  category: string;
  overallScore: number;
  problems: DSAProblem[];
  resources: DSAResource[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

const DSA_CATEGORIES = [
  { id: 'dp', name: 'Dynamic Programming', score: 58, count: 5, icon: Cpu },
  { id: 'graphs', name: 'Graphs & Trees', score: 64, count: 5, icon: TrendingUp },
  { id: 'arrays', name: 'Arrays & Hashing', score: 85, count: 5, icon: CheckCircle },
  { id: 'recursion', name: 'Recursion & Backtracking', score: 70, count: 5, icon: Sparkles },
  { id: 'sliding-window', name: 'Sliding Window & Pointers', score: 76, count: 5, icon: Terminal },
];

const DEFAULT_TRACKS: Record<string, DSATrack> = {
  'dp': {
    category: 'Dynamic Programming',
    overallScore: 58,
    problems: [
      {
        id: 'lc-322',
        title: 'LeetCode 322: Coin Change',
        description: 'Find the fewest number of coins needed to make up a given amount. Classic knapsack-style problem.',
        difficulty: 'Medium',
        timeComplexity: 'O(N * S)',
        spaceComplexity: 'O(S)',
        conceptHint: 'Use a 1D DP array representing the minimum coins for each sub-amount from 0 to target. Initialize with Infinity.',
        leetcodeLink: 'https://leetcode.com/problems/coin-change/'
      },
      {
        id: 'lc-198',
        title: 'LeetCode 198: House Robber',
        description: 'Determine the maximum amount of money you can rob tonight without alerting the police (cannot rob adjacent houses).',
        difficulty: 'Medium',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        conceptHint: 'At house i, maximum loot is max(rob house i + loot at i-2, loot at i-1). Maintain two rolling values to optimize space.',
        leetcodeLink: 'https://leetcode.com/problems/house-robber/'
      },
      {
        id: 'lc-72',
        title: 'LeetCode 72: Edit Distance',
        description: 'Find the minimum number of operations (insert, delete, replace) required to convert word1 to word2.',
        difficulty: 'Hard',
        timeComplexity: 'O(M * N)',
        spaceComplexity: 'O(M * N)',
        conceptHint: 'Initialize a 2D matrix. If characters match, dp[i][j] = dp[i-1][j-1]. Otherwise, take min(insert, delete, replace) + 1.',
        leetcodeLink: 'https://leetcode.com/problems/edit-distance/'
      },
      {
        id: 'lc-300',
        title: 'LeetCode 300: Longest Increasing Subsequence',
        description: 'Return the length of the longest strictly increasing subsequence in an integer array.',
        difficulty: 'Medium',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(N)',
        conceptHint: 'Can be solved in O(N^2) with standard DP, or optimized to O(N log N) using patience sorting and binary search (Arrays.binarySearch or custom).',
        leetcodeLink: 'https://leetcode.com/problems/longest-increasing-subsequence/'
      },
      {
        id: 'lc-70',
        title: 'LeetCode 70: Climbing Stairs',
        description: 'Calculate how many distinct ways you can climb to the top of a staircase of N steps, taking either 1 or 2 steps.',
        difficulty: 'Easy',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        conceptHint: 'Recognize this is the Fibonacci sequence. Solved in O(N) using state transitions: current = prev1 + prev2.',
        leetcodeLink: 'https://leetcode.com/problems/climbing-stairs/'
      }
    ],
    resources: [
      { title: "Striver's Dynamic Programming Masterclass", type: 'video', url: 'https://www.youtube.com/' },
      { title: 'Dynamic Programming Patterns Deconstructed', type: 'article', url: 'https://medium.com/' },
      { title: 'Interactive DP Memoization Playbook', type: 'practice', url: '#' }
    ]
  },
  'graphs': {
    category: 'Graphs & Trees',
    overallScore: 64,
    problems: [
      {
        id: 'lc-207',
        title: 'LeetCode 207: Course Schedule',
        description: 'Determine if you can finish all courses given prereqs. Equivalent to cycle detection in a directed graph.',
        difficulty: 'Medium',
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V + E)',
        conceptHint: 'Use Topological Sort (Kahn’s BFS with in-degrees) or DFS with graph coloring (0=unvisited, 1=visiting, 2=visited).',
        leetcodeLink: 'https://leetcode.com/problems/course-schedule/'
      },
      {
        id: 'lc-200',
        title: 'LeetCode 200: Number of Islands',
        description: 'Given a 2D grid of 1s (land) and 0s (water), count the number of isolated landmasses.',
        difficulty: 'Medium',
        timeComplexity: 'O(M * N)',
        spaceComplexity: 'O(M * N)',
        conceptHint: 'Traverse the grid. For every land cell found, increment islands count and sink connected land using recursively bound DFS/BFS.',
        leetcodeLink: 'https://leetcode.com/problems/number-of-islands/'
      },
      {
        id: 'lc-102',
        title: 'LeetCode 102: Binary Tree Level Order Traversal',
        description: 'Perform a level-by-level breadth-first traversal of a binary tree and return nested list nodes.',
        difficulty: 'Medium',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(W)',
        conceptHint: 'Use a Queue. Loop tree nodes, keep track of queue size at each depth iteration to flush entire horizontal lines at once.',
        leetcodeLink: 'https://leetcode.com/problems/binary-tree-level-order-traversal/'
      }
    ],
    resources: [
      { title: 'NeetCode Graph Algorithms Complete Guide', type: 'video', url: 'https://youtube.com' },
      { title: 'Understanding Union Find / Disjoint Set Union', type: 'article', url: 'https://wikipedia.org' }
    ]
  }
};

export const DSARecommendationsTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('dp');
  const [activeTrack, setActiveTrack] = useState<DSATrack>(DEFAULT_TRACKS['dp']);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [aiApiKeyMissing, setAiApiKeyMissing] = useState<boolean>(false);

  // AI Chat Assistant State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi there! I'm your elite DSA and competitive programming coach. Choose a topic on the left to review custom target problem sets, or type any conceptual/coding questions here. Let's master those technical rounds!",
      time: 'Just now'
    }
  ]);
  const [isAskingAI, setIsAskingAI] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Map category code to category friendly name
  const getCategoryName = (id: string) => {
    const found = DSA_CATEGORIES.find(c => c.id === id);
    return found ? found.name : 'Data Structures & Algorithms';
  };

  // Load / generate recommendations
  const fetchTrackRecommendations = async (categoryId: string) => {
    setIsLoadingTrack(true);
    const categoryName = getCategoryName(categoryId);
    try {
      const res = await fetch('/api/gemini/dsa/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.track && data.track.problems) {
          setActiveTrack(data.track);
          setAiApiKeyMissing(false);
        } else {
          // Fallback
          useLocalFallback(categoryId);
        }
      } else {
        useLocalFallback(categoryId);
      }
    } catch (e) {
      console.warn("API unavailable, loading local fallback track", e);
      useLocalFallback(categoryId);
    } finally {
      setIsLoadingTrack(false);
    }
  };

  const useLocalFallback = (categoryId: string) => {
    if (DEFAULT_TRACKS[categoryId]) {
      setActiveTrack(DEFAULT_TRACKS[categoryId]);
    } else {
      // Build a basic dynamic structure if category not hardcoded
      setActiveTrack({
        category: getCategoryName(categoryId),
        overallScore: 70,
        problems: [
          {
            id: 'lc-generic-1',
            title: `LeetCode Practice on ${getCategoryName(categoryId)}`,
            description: `Review fundamental sliding-window, pointer boundaries, and recursive branch logic representing standard interviews.`,
            difficulty: 'Medium',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(1)',
            conceptHint: 'Optimize brute-force structures. Leverage memory locality or standard hash lookups to reduce search steps.',
            leetcodeLink: 'https://leetcode.com/'
          }
        ],
        resources: [
          { title: `${getCategoryName(categoryId)} Cheatsheet`, type: 'article', url: '#' },
          { title: 'Interactive Problem Sandbox', type: 'practice', url: '#' }
        ]
      });
    }
  };

  useEffect(() => {
    fetchTrackRecommendations(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAskingAI]);

  const handleAskAI = async (customQuery?: string) => {
    const queryToSend = customQuery || chatInput;
    if (!queryToSend.trim()) return;

    if (!customQuery) {
      setChatInput('');
    }

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: queryToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, newUserMessage]);
    setIsAskingAI(true);

    try {
      const res = await fetch('/api/gemini/dsa/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSend,
          category: activeTrack.category,
          history: chatHistory.slice(-6).map(h => ({ role: h.role, text: h.text }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newAiMessage: ChatMessage = {
          id: Math.random().toString(),
          role: 'model',
          text: data.text || "I processed your request, but received an empty response. Let me know if you would like me to try again!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, newAiMessage]);
      } else {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "API server returned an error.");
      }
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      const errorMsgText = error.message && error.message.includes("GEMINI_API_KEY") 
        ? "My real-time Gemini connection requires an API Key. I've populated this with an elite conceptual review as a backup: Try to analyze time complexes, map state tables, and isolate boundary pointers first!" 
        : "I ran into a connection glitch while processing that request. Here is an essential tip: break down the problem into a base case, draw out the state table manually, and optimize step-by-step!";

      setChatHistory(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'model',
          text: `[SYSTEM] ${errorMsgText}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAskingAI(false);
    }
  };

  // Auto-fill and query AI for a specific problem
  const handleProblemExplain = (problemTitle: string) => {
    const promptText = `Provide a step-by-step analysis of optimal approaches, boundary cases, and runtime optimizations for: "${problemTitle}". Can you show a clean, commented TypeScript implementation?`;
    handleAskAI(promptText);
  };

  // Formatting helper for text blocks (replaces code blocks with styling)
  const renderMessageContent = (text: string) => {
    if (text.startsWith('[SYSTEM]')) {
      return (
        <p className="text-zinc-400 italic text-xs bg-zinc-900/50 p-3 rounded-lg border border-red-950/20 leading-relaxed">
          {text.replace('[SYSTEM]', '')}
        </p>
      );
    }

    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return (
          <div key={index} className="my-3 font-mono text-[11px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
            <div className="bg-zinc-900 px-4 py-1.5 flex justify-between items-center text-zinc-500 border-b border-zinc-800 text-[10px]">
              <span>{lang || 'typescript'}</span>
              <span className="uppercase text-[9px] font-bold text-zinc-600">Optimal Solution</span>
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-400 text-left max-w-full whitespace-pre-wrap leading-relaxed">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }
      return (
        <p key={index} className="text-zinc-300 leading-relaxed whitespace-pre-line text-xs mb-1.5">
          {part}
        </p>
      );
    });
  };

  const chartData = DSA_CATEGORIES.map(cat => ({
    name: cat.name.split(' & ')[0].split(' ')[0],
    Score: cat.score,
    Target: 85
  }));

  return (
    <div id="dsa-rec-container" className="space-y-8 text-left">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-400 font-medium w-fit mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Adaptive Algorithm Recommender Active
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">DSA Resource Recommendation Engine</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Our AI maps completed interview transcripts and resume tech stacks to target your specific algorithm weak spots. Get a curated training path and ask the interactive coach for step-by-step proofs.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0d0f17] border border-zinc-800 p-4 rounded-xl">
          <div className="text-right">
            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Overall Coding Grade</span>
            <span className="text-xl font-extrabold text-indigo-400">72 / 100</span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* COMPONENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: TOPICS & ANALYTICS CHIPS */}
        <div className="lg:col-span-4 space-y-6">
          {/* VISUAL ANALYTICS Radar/Bar */}
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Algorithmic Competencies
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0e111a', border: '1px solid #27272a', borderRadius: '10px' }}
                    itemStyle={{ fontSize: '11px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  />
                  <Bar dataKey="Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Target" fill="#10b981" fillOpacity={0.15} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 text-center">
              Indigo bars represent your performance; green targets represent FAANG job readiness.
            </p>
          </div>

          {/* CHIP MENU LIST */}
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              Focus Areas & Training Status
            </h3>
            {DSA_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-indigo-500/50 text-white' 
                      : 'bg-zinc-950/20 border-zinc-800/60 hover:bg-zinc-800/20 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600/20 text-indigo-400' : 'bg-zinc-900 text-zinc-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold">{cat.name}</span>
                      <span className="block text-[10px] text-zinc-500 mt-0.5">{cat.count} curated milestones</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block text-xs font-extrabold ${cat.score < 60 ? 'text-rose-400' : cat.score < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {cat.score}%
                    </span>
                    <span className="block text-[9px] text-zinc-500 uppercase">Score</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: RECOMMENDED PRACTICE + AI CHAT ASSISTANT (STACKED ON MOBILE) */}
        <div className="lg:col-span-8 space-y-6">
          {/* DYNAMIC PROGRESSION PATH */}
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Active Recommended Path</span>
                <h3 className="text-base font-bold text-white mt-1">{activeTrack.category} Focus Track</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <span className="text-zinc-500">Subject Competency:</span>
                <span className="font-extrabold text-indigo-400">{activeTrack.overallScore}%</span>
              </div>
            </div>

            {isLoadingTrack ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-500 font-medium">Re-mapping problem arrays via Gemini...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrack.problems.map((prob, index) => (
                  <div 
                    key={prob.id}
                    className="bg-[#090a0f] border border-zinc-800/80 hover:border-zinc-700/80 p-4 rounded-xl relative group transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-extrabold">
                          {index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {prob.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          prob.difficulty === 'Easy' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : prob.difficulty === 'Medium'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                          {prob.difficulty}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/40">
                          {prob.timeComplexity} Space: {prob.spaceComplexity}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-3 pr-28">
                      {prob.description}
                    </p>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 text-[11px] text-zinc-500 leading-relaxed flex items-start gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-zinc-400">AI Blueprint:</strong> {prob.conceptHint}
                      </div>
                    </div>

                    {/* ACTION TRIGGERS */}
                    <div className="flex items-center gap-3">
                      <a 
                        href={prob.leetcodeLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300 font-bold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3 h-3 text-emerald-400" /> Solve Problem
                      </a>
                      <button 
                        onClick={() => handleProblemExplain(prob.title)}
                        className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/30 border border-indigo-900/40 text-[11px] text-indigo-300 font-bold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <Code2 className="w-3 h-3" /> Walkthrough with Coach
                      </button>
                    </div>
                  </div>
                ))}

                {/* STUDY PLAYLISTS */}
                {activeTrack.resources && activeTrack.resources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-800/60">
                    <h4 className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-400" /> Primary Video Playlists & Resources
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTrack.resources.map((res, idx) => (
                        <a 
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800/40 hover:border-indigo-500/20 rounded-xl hover:bg-zinc-900/30 transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-500/5 group-hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-colors">
                              {res.type === 'video' ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-bold text-zinc-300 truncate max-w-[180px] group-hover:text-white transition-colors">{res.title}</span>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {res.type}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CHAT ASSISTANT PANEL */}
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl flex flex-col h-[420px] overflow-hidden">
            {/* PANEL TITLE */}
            <div className="bg-[#101321] border-b border-zinc-800 p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Coding Coach & Tutor</h3>
                  <span className="block text-[10px] text-zinc-500">Gemini 3.5 Flash Active</span>
                </div>
              </div>
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <Code2 className="w-4 h-4" />
              </div>
            </div>

            {/* CHAT LOGS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {chatHistory.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
                      <span>{msg.role === 'user' ? 'You' : 'DSA Coach'}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs text-left leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-zinc-900 border border-zinc-800/80 text-zinc-300 rounded-tl-sm'
                    }`}>
                      {renderMessageContent(msg.text)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isAskingAI && (
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
                    <span>DSA Coach is explaining...</span>
                  </div>
                  <div className="p-3.5 bg-zinc-900 border border-zinc-800/80 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* PANEL SUGGESTED QUERIES */}
            <div className="px-4 py-2 border-t border-zinc-800/40 bg-zinc-950/30 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <button 
                onClick={() => handleAskAI(`Compare Recursive vs Iterative implementations of bottom-up Dynamic Programming for '${getCategoryName(selectedCategory)}'.`)}
                className="text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                Recursion vs Iteration
              </button>
              <button 
                onClick={() => handleAskAI(`What is the optimal Big-O complexity boundary of '${getCategoryName(selectedCategory)}' algorithms in standard mock sessions?`)}
                className="text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                Big-O Bounds
              </button>
              <button 
                onClick={() => handleAskAI(`Walk me through cycle detection in directed graphs using Kahn's topological sort algorithm.`)}
                className="text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                Explain Kahn's Cycle Detection
              </button>
            </div>

            {/* INPUT PANEL */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask any DSA, complexity, or solution walk-through query..."
                className="flex-1 bg-zinc-900 border border-zinc-850 px-4 py-2 text-xs rounded-xl focus:border-indigo-500 focus:outline-none text-white placeholder-zinc-500"
              />
              <button
                onClick={() => handleAskAI()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-950/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
