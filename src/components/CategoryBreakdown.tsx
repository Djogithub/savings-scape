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
  'credit-regroup': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'credit-conso': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'credit-immo': 'bg-red-500/20 text-red-400 border-red-500/30',
  'ecole': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'digital': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'impots': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'impots-exceptionnels': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'energie': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'auto': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'nourriture': 'bg-green-500/20 text-green-400 border-green-500/30',
  'vetements': 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  'sante': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'loisirs': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'autre': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
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
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total);
  }, [charges]);

  const totalCharges = charges.reduce((s, c) => s + c.amount, 0);
  const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);
  const maxCatTotal = grouped.length > 0 ? grouped[0][1].total : 1;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total revenus</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total charges</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(totalCharges)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Solde</p>
          <p className={`text-xl font-bold ${totalIncomes - totalCharges >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(totalIncomes - totalCharges)}
          </p>
        </div>
      </div>

      {/* Charges by category */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Charges par catégorie</h3>
        {grouped.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-6">Aucune charge enregistrée.</p>
        )}
        <div className="space-y-3">
          {grouped.map(([cat, { charges: items, total }]) => {
            const pct = totalCharges > 0 ? (total / totalCharges) * 100 : 0;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['autre']}>
                      {CATEGORY_LABELS[cat]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {items.length} charge{items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(total)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${BAR_COLORS[cat] ?? BAR_COLORS['autre']}`}
                    style={{ width: `${(total / maxCatTotal) * 100}%` }}
                  />
                </div>
                {/* Detail items */}
                <div className="pl-4 space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.amount)}/mois</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incomes list */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Revenus</h3>
        {incomes.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-6">Aucun revenu enregistré.</p>
        )}
        <div className="space-y-2">
          {incomes.map(income => (
            <div key={income.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{income.name}</span>
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
                  {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
                </Badge>
              </div>
              <span className="font-semibold text-primary">{formatCurrency(income.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
