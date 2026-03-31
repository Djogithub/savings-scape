import { useMemo, useState } from 'react';
import { Charge, Income, CATEGORY_LABELS } from '@/types/finance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart } from 'recharts';
import { Button } from '@/components/ui/button';

interface TimelineChartProps {
  charges: Charge[];
  incomes: Income[];
  projectedCharges?: Charge[];
  projectedIncomes?: Income[];
  showProjections?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function isActiveInMonth(item: { startDate: string; endDate?: string }, year: number, month: number): boolean {
  const start = new Date(item.startDate);
  const startMonth = start.getFullYear() * 12 + start.getMonth();
  const targetMonth = year * 12 + month;

  if (targetMonth < startMonth) return false;

  if (item.endDate) {
    const end = new Date(item.endDate);
    const endMonth = end.getFullYear() * 12 + end.getMonth();
    if (targetMonth > endMonth) return false;
  }

  return true;
}

export function TimelineChart({ charges, incomes, projectedCharges = [], projectedIncomes = [], showProjections = false }: TimelineChartProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const activeCharges = charges.filter(c => isActiveInMonth(c, year, month));
      const activeIncomes = incomes.filter(i => (i.isRecurring || isActiveInMonth(i, year, month)) && isActiveInMonth(i, year, month));

      const totalCharges = activeCharges.reduce((s, c) => s + c.amount, 0);
      const totalIncomes = activeIncomes.reduce((s, i) => s + i.amount, 0);

      let projCharges = 0;
      let projIncomes = 0;
      if (showProjections) {
        projCharges = projectedCharges.filter(c => isActiveInMonth(c, year, month)).reduce((s, c) => s + c.amount, 0);
        projIncomes = projectedIncomes.filter(i => isActiveInMonth(i, year, month)).reduce((s, i) => s + i.amount, 0);
      }

      return {
        name: MONTHS_FR[month],
        depenses: totalCharges,
        revenus: totalIncomes,
        solde: totalIncomes - totalCharges,
        ...(showProjections ? {
          depensesProj: totalCharges + projCharges,
          revenusProj: totalIncomes + projIncomes,
          soldeProj: (totalIncomes + projIncomes) - (totalCharges + projCharges),
        } : {}),
      };
    });
  }, [charges, incomes, projectedCharges, projectedIncomes, year, showProjections]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Timeline {year}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>← {year - 1}</Button>
          <Button variant="outline" size="sm" onClick={() => setYear(currentYear)}>Aujourd'hui</Button>
          <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>{year + 1} →</Button>
        </div>
      </div>

      <div className="glass-card p-6">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
            <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(220 18% 12%)', border: '1px solid hsl(220 14% 22%)', borderRadius: '8px', color: 'hsl(210 20% 92%)' }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend />
            <Bar dataKey="revenus" name="Revenus" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="depenses" name="Dépenses" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="solde" name="Solde" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ fill: 'hsl(217 91% 60%)' }} />
            {showProjections && (
              <>
                <Line type="monotone" dataKey="soldeProj" name="Solde projeté" stroke="hsl(38 92% 50%)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'hsl(38 92% 50%)' }} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
