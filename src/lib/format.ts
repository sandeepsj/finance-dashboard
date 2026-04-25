// INR + date helpers transcribed from docs/design/project/tokens.js.
// Indian grouping: 12,34,567 (last 3 digits, then groups of 2).

export interface FormatINROptions {
  compact?: boolean;
  decimals?: number;
}

export function formatINR(n: number | null | undefined, opts: FormatINROptions = {}): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  if (opts.compact) {
    if (abs >= 1e7) return sign + '₹' + (abs / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (abs >= 1e5) return sign + '₹' + (abs / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
    if (abs >= 1e3) return sign + '₹' + (abs / 1e3).toFixed(1).replace(/\.?0$/, '') + 'k';
  }

  const fixed = abs.toFixed(opts.decimals != null ? opts.decimals : 0);
  const parts = fixed.split('.');
  const intPart = parts[0];
  const last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest ? rest + ',' + last3 : last3;
  const out = '₹' + grouped + (parts[1] ? '.' + parts[1] : '');
  return sign + out;
}

export interface FormatDateOptions {
  short?: boolean;
}

export function formatDate(iso: string | null | undefined, opts: FormatDateOptions = {}): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (opts.short) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return dd + ' ' + months[d.getMonth()] + ' ' + String(yyyy).slice(2);
  }
  return dd + '/' + mm + '/' + yyyy;
}

export function formatPercent(n: number | null | undefined, decimals = 1): string {
  if (n == null || isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(decimals) + '%';
}
