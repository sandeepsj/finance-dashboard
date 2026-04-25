// Extended India-flavored merchant rules. Patterns cover what shows up in
// real HDFC bank / HDFC credit card / ICICI credit card statements.
//
// Each rule returns `null` if it doesn't match. First-match wins (Chain of
// Responsibility), so order specific patterns before generic ones.

import type { CategorizationRule } from './index';
import { regexRule } from './index';

// ── Specific merchant rules (run first) ──────────────────────────────────

export const merchantRules: CategorizationRule[] = [
  // SIP — ACH debit from Indian Clearing Corporation = SIP/MF mandate
  regexRule({ id: 'cat.sip.ach', pattern: /\bACH\s*D-?\s*INDIAN\s*CLEARING\s*CORP/i, category: 'sip' }),
  regexRule({ id: 'cat.sip', pattern: /\bSIP\b/i, category: 'sip' }),

  // Insurance premiums
  regexRule({ id: 'cat.insurance.lic', pattern: /\bLIC\b.*\bPREMIUM\b|\bLIC\s+PREM\b/i, category: 'insurance-premium' }),
  regexRule({ id: 'cat.insurance.hdfclife', pattern: /\bHDFC\s*LIFE\b|\bSANCHAY\b/i, category: 'insurance-premium' }),
  regexRule({ id: 'cat.insurance.icici', pattern: /\bICICI\s*PRU\b|\bICICI\s*LOMBARD\b/i, category: 'insurance-premium' }),

  // Subscriptions / SaaS
  regexRule({ id: 'cat.sub.netflix', pattern: /\bNETFLIX\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.spotify', pattern: /\bSPOTIFY\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.prime', pattern: /\bPRIME\s*VIDEO\b|\bAMAZON\s*PRIME\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.youtube', pattern: /\bYOUTUBE\s*PREMIUM\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.apple', pattern: /\bAPPLE\.COM\b|\bAPPLE\s*SVCS\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.adobe', pattern: /\bADOBE\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.google.cloud', pattern: /\bGOOGLE\s*CLOUD/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.anthropic', pattern: /\bANTHROPIC|\bCLAUDE\.AI\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.openai', pattern: /\bOPENAI\b|\bCHATGPT\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.github', pattern: /\bGITHUB\b/i, category: 'subscription' }),
  regexRule({ id: 'cat.sub.cred', pattern: /\bCRED\.(?:TELECOM|UTILITY|CLUB|RENT)\b|\bCRED\.GARAGE\b|\bDREAMPLUG/i, category: 'subscription' }),

  // Utilities (electricity, telecom, gas, water)
  regexRule({ id: 'cat.util.electricity', pattern: /\b(BESCOM|TANGEDCO|MSEB|BSES|TPDDL|ELECTRICITY)\b/i, category: 'utility' }),
  regexRule({ id: 'cat.util.telecom', pattern: /\b(AIRTEL|JIO|VI\s*INDIA|VODAFONE|BSNL)\b/i, category: 'utility' }),
  regexRule({ id: 'cat.util.gas', pattern: /\b(IGL|MAHANAGAR\s*GAS|GAS\s*BILL)\b/i, category: 'utility' }),
  regexRule({ id: 'cat.util.water', pattern: /\bWATER\s*BILL\b|\bBWSSB\b/i, category: 'utility' }),
  // (removed cat.util.bbps — too ambiguous: "BBPS Payment received" is a
  // credit-card payment, not a utility bill. The cc-payment rule below
  // catches that explicitly. Specific utility merchants — BESCOM, AIRTEL,
  // BSES, etc. — are matched by name above.)

  // Groceries
  regexRule({ id: 'cat.grocery.blinkit', pattern: /\bBLINKIT\b/i, category: 'groceries' }),
  regexRule({ id: 'cat.grocery.zepto', pattern: /\bZEPTO\b/i, category: 'groceries' }),
  regexRule({ id: 'cat.grocery.bigbasket', pattern: /\bBIGBASKET\b|\bGROFERS\b/i, category: 'groceries' }),
  regexRule({ id: 'cat.grocery.dmart', pattern: /\bDMART\b|\bD\s*MART\b/i, category: 'groceries' }),
  regexRule({ id: 'cat.grocery.amazonpay.grocery', pattern: /\bAMAZON\s*PAY\s*IN\s*GROCERY\b/i, category: 'groceries' }),
  regexRule({ id: 'cat.grocery.instamart', pattern: /\bINSTAMART\b/i, category: 'groceries' }),

  // Dining (food delivery + restaurants + cafes)
  regexRule({ id: 'cat.dining.swiggy', pattern: /\bSWIGGY\b|\bBUNDL\s*TECHNOL/i, category: 'dining' }),
  regexRule({ id: 'cat.dining.zomato', pattern: /\bZOMATO\b/i, category: 'dining' }),
  regexRule({ id: 'cat.dining.dineout', pattern: /\bDINEOUT\b/i, category: 'dining' }),
  regexRule({ id: 'cat.dining.shawarma', pattern: /\bSHAWARMA\b/i, category: 'dining' }),
  regexRule({ id: 'cat.dining.cafe', pattern: /\b(CAFE|RESTAURANT|HOTEL\b(?!.*INSURANCE)|BAR|BAKERY)\b/i, category: 'dining' }),
  regexRule({ id: 'cat.dining.fast-food', pattern: /\bFAST\s*FOOD\b|\bMCDONALDS\b|\bKFC\b|\bDOMINO/i, category: 'dining' }),
  regexRule({ id: 'cat.dining.starbucks', pattern: /\bSTARBUCKS\b|\bCCD\b/i, category: 'dining' }),

  // Travel
  regexRule({ id: 'cat.travel.irctc', pattern: /\bIRCTC\b/i, category: 'travel' }),
  regexRule({ id: 'cat.travel.makemytrip', pattern: /\bMAKEMYTRIP\b|\bMMT\b/i, category: 'travel' }),
  regexRule({ id: 'cat.travel.cab', pattern: /\b(UBER|OLA|RAPIDO)\b/i, category: 'travel' }),
  regexRule({ id: 'cat.travel.flight', pattern: /\b(INDIGO|VISTARA|SPICEJET|AIR\s*INDIA|AKASA)\b/i, category: 'travel' }),
  regexRule({ id: 'cat.travel.bus', pattern: /\bREDBUS\b|\bABHIBUS\b/i, category: 'travel' }),
  regexRule({ id: 'cat.travel.book', pattern: /\bBOOKING\.COM\b|\bAIRBNB\b|\bGOIBIBO\b/i, category: 'travel' }),
  regexRule({ id: 'cat.travel.fuel', pattern: /\b(HP\s*PETROL|IOCL|BPCL|RELIANCE\s*PETRO)\b|\bFUEL\b/i, category: 'fuel' }),
  regexRule({ id: 'cat.travel.parking', pattern: /\bPARKING\b|\bFASTAG\b|\bPAYTM\s*FASTAG\b/i, category: 'travel' }),

  // Healthcare
  regexRule({ id: 'cat.health.pharma', pattern: /\b(PHARMA|MEDPLUS|APOLLO|NETMEDS|1MG|TATA\s*1MG)/i, category: 'healthcare' }),
  regexRule({ id: 'cat.health.healthcare', pattern: /\b(HEALTHCARE|HOSPITAL|CLINIC|DOCTOR)/i, category: 'healthcare' }),
  regexRule({ id: 'cat.health.diagnostic', pattern: /\b(DIAGNOSTIC|LAB\s*TEST|DR\s*LAL\s*PATH|THYROCARE)\b/i, category: 'healthcare' }),

  // Shopping (non-grocery)
  regexRule({ id: 'cat.shop.amazon.ecomm', pattern: /\bAMAZON\s*PAY\s*IN\s*E\s*COMMERC|\bAMAZON\.IN\b|\bAMAZON\s*INDIA\b/i, category: 'shopping' }),
  regexRule({ id: 'cat.shop.flipkart', pattern: /\bFLIPKART\b/i, category: 'shopping' }),
  regexRule({ id: 'cat.shop.myntra', pattern: /\bMYNTRA\b/i, category: 'shopping' }),
  regexRule({ id: 'cat.shop.ajio', pattern: /\bAJIO\b/i, category: 'shopping' }),
  regexRule({ id: 'cat.shop.nykaa', pattern: /\bNYKAA\b/i, category: 'shopping' }),
  regexRule({ id: 'cat.shop.book', pattern: /\b(SAPNA\s*BOOK|CROSSWORD|BLOSSOM\s*BOOK)\b/i, category: 'shopping' }),

  // Pets
  regexRule({ id: 'cat.pets.supertails', pattern: /\bSUPERTAILS\b/i, category: 'pets' }),
  regexRule({ id: 'cat.pets.headsup', pattern: /\bHEADS?\s*UP\s*FOR\s*TAILS\b/i, category: 'pets' }),
  regexRule({ id: 'cat.pets.dogs', pattern: /\bOH\s*MY\s*DOWG\b|\bVET\s*CLINIC\b|\bPET\s*STORE\b/i, category: 'pets' }),

  // Credit card payments (incoming on CC, outgoing on bank)
  regexRule({ id: 'cat.cc.payment', pattern: /\bCREDIT\s*CARD\s*PAYMENT|\bBPPY\s*CC\s*PAYMENT|\bBBPS\s*Payment\s*received/i, category: 'cc-payment' }),

  // EMI / loans
  regexRule({ id: 'cat.emi.offus', pattern: /\bOFFUS\s*EMI\b|\bONUS\s*EMI\b/i, category: 'emi' }),
  regexRule({ id: 'cat.emi.loan', pattern: /\b(LOAN\s*EMI|EMI\s*PAYMENT|HOME\s*LOAN|CAR\s*LOAN)\b/i, category: 'emi' }),

  // Bank fees / GST / interest charges
  regexRule({ id: 'cat.fee.igst', pattern: /^IGST-|\bIGST-VPS|\bIGST\s*RATE\b/i, category: 'fees' }),
  regexRule({ id: 'cat.fee.gst', pattern: /\bGST\s*-/i, category: 'fees' }),
  regexRule({ id: 'cat.fee.charges', pattern: /\b(SMS\s*CHG|ANNUAL\s*FEE|LATE\s*FEE|MIN\s*BAL\s*CHG|RTGS\s*CHG|NEFT\s*CHG)\b/i, category: 'fees' }),

  // ATM cash withdrawals
  regexRule({ id: 'cat.cash.atm', pattern: /\bATM[- ]/i, category: 'cash' }),
  regexRule({ id: 'cat.cash.cash', pattern: /\bCASH\s*WITHDRAWAL\b|\bCASH\s*WDL\b/i, category: 'cash' }),

  // Income (not outflow but useful to tag)
  regexRule({ id: 'cat.salary', pattern: /\b(salary|sal\s*cr|payroll)\b/i, category: 'salary' }),
  regexRule({ id: 'cat.refund', pattern: /\b(REFUND|REVERSAL|CASHBACK)\b/i, category: 'refund' }),

  // Person-to-person transfers (UPI / NEFT to individuals) — broad fallback
  // Comes last so specific merchant rules win first.
  regexRule({ id: 'cat.transfer.upi', pattern: /^UPI-/i, category: 'transfer' }),
];
