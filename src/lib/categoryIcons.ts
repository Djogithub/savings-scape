import {
  CreditCard, ShoppingCart, Home, GraduationCap, Monitor, Receipt,
  Zap, Car, UtensilsCrossed, Shirt, Heart, Gamepad2, HelpCircle,
  Briefcase, TrendingUp, PiggyBank, Building2, Landmark,
  Banknote, Wallet, DollarSign,
  type LucideIcon,
} from 'lucide-react';

export const CHARGE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  'credit-regroup': CreditCard,
  'credit-conso': ShoppingCart,
  'credit-immo': Home,
  'ecole': GraduationCap,
  'digital': Monitor,
  'impots': Receipt,
  'impots-exceptionnels': Receipt,
  'energie': Zap,
  'auto': Car,
  'nourriture': UtensilsCrossed,
  'vetements': Shirt,
  'sante': Heart,
  'loisirs': Gamepad2,
  'autre': HelpCircle,
};

export const PATRIMOINE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  'epargne': PiggyBank,
  'immobilier': Building2,
  'placement': TrendingUp,
  'epargne-salariale': Briefcase,
  'epargne-retraite': Landmark,
};

export function getChargeCategoryIcon(category: string): LucideIcon {
  return CHARGE_CATEGORY_ICONS[category] ?? HelpCircle;
}

export function getPatrimoineCategoryIcon(category: string): LucideIcon {
  return PATRIMOINE_CATEGORY_ICONS[category] ?? PiggyBank;
}

/** Generic income icon */
export const INCOME_ICON: LucideIcon = Banknote;
