import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spark, Upload as UploadIcon } from '@/components/ui/Icon';
import { useStoreState } from '@/store/hooks';
import { hasData, latestMonth } from '@/store/derive';
import {
  buildReviewPrompt,
  getCachedReview,
  reviewCacheKey,
  runReview,
  setCachedReview,
} from '@/lib/monthlyReview';
import { cn } from '@/lib/cn';

const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ymLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_LABEL[Number(m) - 1]} ${y}`;
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; text: string; cached: boolean; generatedAt: string }
  | { kind: 'failed'; reason: string };

export function MonthlyReview() {
  const state = useStoreState();
  if (!hasData(state)) return <ReviewEmpty />;

  const monthsAvailable = useMemo(() => {
    const set = new Set<string>();
    for (const t of Object.values(state.transactions)) set.add(t.date.slice(0, 7));
    return [...set].sort();
  }, [state.transactions]);

  const defaultYm = latestMonth(state);
  const [ym, setYm] = useState<string>(defaultYm);
  const activeYm = monthsAvailable.includes(ym) ? ym : defaultYm;

  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const prompt = useMemo(() => buildReviewPrompt(state, activeYm), [state, activeYm]);
  const cacheKey = useMemo(() => reviewCacheKey(state, activeYm), [state, activeYm]);

  // Load cached review when the month changes.
  useEffect(() => {
    const cached = getCachedReview(cacheKey);
    if (cached) {
      setStage({ kind: 'done', text: cached.text, cached: true, generatedAt: cached.generatedAt });
    } else {
      setStage({ kind: 'idle' });
    }
  }, [cacheKey]);

  const run = async () => {
    setStage({ kind: 'running' });
    try {
      const text = await runReview(prompt);
      const generatedAt = new Date().toISOString();
      setCachedReview(cacheKey, { prompt, text, generatedAt });
      setStage({ kind: 'done', text, cached: false, generatedAt });
    } catch (e) {
      setStage({ kind: 'failed', reason: (e as Error).message });
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Monthly Review"
        subtitle={`${ymLabel(activeYm)} · narrative summary by Claude`}
        period={ymLabel(activeYm)}
      />
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-w-0 max-w-5xl w-full">
        {monthsAvailable.length > 1 && (
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-ink-muted">Period</span>
            <div className="flex gap-1 flex-wrap">
              {monthsAvailable.map(m => (
                <button
                  key={m}
                  onClick={() => setYm(m)}
                  className={cn(
                    'h-7 px-3 rounded-full text-[11px] font-medium transition-colors',
                    m === activeYm ? 'bg-accent-soft text-accent-ink' : 'bg-surface-alt text-ink-muted hover:text-ink',
                  )}
                >
                  {ymLabel(m).replace(' 20', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        <Card padding={20} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">
                Review for {ymLabel(activeYm)}
              </div>
              <div className="text-[15px] text-ink mt-1">
                Sends a structured summary of this month's data to Claude (Sonnet) and renders the response. Cached locally so re-opening the same month is free.
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              leadingIcon={<Spark size={14} />}
              disabled={stage.kind === 'running'}
              onClick={run}
            >
              {stage.kind === 'running' ? 'Running…' : stage.kind === 'done' ? 'Re-run' : 'Run review'}
            </Button>
          </div>

          {stage.kind === 'done' && (
            <div className="flex items-center gap-2">
              <Badge tone="gain" dot>Done</Badge>
              {stage.cached && <span className="text-[11px] text-ink-muted">from cache</span>}
              <span className="text-[11px] text-ink-subtle font-mono">
                {new Date(stage.generatedAt).toLocaleString()}
              </span>
            </div>
          )}
          {stage.kind === 'failed' && (
            <div className="flex flex-col gap-2">
              <Badge tone="loss" dot>Failed</Badge>
              <div className="text-[12px] text-ink-muted">{stage.reason}</div>
              <div className="text-[11px] text-ink-subtle">
                The LLM proxy may be unreachable. You can copy the prompt below and paste it into Claude.ai by hand.
              </div>
            </div>
          )}
        </Card>

        {stage.kind === 'done' && (
          <Card padding={20} className="flex flex-col gap-3 bg-surface">
            <div className="prose-review">
              <RenderMarkdown text={stage.text} />
            </div>
          </Card>
        )}

        <details className="text-[12px] text-ink-muted">
          <summary className="cursor-pointer select-none">View constructed prompt</summary>
          <Card padding={16} className="mt-2">
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-ink-muted leading-relaxed">{prompt}</pre>
            <div className="flex justify-end mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(prompt);
                  } catch {
                    // ignore
                  }
                }}
              >
                Copy to clipboard
              </Button>
            </div>
          </Card>
        </details>
      </div>
    </div>
  );
}

/** Tiny markdown renderer — bold, italic, lists, and headings are enough for
 *  Claude's output. Avoids pulling in a markdown library for one page. */
function RenderMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === 'h1') return <h2 key={i} className="text-[20px] font-semibold text-ink mt-3 -tracking-[0.01em]">{renderInline(b.text)}</h2>;
        if (b.kind === 'h2') return <h3 key={i} className="text-[16px] font-semibold text-ink mt-3">{renderInline(b.text)}</h3>;
        if (b.kind === 'h3') return <h4 key={i} className="text-[13px] font-semibold text-ink mt-3 uppercase tracking-[0.04em]">{renderInline(b.text)}</h4>;
        if (b.kind === 'list') return (
          <ul key={i} className="list-disc pl-5 text-[13px] text-ink leading-relaxed mt-2 flex flex-col gap-1">
            {b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
          </ul>
        );
        return <p key={i} className="text-[13px] text-ink leading-relaxed mt-2">{renderInline(b.text)}</p>;
      })}
    </>
  );
}

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'list'; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ kind: 'list', items: list });
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }
    const hMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (hMatch) {
      flushPara();
      flushList();
      const level = hMatch[1].length as 1 | 2 | 3;
      blocks.push({ kind: `h${level}` as 'h1' | 'h2' | 'h3', text: hMatch[2] });
      continue;
    }
    const liMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (liMatch) {
      flushPara();
      list.push(liMatch[1]);
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  // Match **bold** and *italic* and `code`
  const tokens: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) tokens.push(text.slice(lastIdx, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) tokens.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('*')) tokens.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    else if (tok.startsWith('`')) tokens.push(<code key={key++} className="font-mono text-[12px] bg-surface-alt px-1 rounded-sm">{tok.slice(1, -1)}</code>);
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) tokens.push(text.slice(lastIdx));
  return <>{tokens}</>;
}

function ReviewEmpty() {
  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar title="Monthly Review" subtitle="Upload a statement first to generate a review" />
      <div className="flex-1 p-6 overflow-auto">
        <Card padding={32} className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
          <div className="text-[20px] font-semibold text-ink">Nothing to review yet</div>
          <div className="text-[13px] text-ink-muted">
            Once a month or two of statements are loaded, Claude can summarize what happened and call out anything worth watching.
          </div>
          <Link to="/upload">
            <Button variant="primary" size="sm" leadingIcon={<UploadIcon size={13} />}>
              Open upload page
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
