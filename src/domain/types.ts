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

export interface PolicyPayment {
  /** ISO date the premium is due. */
  dueDate: string;
  amount: number;
  /** Set when the user marks it paid (or it's auto-detected from a bank txn). */
  paidDate?: string;
  paidTransactionId?: string;
  /** Document.id of an attached payment receipt. */
  receiptDocId?: string;
}

export interface PolicyPayout {
  /** ISO date the payout is due. */
  dueDate: string;
  /** Estimated amount (projection) or actual amount (after receipt). */
  amount: number;
  payoutType: 'survival' | 'maturity' | 'death';
  /** Set when received. */
  receivedDate?: string;
  receivedTransactionId?: string;
}

export interface HDFCLifePolicy extends BaseSavings {
  type: 'hdfcLife';
  productName: string;
  policyNumber: string;
  /** Sum assured payable on death. */
  sumAssuredOnDeath: number;
  /** Sum assured payable on maturity (= annualizedPremium × PPT for Sanchay Par Advantage). */
  sumAssuredOnMaturity: number;
  /** Premium paying term (years). */
  premiumPayingTerm: number;
  /** Total policy term (years). */
  policyTerm: number;
  /** ISO date — first day of cover. */
  riskCommencementDate: string;
  /** ISO date — final maturity payout. */
  maturityDate: string;
  /** "MM-DD" — every premium due on this calendar day each year. */
  premiumDueDay?: string;
  /** "MM-DD" — annual payout day if survival benefit is paid yearly. */
  payoutDueDay?: string;
  /** Generated up-front so the UI / outflow projection can use them without
   *  re-deriving. paidDate / receivedDate / receiptDocId fill in over time. */
  premiumSchedule?: PolicyPayment[];
  payoutSchedule?: PolicyPayout[];
  planOption?: string;
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
export type DriveSyncStatus = 'local-only' | 'pending' | 'synced' | 'failed';

export interface Document {
  id: string;
  /** Set once the raw file has been uploaded to Drive. */
  driveFileId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  fileHash: string;
  parserId?: string;
  period?: string;
  uploadedAt: string;
  parseStatus: ParseStatus;
  /** Where the raw bytes live: localStorage only, in flight to Drive,
   *  successfully synced to Drive, or upload failed. */
  driveSyncStatus?: DriveSyncStatus;
  derivedRecordIds?: string[];
  passwordRequired?: boolean;
}
