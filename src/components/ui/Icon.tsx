// Stroked 16px icons transcribed from docs/design/project/primitives.jsx.
import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function ArrowRight({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
export function Plus({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}
export function Upload({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M8 11V3M5 6l3-3 3 3M3 13h10" />
    </svg>
  );
}
export function Doc({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M3.5 2h6L13 5.5V14H3.5zM9 2v4h4" />
    </svg>
  );
}
export function Search({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m13 13-2.5-2.5" />
    </svg>
  );
}
export function Lock({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <rect x="3.5" y="7" width="9" height="6" rx="1" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
export function Spark({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2 2M10 10l2 2M4 12l2-2M10 6l2-2" />
    </svg>
  );
}
export function Drive({ size = 14, className, style }: IconProps) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M5 3h6l3 6-3 4H5L2 9zM5 3l3 6h6M11 3l-3 6-3-6" />
    </svg>
  );
}
