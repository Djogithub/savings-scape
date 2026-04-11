import { Charge, Income, getCurrentMonthChargesTotal, getCurrentMonthIncomesTotal, getChargeAmountForMonth, getIncomeAmountForMonth } from '@/types/finance';
import { TrendingDown, TrendingUp, Wallet, PiggyBank, Zap, Sparkles } from 'lucide-react';

interface SummaryCardsProps {
  charges: Charge[];
  incomes: Income[];
  compact?: boolean;
  grid2x2?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function SummaryCards({ charges, incomes, compact = false, grid2x2 = false }: SummaryCardsProps) {
  const totalCharges = getCurrentMonthChargesTotal(charges);
  const totalIncomes = getCurrentMonthIncomesTotal(incomes);
  const solde = totalIncomes - totalCharges;
  const now = new Date();
  const fixedCharges = charges.filter(c => c.type === 'fixed').reduce((s, c) => s + getChargeAmountForMonth(c, now.getFullYear(), now.getMonth()), 0);
  const savingsRate = totalIncomes > 0 ? ((solde / totalIncomes) * 100) : 0;

  // One-time amounts for current month
  const oneTimeCharges = charges.filter(c => c.type === 'one-time').reduce((s, c) => s + getChargeAmountForMonth(c, now.getFullYear(), now.getMonth()), 0);
  const oneTimeIncomes = incomes.filter(i => !i.isRecurring).reduce((s, i) => s + getIncomeAmountForMonth(i, now.getFullYear(), now.getMonth()), 0);

  const cards = [
    {
      label: 'Revenus mensuels',
      value: formatCurrency(totalIncomes),
      icon: TrendingUp,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      valueColor: 'text-foreground',
    },
    {
      label: 'Charges mensuelles',
      value: formatCurrency(totalCharges),
      icon: TrendingDown,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      valueColor: 'text-foreground',
    },
    {
      label: 'Solde disponible',
      value: formatCurrency(solde),
      subtitle: savingsRate > 0 ? `${savingsRate.toFixed(0)}% d'épargne` : undefined,
      icon: Wallet,
      iconBg: solde >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      iconColor: solde >= 0 ? 'text-green-500' : 'text-red-500',
      valueColor: solde >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'Charges fixes',
      value: formatCurrency(fixedCharges),
      subtitle: totalCharges > 0 ? `${((fixedCharges / totalCharges) * 100).toFixed(0)}% du total` : undefined,
      icon: PiggyBank,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      valueColor: 'text-foreground',
    },
  ];

  // Add one-time cards only if there are values this month
  if (oneTimeIncomes > 0) {
    cards.push({
      label: 'Revenus ponctuels',
      value: formatCurrency(oneTimeIncomes),
      subtitle: undefined,
      icon: Sparkles,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      valueColor: 'text-emerald-500',
    });
  }
  if (oneTimeCharges > 0) {
    cards.push({
      label: 'Charges ponctuelles',
      value: formatCurrency(oneTimeCharges),
      subtitle: undefined,
      icon: Zap,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      valueColor: 'text-orange-500',
    });
  }

  return (
    <div className={`grid ${grid2x2 ? 'grid-cols-2 gap-2 sm:gap-3' : compact ? 'grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'}`}>
      {cards.map((card) => (
        <div
          key={card.label}
          className={`glass-card premium-shadow ${compact ? 'p-3' : 'p-5'}`}
        >
          <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
            <span className={`font-medium text-muted-foreground ${compact ? 'text-[11px]' : 'text-[13px]'}`}>{card.label}</span>
            {!compact && (
              <div className={`h-8 w-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            )}
          </div>
          <div className={`font-bold tracking-tight ${card.valueColor} ${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>{card.value}</div>
          {card.subtitle && (
            <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-[10px]' : 'text-xs mt-1'}`}>{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
