import { derivePolicy } from './policy';
import type { Decision, EvaluationResponse, PresetId } from './types';

function seeded(text: string, salt: number) {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function confidence(text: string, salt: number) {
  return 0.71 + seeded(text, salt) * 0.27;
}

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function supportDemo(state: string): Decision[] {
  const route = includesAny(state, ['charge', 'charged', 'payment', 'refund', 'invoice', 'cobran', 'pagament'])
    ? 'billing'
    : includesAny(state, ['bug', 'error', 'login', 'api', 'integration', 'technical'])
      ? 'technical'
      : 'general';
  const urgent = includesAny(state, ['today', 'tomorrow', 'urgent', 'twice', 'blocked', 'immediate', 'hoje']) ? 3 : 2;
  return [
    { id: 'route', label: 'Route', kind: 'choice', value: route, confidence: confidence(state, 1), detail: 'Demo probability distribution' },
    { id: 'priority', label: 'Priority', kind: 'score', value: urgent, confidence: confidence(state, 2), detail: 'Demo ordered rubric' },
    { id: 'humanReview', label: 'Human Review', kind: 'boolean', value: urgent >= 3, confidence: confidence(state, 3), detail: 'Demo boolean probability' },
  ];
}

function genericDemo(presetId: PresetId, state: string): Decision[] {
  const c1 = confidence(state + presetId, 11);
  const c2 = confidence(state + presetId, 22);
  const c3 = confidence(state + presetId, 33);

  if (presetId === 'lead') {
    return [
      { id: 'fit', label: 'Fit', kind: 'choice', value: includesAny(state, ['budget', 'demo', 'crm', 'approved']) ? 'strong' : 'medium', confidence: c1, detail: 'Demo probability distribution' },
      { id: 'urgency', label: 'Urgency', kind: 'score', value: includesAny(state, ['week', 'month', 'this month', 'urgent']) ? 3 : 2, confidence: c2, detail: 'Demo ordered rubric' },
      { id: 'salesReady', label: 'Sales Ready', kind: 'boolean', value: includesAny(state, ['budget', 'demo', 'approved']), confidence: c3, detail: 'Demo boolean probability' },
    ];
  }

  if (presetId === 'agent') {
    const needsHuman = includesAny(state, ['ambiguous', 'exception', 'irreversible', 'sensitive']);
    return [
      { id: 'nextAction', label: 'Next Action', kind: 'choice', value: needsHuman ? 'ask' : 'act', confidence: c1, detail: 'Demo probability distribution' },
      { id: 'certainty', label: 'Certainty', kind: 'score', value: needsHuman ? 1 : 3, confidence: c2, detail: 'Demo ordered rubric' },
      { id: 'humanReview', label: 'Human Review', kind: 'boolean', value: needsHuman, confidence: c3, detail: 'Demo boolean probability' },
    ];
  }

  if (presetId === 'review') {
    const risky = includesAny(state, ['auth', 'production', 'no integration test', 'security']);
    return [
      { id: 'mergeState', label: 'Merge State', kind: 'choice', value: risky ? 'review' : 'ready', confidence: c1, detail: 'Demo probability distribution' },
      { id: 'risk', label: 'Risk', kind: 'score', value: risky ? 2 : 1, confidence: c2, detail: 'Demo ordered rubric' },
      { id: 'needsTests', label: 'Needs Tests', kind: 'boolean', value: risky, confidence: c3, detail: 'Demo boolean probability' },
    ];
  }

  return [
    { id: 'action', label: 'Action', kind: 'choice', value: includesAny(state, ['429', 'retry', 'rate']) ? 'pause' : 'continue', confidence: c1, detail: 'Demo probability distribution' },
    { id: 'risk', label: 'Risk', kind: 'score', value: includesAny(state, ['429', 'failed', 'twice']) ? 2 : 1, confidence: c2, detail: 'Demo ordered rubric' },
    { id: 'safeToContinue', label: 'Safe To Continue', kind: 'boolean', value: !includesAny(state, ['429', 'failed', 'twice']), confidence: c3, detail: 'Demo boolean probability' },
  ];
}

export async function demoEvaluation(presetId: PresetId, state: string): Promise<EvaluationResponse> {
  await new Promise((resolve) => setTimeout(resolve, 260 + seeded(state, 5) * 280));
  const decisions = presetId === 'support' ? supportDemo(state) : genericDemo(presetId, state);
  const policy = derivePolicy(decisions);

  return {
    mode: 'demo',
    model: 'typesafe-ai/jev (simulated)',
    presetId,
    latencyMs: null,
    decisions,
    policy,
    raw: {
      notice: 'Demo mode: add AI_GATEWAY_API_KEY to execute TypeSafe Jev through Vercel AI Gateway.',
      answers: Object.fromEntries(decisions.map((decision) => [decision.id, decision.value])),
    },
    timestamp: new Date().toISOString(),
  };
}
