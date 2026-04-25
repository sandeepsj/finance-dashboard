interface DonutSeg {
  value: number;
  color: string;
  label: string;
}

interface PortfolioDonutProps {
  segments: DonutSeg[];
  size?: number;
  thickness?: number;
}

/** Pure SVG donut. Each segment fills its share of the circumference. */
export function PortfolioDonut({ segments, size = 130, thickness = 18 }: PortfolioDonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--divider)" strokeWidth={thickness} />
      {total > 0 &&
        segments.map((seg, i) => {
          const start = (acc / total) * Math.PI * 2;
          acc += seg.value;
          const end = (acc / total) * Math.PI * 2;
          const x0 = cx + r * Math.sin(start);
          const y0 = cy - r * Math.cos(start);
          const x1 = cx + r * Math.sin(end);
          const y1 = cy - r * Math.cos(end);
          const largeArc = end - start > Math.PI ? 1 : 0;
          return (
            <path
              key={i}
              d={`M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
            />
          );
        })}
    </svg>
  );
}
