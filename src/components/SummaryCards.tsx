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

  const cards = [
    { label: 'Revenus mensuels', value: formatCurrency(totalIncomes), icon: TrendingUp, color: 'text-primary' },
    { label: 'Charges mensuelles', value: formatCurrency(totalCharges), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Solde disponible', value: formatCurrency(solde), icon: Wallet, color: solde >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'Charges fixes', value: formatCurrency(fixedCharges), icon: PiggyBank, color: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="glass-card p-5 stat-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
