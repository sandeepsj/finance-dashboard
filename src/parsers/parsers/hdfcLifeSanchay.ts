// HDFC Life — Sanchay Par Advantage policy document.
//
// The policy PDF carries a Policy Schedule with all the fields we need
// (policy number, premium, sum assured, term, dates) plus a year-by-year
// benefit illustration. The Schedule is enough to project both sides of the
// outflow — premium payments due each year of the PPT, and survival benefit
// + maturity payouts due each year of the policy term.

import type {
  HDFCLifePolicy,
  PolicyPayment,
  PolicyPayout,
  SavingsInstrument,
} from '@/domain/types';
import { StatementParser, type ParseContext } from './base';
import type { ExtractedDocument, ProducedRecordKind } from '../types';

const NUM = String.raw`([\d,]+(?:\.\d{1,2})?)`;
const POLICY_NO_RE = /Policy\s*number\s*:?\s*(\d+)/i;
const ANNUAL_PREM_RE = new RegExp(`Annualized\\s*Premium\\s*\`?\\s*${NUM}`, 'i');
const SUM_DEATH_RE = new RegExp(`Sum\\s*Assured\\s*on\\s*Death\\s*\`?\\s*${NUM}`, 'i');
const SUM_MAT_RE = new RegExp(`Sum\\s*Assured\\s*on\\s*Maturity\\s*\`?\\s*${NUM}`, 'i');
const PPT_RE = /Premium\s*Paying\s*Term\s*(\d+)\s*years?/i;
const POLICY_TERM_RE = /Policy\s*Term\s*(\d+)\s*years?/i;
const RISK_COMMENCE_RE = /Date\s*of\s*Risk\s*Commencement\s*(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+)\s*(\d{4})/i;
const MATURITY_RE = /Maturity\s*Date\s*(\d{2})\/(\d{2})\/(\d{4})/i;
const PREMIUM_DUE_DAY_RE = /Premium\s*Due\s*Date\(?s?\)?\s*(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+)/i;
const PAYOUT_DAY_RE = /Survival\s*Benefit\s*Payout\s*Date\s*(\d{2})\/(\d{2})/i;
const PAYOUT_FREQ_RE = /Survival\s*Benefit\s*Frequency\s*([A-Za-z\-]+)/i;
const PLAN_OPTION_RE = /Plan\s*Option\s*([A-Za-z\s]+?)(?:Survival|Guaranteed|\n)/i;
const PRODUCT_NAME_RE = /HDFC\s*Life\s*Sanchay\s*Par\s*Advantage/i;

const MONTHS: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06',
  jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
};

function parseAmount(s: string): number {
  return Number(s.replace(/[`₹,]/g, ''));
}

function isoFromParts(d: string, m: string, y: string): string {
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function isoFromMonthName(d: string, monthName: string, y: string): string | null {
  const m = MONTHS[monthName.toLowerCase()];
  if (!m) return null;
  return `${y}-${m}-${d.padStart(2, '0')}`;
}

function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${(y + years).toString().padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Cash-bonus rate (% of annualized premium) for the **Immediate Income** option,
 * 8-year PPT column from the policy document. Index = policy year (year 0 = no bonus).
 * The values are guaranteed once declared but the policy document only lists them
 * as percentage-of-AP guarantees (not absolute amounts), so we use them as the
 * projection baseline for the per-year payout schedule.
 */
const CASH_BONUS_RATE_8YR_PPT: number[] = [
  0,    // year 0 (issuance)
  0,    // 1
  0.35, // 2 (35%)
  0.40, // 3
  0.60, // 4
  0.60, // 5
  0.60, // 6
  0.60, // 7
  0.70, // 8
  0.75, // 9
  0.85, // 10
  0.90, // 11
  // year 12+: 90%
];
const TAIL_RATE = 0.90;

function cashBonusRate(year: number, ppt: number): number {
  // Sanchay Par Advantage cash-bonus % table — depends on PPT. We support 8yr exactly;
  // for other PPTs, fall back to 8yr table (mostly accurate).
  void ppt;
  if (year < CASH_BONUS_RATE_8YR_PPT.length) return CASH_BONUS_RATE_8YR_PPT[year];
  return TAIL_RATE;
}

export class HdfcLifeSanchayParser extends StatementParser {
  readonly id = 'parser.hdfc.life-sanchay';
  readonly version = '1.0.0';
  readonly displayName = 'HDFC Life Sanchay Par Advantage policy';
  readonly produces: readonly ProducedRecordKind[] = ['savingsInstruments'];

  detect(doc: ExtractedDocument): boolean {
    return PRODUCT_NAME_RE.test(doc.text)
      && /POLICY\s*SCHEDULE/i.test(doc.text)
      && /Annualized\s*Premium/i.test(doc.text);
  }

  protected extractTransactions(): never[] {
    return [];
  }

  protected extractSavingsInstruments(doc: ExtractedDocument, ctx: ParseContext): SavingsInstrument[] {
    const t = doc.text;

    const policyNumber = t.match(POLICY_NO_RE)?.[1];
    const annualPremium = parseAmount(t.match(ANNUAL_PREM_RE)?.[1] ?? '');
    const sumDeath = parseAmount(t.match(SUM_DEATH_RE)?.[1] ?? '');
    const sumMaturity = parseAmount(t.match(SUM_MAT_RE)?.[1] ?? '');
    const ppt = Number.parseInt(t.match(PPT_RE)?.[1] ?? '', 10);
    const policyTerm = Number.parseInt(t.match(POLICY_TERM_RE)?.[1] ?? '', 10);

    const riskMatch = t.match(RISK_COMMENCE_RE);
    const riskCommencement = riskMatch ? isoFromMonthName(riskMatch[1], riskMatch[2], riskMatch[3]) : null;

    const maturityMatch = t.match(MATURITY_RE);
    const maturityDate = maturityMatch ? isoFromParts(maturityMatch[1], maturityMatch[2], maturityMatch[3]) : null;

    if (!policyNumber || !Number.isFinite(annualPremium) || !ppt || !policyTerm || !riskCommencement || !maturityDate) {
      this.warn(ctx, 'incomplete', `Missing required field(s) — policyNo=${policyNumber}, AP=${annualPremium}, PPT=${ppt}, term=${policyTerm}, risk=${riskCommencement}, maturity=${maturityDate}`);
      return [];
    }

    const planOption = t.match(PLAN_OPTION_RE)?.[1].trim();
    const premiumDueMatch = t.match(PREMIUM_DUE_DAY_RE);
    const premiumDueDay = premiumDueMatch
      ? `${MONTHS[premiumDueMatch[2].toLowerCase()] ?? '01'}-${premiumDueMatch[1].padStart(2, '0')}`
      : `${riskCommencement.slice(5, 7)}-${riskCommencement.slice(8, 10)}`;
    const payoutDayMatch = t.match(PAYOUT_DAY_RE);
    const payoutDueDay = payoutDayMatch ? `${payoutDayMatch[2]}-${payoutDayMatch[1]}` : undefined;

    const payoutFreqRaw = t.match(PAYOUT_FREQ_RE)?.[1].toLowerCase();
    const payoutFrequency =
      payoutFreqRaw === 'annually' || payoutFreqRaw === 'yearly' ? 'annual' :
      payoutFreqRaw === 'half-yearly' || payoutFreqRaw === 'semi-annually' ? 'semi-annual' :
      payoutFreqRaw === 'quarterly' ? 'quarterly' :
      payoutFreqRaw === 'monthly' ? 'monthly' :
      undefined;

    // Build premium schedule: PPT entries, one per year on the premium due day
    // starting from riskCommencement.
    const premiumSchedule: PolicyPayment[] = [];
    for (let i = 0; i < ppt; i++) {
      premiumSchedule.push({
        dueDate: addYears(riskCommencement, i),
        amount: annualPremium,
      });
    }

    // Build payout schedule.
    // - Survival benefit: years 1..policyTerm-1 on payoutDueDay (Immediate Income
    //   pays from year 1; Deferred Income pays starting after PPT — use a
    //   conservative "year ≥ 1" for both, sized by cash-bonus rate ×AP).
    // - Maturity benefit on maturityDate.
    const payoutSchedule: PolicyPayout[] = [];
    if (payoutDueDay) {
      // First survival benefit year — Immediate Income pays from year 1, Deferred Income from year PPT+1.
      const isImmediate = !planOption || /immediate/i.test(planOption);
      const startYear = isImmediate ? 1 : ppt + 1;
      for (let yr = startYear; yr < policyTerm; yr++) {
        const date = addYears(`${riskCommencement.slice(0, 4)}-${payoutDueDay}`, yr);
        const rate = cashBonusRate(yr, ppt);
        payoutSchedule.push({
          dueDate: date,
          amount: Math.round(rate * annualPremium),
          payoutType: 'survival',
        });
      }
    }
    payoutSchedule.push({
      dueDate: maturityDate,
      amount: sumMaturity,
      payoutType: 'maturity',
    });

    // Approximate "totalPaidToDate" from how many premium dates have passed.
    const today = new Date().toISOString().slice(0, 10);
    const paidCount = premiumSchedule.filter(p => p.dueDate <= today).length;
    const totalPaidToDate = paidCount * annualPremium;

    const policy: HDFCLifePolicy = {
      id: `hdfclife_${policyNumber}`,
      type: 'hdfcLife',
      label: `HDFC Life Sanchay · ${policyNumber}`,
      institution: 'HDFC Life',
      productName: 'Sanchay Par Advantage',
      planOption,
      policyNumber,
      sumAssuredOnDeath: sumDeath,
      sumAssuredOnMaturity: sumMaturity,
      premiumPayingTerm: ppt,
      policyTerm,
      riskCommencementDate: riskCommencement,
      maturityDate,
      premiumDueDay,
      payoutDueDay,
      // BaseSavings fields
      amountPerInstallment: annualPremium,
      frequency: payoutFrequency === 'annual' ? 'yearly' : 'yearly',
      startDate: riskCommencement,
      totalPaidToDate,
      currentValue: totalPaidToDate, // rough — true cash value depends on cash bonus accrual
      expectedMaturityValue: sumMaturity + payoutSchedule.filter(p => p.payoutType === 'survival').reduce((a, p) => a + p.amount, 0),
      sourceDocIds: [doc.sourceFile.hash],
      premiumSchedule,
      payoutSchedule,
    };

    return [policy];
  }
}
