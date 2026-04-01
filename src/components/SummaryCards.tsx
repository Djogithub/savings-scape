import { Charge, Income } from '@/types/finance';
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';

interface SummaryCardsProps {
  charges: Charge[];
  incomes: Income[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function SummaryCards({ charges, incomes }: SummaryCardsProps) {
  const totalCharges = charges.reduce((s, c) => s + c.amount, 0);
  const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);
  const solde = totalIncomes - totalCharges;
  const fixedCharges = charges.filter(c => c.type === 'fixed').reduce((s, c) => s + c.amount, 0);
  const savingsRate = totalIncomes > 0 ? ((solde / totalIncomes) * 100) : 0;

  const cards = [
    {
      label: 'Revenus mensuels',
      value: formatCurrency(totalIncomes),
      icon: TrendingUp,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-foreground',
    },
    {
      label: 'Charges mensuelles',
      value: formatCurrency(totalCharges),
      icon: TrendingDown,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      valueColor: 'text-foreground',
    },
    {
      label: 'Solde disponible',
      value: formatCurrency(solde),
      subtitle: savingsRate > 0 ? `${savingsRate.toFixed(0)}% d'épargne` : undefined,
      icon: Wallet,
      iconBg: solde >= 0 ? 'bg-primary/10' : 'bg-destructive/10',
      iconColor: solde >= 0 ? 'text-primary' : 'text-destructive',
      valueColor: solde >= 0 ? 'text-primary' : 'text-destructive',
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="glass-card p-5 premium-shadow">
          <div className="flex items-start justify-between mb-4">
            <span className="text-[13px] font-medium text-muted-foreground">{card.label}</span>
            <div className={`h-8 w-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${card.valueColor}`}>{card.value}</div>
          {card.subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
