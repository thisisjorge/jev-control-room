'use client';

import { useEffect, useState } from 'react';

import { humanizeId } from '@/lib/normalize';
import { getPreset, presets } from '@/lib/presets';
import { questionsForPreset } from '@/lib/questions';
import type { Decision, EvaluationResponse, HistoryItem, PolicyBand, PresetId } from '@/lib/types';

const HISTORY_KEY = 'jev-control-room:history:v1';

function Icon({ name, size = 18 }: { name: 'spark' | 'play' | 'clock' | 'database' | 'chevron' | 'copy' | 'trash' | 'terminal' | 'shield' | 'branch'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'play') return <svg {...common}><path d="m8 5 11 7-11 7Z" /></svg>;
  if (name === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === 'database') return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>;
  if (name === 'chevron') return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
  if (name === 'copy') return <svg {...common}><rect x="9" y="9" width="10" height="10" rx="2" /><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>;
  if (name === 'trash') return <svg {...common}><path d="M4 7h16" /><path d="M10 11v5M14 11v5" /><path d="m6 7 1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>;
  if (name === 'terminal') return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M12 15h5" /></svg>;
  if (name === 'shield') return <svg {...common}><path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6Z" /><path d="m9 12 2 2 4-5" /></svg>;
  if (name === 'branch') return <svg {...common}><circle cx="6" cy="5" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="8" cy="19" r="2" /><path d="M6 7v3c0 2 2 3 4 3h3c3 0 5-2 5-5M8 17v-4" /></svg>;
  return <svg {...common}><path d="m12 2 1.5 5.1L18 9l-4.5 1.9L12 16l-1.5-5.1L6 9l4.5-1.9Z" /><path d="m19 14 .8 2.7L22 18l-2.2 1.3L19 22l-.8-2.7L16 18l2.2-1.3Z" /></svg>;
}

function formatValue(value: Decision['value']) {
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toFixed(Number.isInteger(value) ? 0 : 1);
  return value.replace(/[_-]/g, ' ').toUpperCase();
}

function policyTone(band: PolicyBand) {
  if (band === 'AUTO') return 'good';
  if (band === 'REVIEW') return 'warn';
  return 'danger';
}

function confidenceLabel(value: number | null) {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function DecisionCard({ decision, index }: { decision: Decision; index: number }) {
  const confidence = decision.confidence ?? 0;
  return (
    <article className="decision-card" style={{ '--delay': `${index * 45}ms` } as React.CSSProperties}>
      <div className="decision-topline">
        <span className={`kind kind-${decision.kind}`}>{decision.kind}</span>
        <span className="confidence-number">{confidenceLabel(decision.confidence)}</span>
      </div>
      <div className="decision-label">{decision.label}</div>
      <div className="decision-value">{formatValue(decision.value)}</div>
      <div className="meter" aria-label={`Confidence ${confidenceLabel(decision.confidence)}`}>
        <span style={{ width: `${confidence * 100}%` }} />
      </div>
      <div className="decision-detail">{decision.detail}</div>
    </article>
  );
}

function EmptyDecisionCard({ type, label }: { type: string; label: string }) {
  return (
    <article className="decision-card empty-card">
      <div className="decision-topline"><span className="kind">{type}</span><span className="confidence-number">—</span></div>
      <div className="decision-label">{label}</div>
      <div className="decision-value skeleton-text">WAITING</div>
      <div className="meter"><span style={{ width: '0%' }} /></div>
      <div className="decision-detail">Run an evaluation to populate this head.</div>
    </article>
  );
}

function PolicyRail({ result }: { result: EvaluationResponse | null }) {
  const bands: { band: PolicyBand; range: string; text: string }[] = [
    { band: 'AUTO', range: '≥ 85%', text: 'autonomous action' },
    { band: 'REVIEW', range: '60–84%', text: 'human checkpoint' },
    { band: 'MANUAL', range: '< 60%', text: 'manual only' },
  ];

  return (
    <section className="policy-card panel">
      <div className="section-heading">
        <div><span className="eyebrow">CONFIDENCE POLICY</span><h2>Execution gate</h2></div>
        <Icon name="shield" size={19} />
      </div>
      <div className="policy-bands">
        {bands.map((item) => (
          <div key={item.band} className={`policy-band ${result?.policy.band === item.band ? 'active' : ''}`}>
            <span className={`policy-dot ${policyTone(item.band)}`} />
            <div><strong>{item.band}</strong><span>{item.text}</span></div>
            <code>{item.range}</code>
          </div>
        ))}
      </div>
      <div className={`policy-result ${result ? policyTone(result.policy.band) : ''}`}>
        <div className="policy-result-main">
          <span className="policy-caption">CURRENT VERDICT</span>
          <strong>{result?.policy.band ?? 'NO SIGNAL'}</strong>
        </div>
        <span className="policy-confidence">{result ? confidenceLabel(result.policy.confidence) : '—'}</span>
      </div>
      <p className="policy-explanation">{result?.policy.explanation ?? 'The weakest decision head determines the gate.'}</p>
    </section>
  );
}

function HistoryPanel({ history, onSelect, onClear }: { history: HistoryItem[]; onSelect: (item: HistoryItem) => void; onClear: () => void }) {
  return (
    <section className="history-panel panel">
      <div className="section-heading history-heading">
        <div><span className="eyebrow">LOCAL SESSION</span><h2>Decision history</h2></div>
        {history.length > 0 && <button className="icon-button" onClick={onClear} aria-label="Clear local history" title="Clear local history"><Icon name="trash" size={17} /></button>}
      </div>
      {history.length === 0 ? (
        <div className="history-empty"><Icon name="database" size={24} /><span>No runs stored yet.</span><small>Results stay in this browser.</small></div>
      ) : (
        <div className="history-list">
          {history.slice(0, 8).map((item) => (
            <button key={item.id} className="history-row" onClick={() => onSelect(item)}>
              <span className={`history-mode ${item.mode}`}>{item.mode === 'live' ? 'LIVE' : 'DEMO'}</span>
              <div className="history-copy"><strong>{item.title}</strong><span>{item.state}</span></div>
              <span className={`history-policy ${policyTone(item.policy.band)}`}>{item.policy.band}</span>
              <Icon name="chevron" size={15} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [presetId, setPresetId] = useState<PresetId>('support');
  const preset = getPreset(presetId);
  const [state, setState] = useState(preset.example);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedLive, setFailedLive] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setHistory(parsed as HistoryItem[]);
      }
    } catch { /* local storage is non-critical */ }
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch { /* local storage is non-critical */ }
  }, [history, historyLoaded]);

  const decisionCount = result?.decisions.length ?? 3;
  const weakestConfidence = result?.policy.confidence ?? null;
  const emptyHeads = Object.entries(questionsForPreset(presetId));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void runEvaluation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function choosePreset(id: PresetId) {
    const next = getPreset(id);
    setPresetId(id);
    setState(next.example);
    setResult(null);
    setError(null);
    setFailedLive(false);
    setRawOpen(false);
  }

  async function runEvaluation() {
    if (loading || state.trim().length < 8) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setFailedLive(false);
    setRawOpen(false);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId, state }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFailedLive(response.status === 502);
        throw new Error(data.detail || data.error || 'Evaluation failed.');
      }

      const evaluation = data as EvaluationResponse;
      setResult(evaluation);
      const item: HistoryItem = {
        ...evaluation,
        id: crypto.randomUUID(),
        state: state.trim(),
        title: preset.label,
      };
      setHistory((current) => [item, ...current].slice(0, 20));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Evaluation failed.');
    } finally {
      setLoading(false);
    }
  }

  function loadHistory(item: HistoryItem) {
    setPresetId(item.presetId);
    setState(item.state);
    setResult(item);
    setError(null);
    setFailedLive(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function copyRaw() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.raw, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError('Could not copy the raw response. Use the inspector to select the JSON.');
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Jev Control Room home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span>JEV <b>CONTROL ROOM</b></span>
        </a>
        <div className="topbar-center"><span className="pulse" /><span>SYSTEM ONE / DECISION INFRASTRUCTURE</span></div>
      </header>

      <div className="content" id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker"><span>TYPE-SAFE DECISIONS</span><span className="kicker-line" /><span>01</span></div>
            <h1>Decide first.<br /><em>Generate less.</em></h1>
            <p>Inspect fast, typed AI decisions from <strong>TypeSafe Jev</strong>. State goes in; Choice, Score, and Boolean signals come out with uncertainty you can route on.</p>
          </div>
          <div className="hero-status">
            <div className="status-row"><span>MODEL</span><strong>typesafe-ai/jev</strong></div>
            <div className="status-row"><span>TRANSPORT</span><strong>Vercel AI Gateway</strong></div>
            <div className="status-row"><span>DATA</span><strong>Gateway default</strong></div>
            <div className="status-row"><span>MODE</span><strong className={result?.mode === 'live' ? 'live-text' : ''}>{result?.mode === 'live' ? 'LIVE' : result?.mode === 'demo' ? 'DEMO' : failedLive ? 'LIVE ERROR' : 'NOT RUN'}</strong></div>
            <div className="status-row"><span>JEV LATENCY</span><strong className={result?.mode === 'live' ? 'live-text' : ''}>{result?.mode === 'live' && typeof result.latencyMs === 'number' ? `${result.latencyMs} ms` : result?.mode === 'demo' ? 'SIMULATED' : '—'}</strong></div>
          </div>
        </section>

        <section className="workspace-grid">
          <div className="left-column">
            <section className="preset-strip" aria-label="Decision presets">
              {presets.map((item, index) => (
                <button key={item.id} type="button" aria-pressed={presetId === item.id} className={`preset-button ${presetId === item.id ? 'active' : ''}`} onClick={() => choosePreset(item.id)}>
                  <span className="preset-index">0{index + 1}</span>
                  <span><small>{item.eyebrow}</small><strong>{item.label}</strong></span>
                </button>
              ))}
            </section>

            <section className="input-panel panel">
              <div className="section-heading">
                <div><span className="eyebrow">INCOMING STATE</span><h2>{preset.label}</h2></div>
                <span className="char-count">{state.length.toLocaleString()} / 8,000</span>
              </div>
              <p className="preset-description">{preset.description}</p>
              <div className="textarea-shell">
                <textarea aria-label={`${preset.label} state`} aria-describedby="state-guidance" maxLength={8000} value={state} onChange={(event) => setState(event.target.value)} placeholder={preset.placeholder} spellCheck="true" />
                <div className="textarea-footer">
                  <button className="example-button" type="button" onClick={() => setState(preset.example)}>LOAD EXAMPLE</button>
                  <span id="state-guidance">shared state</span>
                </div>
              </div>
              {error && <div className="error-banner" role="alert"><span aria-hidden="true">!</span><span>{error}</span></div>}
              <div className="sr-only" role="status" aria-live="polite">{loading ? 'Evaluating the selected preset.' : result ? `${result.mode.toUpperCase()} evaluation complete. Policy: ${result.policy.band}.${result.mode === 'live' && typeof result.latencyMs === 'number' ? ` Jev latency: ${result.latencyMs} milliseconds.` : ''}` : ''}</div>
              <button className="run-button" type="button" onClick={runEvaluation} disabled={loading || state.trim().length < 8}>
                <span className="run-icon">{loading ? <span className="spinner" /> : <Icon name="play" size={18} />}</span>
                <span><strong>{loading ? 'EVALUATING…' : 'RUN JEV EVALUATION'}</strong><small>{loading ? 'dispatching typed questions in parallel' : 'Choice + Score + Boolean'}</small></span>
                <kbd>CTRL ↵</kbd>
              </button>
            </section>

            <section className="results-section panel" aria-busy={loading}>
              <div className="section-heading results-heading">
                <div><span className="eyebrow">DECISION HEADS</span><h2>Structured output</h2></div>
                <div className="result-badges">
                  <span>{decisionCount} heads</span>
                  {result && <span className={`mode-badge ${result.mode}`}>{result.mode}</span>}
                </div>
              </div>
              <div className="decision-grid">
                {result
                  ? result.decisions.map((decision, index) => <DecisionCard key={decision.id} decision={decision} index={index} />)
                  : emptyHeads.map(([id, question]) => <EmptyDecisionCard key={id} type={question.type} label={humanizeId(id)} />)}
              </div>
              <div className="signal-footer">
                <div><span>Weakest signal</span><strong>{weakestConfidence === null ? '—' : confidenceLabel(weakestConfidence)}</strong></div>
                <div><span>Policy strategy</span><strong>MIN CONFIDENCE</strong></div>
                <div><span>Output contract</span><strong>TYPED</strong></div>
              </div>
            </section>

            <section className="raw-panel panel">
              <button className="raw-toggle" type="button" aria-expanded={rawOpen} aria-controls="raw-response" onClick={() => setRawOpen((open) => !open)} disabled={!result}>
                <span><Icon name="terminal" size={18} /><span><small>PROVIDER RESPONSE</small><strong>Raw inspection</strong></span></span>
                <span className={rawOpen ? 'rotated' : ''}><Icon name="chevron" size={18} /></span>
              </button>
              {rawOpen && result && (
                <div className="raw-body" id="raw-response">
                  <div className="raw-toolbar"><span>JSON</span><button type="button" onClick={copyRaw}><Icon name="copy" size={14} /> {copied ? 'COPIED' : 'COPY'}</button></div>
                  <pre>{JSON.stringify(result.raw, null, 2)}</pre>
                </div>
              )}
            </section>
          </div>

          <aside className="right-column">
            <PolicyRail result={result} />
            <section className="architecture-card panel">
              <div className="section-heading"><div><span className="eyebrow">DATAFLOW</span><h2>Decision path</h2></div><Icon name="branch" size={19} /></div>
              <div className="flow-stack">
                <div className="flow-node"><span>01</span><div><small>STATE</small><strong>Application context</strong></div></div>
                <div className="flow-line"><i /></div>
                <div className="flow-node accent"><span>02</span><div><small>EVALUATE</small><strong>TypeSafe Jev</strong></div></div>
                <div className="flow-line split"><i /><i /><i /></div>
                <div className="flow-outputs"><span>CHOICE</span><span>SCORE</span><span>BOOL</span></div>
                <div className="flow-line"><i /></div>
                <div className="flow-node"><span>03</span><div><small>POLICY</small><strong>Act / review / manual</strong></div></div>
              </div>
              <p className="architecture-note">No prose parser in the decision path. The UI acts on typed slots and their uncertainty.</p>
            </section>
            <HistoryPanel history={history} onSelect={loadHistory} onClear={() => setHistory([])} />
          </aside>
        </section>

        <footer>
          <div><span className="footer-dot" /> JEV CONTROL ROOM / EXPERIMENTAL</div>
          <div>Built for observable, confidence-aware decision systems.</div>
        </footer>
      </div>
    </main>
  );
}
