// Monthly Review — prompt construction + LLM proxy call.
//
// The proxy lives at https://llm-proxy-smoky.vercel.app/api/proxy per
// docs/PLAN.md. It's expected to accept Anthropic-style /v1/messages
// requests and proxy them to Claude. If the proxy is unreachable, the page
// shows the constructed prompt with a "Copy to clipboard" so the user can
// paste it into Claude.ai by hand.

import type { AppState } from '@/store/types';
import {
  cashflow,
  derivedIncomeStreams,
  outflowCategories,
  outflowKpis,
  portfolioByType,
  portfolioSummary,
  topMerchants,
} from '@/store/derive';
import { categoryLabel } from './categorize';

const PROXY_URL = 'https://llm-proxy-smoky.vercel.app/api/proxy';
const MODEL = 'claude-sonnet-4-6';

// ── Prompt builder ────────────────────────────────────────────────────────

export function buildReviewPrompt(state: AppState, ym: string): string {
  const k = outflowKpis(state, ym);
  const cats = outflowCategories(state, ym).slice(0, 8);
  const merchants = topMerchants(state, ym, 8);
  const streams = derivedIncomeStreams(state).slice(0, 6);
  const portfolio = portfolioSummary(state);
  const byType = portfolioByType(state);
  const cf = cashflow(state, ym, 6);

  const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

  const lines: string[] = [];
  lines.push(`You are reviewing personal finance data for ${monthName(ym)}.`);
  lines.push('');
  lines.push(`# Income this month`);
  lines.push(`- Credits: ${fmt(k.recurring + k.variable + (cf.find(b => b.month === ym)?.income ?? 0))} (from latest month bucket)`);
  if (streams.length > 0) {
    lines.push(`- Detected streams (last few months):`);
    for (const s of streams) {
      lines.push(`  - ${s.label}: ${fmt(s.amount)} × ${s.occurrences} (${s.frequency})`);
    }
  }
  lines.push('');
  lines.push(`# Outflow this month`);
  lines.push(`- Total debits: ${fmt(k.total)} across ${k.txnCount} transactions`);
  lines.push(`- Recurring: ${fmt(k.recurring)} · Variable: ${fmt(k.variable)}`);
  if (k.topCategory) lines.push(`- Top category: ${categoryLabel(k.topCategory.category)} (${fmt(k.topCategory.spend)})`);
  lines.push('');
  if (cats.length > 0) {
    lines.push(`## By category`);
    for (const c of cats) {
      const merchantPreview = c.topMerchants.slice(0, 2).map(m => trimMerchant(m.description)).join(', ');
      lines.push(`- ${categoryLabel(c.category)}: ${fmt(c.spend)} (${c.txnCount} txns) — ${merchantPreview}`);
    }
    lines.push('');
  }
  if (merchants.length > 0) {
    lines.push(`## Top merchants`);
    for (const m of merchants) {
      lines.push(`- ${trimMerchant(m.description)}: ${fmt(m.spend)} × ${m.count} (last ${m.lastDate})`);
    }
    lines.push('');
  }
  lines.push(`# Cashflow trend (last 6 months)`);
  for (const b of cf) {
    const net = b.income - b.outflow;
    lines.push(`- ${b.month}: in ${fmt(b.income)}, out ${fmt(b.outflow)}, net ${net >= 0 ? '+' : ''}${fmt(net)}`);
  }
  lines.push('');
  if (portfolio.count > 0) {
    lines.push(`# Savings portfolio`);
    lines.push(`- Invested ${fmt(portfolio.invested)} → current ${fmt(portfolio.currentValue)} (${portfolio.pnlPct.toFixed(1)}% returns)`);
    for (const g of byType) {
      lines.push(`  - ${g.label}: ${fmt(g.currentValue)} value, ${fmt(g.invested)} invested, ${g.pnlPct.toFixed(1)}% returns`);
    }
    lines.push('');
  }
  lines.push(`# Your task`);
  lines.push(`Write a personal finance review covering:`);
  lines.push(`1. **Summary** — 2 short paragraphs on what happened this month: what dominated outflow, anything unusual, any flags.`);
  lines.push(`2. **Three actionable suggestions** — specific to this data, not generic finance advice. Use ₹ amounts.`);
  lines.push(`3. **One thing to watch next month** — based on the 6-month trend.`);
  lines.push('');
  lines.push(`Indian context: ₹ symbol, INR. Direct, short prose. Use markdown headings.`);
  return lines.join('\n');
}

function monthName(ym: string): string {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, mm] = ym.split('-');
  return `${m[Number(mm) - 1]} ${y}`;
}

function trimMerchant(desc: string): string {
  return desc.replace(/^UPI[- ]/i, '').replace(/-PAYTMQR\S+/, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

// ── Proxy call ────────────────────────────────────────────────────────────

export interface RunReviewOptions {
  signal?: AbortSignal;
  /** Override the proxy URL (useful for tests). */
  proxyUrl?: string;
}

export async function runReview(prompt: string, opts: RunReviewOptions = {}): Promise<string> {
  const url = opts.proxyUrl ?? PROXY_URL;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) {
    throw new Error(`Proxy returned ${r.status}: ${await r.text().catch(() => '')}`);
  }
  const data = (await r.json()) as ProxyResponse;
  return extractText(data);
}

interface ProxyResponse {
  // Anthropic /v1/messages shape
  content?: { type: string; text: string }[];
  // Or some proxies wrap it
  message?: { content?: { type: string; text: string }[] };
  // Or a flat string
  text?: string;
  result?: string;
  error?: { message: string };
}

function extractText(data: ProxyResponse): string {
  if (data.error) throw new Error(data.error.message);
  if (Array.isArray(data.content)) {
    return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  if (data.message?.content) {
    return data.message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  if (typeof data.text === 'string') return data.text;
  if (typeof data.result === 'string') return data.result;
  return JSON.stringify(data, null, 2);
}

// ── Local cache ───────────────────────────────────────────────────────────
//
// Cache the rendered review in localStorage keyed by (ym, fileHash digest).
// Re-running the same month with no new uploads returns the cached text.

const CACHE_KEY = 'fd:reviews:v1';

interface CacheEntry {
  prompt: string;
  text: string;
  generatedAt: string;
}

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota or disabled — non-fatal
  }
}

export function getCachedReview(key: string): CacheEntry | null {
  return readCache()[key] ?? null;
}

export function setCachedReview(key: string, entry: CacheEntry): void {
  const cache = readCache();
  cache[key] = entry;
  writeCache(cache);
}

export function clearCachedReview(key: string): void {
  const cache = readCache();
  delete cache[key];
  writeCache(cache);
}

/** Build a stable cache key from the month + a digest of the doc hashes that
 *  contributed transactions in that month. Re-running with the same docs is
 *  a free cache hit; uploading a new doc invalidates. */
export function reviewCacheKey(state: AppState, ym: string): string {
  const docHashes: string[] = [];
  for (const t of Object.values(state.transactions)) {
    if (t.date.slice(0, 7) === ym && !docHashes.includes(t.sourceDocId)) {
      docHashes.push(t.sourceDocId);
    }
  }
  docHashes.sort();
  // Cheap fnv1a fingerprint
  let h = 2166136261;
  const all = ym + '|' + docHashes.join(',');
  for (let i = 0; i < all.length; i++) {
    h ^= all.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${ym}.${(h >>> 0).toString(36)}`;
}
