import { useState } from 'react';
import { Scenario, Charge, Income } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { CATEGORY_LABELS, ChargeCategory } from '@/types/finance';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2 } from 'lucide-react';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  actualCharges: Charge[];
  actualIncomes: Income[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatCompact(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function getTotal(items: { amount: number }[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const PREMIUM_COLORS = [
  'hsl(160, 55%, 42%)',   // primary green
  'hsl(220, 70%, 55%)',   // blue
  'hsl(340, 65%, 55%)',   // pink/rose
  'hsl(45, 85%, 50%)',    // gold
  'hsl(280, 60%, 55%)',   // purple
  'hsl(180, 50%, 45%)',   // teal
  'hsl(15, 75%, 55%)',    // coral
  'hsl(200, 65%, 50%)',   // sky
];

export function ScenarioComparison({ scenarios, actualCharges, actualIncomes }: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(
    scenarios.map(s => s.id)
  );

  if (scenarios.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="inline-flex h-16 w-16 rounded-2xl bg-muted/60 items-center justify-center mb-4">
          <TrendingUp className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium mb-1">Aucun scénario à comparer</p>
        <p className="text-sm text-muted-foreground">Créez au moins un scénario dans l'onglet Scénarios.</p>
      </motion.div>
    );
  }

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredScenarios = scenarios.filter(s => selectedScenarios.includes(s.id));

  const actualTotalCharges = getTotal(actualCharges);
  const actualTotalIncomes = getTotal(actualIncomes);
  const actualBalance = actualTotalIncomes - actualTotalCharges;

  // Overview cards data
  const allBalances = [actualBalance, ...filteredScenarios.map(s => getTotal(s.incomes) - getTotal(s.charges))];
  const bestBalance = Math.max(...allBalances);
  const worstBalance = Math.min(...allBalances);
  const bestLabel = bestBalance === actualBalance ? 'Actuel' : (filteredScenarios.find(s => getTotal(s.incomes) - getTotal(s.charges) === bestBalance)?.name ?? '');
  const worstLabel = worstBalance === actualBalance ? 'Actuel' : (filteredScenarios.find(s => getTotal(s.incomes) - getTotal(s.charges) === worstBalance)?.name ?? '');

  // Bar chart data
  const barData = [
    {
      name: 'Actuel',
      Revenus: actualTotalIncomes,
      Charges: actualTotalCharges,
      Solde: actualBalance,
    },
    ...filteredScenarios.map(s => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
      Revenus: getTotal(s.incomes),
      Charges: getTotal(s.charges),
      Solde: getTotal(s.incomes) - getTotal(s.charges),
    })),
  ];

  // Stacked waterfall: monthly projection over 12 months
  const monthlyProjection = Array.from({ length: 12 }, (_, month) => {
    const entry: Record<string, string | number> = {
      name: `M${month + 1}`,
    };
    entry['Actuel'] = actualBalance * (month + 1);
    filteredScenarios.forEach(s => {
      const bal = getTotal(s.incomes) - getTotal(s.charges);
      entry[s.name] = bal * (month + 1);
    });
    return entry;
  });

  // Radar data
  const categories = Object.keys(CATEGORY_LABELS) as ChargeCategory[];
  const radarData = categories.map(cat => {
    const entry: Record<string, string | number> = {
      category: CATEGORY_LABELS[cat],
    };
    entry['Actuel'] = actualCharges.filter(c => c.category === cat).reduce((s, c) => s + c.amount, 0);
    filteredScenarios.forEach(s => {
      entry[s.name] = s.charges.filter(c => c.category === cat).reduce((sum, c) => sum + c.amount, 0);
    });
    return entry;
  }).filter(d => Object.values(d).some(v => typeof v === 'number' && v > 0));

  const allColors = [PREMIUM_COLORS[0], ...filteredScenarios.map((s, i) => s.color || PREMIUM_COLORS[(i + 1) % PREMIUM_COLORS.length])];
  const allNames = ['Actuel', ...filteredScenarios.map(s => s.name)];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.dataKey}
            </span>
            <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Scenario selector pills */}
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="text-sm text-muted-foreground self-center mr-2">Comparer :</span>
        {scenarios.map((s, i) => {
          const isSelected = selectedScenarios.includes(s.id);
          return (
            <motion.button
              key={s.id}
              onClick={() => toggleScenario(s.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                isSelected
                  ? 'bg-card border-border shadow-sm'
                  : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || PREMIUM_COLORS[(i + 1) % PREMIUM_COLORS.length] }} />
              {s.name}
              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            </motion.button>
          );
        })}
      </motion.div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Meilleur solde',
            value: formatCurrency(bestBalance),
            sub: bestLabel,
            icon: ArrowUpRight,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Solde le plus bas',
            value: formatCurrency(worstBalance),
            sub: worstLabel,
            icon: ArrowDownRight,
            color: 'text-destructive',
            bg: 'bg-destructive/10',
          },
          {
            label: 'Écart max',
            value: formatCurrency(bestBalance - worstBalance),
            sub: `${filteredScenarios.length + 1} scénarios`,
            icon: Minus,
            color: 'text-warning',
            bg: 'bg-warning/10',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="glass-card p-5 premium-shadow"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[13px] font-medium text-muted-foreground">{kpi.label}</span>
              <div className={`h-8 w-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Summary table */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tableau comparatif</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Métrique</th>
                    <th className="text-right py-3 px-5 font-medium text-xs uppercase tracking-wider">
                      <span className="flex items-center justify-end gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: allColors[0] }} />
                        Actuel
                      </span>
                    </th>
                    {filteredScenarios.map((s, i) => (
                      <th key={s.id} className="text-right py-3 px-5 font-medium text-xs uppercase tracking-wider">
                        <span className="flex items-center justify-end gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: allColors[i + 1] }} />
                          {s.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: 'Revenus mensuels',
                      actual: actualTotalIncomes,
                      values: filteredScenarios.map(s => getTotal(s.incomes)),
                      colorClass: 'text-primary',
                    },
                    {
                      label: 'Charges mensuelles',
                      actual: actualTotalCharges,
                      values: filteredScenarios.map(s => getTotal(s.charges)),
                      colorClass: 'text-destructive',
                    },
                    {
                      label: 'Solde mensuel',
                      actual: actualBalance,
                      values: filteredScenarios.map(s => getTotal(s.incomes) - getTotal(s.charges)),
                      colorClass: 'dynamic',
                      bold: true,
                    },
                    {
                      label: 'Solde annuel',
                      actual: actualBalance * 12,
                      values: filteredScenarios.map(s => (getTotal(s.incomes) - getTotal(s.charges)) * 12),
                      colorClass: 'dynamic',
                      bold: true,
                    },
                  ].map((row, ri) => (
                    <tr key={row.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-5 text-muted-foreground">{row.label}</td>
                      <td className={`py-3.5 px-5 text-right tabular-nums ${row.bold ? 'font-bold' : 'font-medium'} ${row.colorClass === 'dynamic' ? (row.actual >= 0 ? 'text-primary' : 'text-destructive') : row.colorClass}`}>
                        {formatCurrency(row.actual)}
                      </td>
                      {row.values.map((v, vi) => (
                        <td key={vi} className={`py-3.5 px-5 text-right tabular-nums ${row.bold ? 'font-bold' : 'font-medium'} ${row.colorClass === 'dynamic' ? (v >= 0 ? 'text-primary' : 'text-destructive') : row.colorClass}`}>
                          {formatCurrency(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-5 text-muted-foreground">Écart vs actuel</td>
                    <td className="py-3.5 px-5 text-right text-muted-foreground">—</td>
                    {filteredScenarios.map((s, i) => {
                      const diff = (getTotal(s.incomes) - getTotal(s.charges)) - actualBalance;
                      return (
                        <td key={s.id} className={`py-3.5 px-5 text-right font-semibold tabular-nums ${diff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          <span className="inline-flex items-center gap-1">
                            {diff >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenus vs Charges vs Solde</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${formatCompact(v)}€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Revenus" fill="hsl(160, 55%, 42%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Charges" fill="hsl(0, 60%, 55%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Solde" fill="hsl(220, 70%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Area chart: 12-month projection */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Projection cumulée sur 12 mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyProjection}>
                  <defs>
                    {allNames.map((name, i) => (
                      <linearGradient key={name} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={allColors[i]} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={allColors[i]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${formatCompact(v)}€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  {allNames.map((name, i) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={allColors[i]}
                      strokeWidth={2.5}
                      fill={`url(#gradient-${i})`}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Radar chart */}
      {radarData.length > 0 && (
        <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData} cx="50%" cy="50%">
                  <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  {allNames.map((name, i) => (
                    <Radar
                      key={name}
                      name={name}
                      dataKey={name}
                      stroke={allColors[i]}
                      strokeWidth={2}
                      fill={allColors[i]}
                      fillOpacity={0.1}
                      dot={{ r: 3, fill: allColors[i] }}
                    />
                  ))}
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
