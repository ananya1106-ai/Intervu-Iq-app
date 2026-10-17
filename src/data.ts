import { UserProfile, InterviewQuestion, InterviewSession, RoadmapNode } from './types';

export const INITIAL_USER: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex.rivera@stanford.edu',
  role: 'Software Engineer',
  targetRole: 'Full Stack Engineer',
  avatar: '/src/assets/images/avatar_user_alex_1792125725562.jpg',
  experienceLevel: 'Entry',
  resumeUploaded: true,
  resumeFileName: 'Alex_Rivera_Resume_2026.pdf',
  placementReadiness: 72,
  confidenceMeter: 68,
  interviewsCompleted: 4
};

export const MOCK_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    question: "Tell me about yourself and why you're interested in this role.",
    category: 'General',
    suggestedPoints: [
      "Briefly summarize your background & recent key achievements",
      "Explain your passion for full-stack engineering and building products",
      "Connect your career goals directly with the company's mission"
    ]
  },
  {
    id: 2,
    question: "How do you optimize a slow React application displaying large lists of real-time data?",
    category: 'Technical',
    suggestedPoints: [
      "Implement windowing/virtualization (using react-window or react-virtualized)",
      "Use React.memo, useMemo, and useCallback to prevent unnecessary re-renders",
      "Throttle or debounce incoming real-time socket events or API updates"
    ]
  },
  {
    id: 3,
    question: "Describe a time you had a major technical conflict with a team member. How was it resolved?",
    category: 'Behavioral',
    suggestedPoints: [
      "Use the STAR method (Situation, Task, Action, Result)",
      "Focus on objective data & system tradeoffs rather than personal opinions",
      "Demonstrate active listening, compromise, and long-term project alignment"
    ]
  },
  {
    id: 4,
    question: "Design a rate limiter for an API that handles 100,000 requests per second.",
    category: 'System Design',
    suggestedPoints: [
      "Compare algorithms: Token Bucket, Leaking Bucket, Fixed Window, Sliding Window",
      "Use in-memory distributed stores like Redis for high throughput and low latency",
      "Handle edge cases like client-side retries, caching, and rate limit HTTP headers"
    ]
  },
  {
    id: 5,
    question: "What is the difference between SQL and NoSQL databases, and when would you choose one over the other?",
    category: 'Technical',
    suggestedPoints: [
      "Discuss ACID compliance, transaction guarantees, and rigid vs flexible schemas",
      "Select SQL for structured data with complex relational queries (e.g., banking)",
      "Select NoSQL for high-write volumes, unstructured data, or rapid scaling (e.g., social feed)"
    ]
  }
];

export const INITIAL_INTERVIEWS: InterviewSession[] = [
  {
    id: 'int-101',
    date: 'July 14, 2026',
    role: 'Full Stack Engineer',
    type: 'Technical',
    durationSeconds: 940,
    overallScore: 78,
    metrics: {
      communication: 74,
      technical: 82,
      confidence: 70,
      bodyLanguage: 80,
      speech: 84
    },
    questionsAnswered: [
      {
        question: "How do you optimize a slow React application?",
        transcript: "Well, to optimize React, I would basically use React.memo to prevent unnecessary re-renders, and maybe useMemo for expensive calculations. I also think using virtualization is, like, super important for lists.",
        feedback: "Good technical foundations. However, you used filler words like 'basically' and 'like' several times. Try to state your design choices with higher assertiveness.",
        score: 80
      }
    ]
  },
  {
    id: 'int-102',
    date: 'July 18, 2026',
    role: 'Full Stack Engineer',
    type: 'Behavioral',
    durationSeconds: 620,
    overallScore: 84,
    metrics: {
      communication: 88,
      technical: 75,
      confidence: 85,
      bodyLanguage: 90,
      speech: 82
    },
    questionsAnswered: [
      {
        question: "Describe a time you had a major technical conflict with a team member.",
        transcript: "We disagreed on using PostgreSQL versus MongoDB for our capstone project. I scheduled a call to list out pros and cons objectively, focusing on transactional safety. We ultimately chose Postgres and completed the project on time.",
        feedback: "Excellent structure using the STAR method. Clear, professional communication. Body language and posture were exceptional throughout.",
        score: 88
      }
    ]
  }
];

export const INITIAL_ROADMAP: RoadmapNode[] = [
  {
    id: 'rm-1',
    title: 'Core Interview Communication Mastery',
    description: 'Learn the STAR technique, behavioral grids, and how to structure complex architectural responses confidently.',
    category: 'Behavioral',
    status: 'completed',
    resources: [
      { title: 'The STAR Method Explained', url: '#', type: 'article' },
      { title: 'Cracking the Behavioral Interview', url: '#', type: 'video' }
    ],
    estimatedMinutes: 45
  },
  {
    id: 'rm-2',
    title: 'Advanced React Optimization & State Patterns',
    description: 'Deep dive into rendering lifecycles, memory leak preventions, and caching architectures on the browser.',
    category: 'Frontend',
    status: 'unlocked',
    resources: [
      { title: 'React Rendering Lifecycles', url: '#', type: 'article' },
      { title: 'Interactive Performance Profiling', url: '#', type: 'practice' }
    ],
    estimatedMinutes: 60
  },
  {
    id: 'rm-3',
    title: 'Distributed System Design: Microservices & Rate Limiters',
    description: 'Learn load balancing, partition strategies, cache invalidation, and rate limiting algorithms at massive scales.',
    category: 'System Design',
    status: 'locked',
    resources: [
      { title: 'Rate Limiting Architectures', url: '#', type: 'video' },
      { title: 'Designing High Availability Systems', url: '#', type: 'article' }
    ],
    estimatedMinutes: 90
  },
  {
    id: 'rm-4',
    title: 'Advanced Data Structures & Algorithms (Graph Algorithms)',
    description: 'Master topological sorting, Dijkstra, A* search, and cycle detection algorithms with direct interactive test benches.',
    category: 'DSA',
    status: 'locked',
    resources: [
      { title: 'Interactive Graph Traversal Simulator', url: '#', type: 'practice' },
      { title: 'Top 10 Graph Interview Patterns', url: '#', type: 'article' }
    ],
    estimatedMinutes: 120
  }
];
