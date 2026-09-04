export interface DSACompany {
  id: string;
  name: string;
  logo: string;
  description: string;
  totalQuestions: number;
  solvedCount: number;
}

export interface DSATopic {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  solvedCount: number;
  keyPatterns: string[];
  isWeakArea?: boolean;
  weaknessPriority?: 'High' | 'Medium';
}

export interface DSAPattern {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  solvedCount: number;
}

export interface DSAQuestion {
  id: string;
  title: string;
  topicId: string;
  topicName: string;
  patternId: string;
  patternName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  companyIds: string[];
  companyNames: string[];
  externalUrl: string;
  platform: 'LeetCode' | 'GeeksForGeeks' | 'HackerRank';
  isSolved: boolean;
}

export interface DSAResource {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  type: 'YouTube' | 'Article' | 'Practice Sheet' | 'Course';
  description: string;
  url: string;
}

export interface DSADashboardStats {
  questionsSolved: number;
  totalQuestions: number;
  topicsMastered: number;
  totalTopics: number;
  currentStreak: number;
  overallProgress: number;
}

export const INITIAL_DSA_STATS: DSADashboardStats = {
  questionsSolved: 48,
  totalQuestions: 180,
  topicsMastered: 4,
  totalTopics: 13,
  currentStreak: 6,
  overallProgress: 27
};

export const MOCK_DSA_COMPANIES: DSACompany[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '📦',
    description: 'Frequently asked coding questions focusing on Leadership Principles, Arrays, Trees, and System Design basics.',
    totalQuestions: 150,
    solvedCount: 42
  },
  {
    id: 'google',
    name: 'Google',
    logo: '🌐',
    description: 'High difficulty algorithmic problems emphasizing Graphs, Dynamic Programming, and Advanced Trees.',
    totalQuestions: 160,
    solvedCount: 35
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: '🪟',
    description: 'Core Data Structures, String Manipulation, Trees, and Object-Oriented Design challenges.',
    totalQuestions: 120,
    solvedCount: 38
  },
  {
    id: 'meta',
    name: 'Meta',
    logo: '♾️',
    description: 'Fast-paced algorithmic rounds prioritizing Hash Tables, Binary Search, Graphs, and Recursion.',
    totalQuestions: 130,
    solvedCount: 29
  },
  {
    id: 'adobe',
    name: 'Adobe',
    logo: '🅰️',
    description: 'Matrix problems, Linked Lists, Stack applications, and Dynamic Programming foundations.',
    totalQuestions: 100,
    solvedCount: 25
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: '🛍️',
    description: 'E-commerce scale problem solving featuring Greedy algorithms, Heaps, and Segment Trees.',
    totalQuestions: 90,
    solvedCount: 20
  }
];

export const MOCK_DSA_TOPICS: DSATopic[] = [
  {
    id: 'arrays',
    name: 'Arrays',
    description: 'Fundamental linear structure for contiguous data storage.',
    totalQuestions: 24,
    solvedCount: 16,
    keyPatterns: ['Two Pointer', 'Sliding Window', 'Prefix Sum']
  },
  {
    id: 'strings',
    name: 'Strings',
    description: 'Text manipulation, pattern matching, and palindrome analysis.',
    totalQuestions: 18,
    solvedCount: 12,
    keyPatterns: ['Two Pointer', 'Hashing', 'Sliding Window']
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    description: 'Singly and doubly linked node traversals, reversal, and pointer manipulation.',
    totalQuestions: 15,
    solvedCount: 9,
    keyPatterns: ['Fast & Slow Pointer', 'In-place Reversal']
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'LIFO evaluation, expression parsing, and monotonic stacks.',
    totalQuestions: 14,
    solvedCount: 8,
    keyPatterns: ['Monotonic Stack', 'Parentheses Matching']
  },
  {
    id: 'queue',
    name: 'Queue',
    description: 'FIFO buffers, deques, and sliding window maximums.',
    totalQuestions: 10,
    solvedCount: 5,
    keyPatterns: ['Monotonic Queue', 'BFS Buffer']
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    description: 'Logarithmic search space reduction and search on answer range.',
    totalQuestions: 16,
    solvedCount: 10,
    keyPatterns: ['Binary Search', 'Search Space Reduction']
  },
  {
    id: 'trees',
    name: 'Trees',
    description: 'Binary trees, BSTs, traversals, and structural recursion.',
    totalQuestions: 22,
    solvedCount: 8,
    keyPatterns: ['DFS', 'BFS', 'Tree Recursion'],
    isWeakArea: true,
    weaknessPriority: 'Medium'
  },
  {
    id: 'graphs',
    name: 'Graphs',
    description: 'Directed/undirected graphs, shortest paths, and topological sorting.',
    totalQuestions: 20,
    solvedCount: 6,
    keyPatterns: ['BFS', 'DFS', 'Union Find'],
    isWeakArea: true,
    weaknessPriority: 'High'
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Overlapping subproblems, memoization, and bottom-up DP tables.',
    totalQuestions: 26,
    solvedCount: 6,
    keyPatterns: ['0/1 Knapsack', 'Unbounded DP', 'State Transitions'],
    isWeakArea: true,
    weaknessPriority: 'High'
  },
  {
    id: 'greedy',
    name: 'Greedy',
    description: 'Locally optimal choices leading to global optimization.',
    totalQuestions: 12,
    solvedCount: 5,
    keyPatterns: ['Interval Scheduling', 'Greedy Choice']
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    description: 'N-queens, permutations, combinations, and state-space pruning.',
    totalQuestions: 12,
    solvedCount: 4,
    keyPatterns: ['Backtracking', 'Subsets & Permutations']
  },
  {
    id: 'heap',
    name: 'Heap',
    description: 'Min-heaps, max-heaps, K-way merges, and top-K elements.',
    totalQuestions: 11,
    solvedCount: 5,
    keyPatterns: ['Top K Elements', 'Two Heaps']
  },
  {
    id: 'hashing',
    name: 'Hashing',
    description: 'Hash maps and sets for O(1) lookups and frequency counting.',
    totalQuestions: 15,
    solvedCount: 12,
    keyPatterns: ['Hashing', 'Map Counter']
  }
];

export const MOCK_DSA_PATTERNS: DSAPattern[] = [
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    description: 'Iterate with two pointers from opposing ends or different speeds to solve array/string problems in O(N).',
    totalQuestions: 20,
    solvedCount: 14
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    description: 'Maintain a dynamic subarray or substring window to compute contiguous properties efficiently.',
    totalQuestions: 18,
    solvedCount: 11
  },
  {
    id: 'binary-search-pattern',
    name: 'Binary Search',
    description: 'Divide problem search space in half repeatedly to achieve O(log N) time complexity.',
    totalQuestions: 16,
    solvedCount: 10
  },
  {
    id: 'prefix-sum',
    name: 'Prefix Sum',
    description: 'Precompute cumulative sums to answer range sum queries in O(1) time.',
    totalQuestions: 12,
    solvedCount: 8
  },
  {
    id: 'hashing-pattern',
    name: 'Hashing',
    description: 'Use key-value mapping to track frequencies, pairs, or seen states in constant time.',
    totalQuestions: 15,
    solvedCount: 12
  },
  {
    id: 'fast-slow-pointers',
    name: 'Fast & Slow Pointer',
    description: 'Hare & Tortoise technique for cycle detection in linked lists and arrays.',
    totalQuestions: 10,
    solvedCount: 7
  },
  {
    id: 'monotonic-stack',
    name: 'Monotonic Stack',
    description: 'Maintain a monotonically increasing/decreasing stack to find next greater/smaller elements in O(N).',
    totalQuestions: 12,
    solvedCount: 6
  },
  {
    id: 'bfs',
    name: 'BFS (Breadth-First Search)',
    description: 'Level-order traversal ideal for shortest paths in unweighted graphs and trees.',
    totalQuestions: 18,
    solvedCount: 9
  },
  {
    id: 'dfs',
    name: 'DFS (Depth-First Search)',
    description: 'Explore as far as possible along branches before backtracking for connectedness and paths.',
    totalQuestions: 22,
    solvedCount: 10
  },
  {
    id: 'backtracking-pattern',
    name: 'Backtracking',
    description: 'Systematic search technique exploring choices and pruning invalid decision trees.',
    totalQuestions: 12,
    solvedCount: 4
  },
  {
    id: 'greedy-pattern',
    name: 'Greedy',
    description: 'Pick the local optimum at each stage to construct a globally optimal solution.',
    totalQuestions: 12,
    solvedCount: 5
  },
  {
    id: 'dp-pattern',
    name: 'Dynamic Programming',
    description: 'Break complex problems into smaller subproblems, memoizing results to eliminate redundant work.',
    totalQuestions: 26,
    solvedCount: 6
  },
  {
    id: 'union-find',
    name: 'Union Find',
    description: 'Disjoint Set Union (DSU) for tracking connected components and cycle detection in O(α(N)).',
    totalQuestions: 10,
    solvedCount: 3
  }
];

export const MOCK_DSA_QUESTIONS: DSAQuestion[] = [
  {
    id: 'q-1',
    title: 'Two Sum',
    topicId: 'arrays',
    topicName: 'Arrays',
    patternId: 'hashing-pattern',
    patternName: 'Hashing',
    difficulty: 'Easy',
    companyIds: ['amazon', 'google', 'microsoft', 'meta', 'adobe'],
    companyNames: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'],
    externalUrl: 'https://leetcode.com/problems/two-sum/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-2',
    title: 'Best Time to Buy and Sell Stock',
    topicId: 'arrays',
    topicName: 'Arrays',
    patternId: 'sliding-window',
    patternName: 'Sliding Window',
    difficulty: 'Easy',
    companyIds: ['amazon', 'microsoft', 'adobe', 'flipkart'],
    companyNames: ['Amazon', 'Microsoft', 'Adobe', 'Flipkart'],
    externalUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-3',
    title: '3Sum',
    topicId: 'arrays',
    topicName: 'Arrays',
    patternId: 'two-pointers',
    patternName: 'Two Pointers',
    difficulty: 'Medium',
    companyIds: ['amazon', 'google', 'meta'],
    companyNames: ['Amazon', 'Google', 'Meta'],
    externalUrl: 'https://leetcode.com/problems/3sum/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-4',
    title: 'Container With Most Water',
    topicId: 'arrays',
    topicName: 'Arrays',
    patternId: 'two-pointers',
    patternName: 'Two Pointers',
    difficulty: 'Medium',
    companyIds: ['amazon', 'google', 'microsoft'],
    companyNames: ['Amazon', 'Google', 'Microsoft'],
    externalUrl: 'https://leetcode.com/problems/container-with-most-water/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-5',
    title: 'Longest Substring Without Repeating Characters',
    topicId: 'strings',
    topicName: 'Strings',
    patternId: 'sliding-window',
    patternName: 'Sliding Window',
    difficulty: 'Medium',
    companyIds: ['amazon', 'google', 'meta', 'microsoft'],
    companyNames: ['Amazon', 'Google', 'Meta', 'Microsoft'],
    externalUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-6',
    title: 'Valid Palindrome',
    topicId: 'strings',
    topicName: 'Strings',
    patternId: 'two-pointers',
    patternName: 'Two Pointers',
    difficulty: 'Easy',
    companyIds: ['meta', 'microsoft'],
    companyNames: ['Meta', 'Microsoft'],
    externalUrl: 'https://leetcode.com/problems/valid-palindrome/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-7',
    title: 'Reverse Linked List',
    topicId: 'linked-list',
    topicName: 'Linked List',
    patternId: 'fast-slow-pointers',
    patternName: 'Fast & Slow Pointer',
    difficulty: 'Easy',
    companyIds: ['amazon', 'microsoft', 'adobe'],
    companyNames: ['Amazon', 'Microsoft', 'Adobe'],
    externalUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-8',
    title: 'Linked List Cycle',
    topicId: 'linked-list',
    topicName: 'Linked List',
    patternId: 'fast-slow-pointers',
    patternName: 'Fast & Slow Pointer',
    difficulty: 'Easy',
    companyIds: ['amazon', 'meta', 'flipkart'],
    companyNames: ['Amazon', 'Meta', 'Flipkart'],
    externalUrl: 'https://leetcode.com/problems/linked-list-cycle/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-9',
    title: 'Valid Parentheses',
    topicId: 'stack',
    topicName: 'Stack',
    patternId: 'monotonic-stack',
    patternName: 'Monotonic Stack',
    difficulty: 'Easy',
    companyIds: ['amazon', 'google', 'microsoft', 'meta'],
    companyNames: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    externalUrl: 'https://leetcode.com/problems/valid-parentheses/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-10',
    title: 'Daily Temperatures',
    topicId: 'stack',
    topicName: 'Stack',
    patternId: 'monotonic-stack',
    patternName: 'Monotonic Stack',
    difficulty: 'Medium',
    companyIds: ['google', 'amazon'],
    companyNames: ['Google', 'Amazon'],
    externalUrl: 'https://leetcode.com/problems/daily-temperatures/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-11',
    title: 'Search in Rotated Sorted Array',
    topicId: 'binary-search',
    topicName: 'Binary Search',
    patternId: 'binary-search-pattern',
    patternName: 'Binary Search',
    difficulty: 'Medium',
    companyIds: ['amazon', 'microsoft', 'google'],
    companyNames: ['Amazon', 'Microsoft', 'Google'],
    externalUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-12',
    title: 'Invert Binary Tree',
    topicId: 'trees',
    topicName: 'Trees',
    patternId: 'dfs',
    patternName: 'DFS (Depth-First Search)',
    difficulty: 'Easy',
    companyIds: ['google', 'amazon'],
    companyNames: ['Google', 'Amazon'],
    externalUrl: 'https://leetcode.com/problems/invert-binary-tree/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-13',
    title: 'Lowest Common Ancestor of a Binary Tree',
    topicId: 'trees',
    topicName: 'Trees',
    patternId: 'dfs',
    patternName: 'DFS (Depth-First Search)',
    difficulty: 'Medium',
    companyIds: ['amazon', 'meta', 'microsoft'],
    companyNames: ['Amazon', 'Meta', 'Microsoft'],
    externalUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-14',
    title: 'Binary Tree Level Order Traversal',
    topicId: 'trees',
    topicName: 'Trees',
    patternId: 'bfs',
    patternName: 'BFS (Breadth-First Search)',
    difficulty: 'Medium',
    companyIds: ['amazon', 'microsoft'],
    companyNames: ['Amazon', 'Microsoft'],
    externalUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-15',
    title: 'Number of Islands',
    topicId: 'graphs',
    topicName: 'Graphs',
    patternId: 'bfs',
    patternName: 'BFS (Breadth-First Search)',
    difficulty: 'Medium',
    companyIds: ['amazon', 'google', 'microsoft', 'meta'],
    companyNames: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    externalUrl: 'https://leetcode.com/problems/number-of-islands/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-16',
    title: 'Course Schedule',
    topicId: 'graphs',
    topicName: 'Graphs',
    patternId: 'dfs',
    patternName: 'DFS (Depth-First Search)',
    difficulty: 'Medium',
    companyIds: ['amazon', 'google'],
    companyNames: ['Amazon', 'Google'],
    externalUrl: 'https://leetcode.com/problems/course-schedule/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-17',
    title: 'Climbing Stairs',
    topicId: 'dynamic-programming',
    topicName: 'Dynamic Programming',
    patternId: 'dp-pattern',
    patternName: 'Dynamic Programming',
    difficulty: 'Easy',
    companyIds: ['adobe', 'amazon', 'flipkart'],
    companyNames: ['Adobe', 'Amazon', 'Flipkart'],
    externalUrl: 'https://leetcode.com/problems/climbing-stairs/',
    platform: 'LeetCode',
    isSolved: true
  },
  {
    id: 'q-18',
    title: 'Coin Change',
    topicId: 'dynamic-programming',
    topicName: 'Dynamic Programming',
    patternId: 'dp-pattern',
    patternName: 'Dynamic Programming',
    difficulty: 'Medium',
    companyIds: ['amazon', 'google', 'flipkart'],
    companyNames: ['Amazon', 'Google', 'Flipkart'],
    externalUrl: 'https://leetcode.com/problems/coin-change/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-19',
    title: 'Longest Increasing Subsequence',
    topicId: 'dynamic-programming',
    topicName: 'Dynamic Programming',
    patternId: 'dp-pattern',
    patternName: 'Dynamic Programming',
    difficulty: 'Medium',
    companyIds: ['google', 'microsoft', 'amazon'],
    companyNames: ['Google', 'Microsoft', 'Amazon'],
    externalUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    platform: 'LeetCode',
    isSolved: false
  },
  {
    id: 'q-20',
    title: 'Word Break',
    topicId: 'dynamic-programming',
    topicName: 'Dynamic Programming',
    patternId: 'dp-pattern',
    patternName: 'Dynamic Programming',
    difficulty: 'Medium',
    companyIds: ['amazon', 'meta', 'google'],
    companyNames: ['Amazon', 'Meta', 'Google'],
    externalUrl: 'https://leetcode.com/problems/word-break/',
    platform: 'LeetCode',
    isSolved: false
  }
];

export const MOCK_DSA_RESOURCES: DSAResource[] = [
  {
    id: 'res-1',
    topicId: 'dynamic-programming',
    topicName: 'Dynamic Programming',
    title: 'Dynamic Programming Masterclass for Tech Interviews',
    type: 'YouTube',
    description: 'Comprehensive breakdown of 0/1 Knapsack, Memoization, and Bottom-up Tabulation state transitions.',
    url: 'https://www.youtube.com/results?search_query=dynamic+programming+interview+course'
  },
  {
    id: 'res-2',
    topicId: 'dynamic-programming',
    topicName: 'Dynamic Programming',
    title: 'Top 20 Dynamic Programming Patterns Blueprint',
    type: 'Article',
    description: 'In-depth guide detailing how to identify subproblems and write recurrence relations.',
    url: 'https://geeksforgeeks.org/dynamic-programming/'
  },
  {
    id: 'res-3',
    topicId: 'graphs',
    topicName: 'Graphs',
    title: 'Graph Algorithms Visually Explained (BFS, DFS, Dijkstra)',
    type: 'YouTube',
    description: 'Step-by-step visual animation of graph traversals and shortest path algorithms.',
    url: 'https://www.youtube.com/results?search_query=graph+algorithms+visual+guide'
  },
  {
    id: 'res-4',
    topicId: 'graphs',
    topicName: 'Graphs',
    title: 'FAANG Graph Problems Practice Sheet',
    type: 'Practice Sheet',
    description: 'Curated set of 25 essential graph problems asked in Amazon and Google interviews.',
    url: 'https://leetcode.com/problemset/all/?topicSlugs=graph'
  },
  {
    id: 'res-5',
    topicId: 'trees',
    topicName: 'Trees',
    title: 'Binary Tree & BST Interview Playbook',
    type: 'Course',
    description: 'Master tree traversals, lowest common ancestors, and tree-to-graph conversions.',
    url: 'https://geeksforgeeks.org/binary-tree-data-structure/'
  }
];
