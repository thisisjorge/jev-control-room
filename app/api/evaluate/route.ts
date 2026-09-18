import { experimental_evaluate as evaluate } from 'ai';
import { NextResponse } from 'next/server';

import { demoEvaluation } from '@/lib/demo';
import { normalizeAnswers } from '@/lib/normalize';
import { derivePolicy } from '@/lib/policy';
import { questionsForPreset } from '@/lib/questions';
import { checkRateLimit } from '@/lib/rate-limit';
import type { EvaluationResponse, PresetId } from '@/lib/types';

export const runtime = 'nodejs';

const presetIds = new Set<PresetId>(['support', 'lead', 'agent', 'review', 'workflow']);

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const clientKey = forwardedFor || request.headers.get('x-real-ip') || 'local';
    const rateLimit = checkRateLimit(clientKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many evaluations. Try again in a minute.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected a preset and state.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const presetId = input.presetId as PresetId;
    const state = typeof input.state === 'string' ? input.state.trim() : '';

    if (!presetIds.has(presetId)) {
      return NextResponse.json({ error: 'Unknown preset.' }, { status: 400 });
    }

    if (state.length < 8) {
      return NextResponse.json({ error: 'Add a little more context before running the evaluation.' }, { status: 400 });
    }

    if (state.length > 8000) {
      return NextResponse.json({ error: 'Keep the state under 8,000 characters for this demo.' }, { status: 400 });
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(await demoEvaluation(presetId, state));
    }

    const started = performance.now();
    const result = await evaluate({
      model: 'typesafe-ai/jev',
      state,
      questions: questionsForPreset(presetId),
    });
    const latencyMs = Math.round(performance.now() - started);

    const decisions = normalizeAnswers(
      result.answers as Record<string, unknown>,
      result.providerMetadata,
    );
    const response: EvaluationResponse = {
      mode: 'live',
      model: 'typesafe-ai/jev',
      presetId,
      latencyMs,
      decisions,
      policy: derivePolicy(decisions),
      raw: {
        answers: result.answers,
        providerMetadata: result.providerMetadata,
        usage: result.usage,
        warnings: result.warnings,
        rounding: result.rounding,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown evaluation error';
    const secret = process.env.AI_GATEWAY_API_KEY;
    const safeMessage = secret ? message.replaceAll(secret, '[redacted]') : message;
    console.error('Jev evaluation failed:', safeMessage);
    const publicMessage = safeMessage.includes('requires a valid credit card on file')
      ? 'AI Gateway requires a valid credit card on the Vercel account before LIVE evaluations can run.'
      : safeMessage;
    return NextResponse.json(
      {
        error: 'Jev evaluation failed.',
        detail: publicMessage !== safeMessage || process.env.NODE_ENV === 'development'
          ? publicMessage
          : undefined,
      },
      { status: 502 },
    );
  }
}
