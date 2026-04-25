// savings.jsx — Savings page artboards.
// Five views:
//   SavingsIndex          — desktop landing, all instruments grouped by type
//   SavingsDetailMarket   — market-linked detail (PPFAS Flexi Cap)
//   SavingsDetailTraditional — LIC Jeevan Anand traditional endowment
//   SavingsDetailFixed    — PPF (fixed-return)
//   SavingsMobile         — phone version of index

const TS = window.FDTokens;
const ALL_INSTR = window.SAVINGS_INSTRUMENTS;
const SAV_GROUPS = window.SAVINGS_GROUPS;
const savAgg = window.savingsPortfolioAgg;

function tks(theme) { return theme === 'dark' ? TS.dark : TS.light; }

// ─── helpers ───────────────────────────────────────────────────────────────
function sectionLabel(theme) {
  return {
    fontSize: 11, fontWeight: 600, color: tks(theme).inkMuted,
    letterSpacing: '0.05em', textTransform: 'uppercase',
    fontFamily: TS.type.sans,
  };
}

function findInstr(id) { return ALL_INSTR.find(i => i.id === id); }

// ─── Mini sparkline w/ contribution underlay ───────────────────────────────
function GrowthSpark({ theme, value, contrib, width = 100, height = 30, color }) {
  const tk = tks(theme);
  const c = color || tk.accent;
  const all = [...value, ...contrib];
  const min = Math.min(...all), max = Math.max(...all);
  const range = max - min || 1;
  const stepX = width / (value.length - 1);
  const ptsV = value.map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`);
  const ptsC = contrib.map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={'M' + ptsC.join(' L')} fill="none" stroke={tk.borderStrong} strokeWidth="1" strokeDasharray="2 2" />
      <path d={'M' + ptsV.join(' L')} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Donut for portfolio composition ───────────────────────────────────────
function PortfolioDonut({ theme, agg, size = 180, thickness = 22 }) {
  const tk = tks(theme);
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  const total = agg.totalValue;
  let acc = 0;
  const arcs = agg.byType.map((seg) => {
    const start = (acc / total) * Math.PI * 2;
    acc += seg.value;
    const end = (acc / total) * Math.PI * 2;
    const x0 = cx + r * Math.sin(start);
    const y0 = cy - r * Math.cos(start);
    const x1 = cx + r * Math.sin(end);
    const y1 = cy - r * Math.cos(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return { d: `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`, color: tk[seg.accentKey] || tk.accent };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={tk.divider} strokeWidth={thickness} />
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={thickness} strokeLinecap="butt" />
      ))}
    </svg>
  );
}

// ─── Compact instrument row (for index page lists) ─────────────────────────
function InstrumentRow({ theme, instr, onClick }) {
  const tk = tks(theme);
  const i = instr;
  const totalReturn = i.currentValue - i.investedReal;
  const returnPct = (totalReturn / i.investedReal) * 100;
  const isFixed = i.layout === 'fixed';
  const isTrad = i.layout === 'traditional';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1.6fr 1fr 1fr 1fr 110px',
        alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderBottom: `1px solid ${tk.divider}`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: TS.radius.sm,
        background: tk[i.accentKey] || tk.accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: TS.type.mono, fontSize: 14, fontWeight: 600,
      }}>{i.icon}</div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.short}</span>
          {i.flag && <Badge theme={theme} tone="warn" dot>{i.flag}</Badge>}
        </div>
        <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono }}>
          {i.type}
          {i.sipAmount > 0 && <> · SIP {TS.formatINR(i.sipAmount)}/mo</>}
          {i.annualPremium > 0 && <> · ₹{(i.annualPremium / 1000).toFixed(0)}k/yr</>}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: TS.type.mono, fontSize: 14, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
          {TS.formatINR(i.currentValue)}
        </div>
        <div style={{ fontFamily: TS.type.mono, fontSize: 10, color: tk.inkSubtle, fontVariantNumeric: 'tabular-nums' }}>
          invested {TS.formatINR(i.investedReal, { compact: true })}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        {isFixed || isTrad ? (
          <>
            <div style={{ fontFamily: TS.type.mono, fontSize: 13, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
              {i.interestRate ? i.interestRate.toFixed(2) + '%' : (i.estimatedIRR ? i.estimatedIRR.toFixed(1) + '%' : '—')}
            </div>
            <div style={{ fontSize: 10, color: tk.inkSubtle }}>
              {isTrad ? 'est. IRR' : 'guaranteed'}
            </div>
          </>
        ) : (
          <>
            <Delta theme={theme} value={i.xirr} size={13} />
            <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TS.type.mono, marginTop: 2 }}>XIRR</div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'right' }}>
        {isFixed || isTrad ? (
          <>
            <div style={{ fontFamily: TS.type.mono, fontSize: 12, color: tk.inkMuted, fontVariantNumeric: 'tabular-nums' }}>
              yr {i.yearsPaid}/{i.yearsTotal}
            </div>
            <div style={{ fontSize: 10, color: tk.inkSubtle }}>
              matures {(i.horizon || '').match(/\d{4}/) ? (i.horizon).match(/\d{2}\/\d{2}\/\d{4}/)?.[0] : '—'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: TS.type.mono, fontSize: 12, color: tk.inkMuted, fontVariantNumeric: 'tabular-nums' }}>
              {(returnPct >= 0 ? '+' : '') + TS.formatINR(totalReturn, { compact: true })}
            </div>
            <div style={{ fontSize: 10, color: tk.inkSubtle }}>
              abs. {(returnPct >= 0 ? '+' : '') + returnPct.toFixed(1) + '%'}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!isFixed && !isTrad && i.series && (
          <Sparkline theme={theme} data={i.series} width={100} height={28} color={i.xirr >= 0 ? tk.gain : tk.loss} />
        )}
        {(isFixed || isTrad) && (
          <div style={{ width: 100 }}>
            <Progress theme={theme} value={i.yearsPaid} max={i.yearsTotal} tone="accent" height={4} />
            <div style={{ fontSize: 9, color: tk.inkSubtle, fontFamily: TS.type.mono, marginTop: 4, textAlign: 'right' }}>
              {((i.yearsPaid / i.yearsTotal) * 100).toFixed(0)}% to maturity
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SavingsIndex ──────────────────────────────────────────────────────────
function SavingsIndex({ theme = 'light' }) {
  const tk = tks(theme);
  const agg = savAgg(ALL_INSTR);

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TS.type.sans, display: 'flex', height: '100%', minWidth: 0 }} data-screen-label="Savings · index">
      <SideNav theme={theme} active="Savings" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar theme={theme} title="Savings" subtitle={`${agg.count} instruments · ${TS.formatINR(agg.monthlyOut)}/mo SIPs · ${TS.formatINR(agg.annualPremiums, { compact: true })}/yr premiums`} period="Apr 2026" />

        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>

          {/* HERO STRIP — totals + donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 12 }}>
            <Card theme={theme} padding={18} style={{ display: 'flex', gap: 18, alignItems: 'center', minWidth: 0 }}>
              <PortfolioDonut theme={theme} agg={agg} size={130} thickness={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Total savings · current value</div>
                <div style={{ fontFamily: TS.type.mono, fontSize: 36, fontWeight: 500, color: tk.ink, letterSpacing: '-0.025em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                  {TS.formatINR(agg.totalValue)}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, fontSize: 12, color: tk.inkMuted }}>
                  <span>invested <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{TS.formatINR(agg.totalInvested)}</span></span>
                  <span>·</span>
                  <Delta theme={theme} value={(agg.totalReturn / agg.totalInvested) * 100} size={12} />
                  <span style={{ fontFamily: TS.type.mono }}>({TS.formatINR(agg.totalReturn, { compact: true })})</span>
                </div>
              </div>
            </Card>

            <KPICard
              theme={theme}
              label="Monthly SIPs"
              value={TS.formatINR(agg.monthlyOut)}
              footer={`${ALL_INSTR.filter(i => i.sipAmount > 0).length} active`}
              accent={tk.accent}
            />
            <KPICard
              theme={theme}
              label="Annual premiums"
              value={TS.formatINR(agg.annualPremiums, { compact: true })}
              footer="HDFC Life · LIC"
              accent={tk.s2}
            />
            <KPICard
              theme={theme}
              label="Next premium due"
              value="12 May"
              footer="LIC · ₹57,520"
              accent={tk.warn}
            />
          </div>

          {/* GROUPS — each with its own list */}
          {SAV_GROUPS.map((grp) => {
            const items = ALL_INSTR.filter(grp.filter);
            if (items.length === 0) return null;
            const grpValue = items.reduce((s, i) => s + i.currentValue, 0);
            const grpInvested = items.reduce((s, i) => s + i.investedReal, 0);
            const grpReturn = grpValue - grpInvested;
            return (
              <Card key={grp.id} theme={theme} padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `1px solid ${tk.border}` }}>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 3 }}>{grp.label} · {items.length}</div>
                    <div style={{ fontSize: 12, color: tk.inkMuted }}>{grp.subtitle}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, fontSize: 12, color: tk.inkMuted }}>
                    <span>value <span style={{ fontFamily: TS.type.mono, color: tk.ink, fontWeight: 500 }}>{TS.formatINR(grpValue)}</span></span>
                    <span>invested <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{TS.formatINR(grpInvested, { compact: true })}</span></span>
                    <span><Delta theme={theme} value={(grpReturn / grpInvested) * 100} size={12} /></span>
                  </div>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '32px 1.6fr 1fr 1fr 1fr 110px',
                  padding: '0 16px', height: 28, alignItems: 'center', gap: 14,
                  background: tk.surfaceAlt, borderBottom: `1px solid ${tk.border}`,
                  fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  <div />
                  <div>Instrument</div>
                  <div style={{ textAlign: 'right' }}>Value · invested</div>
                  <div style={{ textAlign: 'right' }}>Return / rate</div>
                  <div style={{ textAlign: 'right' }}>Tenure / abs.</div>
                  <div style={{ textAlign: 'right' }}>Trend</div>
                </div>
                {items.map((i) => <InstrumentRow key={i.id} theme={theme} instr={i} />)}
              </Card>
            );
          })}

          {/* footer add-button */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
            <Button theme={theme} variant="secondary" size="md" leadingIcon={Icon.plus(14)}>Add an instrument</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL PAGE shared chrome
// ============================================================================
function DetailHeader({ theme, instr, kindBadge }) {
  const tk = tks(theme);
  const i = instr;
  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${tk.border}`, background: tk.bg, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: tk.inkSubtle, fontFamily: TS.type.mono }}>
        <span>Savings</span>
        <span>›</span>
        <span style={{ color: tk.inkMuted }}>{kindBadge}</span>
        <span>›</span>
        <span style={{ color: tk.ink }}>{i.short}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: TS.radius.md,
            background: tk[i.accentKey], color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: TS.type.mono, fontSize: 20, fontWeight: 600,
          }}>{i.icon}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: tk.ink, letterSpacing: '-0.015em', lineHeight: 1.15 }}>{i.name}</div>
            <div style={{ fontSize: 12, color: tk.inkMuted, marginTop: 3, fontFamily: TS.type.mono }}>
              {i.type} · {i.folio} · started {i.started}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button theme={theme} variant="secondary" size="sm" leadingIcon={Icon.upload(13)}>Upload statement</Button>
          <Button theme={theme} variant="ghost" size="sm">Edit</Button>
          <Button theme={theme} variant="ghost" size="sm">···</Button>
        </div>
      </div>
    </div>
  );
}

// Premium / SIP schedule strip (12 month grid)
function ScheduleStrip({ theme, instr }) {
  const tk = tks(theme);
  const sched = instr.schedule || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={sectionLabel(theme)}>{instr.sipAmount > 0 ? 'SIP schedule' : 'Premium schedule'}</div>
        <div style={{ fontSize: 11, color: tk.inkSubtle, fontFamily: TS.type.mono }}>● paid  ◯ scheduled</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
        {sched.map((m) => {
          const isPremium = m.amount > 0;
          const isPaid = m.status === 'paid';
          const isSched = m.status === 'scheduled';
          return (
            <div key={m.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '10px 6px',
              background: isPaid ? tk.surfaceAlt : tk.surface,
              border: `1px solid ${isSched ? tk[instr.accentKey] : tk.divider}`,
              borderStyle: isSched ? 'dashed' : 'solid',
              borderRadius: TS.radius.sm,
            }}>
              <span style={{ fontSize: 10, fontFamily: TS.type.mono, color: tk.inkSubtle, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.short} '{String(m.y).padStart(2, '0')}</span>
              {isPremium ? (
                <>
                  <span style={{
                    width: 10, height: 10, borderRadius: 999,
                    background: isPaid ? tk[instr.accentKey] : 'transparent',
                    border: isPaid ? 'none' : `1.5px solid ${tk[instr.accentKey]}`,
                  }} />
                  <span style={{ fontSize: 10, fontFamily: TS.type.mono, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {m.amount >= 1000 ? Math.round(m.amount / 1000) + 'k' : m.amount}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: tk.divider }} />
                  <span style={{ fontSize: 10, color: tk.inkSubtle }}>—</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Statements list
function StatementsList({ theme, instr }) {
  const tk = tks(theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={sectionLabel(theme)}>Statements & receipts</div>
        <Button theme={theme} variant="ghost" size="sm" leadingIcon={Icon.upload(13)}>Upload</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {instr.statements.map((st, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: TS.radius.sm,
          }}>
            <span style={{ color: tk.inkMuted }}>{Icon.doc(14, tk.inkMuted)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: tk.ink }}>{st.period}</div>
              <div style={{ fontSize: 10, fontFamily: TS.type.mono, color: tk.inkSubtle, marginTop: 1 }}>uploaded {st.uploaded}</div>
            </div>
            <Badge theme={theme} tone={st.parsed === true ? 'gain' : 'pending'} dot>{st.parsed === true ? 'Parsed' : 'Pending'}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// Detail metadata block (right rail)
function MetaBlock({ theme, items }) {
  const tk = tks(theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: '10px 0',
          borderBottom: i < items.length - 1 ? `1px solid ${tk.divider}` : 'none',
        }}>
          <div style={{ fontSize: 10, fontFamily: TS.type.mono, color: tk.inkSubtle, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{it.label}</div>
          <div style={{ fontSize: 12, color: tk.ink, fontFamily: it.mono ? TS.type.mono : TS.type.sans, fontVariantNumeric: 'tabular-nums', lineHeight: 1.4 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SavingsDetailMarket — PPFAS / mutual fund with NAV chart, XIRR, units
// ============================================================================
function SavingsDetailMarket({ theme = 'light', instrumentId = 'ppfas' }) {
  const tk = tks(theme);
  const i = findInstr(instrumentId);
  if (!i) return null;
  const totalReturn = i.currentValue - i.investedReal;

  // build "value vs invested" series for projection chart
  const projData = i.series.map((v, idx) => ({
    year: idx,
    value: v,
  }));

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TS.type.sans, display: 'flex', height: '100%', minWidth: 0 }} data-screen-label={`Savings · ${i.short}`}>
      <SideNav theme={theme} active="Savings" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <DetailHeader theme={theme} instr={i} kindBadge="Mutual fund" />

        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>

          {/* main column / right rail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>

            {/* MAIN COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

              {/* hero metrics */}
              <Card theme={theme} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Current value</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 36, fontWeight: 500, color: tk.ink, letterSpacing: '-0.025em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                      {TS.formatINR(i.currentValue)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 6 }}>
                      <Delta theme={theme} value={(totalReturn / i.investedReal) * 100} size={13} />
                      <span style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono }}>
                        {(totalReturn >= 0 ? '+' : '') + TS.formatINR(totalReturn, { compact: true })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Invested</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                      {TS.formatINR(i.investedReal)}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono, marginTop: 4 }}>
                      {Math.round(i.investedReal / i.sipAmount)} SIPs · {i.monthsActive} months
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>XIRR</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: i.xirr >= 0 ? tk.gain : tk.loss, fontVariantNumeric: 'tabular-nums' }}>
                      {(i.xirr >= 0 ? '+' : '') + i.xirr.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono, marginTop: 4 }}>
                      since {i.started}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Units / NAV</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                      {i.units.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono, marginTop: 4 }}>
                      NAV ₹{i.nav.toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* chart card */}
              <Card theme={theme} padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tk.divider}` }}>
                  <div>
                    <div style={sectionLabel(theme)}>Value vs invested</div>
                    <div style={{ fontSize: 12, color: tk.inkMuted, marginTop: 2 }}>Solid: market value · dashed: cumulative contributions</div>
                  </div>
                  <Tabs theme={theme} items={['1Y', '3Y', '5Y', 'Since SIP']} active="Since SIP" />
                </div>
                <div style={{ padding: 12 }}>
                  {/* dual line chart - inline SVG */}
                  <DualLineChart theme={theme} value={i.series} contrib={i.contribSeries} width={780} height={230} />
                  <div style={{ display: 'flex', gap: 18, fontSize: 11, color: tk.inkMuted, padding: '4px 8px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 2, background: tk[i.accentKey], borderRadius: 1 }} /> Market value
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 0, borderBottom: `1.5px dashed ${tk.borderStrong}` }} /> Invested capital
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: TS.type.mono }}>
                      {i.last1y >= 0 ? '+' : ''}{(i.last1y * 100).toFixed(1)}% 1Y · {i.last3y >= 0 ? '+' : ''}{(i.last3y * 100).toFixed(1)}% 3Y avg
                    </span>
                  </div>
                </div>
              </Card>

              {/* schedule strip */}
              <Card theme={theme} padding={18}>
                <ScheduleStrip theme={theme} instr={i} />
              </Card>

            </div>

            {/* RIGHT RAIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>SIP details</div>
                <MetaBlock theme={theme} items={[
                  { label: 'Amount', value: TS.formatINR(i.sipAmount) + ' / month', mono: true },
                  { label: 'Day', value: 'day ' + i.sipDay + ' of every month', mono: true },
                  { label: 'Folio', value: i.folio, mono: true },
                  { label: 'Plan', value: i.holding },
                  { label: 'Horizon', value: i.horizon },
                ]} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <Button theme={theme} variant="secondary" size="sm" style={{ flex: 1 }}>Pause SIP</Button>
                  <Button theme={theme} variant="secondary" size="sm" style={{ flex: 1 }}>Top-up</Button>
                </div>
              </Card>

              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Performance</div>
                <MetaBlock theme={theme} items={[
                  { label: '1 year', value: (i.last1y >= 0 ? '+' : '') + (i.last1y * 100).toFixed(1) + '%', mono: true },
                  { label: '3 years (annualised)', value: (i.last3y >= 0 ? '+' : '') + (i.last3y * 100).toFixed(1) + '%', mono: true },
                  { label: 'Since inception', value: (i.xirr >= 0 ? '+' : '') + i.xirr.toFixed(1) + '% XIRR', mono: true },
                  { label: 'Expense ratio', value: i.expenseRatio.toFixed(2) + '%', mono: true },
                ]} />
              </Card>

              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Tax · risk · exit</div>
                <MetaBlock theme={theme} items={[
                  { label: 'Tax', value: i.taxNote },
                  { label: 'Risk', value: i.riskLevel },
                  { label: 'Lock-in', value: i.lockIn },
                  { label: 'Exit load', value: i.exitLoad },
                  { label: 'Nominee', value: i.nominee },
                ]} />
              </Card>

              <Card theme={theme} padding={18}>
                <StatementsList theme={theme} instr={i} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// helper: dual line chart (value + dashed invested) — used by market detail
function DualLineChart({ theme, value, contrib, width = 600, height = 220 }) {
  const tk = tks(theme);
  const padL = 50, padR = 12, padT = 14, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const all = [...value, ...contrib, 0];
  const min = 0;
  const max = Math.max(...all);
  const stepX = innerW / (value.length - 1);
  const ptsV = value.map((v, i) => `${(padL + i * stepX).toFixed(2)},${(padT + innerH - ((v - min) / (max - min)) * innerH).toFixed(2)}`);
  const ptsC = contrib.map((v, i) => `${(padL + i * stepX).toFixed(2)},${(padT + innerH - ((v - min) / (max - min)) * innerH).toFixed(2)}`);
  const fillPath = 'M' + ptsV.join(' L') + ` L${padL + (value.length - 1) * stepX},${padT + innerH} L${padL},${padT + innerH} Z`;
  const fillId = `dl-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={tk.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={tk.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + innerH * t;
        const v = max * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={tk.divider} strokeDasharray="2 3" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fill={tk.inkSubtle} fontFamily={TS.type.mono} fontSize="9">
              {v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : v >= 1e5 ? (v / 1e5).toFixed(1) + 'L' : Math.round(v / 1000) + 'k'}
            </text>
          </g>
        );
      })}
      <path d={fillPath} fill={`url(#${fillId})`} />
      <path d={'M' + ptsC.join(' L')} fill="none" stroke={tk.borderStrong} strokeWidth="1.25" strokeDasharray="3 3" />
      <path d={'M' + ptsV.join(' L')} fill="none" stroke={tk.accent} strokeWidth="1.75" strokeLinejoin="round" />
      {/* x labels: every ~12 months */}
      {value.map((v, i) => {
        if (i === 0 || i === value.length - 1 || i % 12 === 0) {
          return <text key={i} x={padL + i * stepX} y={height - 8} textAnchor="middle" fill={tk.inkSubtle} fontFamily={TS.type.mono} fontSize="9">M{i}</text>;
        }
        return null;
      })}
    </svg>
  );
}

// ============================================================================
// SavingsDetailTraditional — LIC Jeevan Anand
// ============================================================================
function SavingsDetailTraditional({ theme = 'light', instrumentId = 'lic' }) {
  const tk = tks(theme);
  const i = findInstr(instrumentId);
  if (!i) return null;

  const yearsLeft = i.yearsTotal - i.yearsPaid;
  const premiumsRemaining = yearsLeft;
  const totalPremiums = i.annualPremium * i.yearsTotal;

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TS.type.sans, display: 'flex', height: '100%', minWidth: 0 }} data-screen-label="Savings · LIC Jeevan Anand">
      <SideNav theme={theme} active="Savings" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <DetailHeader theme={theme} instr={i} kindBadge="Traditional insurance" />

        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>

            {/* MAIN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

              {/* hero — protection + savings narrative */}
              <Card theme={theme} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Sum assured</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 32, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {TS.formatINR(i.sumAssured)}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 4 }}>Death benefit + lifetime cover after maturity</div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Bonus accrued</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 32, fontWeight: 500, color: tk.gain, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      +{TS.formatINR(i.bonusAccrued, { compact: true })}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 4 }}>Reversionary bonus · {i.yearsPaid} years</div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Expected at maturity</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 32, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {TS.formatINR(i.expectedMaturity, { compact: true })}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 4 }}>≈ {i.estimatedIRR}% est. IRR · 12/05/2039</div>
                  </div>
                </div>

                {/* Premium progress bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: `1px solid ${tk.divider}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tk.inkMuted }}>
                    <span>{i.yearsPaid} of {i.yearsTotal} premiums paid</span>
                    <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{TS.formatINR(i.investedReal, { compact: true })} of {TS.formatINR(totalPremiums, { compact: true })}</span>
                  </div>
                  <div style={{ display: 'flex', height: 10, background: tk.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(i.yearsPaid / i.yearsTotal) * 100}%`, background: tk[i.accentKey] }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tk.inkSubtle, fontFamily: TS.type.mono }}>
                    <span>2018 · started</span>
                    <span>{premiumsRemaining} years remaining</span>
                    <span>2039 · matures</span>
                  </div>
                </div>
              </Card>

              {/* Three-state timeline: Paid up · Surrender · Maturity */}
              <Card theme={theme} padding={20}>
                <div style={{ ...sectionLabel(theme), marginBottom: 14 }}>If you stop now · scenarios</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <ScenarioCell theme={theme} label="Paid-up value" value={i.paidUpValue} note="Stop premiums; reduced sum assured at maturity" tone="warn" />
                  <ScenarioCell theme={theme} label="Surrender value" value={i.surrenderValue} note="Cash now; policy terminates" tone="loss" />
                  <ScenarioCell theme={theme} label="Continue · maturity" value={i.expectedMaturity} note={`Pay ${premiumsRemaining} more years; get full benefit`} tone="gain" highlight />
                </div>
              </Card>

              {/* Premium schedule (annual — only shows the 1 month/yr) */}
              <Card theme={theme} padding={18}>
                <ScheduleStrip theme={theme} instr={i} />
                <div style={{ marginTop: 12, padding: 12, background: tk.warnSoft, borderRadius: TS.radius.sm, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge theme={theme} tone="warn" dot>Reminder</Badge>
                  <span style={{ fontSize: 12, color: tk.ink }}>Next premium of <span style={{ fontFamily: TS.type.mono, fontWeight: 600 }}>{TS.formatINR(i.annualPremium)}</span> due <span style={{ fontFamily: TS.type.mono, fontWeight: 600 }}>{i.nextPremium}</span> · 16 days</span>
                </div>
              </Card>

            </div>

            {/* RIGHT RAIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Policy details</div>
                <MetaBlock theme={theme} items={[
                  { label: 'Plan', value: i.holding },
                  { label: 'Policy number', value: i.folio, mono: true },
                  { label: 'Premium', value: TS.formatINR(i.annualPremium) + ' / year', mono: true },
                  { label: 'Mode', value: 'Annual · ECS auto-debit' },
                  { label: 'Term', value: `${i.yearsTotal} years (${i.started.slice(6)}–2039)`, mono: true },
                ]} />
              </Card>

              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Bonus history</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { yr: 'FY26', amount: 27200, rate: '40/1000' },
                    { yr: 'FY25', amount: 25800, rate: '40/1000' },
                    { yr: 'FY24', amount: 24600, rate: '38/1000' },
                    { yr: 'FY23', amount: 23400, rate: '38/1000' },
                  ].map((b) => (
                    <div key={b.yr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${tk.divider}` }}>
                      <span style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono }}>{b.yr}</span>
                      <span style={{ fontFamily: TS.type.mono, fontSize: 12, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>+{TS.formatINR(b.amount)}</span>
                      <span style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TS.type.mono }}>{b.rate}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Tax · nominee</div>
                <MetaBlock theme={theme} items={[
                  { label: 'Tax', value: i.taxNote },
                  { label: 'Risk', value: i.riskLevel },
                  { label: 'Lock-in', value: i.lockIn },
                  { label: 'Nominee', value: i.nominee },
                ]} />
              </Card>

              <Card theme={theme} padding={18}>
                <StatementsList theme={theme} instr={i} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioCell({ theme, label, value, note, tone, highlight }) {
  const tk = tks(theme);
  const colors = { warn: tk.warn, loss: tk.loss, gain: tk.gain };
  const softs = { warn: tk.warnSoft, loss: tk.lossSoft, gain: tk.gainSoft };
  return (
    <div style={{
      padding: 14,
      background: highlight ? softs[tone] : tk.surfaceAlt,
      border: `1px solid ${highlight ? colors[tone] : tk.divider}`,
      borderRadius: TS.radius.md,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: colors[tone], letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
        {TS.formatINR(value, { compact: true })}
      </div>
      <div style={{ fontSize: 11, color: tk.inkMuted, lineHeight: 1.4 }}>{note}</div>
    </div>
  );
}

// ============================================================================
// SavingsDetailFixed — PPF
// ============================================================================
function SavingsDetailFixed({ theme = 'light', instrumentId = 'ppf' }) {
  const tk = tks(theme);
  const i = findInstr(instrumentId);
  if (!i) return null;
  const yearsLeft = i.yearsTotal - i.yearsPaid;

  // Build a 15-year contribution + interest projection for chart
  const yearByYear = [];
  let bal = 0;
  for (let y = 0; y <= i.yearsTotal; y++) {
    if (y > 0) {
      bal = bal + i.annualContrib;
      bal = bal * (1 + i.interestRate / 100);
    }
    yearByYear.push({ year: y, value: Math.round(bal), contrib: y * i.annualContrib });
  }

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TS.type.sans, display: 'flex', height: '100%', minWidth: 0 }} data-screen-label="Savings · PPF">
      <SideNav theme={theme} active="Savings" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <DetailHeader theme={theme} instr={i} kindBadge="Government · PPF" />

        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>

            {/* MAIN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

              {/* hero metrics */}
              <Card theme={theme} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Current balance</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 36, fontWeight: 500, color: tk.ink, letterSpacing: '-0.025em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                      {TS.formatINR(i.currentValue)}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 6 }}>
                      principal <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{TS.formatINR(i.investedReal, { compact: true })}</span> + interest <span style={{ fontFamily: TS.type.mono, color: tk.gain }}>+{TS.formatINR(i.accruedInterest, { compact: true })}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Interest rate</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: tk.gain, fontVariantNumeric: 'tabular-nums' }}>
                      {i.interestRate.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, marginTop: 4 }}>{i.interestRateNote}</div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>This year (FY26)</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                      {TS.formatINR(i.annualContrib, { compact: true })}
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono, marginTop: 4 }}>
                      of {TS.formatINR(i.annualLimit, { compact: true })} ceiling
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel(theme), marginBottom: 6 }}>Matures</div>
                    <div style={{ fontFamily: TS.type.mono, fontSize: 22, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
                      31/03/2035
                    </div>
                    <div style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono, marginTop: 4 }}>
                      {yearsLeft} years remaining
                    </div>
                  </div>
                </div>

                {/* Annual ceiling fill bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 14, borderTop: `1px solid ${tk.divider}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tk.inkMuted }}>
                    <span>FY26 contribution · 80C ceiling</span>
                    <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{TS.formatINR(i.annualContrib)} / {TS.formatINR(i.annualLimit)}</span>
                  </div>
                  <div style={{ display: 'flex', height: 8, background: tk.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(i.annualContrib / i.annualLimit) * 100}%`, background: tk[i.accentKey] }} />
                  </div>
                  <div style={{ fontSize: 11, color: tk.inkSubtle }}>
                    <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{TS.formatINR(i.annualLimit - i.annualContrib)}</span> headroom — top up before 31 Mar to maximise 80C deduction
                  </div>
                </div>
              </Card>

              {/* Projection chart */}
              <Card theme={theme} padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tk.divider}` }}>
                  <div>
                    <div style={sectionLabel(theme)}>Projected to maturity</div>
                    <div style={{ fontSize: 12, color: tk.inkMuted, marginTop: 2 }}>At {i.interestRate}% compounded · ₹{(i.annualContrib / 1000).toFixed(0)}k/yr</div>
                  </div>
                  <div style={{ fontFamily: TS.type.mono, fontSize: 13, color: tk.ink }}>
                    Maturity ≈ <span style={{ fontWeight: 600 }}>{TS.formatINR(i.expectedMaturity, { compact: true })}</span>
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <ProjectionLineChart theme={theme} data={yearByYear} maturityIdx={i.yearsTotal} todayIdx={i.yearsPaid} width={780} height={230} accent={tk[i.accentKey]} />
                  <div style={{ display: 'flex', gap: 18, fontSize: 11, color: tk.inkMuted, padding: '4px 8px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 2, background: tk[i.accentKey], borderRadius: 1 }} /> Balance (principal + interest)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 0, borderBottom: `1.5px dashed ${tk.borderStrong}` }} /> Cumulative contributions
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: tk.warn }} /> today, year {i.yearsPaid}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Monthly contribution schedule */}
              <Card theme={theme} padding={18}>
                <ScheduleStrip theme={theme} instr={i} />
              </Card>

            </div>

            {/* RIGHT RAIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Account details</div>
                <MetaBlock theme={theme} items={[
                  { label: 'Account', value: i.folio, mono: true },
                  { label: 'Branch', value: 'SBI · HSR Layout' },
                  { label: 'Auto-debit', value: TS.formatINR(i.sipAmount) + ' on day ' + i.sipDay, mono: true },
                  { label: 'Tenure', value: `15 years · matures 31/03/2035`, mono: true },
                  { label: 'Extension', value: '5-year blocks · with or without contribution' },
                ]} />
              </Card>

              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Interest rate history</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { yr: 'Q1 FY26', rate: '7.10%', current: true },
                    { yr: 'FY25', rate: '7.10%' },
                    { yr: 'FY24', rate: '7.10%' },
                    { yr: 'FY23', rate: '7.10%' },
                    { yr: 'FY22', rate: '7.10%' },
                    { yr: 'FY21', rate: '7.10%' },
                  ].map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${tk.divider}` }}>
                      <span style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono }}>{b.yr}</span>
                      <span style={{ fontFamily: TS.type.mono, fontSize: 12, color: tk.ink, fontVariantNumeric: 'tabular-nums', fontWeight: b.current ? 600 : 400 }}>
                        {b.rate} {b.current && <span style={{ fontSize: 9, color: tk.gain, marginLeft: 4 }}>● current</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card theme={theme} padding={18}>
                <div style={{ ...sectionLabel(theme), marginBottom: 8 }}>Tax · withdrawal</div>
                <MetaBlock theme={theme} items={[
                  { label: 'Tax', value: i.taxNote },
                  { label: 'Risk', value: i.riskLevel },
                  { label: 'Lock-in', value: i.lockIn },
                  { label: 'Nominee', value: i.nominee },
                ]} />
              </Card>

              <Card theme={theme} padding={18}>
                <StatementsList theme={theme} instr={i} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// helper: projection line chart with today marker + maturity marker
function ProjectionLineChart({ theme, data, todayIdx, maturityIdx, width = 600, height = 220, accent }) {
  const tk = tks(theme);
  const c = accent || tk.accent;
  const padL = 50, padR = 12, padT = 14, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...data.map(d => Math.max(d.value, d.contrib)));
  const stepX = innerW / (data.length - 1);
  const ptsV = data.map((d, i) => `${(padL + i * stepX).toFixed(2)},${(padT + innerH - (d.value / max) * innerH).toFixed(2)}`);
  const ptsC = data.map((d, i) => `${(padL + i * stepX).toFixed(2)},${(padT + innerH - (d.contrib / max) * innerH).toFixed(2)}`);
  const fillPath = 'M' + ptsV.join(' L') + ` L${padL + (data.length - 1) * stepX},${padT + innerH} L${padL},${padT + innerH} Z`;
  const fillId = `pl-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.20" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + innerH * t;
        const v = max * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={tk.divider} strokeDasharray="2 3" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fill={tk.inkSubtle} fontFamily={TS.type.mono} fontSize="9">
              {v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : (v / 1e5).toFixed(0) + 'L'}
            </text>
          </g>
        );
      })}
      <path d={fillPath} fill={`url(#${fillId})`} />
      <path d={'M' + ptsC.join(' L')} fill="none" stroke={tk.borderStrong} strokeWidth="1.25" strokeDasharray="3 3" />
      <path d={'M' + ptsV.join(' L')} fill="none" stroke={c} strokeWidth="1.75" strokeLinejoin="round" />
      {/* today marker */}
      {todayIdx != null && (
        <g>
          <line x1={padL + todayIdx * stepX} y1={padT} x2={padL + todayIdx * stepX} y2={padT + innerH} stroke={tk.warn} strokeDasharray="3 3" strokeWidth="1" />
          <circle cx={padL + todayIdx * stepX} cy={padT + innerH - (data[todayIdx].value / max) * innerH} r="4" fill={tk.warn} stroke={tk.surface} strokeWidth="1.5" />
          <text x={padL + todayIdx * stepX + 6} y={padT + 12} fill={tk.warn} fontFamily={TS.type.mono} fontSize="9" fontWeight="600">today</text>
        </g>
      )}
      {data.map((d, i) => {
        if (i === 0 || i === data.length - 1 || i === todayIdx || i % 5 === 0) {
          return <text key={i} x={padL + i * stepX} y={height - 8} textAnchor="middle" fill={tk.inkSubtle} fontFamily={TS.type.mono} fontSize="9">y{d.year}</text>;
        }
        return null;
      })}
    </svg>
  );
}

// ============================================================================
// SavingsMobile — index page on phone
// ============================================================================
function SavingsMobile({ theme = 'light' }) {
  const tk = tks(theme);
  const agg = savAgg(ALL_INSTR);

  return (
    <div style={{ background: tk.bg, color: tk.ink, fontFamily: TS.type.sans, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} data-screen-label="Savings · mobile">
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${tk.border}`, background: tk.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>‹</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>Savings</span>
          <span style={{ fontSize: 18, color: tk.inkMuted }}>+</span>
        </div>
        <div style={{ fontFamily: TS.type.mono, fontSize: 10, color: tk.inkSubtle, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {agg.count} instruments · April 2026
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Hero: total value */}
        <Card theme={theme} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <PortfolioDonut theme={theme} agg={agg} size={88} thickness={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total savings</div>
              <div style={{ fontFamily: TS.type.mono, fontSize: 26, fontWeight: 500, color: tk.ink, letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
                {TS.formatINR(agg.totalValue)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Delta theme={theme} value={(agg.totalReturn / agg.totalInvested) * 100} size={12} />
                <span style={{ fontSize: 11, color: tk.inkMuted, fontFamily: TS.type.mono }}>{TS.formatINR(agg.totalReturn, { compact: true })}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: `1px solid ${tk.divider}` }}>
            {agg.byType.map((seg, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: tk.inkMuted }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: tk[seg.accentKey] }} />
                <span>{seg.type}</span>
                <span style={{ fontFamily: TS.type.mono, color: tk.ink }}>{((seg.value / agg.totalValue) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* SIP / premium summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MobileMiniStat theme={theme} label="SIPs / month" value={TS.formatINR(agg.monthlyOut, { compact: true })} sub={`${ALL_INSTR.filter(i => i.sipAmount > 0).length} active`} />
          <MobileMiniStat theme={theme} label="Next premium" value="12 May" sub="LIC · ₹57.5k" warn />
        </div>

        {/* Each group as a section */}
        {SAV_GROUPS.map((grp) => {
          const items = ALL_INSTR.filter(grp.filter);
          if (items.length === 0) return null;
          return (
            <div key={grp.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 4px 0' }}>{grp.label} · {items.length}</div>
              {items.map(i => <MobileInstrumentCard key={i.id} theme={theme} instr={i} />)}
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', borderTop: `1px solid ${tk.border}`, background: tk.surface, padding: '8px 0 14px' }}>
        {['Home', 'Income', 'Save', 'Docs', 'More'].map((l) => {
          const active = l === 'Save';
          return (
            <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: active ? tk.accent : 'transparent' }} />
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active ? tk.ink : tk.inkSubtle }}>{l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileMiniStat({ theme, label, value, sub, warn }) {
  const tk = tks(theme);
  return (
    <Card theme={theme} padding={12} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: tk.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: TS.type.mono, fontSize: 18, fontWeight: 500, color: warn ? tk.warn : tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ fontSize: 10, color: tk.inkSubtle, fontFamily: TS.type.mono }}>{sub}</div>
    </Card>
  );
}

function MobileInstrumentCard({ theme, instr }) {
  const tk = tks(theme);
  const i = instr;
  const totalReturn = i.currentValue - i.investedReal;
  const isFixed = i.layout === 'fixed';
  const isTrad = i.layout === 'traditional';
  return (
    <Card theme={theme} padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr', minHeight: 76 }}>
        <div style={{ background: tk[i.accentKey] }} />
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: tk.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.short}</span>
            <span style={{ fontFamily: TS.type.mono, fontSize: 14, fontWeight: 500, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>
              {TS.formatINR(i.currentValue, { compact: true })}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: tk.inkMuted, fontFamily: TS.type.mono }}>
              {i.sipAmount > 0 ? `SIP ${TS.formatINR(i.sipAmount, { compact: true })}/mo` : i.annualPremium > 0 ? `₹${(i.annualPremium / 1000).toFixed(0)}k/yr` : i.type}
            </span>
            {(isFixed || isTrad) ? (
              <span style={{ fontFamily: TS.type.mono, color: tk.gain }}>
                {i.interestRate ? i.interestRate.toFixed(1) + '%' : (i.estimatedIRR ? i.estimatedIRR.toFixed(1) + '%' : '—')}
              </span>
            ) : (
              <Delta theme={theme} value={i.xirr} size={11} />
            )}
          </div>
          {!isFixed && !isTrad && i.series && (
            <div style={{ marginTop: 2 }}>
              <Sparkline theme={theme} data={i.series} width={310} height={22} color={i.xirr >= 0 ? tk.gain : tk.loss} />
            </div>
          )}
          {(isFixed || isTrad) && (
            <Progress theme={theme} value={i.yearsPaid} max={i.yearsTotal} tone="accent" height={4} />
          )}
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, {
  SavingsIndex,
  SavingsDetailMarket,
  SavingsDetailTraditional,
  SavingsDetailFixed,
  SavingsMobile,
});
