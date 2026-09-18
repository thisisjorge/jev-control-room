import type { Decision, DecisionKind } from './types';

function finiteProbability(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

function probabilitiesOf(answer: unknown): Record<string, number> {
  if (!answer || typeof answer !== 'object') return {};
  const raw = (answer as Record<string, unknown>).probabilities;
  if (!raw || typeof raw !== 'object') return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .map(([key, value]) => [key, finiteProbability(value)] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] !== null),
  );
}

function typeSafeConfidenceFor(providerMetadata: unknown, id: string): number | null {
  if (!providerMetadata || typeof providerMetadata !== 'object') return null;
  const typeSafe = (providerMetadata as Record<string, unknown>).typesafe;
  if (!typeSafe || typeof typeSafe !== 'object') return null;
  const confidence = (typeSafe as Record<string, unknown>).confidence;
  if (!confidence || typeof confidence !== 'object') return null;

  return finiteProbability((confidence as Record<string, unknown>)[id]);
}

function confidenceFor(answer: unknown, typeSafeConfidence: number | null): number | null {
  if (!answer || typeof answer !== 'object') return null;
  const record = answer as Record<string, unknown>;

  if (record.type === 'boolean') {
    const p = finiteProbability(record.probability);
    if (p === null) return null;
    return Math.max(p, 1 - p);
  }

  if (typeSafeConfidence !== null) return typeSafeConfidence;

  if (record.type === 'score') return null;

  if (record.type === 'choice' && typeof record.choice === 'string') {
    return probabilitiesOf(answer)[record.choice] ?? null;
  }

  return null;
}

function kindOf(answer: unknown): DecisionKind {
  if (answer && typeof answer === 'object') {
    const type = (answer as Record<string, unknown>).type;
    if (type === 'choice' || type === 'score' || type === 'boolean') return type;
  }
  return 'choice';
}

function valueOf(answer: unknown): string | number | boolean {
  if (!answer || typeof answer !== 'object') return String(answer ?? 'unknown');
  const record = answer as Record<string, unknown>;

  if (record.type === 'choice' && typeof record.choice === 'string') return record.choice;
  if (record.type === 'score' && typeof record.score === 'number') return record.score;
  if (record.type === 'boolean' && typeof record.probability === 'number') {
    return record.probability >= 0.5;
  }

  return 'unknown';
}

export function humanizeId(id: string) {
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export function normalizeAnswers(
  answers: Record<string, unknown>,
  providerMetadata?: unknown,
): Decision[] {
  return Object.entries(answers).map(([id, answer]) => {
    const kind = kindOf(answer);
    const value = valueOf(answer);
    const probabilities = probabilitiesOf(answer);

    let detail = '';
    if (kind === 'boolean' && answer && typeof answer === 'object') {
      const probability = (answer as Record<string, unknown>).probability;
      detail = typeof probability === 'number'
        ? `P(true) ${(probability * 100).toFixed(1)}%`
        : 'Boolean probability';
    } else if (Object.keys(probabilities).length) {
      detail = Object.entries(probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([key, probability]) => `${key} ${(probability * 100).toFixed(0)}%`)
        .join(' · ');
    } else {
      detail = kind === 'score' ? 'Ordered rubric score' : 'Typed decision';
    }

    return {
      id,
      label: humanizeId(id),
      kind,
      value,
      confidence: confidenceFor(answer, typeSafeConfidenceFor(providerMetadata, id)),
      detail,
    };
  });
}
