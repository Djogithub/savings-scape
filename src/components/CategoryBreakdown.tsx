import { Charge, Income, CATEGORY_LABELS, ChargeCategory } from '@/types/finance';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface CategoryBreakdownProps {
  charges: Charge[];
  incomes: Income[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

const CATEGORY_COLORS: Record<string, string> = {
  'credit-regroup': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/20',
  'credit-conso': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20',
  'credit-immo': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20',
  'ecole': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20',
  'digital': 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/20',
  'impots': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20',
  'impots-exceptionnels': 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/20',
  'energie': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/20',
  'auto': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/20',
  'nourriture': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/20',
  'vetements': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-400 dark:border-fuchsia-500/20',
  'sante': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/20',
  'loisirs': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/20',
  'autre': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/20',
};

const BAR_COLORS: Record<string, string> = {
  'credit-regroup': 'bg-orange-500',
  'credit-conso': 'bg-amber-500',
  'credit-immo': 'bg-red-500',
  'ecole': 'bg-blue-500',
  'digital': 'bg-violet-500',
  'impots': 'bg-rose-500',
  'impots-exceptionnels': 'bg-pink-500',
  'energie': 'bg-yellow-500',
  'auto': 'bg-cyan-500',
  'nourriture': 'bg-green-500',
  'vetements': 'bg-fuchsia-500',
  'sante': 'bg-teal-500',
  'loisirs': 'bg-indigo-500',
  'autre': 'bg-gray-500',
};

export function CategoryBreakdown({ charges, incomes }: CategoryBreakdownProps) {
  const grouped = useMemo(() => {
    const map = new Map<ChargeCategory, { charges: Charge[]; total: number }>();
    for (const c of charges) {
      const entry = map.get(c.category) ?? { charges: [], total: 0 };
      entry.charges.push(c);
      entry.total += c.amount;
      map.set(c.category, entry);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [charges]);

  const totalCharges = charges.reduce((s, c) => s + c.amount, 0);
  const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);
  const maxCatTotal = grouped.length > 0 ? grouped[0][1].total : 1;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 premium-shadow text-center">
          <p className="text-[13px] font-medium text-muted-foreground mb-2">Total revenus</p>
          <p className="text-2xl font-bold text-primary tracking-tight">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="glass-card p-5 premium-shadow text-center">
          <p className="text-[13px] font-medium text-muted-foreground mb-2">Total charges</p>
          <p className="text-2xl font-bold text-destructive tracking-tight">{formatCurrency(totalCharges)}</p>
        </div>
        <div className="glass-card p-5 premium-shadow text-center">
          <p className="text-[13px] font-medium text-muted-foreground mb-2">Solde</p>
          <p className={`text-2xl font-bold tracking-tight ${totalIncomes - totalCharges >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(totalIncomes - totalCharges)}
          </p>
        </div>
      </div>

      {/* Charges by category */}
      <div className="glass-card p-6 premium-shadow space-y-5">
        <h3 className="text-lg font-semibold tracking-tight">Charges par catégorie</h3>
        {grouped.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-6">Aucune charge enregistrée.</p>
        )}
        <div className="space-y-4">
          {grouped.map(([cat, { charges: items, total }]) => {
            const pct = totalCharges > 0 ? (total / totalCharges) * 100 : 0;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[11px] font-medium border-0 ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['autre']}`}>
                      {CATEGORY_LABELS[cat]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {items.length} charge{items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">{formatCurrency(total)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[cat] ?? BAR_COLORS['autre']}`}
                    style={{ width: `${(total / maxCatTotal) * 100}%` }}
                  />
                </div>
                <div className="pl-4 space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{item.name}</span>
                      <span className="tabular-nums">{formatCurrency(item.amount)}/mois</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incomes list */}
      <div className="glass-card p-6 premium-shadow space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Revenus</h3>
        {incomes.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-6">Aucun revenu enregistré.</p>
        )}
        <div className="space-y-2">
          {incomes.map(income => (
            <div key={income.id} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2">
                <span>{income.name}</span>
                <Badge variant="secondary" className="text-[11px] font-medium border-0 bg-primary/10 text-primary">
                  {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
                </Badge>
              </div>
              <span className="font-semibold text-primary tabular-nums">{formatCurrency(income.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
