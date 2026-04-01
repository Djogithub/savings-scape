import { useState, useCallback } from 'react';
import { Scenario, Charge, Income } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { CATEGORY_LABELS, ChargeCategory } from '@/types/finance';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, GripVertical } from 'lucide-react';

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

const SOFT_COLORS = [
  'hsl(160, 45%, 52%)',
  'hsl(220, 55%, 62%)',
  'hsl(340, 50%, 62%)',
  'hsl(45, 70%, 58%)',
  'hsl(280, 45%, 62%)',
  'hsl(180, 40%, 52%)',
  'hsl(15, 55%, 60%)',
  'hsl(200, 50%, 58%)',
];

function getSoftColor(scenario: Scenario, index: number): string {
  const color = scenario.color;
  if (color) {
    const hueMatch = color.match(/hsl\((\d+)/);
    if (hueMatch) {
      const hue = parseInt(hueMatch[1]);
      return `hsl(${hue}, 45%, 60%)`;
    }
  }
  return SOFT_COLORS[index % SOFT_COLORS.length];
}

// Extract hue from hsl string
function extractHue(hslStr: string): number {
  const m = hslStr.match(/hsl\((\d+)/);
  return m ? parseInt(m[1]) : 160;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

type ProjectionFilter = 'all' | 'Revenus' | 'Charges' | 'Solde' | 'Balance';

export function ScenarioComparison({ scenarios, actualCharges, actualIncomes }: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(
    scenarios.map(s => s.id)
  );
  const [projectionFilter, setProjectionFilter] = useState<ProjectionFilter>('all');

  // Drag-and-drop state for bar chart ordering
  const [barOrder, setBarOrder] = useState<string[]>(['__actual__', ...scenarios.map(s => s.id)]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Keep barOrder in sync with scenarios
  const currentOrder = barOrder.filter(id => id === '__actual__' || scenarios.some(s => s.id === id && selectedScenarios.includes(s.id)));
  const missingIds = selectedScenarios.filter(id => !currentOrder.includes(id));
  const effectiveOrder = [...currentOrder, ...missingIds];
  if (!effectiveOrder.includes('__actual__')) effectiveOrder.unshift('__actual__');

  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;
    const newOrder = [...effectiveOrder];
    const fromIdx = newOrder.indexOf(draggedItem);
    const toIdx = newOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedItem);
    setBarOrder(newOrder);
  };
  const handleDragEnd = () => setDraggedItem(null);

  if (scenarios.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-muted/60 items-center justify-center mb-4">
          <TrendingUp className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium mb-1">Aucun scénario à comparer</p>
        <p className="text-sm text-muted-foreground">Créez au moins un scénario pour commencer.</p>
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

  const allBalances = [actualBalance, ...filteredScenarios.map(s => getTotal(s.incomes) - getTotal(s.charges))];
  const bestBalance = Math.max(...allBalances);
  const worstBalance = Math.min(...allBalances);
  const bestLabel = bestBalance === actualBalance ? 'Actuel' : (filteredScenarios.find(s => getTotal(s.incomes) - getTotal(s.charges) === bestBalance)?.name ?? '');
  const worstLabel = worstBalance === actualBalance ? 'Actuel' : (filteredScenarios.find(s => getTotal(s.incomes) - getTotal(s.charges) === worstBalance)?.name ?? '');

  const softActualColor = 'hsl(160, 45%, 52%)';
  
  // Build color map
  const colorMap: Record<string, string> = { '__actual__': softActualColor };
  filteredScenarios.forEach((s, i) => { colorMap[s.id] = getSoftColor(s, i + 1); });

  const allColors = effectiveOrder.map(id => colorMap[id] || softActualColor);
  const allNames = effectiveOrder.map(id => id === '__actual__' ? 'Actuel' : (filteredScenarios.find(s => s.id === id)?.name ?? ''));

  // Bar data ordered by drag order
  const barData = effectiveOrder.map(id => {
    if (id === '__actual__') {
      return { name: 'Actuel', Revenus: actualTotalIncomes, Charges: actualTotalCharges, Solde: actualBalance };
    }
    const s = filteredScenarios.find(sc => sc.id === id);
    if (!s) return null;
    return {
      name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
      Revenus: getTotal(s.incomes),
      Charges: getTotal(s.charges),
      Solde: getTotal(s.incomes) - getTotal(s.charges),
    };
  }).filter(Boolean);

  const monthlyProjection = Array.from({ length: 12 }, (_, month) => {
    const entry: Record<string, string | number> = { name: `M${month + 1}` };
    entry['Actuel'] = actualBalance * (month + 1);
    filteredScenarios.forEach(s => {
      const bal = getTotal(s.incomes) - getTotal(s.charges);
      entry[s.name] = bal * (month + 1);
    });
    return entry;
  });

  // For projection filter: build separate data
  const monthlyProjectionFiltered = Array.from({ length: 12 }, (_, month) => {
    const entry: Record<string, string | number> = { name: `M${month + 1}` };
    const addEntry = (label: string, incomes: number, charges: number) => {
      if (projectionFilter === 'all' || projectionFilter === 'Solde') {
        // In 'all' mode we show cumulative balance as before
      }
      if (projectionFilter === 'Revenus') entry[label] = incomes * (month + 1);
      else if (projectionFilter === 'Charges') entry[label] = charges * (month + 1);
      else entry[label] = (incomes - charges) * (month + 1); // Solde or all
    };
    addEntry('Actuel', actualTotalIncomes, actualTotalCharges);
    filteredScenarios.forEach(s => {
      addEntry(s.name, getTotal(s.incomes), getTotal(s.charges));
    });
    return entry;
  });

  const categories = Object.keys(CATEGORY_LABELS) as ChargeCategory[];
  const radarData = categories.map(cat => {
    const entry: Record<string, string | number> = { category: CATEGORY_LABELS[cat] };
    entry['Actuel'] = actualCharges.filter(c => c.category === cat).reduce((s, c) => s + c.amount, 0);
    filteredScenarios.forEach(s => {
      entry[s.name] = s.charges.filter(c => c.category === cat).reduce((sum, c) => sum + c.amount, 0);
    });
    return entry;
  }).filter(d => Object.values(d).some(v => typeof v === 'number' && v > 0));

  // Gradient defs for bar chart
  const barGradientDefs = (
    <defs>
      <linearGradient id="bar-grad-revenus" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(160, 55%, 58%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(160, 40%, 42%)" stopOpacity={0.85} />
      </linearGradient>
      <linearGradient id="bar-grad-charges" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(0, 55%, 65%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(0, 40%, 48%)" stopOpacity={0.85} />
      </linearGradient>
      <linearGradient id="bar-grad-solde" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(220, 60%, 68%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(220, 45%, 50%)" stopOpacity={0.85} />
      </linearGradient>
    </defs>
  );

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

  const projectionFilterOptions: { key: ProjectionFilter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'Revenus', label: 'Revenus' },
    { key: 'Charges', label: 'Charges' },
    { key: 'Solde', label: 'Solde' },
  ];

  return (
    <div className="space-y-6">
      {/* Scenario selector pills */}
      <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="text-sm text-muted-foreground self-center mr-2">Comparer :</span>
        {scenarios.map((s, i) => {
          const isSelected = selectedScenarios.includes(s.id);
          return (
            <motion.button
              key={s.id}
              onClick={() => toggleScenario(s.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                isSelected ? 'bg-card border-border shadow-sm' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getSoftColor(s, i) }} />
              {s.name}
              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            </motion.button>
          );
        })}
      </motion.div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Meilleur solde', value: formatCurrency(bestBalance), sub: bestLabel, icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Solde le plus bas', value: formatCurrency(worstBalance), sub: worstLabel, icon: ArrowDownRight, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Écart max', value: formatCurrency(bestBalance - worstBalance), sub: `${filteredScenarios.length + 1} scénarios`, icon: Minus, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label} className="glass-card p-5 premium-shadow" custom={i}
            initial="hidden" animate="visible" variants={cardVariants} whileHover={{ y: -2 }}
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
      <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-base">Tableau comparatif</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Métrique</th>
                    <th className="text-right py-3 px-5 font-medium text-xs uppercase tracking-wider">
                      <span className="flex items-center justify-end gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: softActualColor }} />
                        Actuel
                      </span>
                    </th>
                    {filteredScenarios.map((s, i) => (
                      <th key={s.id} className="text-right py-3 px-5 font-medium text-xs uppercase tracking-wider">
                        <span className="flex items-center justify-end gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMap[s.id] }} />
                          {s.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Revenus mensuels', actual: actualTotalIncomes, values: filteredScenarios.map(s => getTotal(s.incomes)), colorClass: 'text-primary' },
                    { label: 'Charges mensuelles', actual: actualTotalCharges, values: filteredScenarios.map(s => getTotal(s.charges)), colorClass: 'text-destructive' },
                    { label: 'Solde mensuel', actual: actualBalance, values: filteredScenarios.map(s => getTotal(s.incomes) - getTotal(s.charges)), colorClass: 'dynamic', bold: true },
                    { label: 'Solde annuel', actual: actualBalance * 12, values: filteredScenarios.map(s => (getTotal(s.incomes) - getTotal(s.charges)) * 12), colorClass: 'dynamic', bold: true },
                  ].map((row) => (
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
                    {filteredScenarios.map((s) => {
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
        {/* Bar chart with drag-and-drop ordering */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Revenus vs Charges vs Solde</CardTitle>
                <span className="text-[11px] text-muted-foreground">↕ Glissez pour réorganiser</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Drag-and-drop reorder pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {effectiveOrder.map((id, i) => {
                  const label = id === '__actual__' ? 'Actuel' : (filteredScenarios.find(s => s.id === id)?.name ?? '');
                  if (!label) return null;
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => handleDragStart(id)}
                      onDragOver={(e) => handleDragOver(e, id)}
                      onDragEnd={handleDragEnd}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing border transition-all ${
                        draggedItem === id ? 'opacity-50 border-primary bg-primary/5' : 'border-border/50 bg-muted/30 hover:bg-muted/60'
                      }`}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[id] || softActualColor }} />
                      {label}
                    </div>
                  );
                })}
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} barCategoryGap="20%">
                  {barGradientDefs}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${formatCompact(v)}€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Revenus" fill="url(#bar-grad-revenus)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Charges" fill="url(#bar-grad-charges)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Solde" fill="url(#bar-grad-solde)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Area chart with filter toggles */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Projection cumulée sur 12 mois</CardTitle>
                <div className="flex gap-1 bg-muted/40 rounded-xl p-0.5">
                  {projectionFilterOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setProjectionFilter(opt.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        projectionFilter === opt.key
                          ? 'bg-card shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyProjectionFiltered}>
                  <defs>
                    {allNames.map((name, i) => {
                      const hue = extractHue(allColors[i]);
                      return (
                        <linearGradient key={name} id={`proj-gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={`hsl(${hue}, 50%, 60%)`} stopOpacity={0.3} />
                          <stop offset="50%" stopColor={`hsl(${hue}, 45%, 55%)`} stopOpacity={0.1} />
                          <stop offset="100%" stopColor={`hsl(${hue}, 40%, 50%)`} stopOpacity={0.02} />
                        </linearGradient>
                      );
                    })}
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
                      strokeWidth={2}
                      fill={`url(#proj-gradient-${i})`}
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
            <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par catégorie</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData} cx="50%" cy="50%">
                  <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  {allNames.map((name, i) => (
                    <Radar
                      key={name} name={name} dataKey={name}
                      stroke={allColors[i]} strokeWidth={2}
                      fill={allColors[i]} fillOpacity={0.08}
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
