interface DailyDebitChartProps {
  data: { date: string; spend: number }[];
  width?: number;
  height?: number;
}

/** Vertical bars per calendar day. The day-of-month is implicit in array
 *  position, so the chart works even if some days have zero spend. */
export function DailyDebitChart({ data, width = 620, height = 160 }: DailyDebitChartProps) {
  const padL = 36, padR = 8, padT = 12, padB = 22;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(1, ...data.map(d => d.spend));
  const ticks = 3;
  const stepX = innerW / data.length;
  const barW = Math.max(2, stepX * 0.75);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + (innerH / ticks) * i;
        const v = max - (max / ticks) * i;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="var(--divider)" strokeDasharray="2 3" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fill="var(--ink-subtle)" fontFamily="JetBrains Mono" fontSize="9">
              {v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v).toString()}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padL + i * stepX + (stepX - barW) / 2;
        const h = (d.spend / max) * innerH;
        const y = padT + innerH - h;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={h} fill="var(--s4)" opacity={d.spend > 0 ? 0.85 : 0} rx="1.5">
              <title>{d.date}: ₹{Math.round(d.spend).toLocaleString('en-IN')}</title>
            </rect>
            {(i + 1) % 5 === 0 || i === 0 || i === data.length - 1 ? (
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" fill="var(--ink-subtle)" fontFamily="JetBrains Mono" fontSize="9">
                {Number(d.date.slice(8, 10))}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
