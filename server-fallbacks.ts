// High-quality fallback generator functions for server endpoints to survive 429 quota errors

export function getMockQuestions(role: string, experienceLevel: string, type: string) {
  const normType = (type || "").toLowerCase();
  const normRole = (role || "").toLowerCase();

  // 1. Technical / Coding Rounds
  if (normType.includes("tech") || normType.includes("cod")) {
    return [
      {
        id: 1,
        question: `Explain how the React reconciliation algorithm and Fiber architecture optimize DOM rendering updates under heavy dynamic changes.`,
        category: "Technical",
        suggestedPoints: [
          "Explain the difference between stack and fiber reconcilers",
          "Discuss incremental rendering and lane-based work prioritizing",
          "Identify how keys optimize rendering of sibling nodes"
        ]
      },
      {
        id: 2,
        question: `What is the difference between SQL database indexing methods (B-Tree vs. Hash) and how do they impact query execution planning?`,
        category: "Technical",
        suggestedPoints: [
          "B-Trees support range queries and sorted scans",
          "Hash indexes offer O(1) lookups but do not support range operators",
          "Explain composite index column prefix constraints"
        ]
      },
      {
        id: 3,
        question: `How do you diagnose and eliminate memory leaks in Node.js/Express applications? What specific inspection protocols would you run?`,
        category: "Technical",
        suggestedPoints: [
          "Discuss heap dumps, v8 inspector, and Chrome DevTools integration",
          "Identify stale global cache maps, unclosed sockets, or dangling event listeners",
          "Suggest garbage collection trigger options and process heap metrics"
        ]
      },
      {
        id: 4,
        question: `Explain the detailed caching differences, hydration costs, and SEO tradeoffs between Server-Side Rendering (SSR) and Static-Site Generation (SSG).`,
        category: "Technical",
        suggestedPoints: [
          "SSR computes pages dynamically per-request, yielding high time-to-first-byte (TTFB)",
          "SSG compiles HTML at build-time, serving instantly via static Edge CDNs",
          "Explain incremental static regeneration (ISR) and partial hydration concepts"
        ]
      },
      {
        id: 5,
        question: `Explain how the browser event loop operates, specifically detailing the prioritization queues between microtasks (e.g., Promises) and macrotasks (e.g., setTimeout).`,
        category: "Technical",
        suggestedPoints: [
          "Detail how the call stack must clear before the event loop polls the task queues",
          "Describe how all microtasks must run to completion before moving to the next macrotask",
          "Explain requestAnimationFrame rendering cycles in relation to task executions"
        ]
      }
    ];
  }

  // 2. System Design Rounds
  if (normType.includes("design") || normType.includes("system") || normType.includes("architecture")) {
    return [
      {
        id: 1,
        question: `Design a high-throughput, low-latency Notification Engine (Email, SMS, Push) supporting dynamic templating, global rate limits, and priority queuing.`,
        category: "System Design",
        suggestedPoints: [
          "Leverage Redis or Apache Kafka as the main broker for high ingestion rates",
          "Implement token-bucket algorithm per-recipient and per-provider to prevent rate limit bans",
          "Design priority queues (Critical vs. Marketing channels) to ensure SMS alerts have <3s latency"
        ]
      },
      {
        id: 2,
        question: `Design a real-time collaborative document editing platform like Google Docs. How do you resolve conflicts, store documents, and synchronize client changes?`,
        category: "System Design",
        suggestedPoints: [
          "Compare Conflict-Free Replicated Data Types (CRDTs) with Operational Transformation (OT)",
          "Leverage WebSockets for full-duplex lower latency coordinate synching",
          "Utilize Redis Pub/Sub to propagate document changes across multiple scale-out server nodes"
        ]
      },
      {
        id: 3,
        question: `Design a distributed API Gateway Rate Limiter to protect downstream microservices from DDoS and brute force attacks.`,
        category: "System Design",
        suggestedPoints: [
          "Implement distributed Redis Cluster caching with Lua scripts to prevent race conditions",
          "Discuss the sliding window counter algorithm vs. leaky bucket algorithm",
          "Design fallback response headers (X-RateLimit-Remaining) and circuit breakers"
        ]
      },
      {
        id: 4,
        question: `How would you architect a database partition and scaling strategy for an e-commerce platform anticipating a 10x traffic spike on Black Friday?`,
        category: "System Design",
        suggestedPoints: [
          "Leverage database sharding by tenant/region and multi-availability-zone replication",
          "Introduce write-through caching layers to handle read-heavy catalog operations",
          "Introduce transactional outbox patterns with message queues to decouple ordering from inventory"
        ]
      },
      {
        id: 5,
        question: `Design a scalable global analytics tracking system that collects millions of clickstream events per second. How do you ingest and process this data?`,
        category: "System Design",
        suggestedPoints: [
          "Deploy stateless edge servers routing JSON events to a robust Kafka cluster",
          "Implement micro-batching via Apache Flink or Spark Streaming to optimize disk I/O write operations",
          "Store historical aggregates in high-volume analytical column-oriented stores like BigQuery or ClickHouse"
        ]
      }
    ];
  }

  // 3. Behavioral Rounds
  if (normType.includes("behavior") || normType.includes("fit")) {
    return [
      {
        id: 1,
        question: `Tell me about a time when you had to make a high-stakes technical decision under deep ambiguity. What was your choice and how did you resolve differences?`,
        category: "Behavioral",
        suggestedPoints: [
          "Use the STAR method structure (Situation, Task, Action, Result)",
          "Explain how you gathered objective metrics or benchmarked solutions to persuade stakeholders",
          "Admit lessons learned or tradeoffs that occurred post-deployment"
        ]
      },
      {
        id: 2,
        question: `Describe a scenario where you had a strong architectural or code-style disagreement with a senior engineer. How did you handle the conflict?`,
        category: "Behavioral",
        suggestedPoints: [
          "Focus on collaboration, mutual understanding, and depersonalizing technical critique",
          "Detail how you presented benchmarks or proof-of-concept sandboxes rather than arguing opinions",
          "Emphasize committing to the team's final decision once made to move delivery forward"
        ]
      },
      {
        id: 3,
        question: `Tell me about your most complex production post-mortem. What broke, how did you lead the troubleshooting, and what safeguards did you put in place?`,
        category: "Behavioral",
        suggestedPoints: [
          "Define the technical failure root cause clearly (e.g. database lockup, memory leak)",
          "Detail immediate mitigation actions (e.g., rolling back, spinning up replica, rate limiting)",
          "Outline the permanent mitigation fixes (e.g., automated tests, retry-logic, alert triggers)"
        ]
      },
      {
        id: 4,
        question: `How do you prioritize competing deadlines and balance speed with codebase health when a critical business feature is delayed?`,
        category: "Behavioral",
        suggestedPoints: [
          "Discuss technical debt mapping and agreeing on rapid feature-flagged hotfixes",
          "Highlight transparent communication of risks and timeline adjustments to non-technical stakeholders",
          "State how you scheduled post-launch sprint cleanup tasks to pay off immediate technical debt"
        ]
      },
      {
        id: 5,
        question: `Tell me about a project you led that failed. What went wrong, what were the early warning signs, and what did you learn from the experience?`,
        category: "Behavioral",
        suggestedPoints: [
          "Frame failure constructively, focusing on process over blaming specific individuals",
          "Identify warning signs like changing specs, communication gaps, or scope creep",
          "Explain concrete behavioral changes you implemented in subsequent systems to ensure success"
        ]
      }
    ];
  }

  // 4. Default General / General Interview
  return [
    {
      id: 1,
      question: `Please introduce yourself and walk me through your engineering background and most technically complex project.`,
      category: "General",
      suggestedPoints: [
        "Structure your background chronologically focusing on core technical growth",
        "Describe 1-2 major projects detailing your specific individual contributions",
        "Explain your primary engineering motivations and interest in this specific role"
      ]
    },
    {
      id: 2,
      question: `Why are you looking to join our engineering team? What unique expertise or systems focus do you bring?`,
      category: "General",
      suggestedPoints: [
        "Connect your past experience to the target company's current challenges or tech stack",
        "Express enthusiasm for their engineering scale, culture, and business domain",
        "State concrete technical skills (e.g., performance tuning, backend API design) you master"
      ]
    },
    {
      id: 3,
      question: `What is your approach to automated testing, code reviews, and maintaining system health across shared microservices?`,
      category: "General",
      suggestedPoints: [
        "Discuss your preferred testing pyramid (unit, integration, end-to-end setups)",
        "Highlight collaborative code review processes aiming to raise the team's quality bar",
        "Detail how you configure CI/CD pipelines, lint checkers, and error logging monitors"
      ]
    },
    {
      id: 4,
      question: `Tell me about a technology or framework you've recently learned. What triggered this, and what tradeoffs did you observe?`,
      category: "General",
      suggestedPoints: [
        "Show a proactive mindset and intellectual curiosity for modern system evolutions",
        "Evaluate the technology critically, detailing where it excels and where it fails",
        "State how you've experimented with it inside hobby sandboxes or side integrations"
      ]
    },
    {
      id: 5,
      question: `Where do you see your engineering journey heading over the next 2-3 years? What skills are you actively aiming to master?`,
      category: "General",
      suggestedPoints: [
        "Detail interest in senior technical leadership or domain architecture ownership",
        "Identify specific deep areas (e.g., distributed databases, high-availability networks)",
        "Express commitment to mentoring junior peers and improving overall development velocity"
      ]
    }
  ];
}

export function getMockGrading(answers: Array<{ question: string; transcript: string }>, overallScoreBias: number = 84) {
  let totalLength = 0;
  let wordCount = 0;
  const answerResults = (answers || []).map((ans, idx) => {
    const text = (ans.transcript || "").trim();
    totalLength += text.length;
    const words = text.split(/\s+/).filter(Boolean);
    wordCount += words.length;

    let score = 82;
    let feedback = "Solid delivery. Your response structure is clear and effectively addresses the core prompt. Good job!";

    if (words.length === 0) {
      score = 0;
      feedback = "No spoken response was provided for this question.";
    } else if (words.length < 15) {
      score = 64;
      feedback = "Your response is brief. Consider expanding your answers using the STAR format (Situation, Task, Action, Result) and incorporating more technical keywords, quantitative metrics, or architectural trade-offs.";
    } else if (words.length > 80) {
      score = 92;
      feedback = "Excellent response depth! You demonstrated high technical mastery, clearly communicated your concrete actions, and covered all core rubric constraints with precision.";
    }

    return {
      question: ans.question,
      transcript: text,
      feedback,
      score
    };
  });

  if (wordCount === 0) {
    return {
      overallScore: 0,
      metrics: { communication: 0, technical: 0, confidence: 0, bodyLanguage: 0, speech: 0 },
      questionsAnswered: answerResults
    };
  }

  const fillerWords = (answers.map(a => a.transcript || "").join(" ").match(/\b(um|uh|like|actually|basically)\b/gi) || []).length;
  const communication = Math.max(70, Math.min(96, 95 - fillerWords * 2.5));
  const technical = wordCount > 200 ? 89 : 76;
  const confidence = Math.max(70, Math.min(95, 90 - fillerWords * 2));
  const bodyLanguage = 85;
  const speech = Math.max(72, 92 - fillerWords * 2.5);

  const overallScore = Math.round((communication + technical + confidence + bodyLanguage + speech) / 5);

  return {
    overallScore,
    metrics: { communication, technical, confidence, bodyLanguage, speech },
    questionsAnswered: answerResults
  };
}

export function getMockResumeAnalysis(text: string, fileName: string) {
  const normText = (text || "").toLowerCase();
  
  // Heuristically check matching skills
  const skillBank = ["react", "typescript", "node", "express", "postgres", "sql", "redis", "docker", "aws", "kubernetes", "python", "git", "ci/cd", "graphql", "mongodb"];
  const matched: string[] = [];
  const missing: string[] = [];

  skillBank.forEach(skill => {
    if (normText.includes(skill)) {
      matched.push(skill.toUpperCase());
    } else {
      missing.push(skill.toUpperCase());
    }
  });

  // Ensure default fallback arrays if empty
  if (matched.length === 0) matched.push("TYPESCRIPT", "JAVASCRIPT", "GIT", "HTML/CSS");
  if (missing.length === 0) missing.push("KUBERNETES", "REDIS", "AWS SOLUTIONS", "CI/CD PIPELINES");

  // Section existence
  const experience = normText.includes("experience") || normText.includes("work") || normText.includes("employment");
  const education = normText.includes("education") || normText.includes("university") || normText.includes("school") || normText.includes("college");
  const projects = normText.includes("project") || normText.includes("portfolio");
  const skills = normText.includes("skill") || normText.includes("technolog");

  const atsScore = Math.min(95, Math.max(55, 60 + matched.length * 3 + (experience ? 10 : 0) + (education ? 5 : 0) + (projects ? 5 : 0)));

  return {
    atsScore,
    skillsAnalysis: {
      matched,
      missing: missing.slice(0, 5)
    },
    sectionsFound: { experience, education, projects, skills },
    aiSuggestions: [
      {
        category: "Impact",
        severity: "High",
        text: "Enhance bullet points by stating the concrete business impact. Rather than listing tasks, write: 'Optimized PostgreSQL database querying, reducing server response latency by 35%.'"
      },
      {
        category: "Keywords",
        severity: "Medium",
        text: `Incorporate more missing technical tags like ${missing.slice(0, 2).join(", ")} to pass structural ATS parsing filters.`
      },
      {
        category: "Structure",
        severity: "Low",
        text: "Keep your professional summary section clean and limited to 3-4 impactful sentences. Avoid fluff adjectives and center on system contributions."
      }
    ]
  };
}

export function getMockEnhancedSentence(sentence: string) {
  const verbs = ["Engineered", "Orchestrated", "Pioneered", "Championed", "Architected", "Spearheaded"];
  const selectedVerb = verbs[Math.floor(Math.random() * verbs.length)];
  
  const metrics = [
    "reducing load times by 42% and enhancing database reliability",
    "slashing server operational latency by 30% under peak loads",
    "boosting application rendering performance by 25% with zero downtime",
    "optimizing API throughput by 45% and eliminating memory leaks"
  ];
  const selectedMetric = metrics[Math.floor(Math.random() * metrics.length)];

  // Clean the original sentence of passive voice
  let cleanSentence = sentence.trim();
  cleanSentence = cleanSentence.replace(/^(I was |We were |I |I helped to |Responsible for )/i, "");
  // Capitalize first letter
  cleanSentence = cleanSentence.charAt(0).toLowerCase() + cleanSentence.slice(1);

  return `${selectedVerb} custom high-performance pipelines to ${cleanSentence}, ${selectedMetric}.`;
}

export function getMockJdMatch(resumeText: string, jobDescription: string) {
  const normResume = (resumeText || "").toLowerCase();
  const normJd = (jobDescription || "").toLowerCase();

  // Pick some keywords from the JD that might be missing from the resume
  const candidates = ["docker", "kubernetes", "redis", "postgres", "aws", "terraform", "microservices", "graphql", "next.js", "ci/cd", "agile", "security", "kafka", "oauth"];
  const missingKeywords: string[] = [];
  
  candidates.forEach(kw => {
    if (normJd.includes(kw) && !normResume.includes(kw)) {
      missingKeywords.push(kw.toUpperCase());
    }
  });

  if (missingKeywords.length === 0) {
    missingKeywords.push("REDIS CACHING", "SYSTEM DESIGN", "AUTOMATED E2E TESTING");
  }

  const matchPercentage = Math.round(Math.min(95, Math.max(50, 70 + (candidates.length - missingKeywords.length) * 3)));

  return {
    matchPercentage,
    missingKeywords: missingKeywords.slice(0, 5),
    tailoredSummary: `Experienced Software Engineer with a proven history of designing and building scalable systems. Adept at optimizing API performance and implementing high-availability database architectures. Strong expertise in incorporating modern engineering methodologies to align with target business metrics.`,
    tailoredSuggestions: [
      `Explicitly mention experience with '${missingKeywords[0] || 'REDIS'}' in your primary experience section.`,
      "Quantify your accomplishments by adding concrete percentage improvement metrics.",
      "Add a dedicated 'Technical Core Competencies' section listing exact matching technologies."
    ]
  };
}

export function getMockFollowUp(history: Array<{ role: 'interviewer' | 'candidate'; text: string }>, lastUserResponse: string) {
  const text = (lastUserResponse || "").toLowerCase();
  
  let feedback = "Excellent explanation. Your focus on performance and robust state management is a major asset.";
  let nextQuestion = "How do you approach caching strategies like Redis inside distributed nodes to prevent stale state issues?";

  if (text.includes("sql") || text.includes("postgres") || text.includes("database") || text.includes("query")) {
    feedback = "Great insights on database structures! You clearly understand relational concepts and execution planning.";
    nextQuestion = "When scaling relational databases, what strategy would you choose between database sharding and read replicas to resolve heavy write locks?";
  } else if (text.includes("react") || text.includes("component") || text.includes("rendering") || text.includes("frontend")) {
    feedback = "Solid frontend breakdown! It is clear you focus heavily on component performance and state rendering loops.";
    nextQuestion = "How would you prevent unnecessary component re-renders when managing deeply nested states inside a complex client-side dashboard?";
  } else if (text.includes("api") || text.includes("rest") || text.includes("graphql") || text.includes("endpoint")) {
    feedback = "Excellent API security overview. Protecting routes is critical for enterprise architectures.";
    nextQuestion = "How do you design a distributed rate limiter per-client across horizontal Express microservices using Redis?";
  } else if (text.includes("test") || text.includes("unit") || text.includes("ci/cd") || text.includes("pipeline")) {
    feedback = "Wonderful coverage of testing protocols. Ensuring stable deployments is highly valued by elite teams.";
    nextQuestion = "In your past projects, what strategy did you use to keep testing times fast inside automated CI/CD push pipelines?";
  }

  return {
    feedback,
    nextQuestion
  };
}

export function getMockDsaTrack(category: string) {
  const normCat = (category || "").toLowerCase();

  if (normCat.includes("dynamic") || normCat.includes("dp")) {
    return {
      category: "Dynamic Programming",
      overallScore: 68,
      problems: [
        {
          id: "lc-322",
          title: "Coin Change",
          description: "Given coin denominations and an amount, find the minimum coins required to make up that amount.",
          difficulty: "Medium",
          timeComplexity: "O(N * S)",
          spaceComplexity: "O(S)",
          conceptHint: "Use a bottom-up DP array where DP[i] represents the minimum coins for amount i.",
          leetcodeLink: "https://leetcode.com/problems/coin-change/"
        },
        {
          id: "lc-300",
          title: "Longest Increasing Subsequence",
          description: "Find the length of the longest strictly increasing subsequence in an array.",
          difficulty: "Medium",
          timeComplexity: "O(N log N)",
          spaceComplexity: "O(N)",
          conceptHint: "Binary search with dynamic patient sorting arrays yields the optimal O(N log N) runtime.",
          leetcodeLink: "https://leetcode.com/problems/longest-increasing-subsequence/"
        },
        {
          id: "lc-198",
          title: "House Robber",
          description: "Determine the maximum money you can rob tonight without alerting neighbors (cannot rob adjacent houses).",
          difficulty: "Easy",
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          conceptHint: "Keep track of two previous states: max value with current house robbed vs max value skipped.",
          leetcodeLink: "https://leetcode.com/problems/house-robber/"
        },
        {
          id: "lc-72",
          title: "Edit Distance",
          description: "Find the minimum edit operations (insert, delete, replace) to convert word1 to word2.",
          difficulty: "Hard",
          timeComplexity: "O(M * N)",
          spaceComplexity: "O(M * N)",
          conceptHint: "Build a 2D matrix matching prefix lengths and minimizing standard edit transition cells.",
          leetcodeLink: "https://leetcode.com/problems/edit-distance/"
        },
        {
          id: "lc-416",
          title: "Partition Equal Subset Sum",
          description: "Determine if an array can be partitioned into two subsets with equal sums.",
          difficulty: "Medium",
          timeComplexity: "O(N * Sum)",
          spaceComplexity: "O(Sum)",
          conceptHint: "Convert this to a subset sum problem where the target sum is half of the total array elements sum.",
          leetcodeLink: "https://leetcode.com/problems/partition-equal-subset-sum/"
        }
      ],
      resources: [
        {
          title: "Striver's Complete Dynamic Programming Course",
          type: "video",
          url: "https://www.youtube.com/playlist?list=PLgUwDviBIf0qUlt5y6ysfCknwyPcYMQ2Q"
        },
        {
          title: "Dynamic Programming for Beginners - LeetCode Study Guide",
          type: "article",
          url: "https://leetcode.com/discuss/study-guide/1490172/dynamic-programming-for-beginners"
        }
      ]
    };
  }

  if (normCat.includes("array") || normCat.includes("hash") || normCat.includes("string")) {
    return {
      category: "Arrays & Hashing",
      overallScore: 82,
      problems: [
        {
          id: "lc-1",
          title: "Two Sum",
          description: "Find two numbers in an array that add up to a target value.",
          difficulty: "Easy",
          timeComplexity: "O(N)",
          spaceComplexity: "O(N)",
          conceptHint: "Maintain a Hash Map mapping visited values to their indices to check for complements in a single pass.",
          leetcodeLink: "https://leetcode.com/problems/two-sum/"
        },
        {
          id: "lc-49",
          title: "Group Anagrams",
          description: "Group strings that contain the same characters in different orders.",
          difficulty: "Medium",
          timeComplexity: "O(N * K log K)",
          spaceComplexity: "O(N * K)",
          conceptHint: "Use a Hash Map where the key is the sorted string representation of each word.",
          leetcodeLink: "https://leetcode.com/problems/group-anagrams/"
        },
        {
          id: "lc-347",
          title: "Top K Frequent Elements",
          description: "Find the K most frequent elements in an array.",
          difficulty: "Medium",
          timeComplexity: "O(N)",
          spaceComplexity: "O(N)",
          conceptHint: "Use Bucket Sort where bucket index represents frequency count, avoiding Heap overhead.",
          leetcodeLink: "https://leetcode.com/problems/top-k-frequent-elements/"
        },
        {
          id: "lc-128",
          title: "Longest Consecutive Sequence",
          description: "Find the length of the longest consecutive elements sequence in an unsorted array.",
          difficulty: "Medium",
          timeComplexity: "O(N)",
          spaceComplexity: "O(N)",
          conceptHint: "Insert elements into a Hash Set, and only start checking sequences if current-1 doesn't exist.",
          leetcodeLink: "https://leetcode.com/problems/longest-consecutive-sequence/"
        },
        {
          id: "lc-238",
          title: "Product of Array Except Self",
          description: "Calculate products of all elements except current without using division.",
          difficulty: "Medium",
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          conceptHint: "Run a prefix product scan forward, then accumulate suffix products scanning backwards in-place.",
          leetcodeLink: "https://leetcode.com/problems/product-of-array-except-self/"
        }
      ],
      resources: [
        {
          title: "NeetCode 150 Arrays & Hashing Video Playlist",
          type: "video",
          url: "https://neetcode.io/practice"
        }
      ]
    };
  }

  // Default fallback category (Trees & Graphs / System Design / Linked Lists)
  return {
    category: category || "Data Structures & Algorithms",
    overallScore: 75,
    problems: [
      {
        id: "lc-141",
        title: "Linked List Cycle",
        description: "Determine if a linked list contains a loop.",
        difficulty: "Easy",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        conceptHint: "Utilize Floyd's Cycle Finding algorithm using slow and fast pointer increments.",
        leetcodeLink: "https://leetcode.com/problems/linked-list-cycle/"
      },
      {
        id: "lc-102",
        title: "Binary Tree Level Order Traversal",
        description: "Return the level-order traversal of tree nodes.",
        difficulty: "Medium",
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        conceptHint: "Leverage a First-In-First-Out queue (BFS structure) tracking sizes per level loop.",
        leetcodeLink: "https://leetcode.com/problems/binary-tree-level-order-traversal/"
      },
      {
        id: "lc-200",
        title: "Number of Islands",
        description: "Count the number of 1s islands inside a 2D binary grid.",
        difficulty: "Medium",
        timeComplexity: "O(M * N)",
        spaceComplexity: "O(M * N)",
        conceptHint: "Iterate across cells and trigger recursive DFS land-sinking scans for each new island found.",
        leetcodeLink: "https://leetcode.com/problems/number-of-islands/"
      },
      {
        id: "lc-121",
        title: "Best Time to Buy and Sell Stock",
        description: "Find the max profit possible buying on one day and selling in the future.",
        difficulty: "Easy",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        conceptHint: "Maintain the minimum price seen so far and check profit delta on subsequent values.",
        leetcodeLink: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"
      },
      {
        id: "lc-207",
        title: "Course Schedule",
        description: "Determine if you can complete all courses given a list of prerequisite dependency pairs.",
        difficulty: "Medium",
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V + E)",
        conceptHint: "Detect cycles in a directed graph using DFS node state flags or topological sorting (Kahn's algorithm).",
        leetcodeLink: "https://leetcode.com/problems/course-schedule/"
      }
    ],
    resources: [
      {
        title: "Striver's A2Z DSA Course & Sheet",
        type: "practice",
        url: "https://takeuforward.org/strivers-a2z-dsa-course-sheet-instructions/"
      }
    ]
  };
}

export function getMockRoadmap(targetRole: string, atsData: any, interviews: any[]) {
  const role = targetRole || "Software Engineer";
  const missingKws: string[] = Array.isArray(atsData?.missingKeywords) && atsData.missingKeywords.length > 0 
    ? atsData.missingKeywords 
    : ["REST APIs", "System Design", "Redis Caching", "Docker Containerization", "CI/CD Pipelines"];

  const kw1 = missingKws[0] || "RESTful APIs & Backend Services";
  const kw2 = missingKws[1] || "System Design & Distributed Caching";
  const kw3 = missingKws[2] || "CI/CD & DevOps Automation";

  return [
    {
      id: "m-1",
      milestoneNumber: 1,
      category: "Technical Fundamentals",
      title: `Mastering ${kw1} for ${role}`,
      description: `In-depth technical module targeting primary missing ATS keywords (${kw1}) and strengthening core concepts.`,
      whySelected: `Calibrated specifically because your ATS Resume Scan identified '${kw1}' as a critical missing competency for ${role} roles.`,
      estimatedMinutes: 60,
      difficulty: "Medium",
      requiredSkills: [kw1, "Architecture", "Best Practices", "API Testing"],
      resources: [
        {
          title: `${kw1} Architecture Guide & Implementation Patterns`,
          type: "article",
          url: `https://www.google.com/search?q=${encodeURIComponent(kw1 + " best practices tutorial")}`
        },
        {
          title: `Building Production-Ready ${kw1}`,
          type: "video",
          url: `https://www.google.com/search?q=${encodeURIComponent(kw1 + " crash course video")}`
        }
      ],
      practicalTask: `Build and document a hands-on sample component or micro-service showcasing ${kw1} error handling and performance optimizations.`,
      interviewQuestions: [
        `How do you handle error states and edge cases when implementing ${kw1}?`,
        `What are the performance implications and key tradeoffs of ${kw1}?`
      ],
      status: "NOT_STARTED"
    },
    {
      id: "m-2",
      milestoneNumber: 2,
      category: "System Design & Scalability",
      title: `Advanced ${kw2} & High Throughput`,
      description: "Learn distributed system fundamentals, cache invalidation, database indexing, and scale-out strategies.",
      whySelected: `Selected because mock interview transcripts and resume scans indicated an opportunity to deepen architectural depth on ${kw2}.`,
      estimatedMinutes: 90,
      difficulty: "Hard",
      requiredSkills: [kw2, "Load Balancing", "Redis", "Database Indexing"],
      resources: [
        {
          title: `System Design Primer: ${kw2}`,
          type: "article",
          url: `https://www.google.com/search?q=${encodeURIComponent(kw2 + " system design architecture")}`
        },
        {
          title: "High Scalability & Cache Invalidation Strategies",
          type: "video",
          url: "https://www.google.com/search?q=cache+invalidation+redis+system+design"
        }
      ],
      practicalTask: "Design a high-throughput architecture diagram specifying rate limiters, write-through caching, and read replicas.",
      interviewQuestions: [
        "How do you prevent cache stampedes and stale data reads under heavy write traffic?",
        "When would you choose database sharding over read-replicas?"
      ],
      status: "NOT_STARTED"
    },
    {
      id: "m-3",
      milestoneNumber: 3,
      category: "Behavioral & Communication",
      title: "STAR Technique & Executive Vocal Delivery",
      description: "Structure complex behavioral responses using Situation, Task, Action, and Result with quantifiable business metrics.",
      whySelected: "Calibrated to refine verbal confidence, reduce filler words, and elevate communication impact during leadership rounds.",
      estimatedMinutes: 45,
      difficulty: "Easy",
      requiredSkills: ["STAR Method", "Verbal Fluency", "Metric Quantification", "Leadership"],
      resources: [
        {
          title: "Mastering the STAR Interview Framework",
          type: "article",
          url: "https://www.google.com/search?q=STAR+method+interview+technique+guide"
        },
        {
          title: "Quantifying Technical Achievements on Speech & Resume",
          type: "video",
          url: "https://www.google.com/search?q=how+to+quantify+impact+software+engineer+interview"
        }
      ],
      practicalTask: "Prepare 3 STAR-format behavioral stories detailing technical conflicts, production outages, and high-impact features.",
      interviewQuestions: [
        "Tell me about a time you made a technical decision under deep ambiguity.",
        "Describe a high-stakes outage post-mortem you led and what safeguards you introduced."
      ],
      status: "NOT_STARTED"
    },
    {
      id: "m-4",
      milestoneNumber: 4,
      category: "DevOps & Deployment",
      title: `Production Integration: ${kw3}`,
      description: "Automate containerized build pipelines, continuous deployment checks, and health monitoring.",
      whySelected: `Identified from your ATS keywords scan as an essential modern pipeline skill for ${role}.`,
      estimatedMinutes: 60,
      difficulty: "Medium",
      requiredSkills: [kw3, "Docker", "CI/CD", "GitHub Actions"],
      resources: [
        {
          title: `${kw3} Deployment Automation Tutorial`,
          type: "article",
          url: `https://www.google.com/search?q=${encodeURIComponent(kw3 + " tutorial github actions")}`
        }
      ],
      practicalTask: "Configure an automated CI/CD pipeline script running linting, unit tests, and build checks on push.",
      interviewQuestions: [
        "How do you achieve zero-downtime deployments with CI/CD automation?",
        "How do you manage secret keys safely inside containerized build environments?"
      ],
      status: "NOT_STARTED"
    },
    {
      id: "m-5",
      milestoneNumber: 5,
      category: "Final Placement Readiness",
      title: `Full Mock Interview Simulation for ${role}`,
      description: "Synthesize all technical, behavioral, and architectural skills in a full-length 10-question evaluation.",
      whySelected: "Final capstone milestone to validate overall placement readiness and reach a 90+ readiness index.",
      estimatedMinutes: 90,
      difficulty: "Hard",
      requiredSkills: ["Comprehensive Prep", "Mock Simulation", "System Architecture", "STAR Delivery"],
      resources: [
        {
          title: "Top 50 Software Engineering Interview Questions & Answers",
          type: "article",
          url: `https://www.google.com/search?q=${encodeURIComponent(role + " top interview questions 2026")}`
        }
      ],
      practicalTask: "Complete a full 10-question Mock Interview round on Intervu IQ and review detailed performance feedback.",
      interviewQuestions: [
        `Walk me through your most complex production project and explain your individual architectural contributions for ${role}.`
      ],
      status: "NOT_STARTED"
    }
  ];
}

export function getMockAdaptedRoadmap(targetRole: string, existingMilestones: any[], latestInterview: any, interviews: any[]) {
  const role = targetRole || "Software Engineer";
  const completed = Array.isArray(existingMilestones) 
    ? existingMilestones.filter(m => m.status === 'COMPLETED' || m.status === 'completed')
    : [];

  const latestWeaknesses: string[] = latestInterview?.feedback?.weaknesses || latestInterview?.weaknesses || [];
  const primaryWeakness = latestWeaknesses[0] || "Advanced Problem Solving & System Boundaries";
  const secondaryWeakness = latestWeaknesses[1] || "Verbal Technical Fluency & STAR Framework";

  const updatedMilestones = [...completed];

  let nextIndex = completed.length + 1;

  // Add adapted milestone 1 for latest interview weakness
  updatedMilestones.push({
    id: `m-adapted-${nextIndex}`,
    milestoneNumber: nextIndex++,
    category: "Interview Gap Remedy",
    title: `Targeted Practice: ${primaryWeakness}`,
    description: `Adapted milestone directly targeting weakness identified in latest Mock Interview (${latestInterview?.role || role} - ${latestInterview?.interviewType || 'Technical'}).`,
    whySelected: `Updated after latest Mock Interview session where '${primaryWeakness}' was flagged for targeted improvement.`,
    estimatedMinutes: 60,
    difficulty: "Medium",
    requiredSkills: [primaryWeakness, "Edge Cases", "Architecture"],
    resources: [
      {
        title: `Mastering ${primaryWeakness} Guide`,
        type: "article",
        url: `https://www.google.com/search?q=${encodeURIComponent(primaryWeakness + " guide tutorial")}`
      }
    ],
    practicalTask: `Write down 3 concrete examples demonstrating how you address ${primaryWeakness} in production code.`,
    interviewQuestions: [
      `How do you overcome ${primaryWeakness} during high-pressure technical interviews?`
    ],
    status: "IN_PROGRESS"
  });

  // Add adapted milestone 2
  updatedMilestones.push({
    id: `m-adapted-${nextIndex}`,
    milestoneNumber: nextIndex++,
    category: "Communication & Delivery",
    title: `Refining ${secondaryWeakness}`,
    description: "Strengthen explanation structure and verbal impact for senior technical evaluation rounds.",
    whySelected: `Calibrated after latest Mock Interview feedback to polish technical communication on ${secondaryWeakness}.`,
    estimatedMinutes: 45,
    difficulty: "Easy",
    requiredSkills: [secondaryWeakness, "STAR Method", "Technical Communication"],
    resources: [
      {
        title: "Technical Interview Communication Best Practices",
        type: "article",
        url: "https://www.google.com/search?q=technical+interview+communication+tips"
      }
    ],
    practicalTask: "Record a 2-minute mock answer explaining a past project architecture using the STAR method.",
    interviewQuestions: [
      "Walk me through a difficult technical tradeoff you navigated on a live system."
    ],
    status: "NOT_STARTED"
  });

  // Final capstone
  updatedMilestones.push({
    id: `m-adapted-${nextIndex}`,
    milestoneNumber: nextIndex++,
    category: "Capstone Evaluation",
    title: `Follow-up Mock Interview Round for ${role}`,
    description: "Validate mastery of adapted skills in a new full 10-question mock interview round.",
    whySelected: "Final capstone to verify that recently identified weaknesses have been successfully resolved.",
    estimatedMinutes: 90,
    difficulty: "Hard",
    requiredSkills: ["Full Simulation", "Comprehensive Practice", "Mock Round"],
    resources: [
      {
        title: "Intervu IQ Mock Interview Simulator",
        type: "practice",
        url: "#"
      }
    ],
    practicalTask: "Complete another 10-question Mock Interview on Intervu IQ to score 85+ across all metric categories.",
    interviewQuestions: [
      `Walk through your solution for a complex ${role} system under high concurrency.`
    ],
    status: "NOT_STARTED"
  });

  return updatedMilestones;
}

export function getMockAtsAnalysis(text: string, targetRole: string) {
  const normText = (text || "").toLowerCase();
  const role = targetRole || "Software Engineer";

  const skillBank = [
    "react", "typescript", "javascript", "node", "express", "postgres", "sql",
    "redis", "docker", "aws", "kubernetes", "python", "git", "ci/cd", "graphql",
    "mongodb", "rest api", "unit testing", "system design", "microservices"
  ];
  const matched: string[] = [];
  const missingKeywords: string[] = [];

  skillBank.forEach(skill => {
    if (normText.includes(skill)) {
      matched.push(skill.toUpperCase());
    } else {
      missingKeywords.push(skill.toUpperCase());
    }
  });

  const experience = normText.includes("experience") || normText.includes("work");
  const education = normText.includes("education") || normText.includes("university") || normText.includes("degree");
  const projects = normText.includes("project");

  const score = Math.min(94, Math.max(58, 62 + matched.length * 2 + (experience ? 8 : 0) + (education ? 5 : 0) + (projects ? 5 : 0)));

  return {
    score,
    strengths: [
      `Strong alignment with core engineering keywords including ${matched.slice(0, 3).join(", ") || 'TypeScript, JavaScript, and Web Technologies'}.`,
      "Clear chronological layout with distinct professional and technical sections.",
      "Demonstrates relevant development experience for the target position."
    ],
    weaknesses: [
      `Key high-demand technical keywords are missing or underrepresented (e.g., ${missingKeywords.slice(0, 3).join(", ")}).`,
      "Some bullet points lack quantifiable impact metrics (e.g. latency reduction percentages, cost savings, or active user scale).",
      "Action verbs could be stronger in several project and role descriptions."
    ],
    missingKeywords: missingKeywords.slice(0, 6),
    grammarSuggestions: [
      "Replace passive phrases like 'responsible for' with assertive action verbs like 'Engineered', 'Orchestrated', or 'Implemented'.",
      "Maintain consistent past-tense verbs for past roles and present-tense for current positions."
    ],
    formattingSuggestions: [
      "Ensure bullet points are strictly 1-2 lines for optimal ATS scanner parsing readability.",
      "Use standard section headers: 'Work Experience', 'Technical Skills', 'Education', 'Projects'."
    ],
    improvementSuggestions: [
      `Integrate ${missingKeywords.slice(0, 2).join(" and ")} into your recent project bullet points to improve automated parsing match rates.`,
      "Apply the X-Y-Z formula: 'Accomplished [X] as measured by [Y], by doing [Z]' across all major work achievements.",
      `Tailor your summary statement specifically to the '${role}' title.`
    ],
    overallFeedback: `Your resume demonstrates a solid foundation for ${role}. Implementing the suggested industry keyword additions and quantifying your project achievements will significantly boost your ATS match rate.`
  };
}

