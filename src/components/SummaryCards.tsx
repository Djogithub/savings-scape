import { Charge, Income, getChargeAmountForMonth, getIncomeAmountForMonth } from '@/types/finance';
import { TrendingDown, TrendingUp, Wallet, Zap, Sparkles, Scale } from 'lucide-react';

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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Recurring: fixed + variable + seasonal
  const recurringCharges = charges.filter(c => c.type !== 'one-time').reduce((s, c) => s + getChargeAmountForMonth(c, year, month), 0);
  const recurringIncomes = incomes.filter(i => i.isRecurring).reduce((s, i) => s + getIncomeAmountForMonth(i, year, month), 0);
  const recurringBalance = recurringIncomes - recurringCharges;

  // One-time
  const oneTimeCharges = charges.filter(c => c.type === 'one-time').reduce((s, c) => s + getChargeAmountForMonth(c, year, month), 0);
  const oneTimeIncomes = incomes.filter(i => !i.isRecurring).reduce((s, i) => s + getIncomeAmountForMonth(i, year, month), 0);
  const oneTimeBalance = oneTimeIncomes - oneTimeCharges;

  const sections = [
    {
      title: 'Mensuels',
      cards: [
        {
          label: 'Revenus mensuels',
          value: formatCurrency(recurringIncomes),
          subtitle: undefined as string | undefined,
          icon: TrendingUp,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          valueColor: 'text-foreground',
        },
        {
          label: 'Charges mensuelles',
          value: formatCurrency(recurringCharges),
          subtitle: undefined as string | undefined,
          icon: TrendingDown,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500',
          valueColor: 'text-foreground',
        },
        {
          label: 'Solde mensuel',
          value: formatCurrency(recurringBalance),
          subtitle: recurringIncomes > 0 ? `${((recurringBalance / recurringIncomes) * 100).toFixed(0)}% d'épargne` : undefined,
          icon: Wallet,
          iconBg: recurringBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
          iconColor: recurringBalance >= 0 ? 'text-green-500' : 'text-red-500',
          valueColor: recurringBalance >= 0 ? 'text-green-500' : 'text-red-500',
        },
      ],
    },
    {
      title: 'Ponctuels',
      show: oneTimeIncomes > 0 || oneTimeCharges > 0,
      cards: [
        {
          label: 'Revenus ponctuels',
          value: formatCurrency(oneTimeIncomes),
          subtitle: undefined as string | undefined,
          icon: Sparkles,
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-500',
          valueColor: 'text-foreground',
        },
        {
          label: 'Charges ponctuelles',
          value: formatCurrency(oneTimeCharges),
          subtitle: undefined as string | undefined,
          icon: Zap,
          iconBg: 'bg-orange-500/10',
          iconColor: 'text-orange-500',
          valueColor: 'text-foreground',
        },
        {
          label: 'Solde ponctuel',
          value: formatCurrency(oneTimeBalance),
          subtitle: undefined as string | undefined,
          icon: Scale,
          iconBg: oneTimeBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
          iconColor: oneTimeBalance >= 0 ? 'text-green-500' : 'text-red-500',
          valueColor: oneTimeBalance >= 0 ? 'text-green-500' : 'text-red-500',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        if ('show' in section && !section.show) return null;
        return (
          <div key={section.title}>
            {sections.filter(s => !('show' in s) || s.show).length > 1 && (
              <h3 className={`font-semibold text-muted-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>{section.title}</h3>
            )}
            <div className={`grid ${grid2x2 ? 'grid-cols-2 gap-2 sm:gap-3' : compact ? 'grid-cols-2 gap-2 sm:gap-3' : 'grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'}`}>
              {[section.cards[2], section.cards[0], section.cards[1]].map((card, idx) => (
                <div
                  key={card.label}
                  className={`glass-card premium-shadow ${compact ? 'p-3' : 'p-5'} ${idx === 0 ? (grid2x2 ? 'col-span-2' : compact ? 'col-span-2' : 'sm:col-span-2') : ''}`}
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
          </div>
        );
      })}
    </div>
  );
}
