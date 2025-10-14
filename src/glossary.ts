export const GLOSSARY: Record<string, string> = {
  RPS: "Requests Per Second — throughput: how many requests your system handles each second.",
  Integrations: "How many third-party systems your app must talk to (Slack, email provider, calendar, payments, CRM, AI APIs, etc.). Used to judge coupling and whether event-driven/plugins are helpful.",
  SLO: "Service Level Objective — your target for reliability/speed (e.g., p95 < 300ms).",
  SLA: "Service Level Agreement — contractual promise often based on SLOs.",
  SLI: "Service Level Indicator — the measured metric (e.g., p95 latency, error rate).",
  p95: "95th percentile latency — 95% of requests finish under this time.",
  Consistency:
    "Strong = everyone sees the same truth immediately. Eventual = it settles shortly after.",
  Idempotency:
    "Running the same operation multiple times has the same final effect as once.",
  Broker:
    "Messaging middleman (Redis Streams, RabbitMQ, Kafka) routing events/queues.",
  Saga:
    "Multi-step workflow with compensations if later steps fail (an orchestrated business process).",
};
