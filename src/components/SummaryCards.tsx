import { Charge, Income, getCurrentMonthChargesTotal, getCurrentMonthIncomesTotal, getChargeAmountForMonth } from '@/types/finance';
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

interface SummaryCardsProps {
  charges: Charge[];
  incomes: Income[];
  compact?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: {
      delay: i * 0.08, duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export function SummaryCards({ charges, incomes, compact = false }: SummaryCardsProps) {
  const totalCharges = getCurrentMonthChargesTotal(charges);
  const totalIncomes = getCurrentMonthIncomesTotal(incomes);
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
    <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className={`glass-card premium-shadow hover:shadow-md transition-shadow duration-300 ${compact ? 'p-3' : 'p-5'}`}
          custom={i} initial="hidden" animate="visible" variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
            <span className={`font-medium text-muted-foreground ${compact ? 'text-[11px]' : 'text-[13px]'}`}>{card.label}</span>
            {!compact && (
              <div className={`h-8 w-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            )}
          </div>
          <div className={`font-bold tracking-tight ${card.valueColor} ${compact ? 'text-lg' : 'text-2xl'}`}>{card.value}</div>
          {card.subtitle && (
            <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-[10px]' : 'text-xs mt-1'}`}>{card.subtitle}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
