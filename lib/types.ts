export type PresetId =
  | 'support'
  | 'lead'
  | 'agent'
  | 'review'
  | 'workflow';

export type DecisionKind = 'choice' | 'score' | 'boolean';

export type PolicyBand = 'AUTO' | 'REVIEW' | 'MANUAL';

export interface Decision {
  id: string;
  label: string;
  kind: DecisionKind;
  value: string | number | boolean;
  confidence: number | null;
  detail: string;
}

export interface EvaluationResponse {
  mode: 'live' | 'demo';
  model: string;
  presetId: PresetId;
  latencyMs: number | null;
  decisions: Decision[];
  policy: {
    band: PolicyBand;
    confidence: number | null;
    explanation: string;
  };
  raw: unknown;
  timestamp: string;
}

export interface HistoryItem extends EvaluationResponse {
  id: string;
  state: string;
  title: string;
}
