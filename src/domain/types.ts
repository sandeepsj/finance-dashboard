// Domain types — single source of truth for the shapes that flow through the
// dashboard. Parsers produce these; the store holds these; pages render these.
// See docs/PLAN.md for the architectural intent.

export type Frequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'one-time';

// ── Income ────────────────────────────────────────────────────────────────

export type IncomeType = 'salary' | 'pension' | 'rental' | 'reimbursement' | 'insurance-payout' | 'other';

export interface IncomeStream {
  id: string;
  type: IncomeType;
  label: string;
  amount: number;
  frequency: Frequency;
  expectedDayOfMonth?: number;
  startDate: string;
  endDate?: string;
  sourceDocIds: string[];
}

// ── Obligations (committed outflows) ──────────────────────────────────────

export type ObligationType =
  | 'rent'
  | 'emi'
  | 'sip'
  | 'rd'
  | 'insurance-premium'
  | 'subscription'
  | 'utility'
  | 'support'
  | 'other';

export interface Obligation {
  id: string;
  type: ObligationType;
  label: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
  autoDebit?: boolean;
  recipient?: string;
  sourceDocIds: string[];
}

// ── Savings (discriminated union per instrument type) ─────────────────────

export interface BaseSavings {
  id: string;
  label: string;
  institution: string;
  amountPerInstallment: number;
  frequency: Frequency;
  startDate: string;
  maturityDate?: string;
  totalPaidToDate: number;
  currentValue?: number;
  expectedMaturityValue?: number;
  expectedXIRR?: number;
  sourceDocIds: string[];
}

export interface MutualFundHolding extends BaseSavings {
  type: 'mutualFund';
  folio: string;
  amc: string;
  scheme: string;
  category: string;
  units: number;
  nav: number;
}

export interface LICEndowmentPolicy extends BaseSavings {
  type: 'lic';
  planNumber: string;
  policyNumber: string;
  sumAssured: number;
  premiumPaymentTerm: number;
  policyTerm: number;
  bonusAccrued: number;
  nominee: string;
}

export interface HDFCLifePolicy extends BaseSavings {
  type: 'hdfcLife';
  productName: string;
  policyNumber: string;
  sumAssured: number;
  payoutSchedule?: { date: string; amount: number; payoutType: 'survival' | 'maturity' }[];
}

export interface PostalRD extends BaseSavings {
  type: 'postalRd';
  accountNumber: string;
  tenureMonths: number;
  interestRate: number;
}

export interface BankFD extends BaseSavings {
  type: 'bankFd';
  accountNumber: string;
  tenureMonths: number;
  interestRate: number;
  payoutType: 'cumulative' | 'monthly' | 'quarterly';
}

export interface EPF extends BaseSavings {
  type: 'epf';
  uan: string;
  employerShare: number;
  employeeShare: number;
  pensionShare: number;
}

export interface NPS extends BaseSavings {
  type: 'nps';
  pran: string;
  tier: 'I' | 'II';
  schemePreference: string;
}

export interface PPF extends BaseSavings {
  type: 'ppf';
  accountNumber: string;
  yearOpened: number;
  interestRate: number;
}

export interface SukanyaSamriddhi extends BaseSavings {
  type: 'sukanya';
  accountNumber: string;
  beneficiaryName: string;
  yearOpened: number;
  interestRate: number;
}

export interface StockHolding extends BaseSavings {
  type: 'stock';
  ticker: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  avgCost: number;
  ltp: number;
}

export interface OtherSavings extends BaseSavings {
  type: 'other';
  notes?: string;
}

export type SavingsInstrument =
  | MutualFundHolding
  | LICEndowmentPolicy
  | HDFCLifePolicy
  | PostalRD
  | BankFD
  | EPF
  | NPS
  | PPF
  | SukanyaSamriddhi
  | StockHolding
  | OtherSavings;

// ── Transactions ──────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  direction: 'D' | 'C';
  category?: string;
  description: string;
  rawDescription: string;
  accountId: string;
  obligationId?: string;
  incomeStreamId?: string;
  savingsInstrumentId?: string;
  sourceDocId: string;
}

// ── Accounts ──────────────────────────────────────────────────────────────

export type AccountType = 'savings' | 'creditCard' | 'brokerage' | 'wallet';

export interface Account {
  id: string;
  type: AccountType;
  institution: string;
  label: string;
  identifierMask: string;
}

// ── Documents (raw uploads) ───────────────────────────────────────────────

export type ParseStatus = 'pending' | 'parsed' | 'failed';

export interface Document {
  id: string;
  driveFileId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  fileHash: string;
  parserId?: string;
  period?: string;
  uploadedAt: string;
  parseStatus: ParseStatus;
  derivedRecordIds?: string[];
  passwordRequired?: boolean;
}
