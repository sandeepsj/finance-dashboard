interface CashflowDatum {
  month: string;
  income: number;
  outflow: number;
}

interface CashflowChartProps {
  data: CashflowDatum[];
  width?: number;
  height?: number;
}

export function CashflowChart({ data, width = 620, height = 200 }: CashflowChartProps) {
  const padL = 44, padR = 8, padT = 12, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...data.map(d => Math.max(d.income, d.outflow)));
  const ticks = 4;
  const barGroupW = innerW / data.length;
  const barW = Math.min(14, barGroupW * 0.35);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + (innerH / ticks) * i;
        const v = max - (max / ticks) * i;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="var(--divider)" strokeDasharray="2 3" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fill="var(--ink-subtle)" fontFamily="JetBrains Mono" fontSize="9">
              {v >= 100000 ? (v / 100000).toFixed(1) + 'L' : Math.round(v / 1000) + 'k'}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + barGroupW * (i + 0.5);
        const incH = (d.income / max) * innerH;
        const outH = (d.outflow / max) * innerH;
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={padT + innerH - incH} width={barW} height={incH} fill="var(--accent)" rx="1.5" />
            <rect x={cx + 1} y={padT + innerH - outH} width={barW} height={outH} fill="var(--s4)" opacity="0.85" rx="1.5" />
            <text x={cx} y={height - 8} textAnchor="middle" fill="var(--ink-subtle)" fontFamily="JetBrains Mono" fontSize="9">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}
