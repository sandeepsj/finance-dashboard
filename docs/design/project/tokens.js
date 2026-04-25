// tokens.js — design tokens for the finance-dashboard system.
// Loaded as a plain script (no Babel), so this file uses ES5-safe syntax
// and exports onto window.

(function () {
  // Light theme: warm off-white, near-black ink, muted forest accent.
  // Dark theme: warm-cool charcoal, parchment ink, lifted forest accent.
  // All colors authored in oklch for perceptual consistency, then we
  // use them directly (modern browsers support oklch in CSS).

  var light = {
    name: 'light',
    // surfaces
    bg:        'oklch(98.5% 0.005 80)',     // page (warm off-white)
    surface:   'oklch(99.5% 0.004 80)',     // raised card
    surfaceAlt:'oklch(96.5% 0.006 80)',     // sunken / striped
    border:    'oklch(89% 0.008 80)',
    borderStrong:'oklch(80% 0.010 80)',
    divider:   'oklch(93% 0.006 80)',
    // ink
    ink:       'oklch(20% 0.010 80)',
    inkMuted:  'oklch(45% 0.010 80)',
    inkSubtle: 'oklch(60% 0.010 80)',
    inkOnAccent:'oklch(98% 0.005 150)',
    // accent (muted forest)
    accent:    'oklch(48% 0.085 150)',
    accentHover:'oklch(43% 0.085 150)',
    accentSoft:'oklch(94% 0.030 150)',
    accentInk: 'oklch(35% 0.085 150)',
    // semantics
    gain:      'oklch(50% 0.110 145)',      // green
    gainSoft:  'oklch(94% 0.040 145)',
    loss:      'oklch(54% 0.150 28)',       // warm red
    lossSoft:  'oklch(94% 0.045 28)',
    warn:      'oklch(64% 0.130 75)',       // amber
    warnSoft:  'oklch(95% 0.050 75)',
    info:      'oklch(54% 0.090 240)',      // slate-blue
    infoSoft:  'oklch(94% 0.030 240)',
    pending:   'oklch(55% 0.020 80)',       // warm slate
    pendingSoft:'oklch(93% 0.010 80)',
    // chart series (5)
    s1:'oklch(48% 0.085 150)',
    s2:'oklch(54% 0.090 240)',
    s3:'oklch(60% 0.110 75)',
    s4:'oklch(54% 0.110 28)',
    s5:'oklch(50% 0.080 300)',
  };

  var dark = {
    name: 'dark',
    bg:        'oklch(16% 0.008 80)',
    surface:   'oklch(20% 0.010 80)',
    surfaceAlt:'oklch(23% 0.010 80)',
    border:    'oklch(28% 0.010 80)',
    borderStrong:'oklch(36% 0.012 80)',
    divider:   'oklch(25% 0.010 80)',
    ink:       'oklch(95% 0.008 80)',
    inkMuted:  'oklch(70% 0.010 80)',
    inkSubtle: 'oklch(55% 0.010 80)',
    inkOnAccent:'oklch(98% 0.005 150)',
    accent:    'oklch(62% 0.110 150)',
    accentHover:'oklch(68% 0.110 150)',
    accentSoft:'oklch(28% 0.040 150)',
    accentInk: 'oklch(85% 0.080 150)',
    gain:      'oklch(70% 0.150 145)',
    gainSoft:  'oklch(28% 0.060 145)',
    loss:      'oklch(68% 0.170 28)',
    lossSoft:  'oklch(28% 0.060 28)',
    warn:      'oklch(74% 0.140 75)',
    warnSoft:  'oklch(28% 0.060 75)',
    info:      'oklch(70% 0.110 240)',
    infoSoft:  'oklch(26% 0.040 240)',
    pending:   'oklch(65% 0.015 80)',
    pendingSoft:'oklch(26% 0.010 80)',
    s1:'oklch(62% 0.110 150)',
    s2:'oklch(70% 0.110 240)',
    s3:'oklch(74% 0.140 75)',
    s4:'oklch(68% 0.140 28)',
    s5:'oklch(64% 0.110 300)',
  };

  // Type — Inter for UI, JetBrains Mono for numbers / codes / masks.
  var type = {
    sans: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    // scale (px, line-height)
    display:   { size: 40, lh: 1.05, weight: 600, tracking: '-0.02em' }, // hero numbers
    title:     { size: 28, lh: 1.15, weight: 600, tracking: '-0.015em'},
    heading:   { size: 20, lh: 1.25, weight: 600, tracking: '-0.01em' },
    subheading:{ size: 16, lh: 1.35, weight: 600, tracking: '-0.005em'},
    body:      { size: 14, lh: 1.50, weight: 400, tracking: '0' },
    bodySm:    { size: 13, lh: 1.45, weight: 400, tracking: '0' },
    caption:   { size: 12, lh: 1.40, weight: 500, tracking: '0.005em' },
    micro:     { size: 11, lh: 1.30, weight: 500, tracking: '0.04em' },  // ALL-CAPS labels
    metric:    { size: 32, lh: 1.10, weight: 500, tracking: '-0.02em' }, // mono
    metricSm:  { size: 18, lh: 1.20, weight: 500, tracking: '-0.01em' }, // mono
  };

  // Spacing — 4px base. Kept tight for finance-density.
  var space = { 0:0, 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 7:32, 8:40, 9:48, 10:64 };

  // Radius — chosen 6px; expose ladder.
  var radius = { none: 0, sm: 4, md: 6, lg: 10, xl: 14, pill: 999 };

  // Elevation — soft, warm-tinted shadows.
  var elev = {
    0: 'none',
    1: '0 1px 2px rgba(40,30,15,0.04), 0 1px 0 rgba(40,30,15,0.02)',
    2: '0 2px 6px rgba(40,30,15,0.06), 0 1px 2px rgba(40,30,15,0.04)',
    3: '0 8px 24px rgba(40,30,15,0.08), 0 2px 6px rgba(40,30,15,0.05)',
    4: '0 20px 48px rgba(40,30,15,0.14), 0 4px 12px rgba(40,30,15,0.06)',
  };

  var elevDark = {
    0: 'none',
    1: '0 1px 0 rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    2: '0 2px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    3: '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)',
    4: '0 20px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
  };

  // INR + date helpers (Indian grouping: 12,34,567).
  function formatINR(n, opts) {
    opts = opts || {};
    if (n == null || isNaN(n)) return '—';
    var sign = n < 0 ? '-' : '';
    var abs = Math.abs(n);
    if (opts.compact) {
      if (abs >= 1e7) return sign + '₹' + (abs / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
      if (abs >= 1e5) return sign + '₹' + (abs / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
      if (abs >= 1e3) return sign + '₹' + (abs / 1e3).toFixed(1).replace(/\.?0$/, '') + 'k';
    }
    var fixed = abs.toFixed(opts.decimals != null ? opts.decimals : 0);
    var parts = fixed.split('.');
    var intPart = parts[0];
    // Indian grouping: last 3 then groups of 2
    var last3 = intPart.slice(-3);
    var rest = intPart.slice(0, -3);
    if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    var grouped = rest ? rest + ',' + last3 : last3;
    var out = '₹' + grouped + (parts[1] ? '.' + parts[1] : '');
    return sign + out;
  }

  function formatDate(iso, opts) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    if (opts && opts.short) {
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return dd + ' ' + months[d.getMonth()] + ' ' + String(yyyy).slice(2);
    }
    return dd + '/' + mm + '/' + yyyy;
  }

  function formatPercent(n, decimals) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(decimals != null ? decimals : 1) + '%';
  }

  window.FDTokens = {
    light: light,
    dark: dark,
    type: type,
    space: space,
    radius: radius,
    elev: elev,
    elevDark: elevDark,
    formatINR: formatINR,
    formatDate: formatDate,
    formatPercent: formatPercent,
  };
})();
