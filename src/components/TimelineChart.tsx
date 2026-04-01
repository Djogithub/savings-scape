import { useMemo, useState } from 'react';
import { Charge, Income, getChargeAmountForMonth, getIncomeAmountForMonth } from '@/types/finance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface TimelineChartProps {
  charges: Charge[];
  incomes: Income[];
  projectedCharges?: Charge[];
  projectedIncomes?: Income[];
  showProjections?: boolean;
}

type ViewMode = 'year' | 'month' | 'week';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeeksOfMonth(year: number, month: number) {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let current = new Date(firstDay);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  while (current <= lastDay || weeks.length === 0) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    weeks.push({ start, end, label: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}` });
    current.setDate(current.getDate() + 7);
    if (weeks.length >= 6) break;
  }
  return weeks;
}

function getDaysOfWeek(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function useChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    grid: isDark ? 'hsl(228 12% 18%)' : 'hsl(220 13% 92%)',
    axis: isDark ? 'hsl(220 10% 50%)' : 'hsl(220 10% 50%)',
    tooltipBg: isDark ? 'hsl(228 16% 13%)' : 'hsl(0 0% 100%)',
    tooltipBorder: isDark ? 'hsl(228 12% 20%)' : 'hsl(220 13% 90%)',
    tooltipText: isDark ? 'hsl(220 20% 93%)' : 'hsl(224 20% 12%)',
    income: 'hsl(160 60% 42%)',
    incomeLight: 'hsl(160 60% 42% / 0.35)',
    expense: 'hsl(0 65% 55%)',
    expenseLight: 'hsl(0 65% 55% / 0.35)',
    balance: 'hsl(220 85% 58%)',
    projected: 'hsl(35 90% 52%)',
  };
}

export function TimelineChart({ charges, incomes, projectedCharges = [], projectedIncomes = [], showProjections = false }: TimelineChartProps) {
  const currentDate = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const currentMonday = useMemo(() => {
    const d = new Date(year, month, 1);
    const weeks = getWeeksOfMonth(year, month);
    const idx = Math.min(weekOffset, weeks.length - 1);
    return weeks[idx]?.start ?? d;
  }, [year, month, weekOffset]);

  const colors = useChartColors();

  const data = useMemo(() => {
    if (viewMode === 'year') {
      return Array.from({ length: 12 }, (_, m) => {
        const totalCharges = charges.reduce((s, c) => s + getChargeAmountForMonth(c, year, m), 0);
        const totalIncomes = incomes.reduce((s, i) => s + getIncomeAmountForMonth(i, year, m), 0);
        let projC = 0, projI = 0;
        if (showProjections) {
          projC = projectedCharges.reduce((s, c) => s + getChargeAmountForMonth(c, year, m), 0);
          projI = projectedIncomes.reduce((s, i) => s + getIncomeAmountForMonth(i, year, m), 0);
        }
        return {
          name: MONTHS_SHORT[m],
          depenses: totalCharges, revenus: totalIncomes, solde: totalIncomes - totalCharges,
          ...(showProjections ? { depensesProj: totalCharges + projC, revenusProj: totalIncomes + projI, soldeProj: (totalIncomes + projI) - (totalCharges + projC) } : {}),
        };
      });
    }
    if (viewMode === 'month') {
      const weeks = getWeeksOfMonth(year, month);
      return weeks.map((week, idx) => {
        const totalCharges = charges.reduce((s, c) => s + getChargeAmountForMonth(c, year, month), 0) / weeks.length;
        const totalIncomes = incomes.reduce((s, i) => s + getIncomeAmountForMonth(i, year, month), 0) / weeks.length;
        let projC = 0, projI = 0;
        if (showProjections) {
          projC = projectedCharges.reduce((s, c) => s + getChargeAmountForMonth(c, year, month), 0) / weeks.length;
          projI = projectedIncomes.reduce((s, i) => s + getIncomeAmountForMonth(i, year, month), 0) / weeks.length;
        }
        return {
          name: `S${idx + 1}`, fullLabel: week.label,
          depenses: Math.round(totalCharges), revenus: Math.round(totalIncomes), solde: Math.round(totalIncomes - totalCharges),
          ...(showProjections ? { depensesProj: Math.round(totalCharges + projC), revenusProj: Math.round(totalIncomes + projI), soldeProj: Math.round((totalIncomes + projI) - (totalCharges + projC)) } : {}),
        };
      });
    }
    const days = getDaysOfWeek(currentMonday);
    return days.map(day => {
      const m = day.getMonth();
      const y = day.getFullYear();
      const totalCharges = charges.reduce((s, c) => s + getChargeAmountForMonth(c, y, m) / 30, 0);
      const totalIncomes = incomes.reduce((s, i) => s + getIncomeAmountForMonth(i, y, m) / 30, 0);
      let projC = 0, projI = 0;
      if (showProjections) {
        projC = projectedCharges.reduce((s, c) => s + getChargeAmountForMonth(c, y, m) / 30, 0);
        projI = projectedIncomes.reduce((s, i) => s + getIncomeAmountForMonth(i, y, m) / 30, 0);
      }
      return {
        name: `${DAYS_FR[day.getDay() === 0 ? 6 : day.getDay() - 1]} ${day.getDate()}`,
        depenses: Math.round(totalCharges), revenus: Math.round(totalIncomes), solde: Math.round(totalIncomes - totalCharges),
        ...(showProjections ? { depensesProj: Math.round(totalCharges + projC), revenusProj: Math.round(totalIncomes + projI), soldeProj: Math.round((totalIncomes + projI) - (totalCharges + projC)) } : {}),
      };
    });
  }, [charges, incomes, projectedCharges, projectedIncomes, year, month, weekOffset, viewMode, showProjections, currentMonday]);

  const navigatePrev = () => {
    if (viewMode === 'year') setYear(y => y - 1);
    else if (viewMode === 'month') {
      if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
      setWeekOffset(0);
    } else {
      const weeks = getWeeksOfMonth(year, month);
      if (weekOffset > 0) setWeekOffset(w => w - 1);
      else {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        setMonth(prevMonth); setYear(prevYear);
        setWeekOffset(getWeeksOfMonth(prevYear, prevMonth).length - 1);
      }
    }
  };

  const navigateNext = () => {
    if (viewMode === 'year') setYear(y => y + 1);
    else if (viewMode === 'month') {
      if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
      setWeekOffset(0);
    } else {
      const weeks = getWeeksOfMonth(year, month);
      if (weekOffset < weeks.length - 1) setWeekOffset(w => w + 1);
      else {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        setMonth(nextMonth); setYear(nextYear); setWeekOffset(0);
      }
    }
  };

  const navigateToday = () => { const now = new Date(); setYear(now.getFullYear()); setMonth(now.getMonth()); setWeekOffset(0); };

  const getTitle = () => {
    if (viewMode === 'year') return `${year}`;
    if (viewMode === 'month') return `${MONTHS_FR[month]} ${year}`;
    const weeks = getWeeksOfMonth(year, month);
    const w = weeks[Math.min(weekOffset, weeks.length - 1)];
    return w ? `Semaine du ${w.label}` : `${MONTHS_FR[month]} ${year}`;
  };

  const isBarHovered = (key: string) => hoveredBar === key;
  const revenusOpacity = hoveredBar === null ? 0.35 : (hoveredBar === 'revenus' ? 1 : 0.2);
  const depensesOpacity = hoveredBar === null ? 0.35 : (hoveredBar === 'depenses' ? 1 : 0.2);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => { if (v) setViewMode(v as ViewMode); }} className="bg-muted/60 rounded-xl p-1 border border-border/40">
            <ToggleGroupItem value="week" className="text-xs px-3 rounded-lg data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm">Semaine</ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs px-3 rounded-lg data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm">Mois</ToggleGroupItem>
            <ToggleGroupItem value="year" className="text-xs px-3 rounded-lg data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm">Année</ToggleGroupItem>
          </ToggleGroup>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={navigatePrev}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold min-w-[180px] text-center">{getTitle()}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={navigateNext}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="ml-2 gap-2 rounded-xl" onClick={navigateToday}>
              <Calendar className="h-4 w-4" />Aujourd'hui
            </Button>
          </div>
          {viewMode !== 'year' && (
            <Select value={month.toString()} onValueChange={(v) => { setMonth(parseInt(v)); setWeekOffset(0); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS_FR.map((m, i) => (<SelectItem key={i} value={i.toString()}>{m}</SelectItem>))}</SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="glass-card p-6 premium-shadow">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={data}
            onMouseMove={(state: any) => {
              if (state?.activeTooltipIndex !== undefined && state?.activePayload) {
                // no-op, handled by bar hover
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="name" stroke={colors.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={colors.axis} fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '12px', color: colors.tooltipText, boxShadow: '0 8px 32px -8px rgba(0,0,0,0.15)' }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend
              onMouseEnter={(e: any) => setHoveredBar(e.dataKey)}
              onMouseLeave={() => setHoveredBar(null)}
            />
            <Bar
              dataKey="revenus" name="Revenus" fill={colors.income}
              radius={[6, 6, 0, 0]}
              fillOpacity={revenusOpacity}
              onMouseEnter={() => setHoveredBar('revenus')}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ transition: 'fill-opacity 0.3s ease' }}
            />
            <Bar
              dataKey="depenses" name="Dépenses" fill={colors.expense}
              radius={[6, 6, 0, 0]}
              fillOpacity={depensesOpacity}
              onMouseEnter={() => setHoveredBar('depenses')}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ transition: 'fill-opacity 0.3s ease' }}
            />
            <Line type="monotone" dataKey="solde" name="Solde" stroke={colors.balance} strokeWidth={3} dot={{ fill: colors.balance, r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} activeDot={{ r: 7, strokeWidth: 3 }} />
            {showProjections && (
              <Line type="monotone" dataKey="soldeProj" name="Solde projeté" stroke={colors.projected} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: colors.projected }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-muted-foreground text-center mt-2">Survolez les barres ou la légende pour mettre en évidence revenus ou dépenses</p>
      </div>
    </div>
  );
}
