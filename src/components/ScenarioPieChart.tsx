import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Charge, Income, getCurrentMonthChargesTotal, getCurrentMonthIncomesTotal } from '@/types/finance';

interface ScenarioPieChartProps {
  charges: Charge[];
  bare?: boolean;
  incomes: Income[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
];

export function ScenarioPieChart({ charges, incomes, bare = false }: ScenarioPieChartProps) {
  const totalIncomes = getCurrentMonthIncomesTotal(incomes);
  const totalCharges = getCurrentMonthChargesTotal(charges);
  const solde = Math.max(0, totalIncomes - totalCharges);

  const data = [
    { name: 'Revenus', value: totalIncomes },
    { name: 'Charges', value: totalCharges },
    { name: 'Solde', value: solde },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  const colorMap: Record<string, string> = {
    Revenus: COLORS[0],
    Charges: COLORS[1],
    Solde: COLORS[2],
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Répartition mensuelle</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={colorMap[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
