// rules.ts
export type Recommendation = {
  primary: string;
  addons: string[];
  rationale: string[];       // keep existing
  starterStack: string[];    // keep existing

  // NEW
  confidence: number;        // 0–1 overall confidence
  scores: Array<{ option: string; score: number; reasons: string[] }>;
  explanations: Array<{
    criterion: string;
    yourAnswer: string;
    impact: 'strong'|'medium'|'weak';
    because: string;         // single-sentence justification
    contribution: number;    // -5..+5 to the primary option
  }>;
  tradeoffs: string[];       // what you give up with the primary choice
  tippingPoints: Array<{     // “what would change the rec”
    condition: string;       // e.g., "RPS > 1,000 sustained + strict latency <150ms"
    newRec: string;          // e.g., "Modular monolith + async queue"
    why: string;
  }>;
};

export type Answers = {
  team: 'solo'|'small'|'multi';
  rpsNow: '<100'|'100-1000'|'>1000';
  rpsSoon: '<100'|'100-1000'|'>1000';
  spikes: boolean;
  bgWork: 'none'|'some'|'heavy';
  latency: '<150'|'150-500'|'>500';
  consistency: 'strong'|'eventual';
  integrations: number;
  indepDeploys: boolean;
  ops: 'low'|'mid'|'high';
  budget: 'lean'|'mod'|'managedOK';
  regulation: 'none'|'light'|'strict';
};

export const DEFAULT_ANSWERS: Answers = {
  team: 'small',
  rpsNow: '<100',
  rpsSoon: '<100',
  spikes: false,
  bgWork: 'none',
  latency: '150-500',
  consistency: 'strong',
  integrations: 0,
  indepDeploys: false,
  ops: 'low',
  budget: 'lean',
  regulation: 'light',
};

// Helper: weight builder (simple and transparent)
const W = (n: number) => n; // semantic sugar

// Score a few canonical options
const OPTIONS = [
  'Well-structured monolith',
  'Modular monolith',
  'Microservices',
  'Serverless + queue',
] as const;

export function recommend(a: Answers): Recommendation {
  const s: Record<(typeof OPTIONS)[number], number> = {
    'Well-structured monolith': 0,
    'Modular monolith': 0,
    'Microservices': 0,
    'Serverless + queue': 0,
  };

  const explanations: Recommendation['explanations'] = [];

  // TEAM SIZE
  if (a.team === 'solo' || a.team === 'small') {
    s['Well-structured monolith'] += W(4);
    s['Modular monolith'] += W(2);
    explanations.push({
      criterion: 'Team size',
      yourAnswer: a.team,
      impact: 'strong',
      because: 'Smaller teams move faster with one deployable unit and fewer boundaries to manage.',
      contribution: +4,
    });
  } else {
    s['Modular monolith'] += W(2);
    s['Microservices'] += W(2);
    explanations.push({
      criterion: 'Team size',
      yourAnswer: a.team,
      impact: 'medium',
      because: 'Multiple teams benefit from clearer module boundaries and independent work streams.',
      contribution: +2,
    });
  }

  // CURRENT / NEAR-TERM LOAD
  const highLoadSoon = a.rpsNow === '>1000' || a.rpsSoon === '>1000';
  if (highLoadSoon) {
    s['Modular monolith'] += W(3);
    s['Microservices'] += W(2);
    explanations.push({
      criterion: 'Throughput (RPS)',
      yourAnswer: `${a.rpsNow} → ${a.rpsSoon}`,
      impact: 'strong',
      because: 'Higher sustained RPS benefits from internal separation and async paths before full service split.',
      contribution: +3,
    });
  } else {
    s['Well-structured monolith'] += W(2);
    explanations.push({
      criterion: 'Throughput (RPS)',
      yourAnswer: `${a.rpsNow} → ${a.rpsSoon}`,
      impact: 'medium',
      because: 'Sub-1k RPS rarely justifies distributed overhead early on.',
      contribution: +2,
    });
  }

  // SPIKES / BACKGROUND WORK
  if (a.spikes || a.bgWork !== 'none') {
    s['Serverless + queue'] += W(3);
    s['Modular monolith'] += W(1);
    explanations.push({
      criterion: 'Spiky traffic & jobs',
      yourAnswer: `spikes=${a.spikes}, bg=${a.bgWork}`,
      impact: 'strong',
      because: 'Queues and functions handle bursty workloads without resizing the main app.',
      contribution: +3,
    });
  }

  // LATENCY TARGET
  if (a.latency === '<150') {
    s['Well-structured monolith'] += W(2);
    s['Modular monolith'] += W(2);
    s['Microservices'] -= W(1);
    explanations.push({
      criterion: 'Latency target',
      yourAnswer: a.latency,
      impact: 'medium',
      because: 'Cross-service hops add tail latency; tight SLOs favor fewer network boundaries.',
      contribution: +2,
    });
  }

  // CONSISTENCY
  if (a.consistency === 'strong') {
    s['Well-structured monolith'] += W(2);
    s['Modular monolith'] += W(1);
    explanations.push({
      criterion: 'Consistency',
      yourAnswer: a.consistency,
      impact: 'medium',
      because: 'Single DB and transaction scope simplify strong consistency guarantees.',
      contribution: +2,
    });
  } else {
    s['Serverless + queue'] += W(1);
    s['Microservices'] += W(1);
    explanations.push({
      criterion: 'Consistency',
      yourAnswer: a.consistency,
      impact: 'weak',
      because: 'Eventual consistency tolerates async processing and service boundaries.',
      contribution: +1,
    });
  }

  // INTEGRATIONS
  if (a.integrations >= 6) {
    s['Modular monolith'] += W(1);
    s['Microservices'] += W(1);
    explanations.push({
      criterion: 'Integrations',
      yourAnswer: String(a.integrations),
      impact: 'weak',
      because: 'Many third-party integrations often benefit from adapters/edges separated from core.',
      contribution: +1,
    });
  }

  // INDEPENDENT DEPLOYS
  if (a.indepDeploys) {
    s['Modular monolith'] += W(3);
    s['Microservices'] += W(2);
    explanations.push({
      criterion: 'Independent deploys',
      yourAnswer: String(a.indepDeploys),
      impact: 'strong',
      because: 'Separate modules/services allow teams to ship on their own cadence.',
      contribution: +3,
    });
  }

  // OPS MATURITY / BUDGET
  if (a.ops === 'low' || a.budget === 'lean') {
    s['Well-structured monolith'] += W(3);
    s['Serverless + queue'] += W(1);
    s['Microservices'] -= W(3);
    explanations.push({
      criterion: 'Ops maturity & budget',
      yourAnswer: `ops=${a.ops}, budget=${a.budget}`,
      impact: 'strong',
      because: 'Distributed systems add infra/observability cost; start simple if ops are light and budget is lean.',
      contribution: +3,
    });
  } else if (a.ops === 'high' && a.budget !== 'lean') {
    s['Microservices'] += W(2);
    explanations.push({
      criterion: 'Ops maturity & budget',
      yourAnswer: `ops=${a.ops}, budget=${a.budget}`,
      impact: 'medium',
      because: 'If you already run k8s/obs, the platform cost is a lesser concern.',
      contribution: +2,
    });
  }

  // REGULATION
  if (a.regulation === 'strict') {
    s['Modular monolith'] += W(1);
    s['Microservices'] -= W(1);
    explanations.push({
      criterion: 'Regulatory/data boundaries',
      yourAnswer: a.regulation,
      impact: 'weak',
      because: 'Fewer moving parts often makes audits and change control easier.',
      contribution: +1,
    });
  }

  // Pick primary
  const scoresArr = OPTIONS.map(option => ({
    option,
    score: s[option],
    reasons: explanations
      .filter(e => e.contribution > 0 && (option === 'Well-structured monolith'
        ? e.because.includes('fewer') || e.because.includes('single') || e.criterion !== 'Independent deploys'
        : true))
      .slice(0, 4)
      .map(e => `${e.criterion}: ${e.because}`),
  })).sort((a, b) => b.score - a.score);

  const primary = scoresArr[0].option;
  const second = scoresArr[1];

  // Confidence = margin between #1 and #2 normalized
  const confidence = Math.max(0.3, Math.min(0.95, (scoresArr[0].score - second.score) / 10 + 0.5));

  const tradeoffs: string[] = primary === 'Well-structured monolith'
    ? [
        'Fewer independent deploys than services; coordinate releases.',
        'Module boundaries must be enforced by convention/tooling to avoid spaghetti.',
      ]
    : primary === 'Modular monolith'
    ? [
        'Still one runtime → blast radius on resource exhaustion.',
        'Requires discipline on module boundaries and ownership.',
      ]
    : primary === 'Microservices'
    ? [
        'Higher ops/observability cost and cross-service debugging complexity.',
        'Tail latency from network hops; data consistency harder.',
      ]
    : [
        'Cold starts and local dev parity can complicate tight latency SLOs.',
        'Vendor limits and concurrency controls need planning.',
      ];

  const starterStack =
    primary === 'Well-structured monolith' ? [
      'Postgres + Prisma',
      'Node/Express API (modular folders by domain)',
      'React SPA + TanStack Query',
      'BullMQ/Redis for async jobs (optional)',
      'OpenTelemetry + structured logs',
    ] :
    primary === 'Modular monolith' ? [
      'Postgres (schemas per module or namespaces)',
      'Node/NestJS modules per bounded context',
      'Async via queue for non-critical paths',
      'OPA or module-level ACLs',
      'OTel tracing across modules',
    ] :
    primary === 'Microservices' ? [
      'Postgres per service (start with shared cluster, migrate later)',
      'gRPC/HTTP with a gateway',
      'Async events via Kafka/Redpanda',
      'Service mesh / centralized tracing',
      'Infra as code + CI per service',
    ] : [
      'API routes via serverless functions',
      'SQS/Cloud Tasks + workers for jobs',
      'Serverless Postgres or Dynamo',
      'Edge cache/CDN for burst handling',
      'Function-aware tracing',
    ];

  const rationale: string[] = [
    `Your team/ops profile and targets tilt toward ${primary.toLowerCase()} with clear module boundaries and minimal coordination overhead.`,
    `The runner-up (${second.option}) is close; consider it if the tipping conditions happen.`,
  ];

  const addons: string[] = (a.spikes || a.bgWork !== 'none')
    ? ['Async work queue', 'Idempotent job handlers', 'Dead-letter + retries']
    : ['Basic background worker for emails/exports'];

  const tippingPoints = [
    {
      condition: 'RPS > 1,000 sustained or heavy spikes + tighter p95 < 150ms',
      newRec: 'Modular monolith + explicit async boundaries',
      why: 'Keeps latency predictable while isolating bursty workloads.',
    },
    {
      condition: '3+ teams demand independent deploys and ownership boundaries',
      newRec: 'Modular monolith (short term) → Microservices (long term)',
      why: 'Avoids a big-bang split; evolve along module seams.',
    },
  ];

  return {
    primary,
    addons,
    rationale,
    starterStack,
    confidence,
    scores: scoresArr,
    explanations,
    tradeoffs,
    tippingPoints,
  };
}
