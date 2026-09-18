import type { Decision, PolicyBand } from './types';

export function confidenceToBand(confidence: number): PolicyBand {
  if (confidence >= 0.85) return 'AUTO';
  if (confidence >= 0.6) return 'REVIEW';
  return 'MANUAL';
}

export function derivePolicy(decisions: Decision[]) {
  const confidences = decisions.map((decision) => decision.confidence);
  const hasMissingConfidence = confidences.length === 0 ||
    confidences.some((value) => value === null || !Number.isFinite(value));

  // For automation safety, policy follows the least-certain decision instead
  // of averaging away one weak link in a multi-decision evaluation.
  const confidence = hasMissingConfidence
    ? null
    : Math.min(...confidences as number[]);
  const band = confidence === null ? 'MANUAL' : confidenceToBand(confidence);

  const explanation =
    confidence === null
      ? 'A decision head has no usable confidence signal; keep the action manual.'
      : band === 'AUTO'
      ? 'All decision heads cleared the 85% confidence policy threshold.'
      : band === 'REVIEW'
        ? 'At least one decision is uncertain enough to require human review.'
        : 'Confidence is too low for autonomous execution; keep the action manual.';

  return { band, confidence, explanation };
}
