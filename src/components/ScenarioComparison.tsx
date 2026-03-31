import { Scenario, Charge, Income } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { CATEGORY_LABELS, ChargeCategory } from '@/types/finance';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  actualCharges: Charge[];
  actualIncomes: Income[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function getTotal(items: { amount: number }[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

export function ScenarioComparison({ scenarios, actualCharges, actualIncomes }: ScenarioComparisonProps) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg mb-2">Aucun scénario à comparer</p>
        <p className="text-sm">Créez au moins un scénario dans l'onglet Scénarios.</p>
      </div>
    );
  }

  const actualTotalCharges = getTotal(actualCharges);
  const actualTotalIncomes = getTotal(actualIncomes);
  const actualBalance = actualTotalIncomes - actualTotalCharges;

  // Bar chart data
  const barData = [
    {
      name: 'Actuel',
      Revenus: actualTotalIncomes,
      Charges: actualTotalCharges,
      Solde: actualBalance,
    },
    ...scenarios.map(s => ({
      name: s.name,
      Revenus: getTotal(s.incomes),
      Charges: getTotal(s.charges),
      Solde: getTotal(s.incomes) - getTotal(s.charges),
    })),
  ];

  // Category breakdown for radar
  const categories = Object.keys(CATEGORY_LABELS) as ChargeCategory[];
  const radarData = categories.map(cat => {
    const entry: Record<string, string | number> = {
      category: CATEGORY_LABELS[cat],
    };
    entry['Actuel'] = actualCharges.filter(c => c.category === cat).reduce((s, c) => s + c.amount, 0);
    scenarios.forEach(s => {
      entry[s.name] = s.charges.filter(c => c.category === cat).reduce((sum, c) => sum + c.amount, 0);
    });
    return entry;
  }).filter(d => {
    // Only show categories with at least one non-zero value
    return Object.values(d).some(v => typeof v === 'number' && v > 0);
  });

  const allColors = ['hsl(152, 44%, 42%)', ...scenarios.map(s => s.color || 'hsl(220, 70%, 55%)')];
  const allNames = ['Actuel', ...scenarios.map(s => s.name)];

  return (
    <div className="space-y-6">
      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des scénarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Métrique</th>
                  <th className="text-right py-3 px-4 font-medium">
                    <span className="flex items-center justify-end gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: allColors[0] }} />
                      Actuel
                    </span>
                  </th>
                  {scenarios.map((s, i) => (
                    <th key={s.id} className="text-right py-3 px-4 font-medium">
                      <span className="flex items-center justify-end gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: allColors[i + 1] }} />
                        {s.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4 text-muted-foreground">Revenus mensuels</td>
                  <td className="py-3 px-4 text-right font-medium text-primary">{formatCurrency(actualTotalIncomes)}</td>
                  {scenarios.map(s => (
                    <td key={s.id} className="py-3 px-4 text-right font-medium text-primary">{formatCurrency(getTotal(s.incomes))}</td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4 text-muted-foreground">Charges mensuelles</td>
                  <td className="py-3 px-4 text-right font-medium text-destructive">{formatCurrency(actualTotalCharges)}</td>
                  {scenarios.map(s => (
                    <td key={s.id} className="py-3 px-4 text-right font-medium text-destructive">{formatCurrency(getTotal(s.charges))}</td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4 text-muted-foreground">Solde mensuel</td>
                  <td className={`py-3 px-4 text-right font-bold ${actualBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(actualBalance)}
                  </td>
                  {scenarios.map(s => {
                    const bal = getTotal(s.incomes) - getTotal(s.charges);
                    return (
                      <td key={s.id} className={`py-3 px-4 text-right font-bold ${bal >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(bal)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Écart vs actuel</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">—</td>
                  {scenarios.map(s => {
                    const diff = (getTotal(s.incomes) - getTotal(s.charges)) - actualBalance;
                    return (
                      <td key={s.id} className={`py-3 px-4 text-right font-semibold ${diff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vue graphique</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="Revenus" fill="hsl(152, 44%, 42%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Charges" fill="hsl(0, 65%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Solde" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar chart for category comparison */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                {allNames.map((name, i) => (
                  <Radar
                    key={name}
                    name={name}
                    dataKey={name}
                    stroke={allColors[i]}
                    fill={allColors[i]}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
