import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAnswers } from '../lib/normalize.ts';
import { confidenceToBand, derivePolicy } from '../lib/policy.ts';

test('policy thresholds are exact at AUTO, REVIEW, and MANUAL boundaries', () => {
  assert.equal(confidenceToBand(0.85), 'AUTO');
  assert.equal(confidenceToBand(0.8499), 'REVIEW');
  assert.equal(confidenceToBand(0.6), 'REVIEW');
  assert.equal(confidenceToBand(0.5999), 'MANUAL');
});

test('policy follows the least confident decision head', () => {
  const policy = derivePolicy([
    { id: 'a', label: 'A', kind: 'choice', value: 'x', confidence: 0.96, detail: '' },
    { id: 'b', label: 'B', kind: 'score', value: 2, confidence: 0.72, detail: '' },
    { id: 'c', label: 'C', kind: 'boolean', value: true, confidence: 0.91, detail: '' },
  ]);

  assert.equal(policy.confidence, 0.72);
  assert.equal(policy.band, 'REVIEW');
});

test('missing confidence cannot authorize an automatic action', () => {
  const policy = derivePolicy([
    { id: 'a', label: 'A', kind: 'choice', value: 'x', confidence: 0.97, detail: '' },
    { id: 'b', label: 'B', kind: 'score', value: 2, confidence: null, detail: '' },
  ]);

  assert.equal(policy.band, 'MANUAL');
  assert.equal(policy.confidence, null);
  assert.match(policy.explanation, /no usable confidence/i);
});

test('Score distribution alone is not treated as confidence', () => {
  const [decision] = normalizeAnswers({
    risk: {
      type: 'score',
      score: 2.7,
      probabilities: { 0: 0.01, 1: 0.04, 2: 0.19, 3: 0.76 },
    },
  });

  assert.equal(decision.confidence, null);
  assert.equal(derivePolicy([decision]).band, 'MANUAL');
});

test('normalization uses TypeSafe Choice and Score confidence metadata', () => {
  const decisions = normalizeAnswers(
    {
      route: {
        type: 'choice',
        choice: 'billing',
        probabilities: { billing: 0.62, technical: 0.38 },
      },
      priority: {
        type: 'score',
        score: 2.2,
        probabilities: { 0: 0.05, 1: 0.15, 2: 0.35, 3: 0.45 },
      },
      humanReview: { type: 'boolean', probability: 0.2 },
    },
    {
      typesafe: {
        confidence: { route: 0.91, priority: 0.86 },
      },
    },
  );

  assert.deepEqual(
    decisions.map(({ id, value, confidence }) => ({ id, value, confidence })),
    [
      { id: 'route', value: 'billing', confidence: 0.91 },
      { id: 'priority', value: 2.2, confidence: 0.86 },
      { id: 'humanReview', value: false, confidence: 0.8 },
    ],
  );
});

test('normalization falls back to distributions and ignores invalid metadata', () => {
  const [decision] = normalizeAnswers(
    {
      route: {
        type: 'choice',
        choice: 'general',
        probabilities: { billing: 0.1, general: 0.9 },
      },
    },
    { typesafe: { confidence: { route: Number.NaN } } },
  );

  assert.equal(decision.confidence, 0.9);
});

test('Choice fallback uses the selected option, not another option', () => {
  const [decision] = normalizeAnswers({
    route: {
      type: 'choice',
      choice: 'general',
      probabilities: { billing: 0.9, general: 0.1 },
    },
  });

  assert.equal(decision.confidence, 0.1);
  assert.equal(derivePolicy([decision]).band, 'MANUAL');
});

test('out-of-range metadata is never promoted to automatic confidence', () => {
  const [decision] = normalizeAnswers(
    { risk: { type: 'score', score: 2 } },
    { typesafe: { confidence: { risk: 1.7 } } },
  );

  assert.equal(decision.confidence, null);
  assert.equal(derivePolicy([decision]).band, 'MANUAL');
});
