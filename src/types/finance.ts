export type ChargeType = 'fixed' | 'variable' | 'one-time';

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
};

export interface Charge {
  id: string;
  name: string;
  amount: number;
  type: ChargeType;
  category: ChargeCategory;
  startDate?: string; // ISO date, required for credits
  endDate?: string; // ISO date, for credits
  monthlyDay?: number; // day of month for recurring
  totalAmount?: number; // for credits, total to pay
  paidAmount?: number; // for credits, already paid
  interestRate?: number; // annual interest rate in %
  isProjection?: boolean;
  notes?: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  isRecurring: boolean;
  startDate?: string;
  endDate?: string;
  isProjection?: boolean;
}

export interface FinanceData {
  charges: Charge[];
  incomes: Income[];
  version: number;
}
