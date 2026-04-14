import { Charge, Income, CATEGORY_LABELS, ChargeCategory, getChargeAmountForMonth } from '@/types/finance';
import { getCustomCategories } from '@/hooks/useCustomCategories';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryBreakdownProps {
  charges: Charge[];
  incomes: Income[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

const CATEGORY_CHART_COLORS: Record<string, string> = {
  'credit-regroup': 'hsl(25, 55%, 55%)',
  'credit-conso': 'hsl(40, 55%, 55%)',
  'credit-immo': 'hsl(0, 55%, 55%)',
  'ecole': 'hsl(220, 55%, 55%)',
  'digital': 'hsl(270, 55%, 55%)',
  'impots': 'hsl(340, 55%, 55%)',
  'impots-exceptionnels': 'hsl(330, 55%, 55%)',
  'energie': 'hsl(50, 55%, 55%)',
  'auto': 'hsl(190, 55%, 55%)',
  'nourriture': 'hsl(140, 55%, 55%)',
  'vetements': 'hsl(290, 55%, 55%)',
  'sante': 'hsl(170, 55%, 55%)',
  'loisirs': 'hsl(230, 55%, 55%)',
  'autre': 'hsl(220, 15%, 55%)',
};

/** Generate a stable color for custom categories based on the key string */
function generateColorForCategory(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 50%, 55%)`;
}


const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, pct } = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium mb-1">{name}</p>
      <p className="tabular-nums">{formatCurrency(value)}</p>
      <p className="text-muted-foreground text-xs">{pct.toFixed(1)}%</p>
    </div>
  );
};

export function CategoryBreakdown({ charges, incomes }: CategoryBreakdownProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const allLabels = useMemo(() => ({ ...CATEGORY_LABELS, ...getCustomCategories() }), [charges]);

  const chargeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of charges) {
      const amt = getChargeAmountForMonth(c, currentYear, currentMonth);
      if (amt > 0) {
        map.set(c.category, (map.get(c.category) ?? 0) + amt);
      }
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, value]) => ({
        name: allLabels[cat] ?? cat,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: CATEGORY_CHART_COLORS[cat] ?? generateColorForCategory(cat),
        cat,
      }));
  }, [charges, currentYear, currentMonth, allLabels]);


  return (
    <div className="space-y-6">

      {/* Charges donut */}
      <div className="glass-card p-6 premium-shadow">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Charges par catégorie</h3>
        {chargeData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Aucune charge enregistrée.</p>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chargeData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chargeData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center">
              {chargeData.map(entry => (
                <div key={entry.cat} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-medium">{entry.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            {/* Detail list */}
            <div className="w-full space-y-2 mt-2">
              {chargeData.map(entry => (
                <div key={entry.cat} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(entry.value)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({entry.pct.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
