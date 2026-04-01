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

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Printemps (Avr-Juin)',
  summer: 'Été (Juil-Sep)',
  autumn: 'Automne (Oct-Déc)',
  winter: 'Hiver (Jan-Mars)',
};

export interface SeasonalAmounts {
  spring: number;
  summer: number;
  autumn: number;
  winter: number;
}

/**
 * Returns the season for a given month (0-indexed).
 * Winter: Jan(0), Feb(1), Mar(2)
 * Spring: Apr(3), May(4), Jun(5)
 * Summer: Jul(6), Aug(7), Sep(8)
 * Autumn: Oct(9), Nov(10), Dec(11)
 */
export function getSeasonForMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
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
  // One-time: only in the start month
  if (charge.type === 'one-time') {
    if (!charge.startDate) return charge.amount;
    const start = new Date(charge.startDate);
    if (start.getFullYear() === year && start.getMonth() === month) return charge.amount;
    return 0;
  }
  // Seasonal
  if (charge.type === 'seasonal' && charge.seasonalAmounts) {
    const season = getSeasonForMonth(month);
    return charge.seasonalAmounts[season];
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
    if (!income.startDate) return income.amount;
    const start = new Date(income.startDate);
    if (start.getFullYear() === year && start.getMonth() === month) return income.amount;
    return 0;
  }
  return income.amount;
}

/**
 * Get current month's total for charges (date & season aware).
 */
export function getCurrentMonthChargesTotal(charges: Charge[]): number {
  const now = new Date();
  return charges.reduce((sum, c) => sum + getChargeAmountForMonth(c, now.getFullYear(), now.getMonth()), 0);
}

export function getCurrentMonthIncomesTotal(incomes: Income[]): number {
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
  seasonalAmounts?: SeasonalAmounts;
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
  createdAt: string;
  color?: string;
}
