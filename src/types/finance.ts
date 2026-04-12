export type ChargeType = 'fixed' | 'variable' | 'one-time' | 'seasonal';

export type ChargeCategory = 
  | 'credit-regroup'
  | 'credit-conso'
  | 'credit-immo'
  | 'ecole'
  | 'digital'
  | 'impots'
  | 'impots-exceptionnels'
  | 'energie'
  | 'auto'
  | 'nourriture'
  | 'vetements'
  | 'sante'
  | 'loisirs'
  | 'autre';

export const CATEGORY_LABELS: Record<ChargeCategory, string> = {
  'credit-regroup': 'Regroupement de crédits',
  'credit-conso': 'Crédit conso',
  'credit-immo': 'Crédit immobilier',
  'ecole': 'École',
  'digital': 'Abonnements digitaux',
  'impots': 'Impôts & taxes',
  'impots-exceptionnels': 'Impôts exceptionnels',
  'energie': 'Énergie',
  'auto': 'Automobile',
  'nourriture': 'Alimentation',
  'vetements': 'Vêtements',
  'sante': 'Santé',
  'loisirs': 'Loisirs',
  'autre': 'Autre',
};

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  'fixed': 'Récurrente fixe',
  'variable': 'Récurrente variable',
  'one-time': 'Ponctuelle',
  'seasonal': 'Saisonnière',
};

export interface SeasonPeriod {
  id: string;
  startMonth: number; // 1-12
  endMonth: number;   // 1-12
  amount: number;
}

/**
 * Compute the yearly average monthly amount for seasonal periods.
 * Each period covers startMonth to endMonth (inclusive, wraps around year).
 * Months not covered by any period default to 0.
 */
export function getSeasonalMonthlyAverage(periods: SeasonPeriod[]): number {
  const monthAmounts = new Array(12).fill(0);
  for (const p of periods) {
    if (p.startMonth <= p.endMonth) {
      for (let m = p.startMonth; m <= p.endMonth; m++) monthAmounts[m - 1] = p.amount;
    } else {
      // wraps: e.g. Nov(11) -> Feb(2)
      for (let m = p.startMonth; m <= 12; m++) monthAmounts[m - 1] = p.amount;
      for (let m = 1; m <= p.endMonth; m++) monthAmounts[m - 1] = p.amount;
    }
  }
  return monthAmounts.reduce((a, b) => a + b, 0) / 12;
}

/**
 * Get the seasonal amount for a specific month (1-12).
 */
export function getSeasonalAmountForMonth(periods: SeasonPeriod[], month: number): number {
  for (const p of periods) {
    if (p.startMonth <= p.endMonth) {
      if (month >= p.startMonth && month <= p.endMonth) return p.amount;
    } else {
      if (month >= p.startMonth || month <= p.endMonth) return p.amount;
    }
  }
  return 0;
}

/**
 * Get the effective monthly amount for a charge in a given month/year,
 * respecting date ranges and seasonal amounts.
 */
export function getChargeAmountForMonth(charge: Charge, year: number, month: number): number {
  // Check date range
  if (charge.startDate) {
    const start = new Date(charge.startDate);
    const startMonth = start.getFullYear() * 12 + start.getMonth();
    const targetMonth = year * 12 + month;
    if (targetMonth < startMonth) return 0;
  }
  if (charge.endDate) {
    const end = new Date(charge.endDate);
    const endMonth = end.getFullYear() * 12 + end.getMonth();
    const targetMonth = year * 12 + month;
    if (targetMonth > endMonth) return 0;
  }
  // One-time: only in the start month (or current month if no date set)
  if (charge.type === 'one-time') {
    if (!charge.startDate) {
      // No start date: apply only in current month
      const now = new Date();
      if (now.getFullYear() === year && now.getMonth() === month) return charge.amount;
      return 0;
    }
    const start = new Date(charge.startDate);
    if (start.getFullYear() === year && start.getMonth() === month) return charge.amount;
    return 0;
  }
  // Seasonal
  if (charge.type === 'seasonal' && charge.seasonalPeriods) {
    return getSeasonalAmountForMonth(charge.seasonalPeriods, month + 1); // month is 0-indexed
  }
  return charge.amount;
}

/**
 * Get the effective monthly amount for an income in a given month/year.
 */
export function getIncomeAmountForMonth(income: Income, year: number, month: number): number {
  if (income.startDate) {
    const start = new Date(income.startDate);
    const startMonth = start.getFullYear() * 12 + start.getMonth();
    const targetMonth = year * 12 + month;
    if (targetMonth < startMonth) return 0;
  }
  if (income.endDate) {
    const end = new Date(income.endDate);
    const endMonth = end.getFullYear() * 12 + end.getMonth();
    const targetMonth = year * 12 + month;
    if (targetMonth > endMonth) return 0;
  }
  if (!income.isRecurring) {
    if (!income.startDate) {
      // No start date: apply only in current month
      const now = new Date();
      if (now.getFullYear() === year && now.getMonth() === month) return income.amount;
      return 0;
    }
    const start = new Date(income.startDate);
    if (start.getFullYear() === year && start.getMonth() === month) return income.amount;
    return 0;
  }
  return income.amount;
}

/**
 * Get current month's total for charges (date & season aware).
 * Excludes one-time charges — use getCurrentMonthAllChargesTotal to include them.
 */
export function getCurrentMonthChargesTotal(charges: Charge[]): number {
  const now = new Date();
  return charges
    .filter(c => c.type !== 'one-time')
    .reduce((sum, c) => sum + getChargeAmountForMonth(c, now.getFullYear(), now.getMonth()), 0);
}

/**
 * Get current month's total for incomes (date aware).
 * Excludes non-recurring incomes — use getCurrentMonthAllIncomesTotal to include them.
 */
export function getCurrentMonthIncomesTotal(incomes: Income[]): number {
  const now = new Date();
  return incomes
    .filter(i => i.isRecurring)
    .reduce((sum, i) => sum + getIncomeAmountForMonth(i, now.getFullYear(), now.getMonth()), 0);
}

/** Includes ALL charges for current month (recurring + one-time). */
export function getCurrentMonthAllChargesTotal(charges: Charge[]): number {
  const now = new Date();
  return charges.reduce((sum, c) => sum + getChargeAmountForMonth(c, now.getFullYear(), now.getMonth()), 0);
}

/** Includes ALL incomes for current month (recurring + one-time). */
export function getCurrentMonthAllIncomesTotal(incomes: Income[]): number {
  const now = new Date();
  return incomes.reduce((sum, i) => sum + getIncomeAmountForMonth(i, now.getFullYear(), now.getMonth()), 0);
}

export interface Charge {
  id: string;
  name: string;
  amount: number;
  type: ChargeType;
  category: ChargeCategory;
  startDate?: string;
  endDate?: string;
  monthlyDay?: number;
  totalAmount?: number;
  paidAmount?: number;
  interestRate?: number;
  isProjection?: boolean;
  notes?: string;
  originId?: string;
  seasonalAmounts?: Record<string, number>; // legacy
  seasonalPeriods?: SeasonPeriod[];
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  isRecurring: boolean;
  startDate?: string;
  endDate?: string;
  isProjection?: boolean;
  originId?: string;
}

export type PatrimoineCategory = 'epargne' | 'immobilier' | 'placement' | 'epargne-salariale' | 'epargne-retraite';

export const PATRIMOINE_CATEGORY_LABELS: Record<PatrimoineCategory, string> = {
  'epargne': 'Épargne',
  'immobilier': 'Bien immobilier',
  'placement': 'Placement',
  'epargne-salariale': 'Épargne salariale',
  'epargne-retraite': 'Épargne retraite',
};

export interface PatrimoineItem {
  id: string;
  name: string;
  category: PatrimoineCategory;
  currentValue: number;
  annualGrowthRate: number; // in %
  entryDate: string; // ISO date — date of valuation
  notes?: string;
}

export interface FinanceData {
  charges: Charge[];
  incomes: Income[];
  patrimoine: PatrimoineItem[];
  version: number;
}

export interface Scenario {
  id: string;
  name: string;
  charges: Charge[];
  incomes: Income[];
  patrimoine: PatrimoineItem[];
  createdAt: string;
  color?: string;
  deletedChargeOriginIds?: string[];
  deletedIncomeOriginIds?: string[];
}
