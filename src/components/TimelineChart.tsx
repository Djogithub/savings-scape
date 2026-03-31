import { useMemo, useState } from 'react';
import { Charge, Income } from '@/types/finance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart } from 'recharts';
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

function isActiveInMonth(item: { startDate?: string; endDate?: string }, year: number, month: number): boolean {
  if (!item.startDate) return true; // no start date = always active
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

function isActiveOnDate(item: { startDate?: string; endDate?: string }, date: Date): boolean {
  if (!item.startDate) return true; // no start date = always active
  const start = new Date(item.startDate);
  start.setHours(0, 0, 0, 0);
  if (date < start) return false;
  if (item.endDate) {
    const end = new Date(item.endDate);
    end.setHours(23, 59, 59, 999);
    if (date > end) return false;
  }
  return true;
}

function getWeeksOfMonth(year: number, month: number) {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let current = new Date(firstDay);
  // Align to Monday
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);

  while (current <= lastDay || weeks.length === 0) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    weeks.push({
      start,
      end,
      label: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`,
    });
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

export function TimelineChart({ charges, incomes, projectedCharges = [], projectedIncomes = [], showProjections = false }: TimelineChartProps) {
  const currentDate = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [weekOffset, setWeekOffset] = useState(0);

  // Get the Monday of the current week
  const currentMonday = useMemo(() => {
    const d = new Date(year, month, 1);
    const weeks = getWeeksOfMonth(year, month);
    const idx = Math.min(weekOffset, weeks.length - 1);
    return weeks[idx]?.start ?? d;
  }, [year, month, weekOffset]);

  const data = useMemo(() => {
    if (viewMode === 'year') {
      return Array.from({ length: 12 }, (_, m) => {
        const activeCharges = charges.filter(c => isActiveInMonth(c, year, m));
        const activeIncomes = incomes.filter(i => isActiveInMonth(i, year, m));
        const totalCharges = activeCharges.reduce((s, c) => s + c.amount, 0);
        const totalIncomes = activeIncomes.reduce((s, i) => s + i.amount, 0);

        let projC = 0, projI = 0;
        if (showProjections) {
          projC = projectedCharges.filter(c => isActiveInMonth(c, year, m)).reduce((s, c) => s + c.amount, 0);
          projI = projectedIncomes.filter(i => isActiveInMonth(i, year, m)).reduce((s, i) => s + i.amount, 0);
        }

        return {
          name: MONTHS_SHORT[m],
          depenses: totalCharges,
          revenus: totalIncomes,
          solde: totalIncomes - totalCharges,
          ...(showProjections ? {
            depensesProj: totalCharges + projC,
            revenusProj: totalIncomes + projI,
            soldeProj: (totalIncomes + projI) - (totalCharges + projC),
          } : {}),
        };
      });
    }

    if (viewMode === 'month') {
      const weeks = getWeeksOfMonth(year, month);
      return weeks.map(week => {
        // For weekly buckets within a month, use the monthly amounts / weeks as approximation
        // or check if active in that month
        const activeCharges = charges.filter(c => isActiveInMonth(c, year, month));
        const activeIncomes = incomes.filter(i => isActiveInMonth(i, year, month));
        const totalCharges = activeCharges.reduce((s, c) => s + c.amount, 0) / weeks.length;
        const totalIncomes = activeIncomes.reduce((s, i) => s + i.amount, 0) / weeks.length;

        let projC = 0, projI = 0;
        if (showProjections) {
          projC = projectedCharges.filter(c => isActiveInMonth(c, year, month)).reduce((s, c) => s + c.amount, 0) / weeks.length;
          projI = projectedIncomes.filter(i => isActiveInMonth(i, year, month)).reduce((s, i) => s + i.amount, 0) / weeks.length;
        }

        return {
          name: `S${weeks.indexOf(week) + 1}`,
          fullLabel: week.label,
          depenses: Math.round(totalCharges),
          revenus: Math.round(totalIncomes),
          solde: Math.round(totalIncomes - totalCharges),
          ...(showProjections ? {
            depensesProj: Math.round(totalCharges + projC),
            revenusProj: Math.round(totalIncomes + projI),
            soldeProj: Math.round((totalIncomes + projI) - (totalCharges + projC)),
          } : {}),
        };
      });
    }

    // Week view: show each day
    const days = getDaysOfWeek(currentMonday);
    return days.map(day => {
      const activeCharges = charges.filter(c => isActiveOnDate(c, day));
      const activeIncomes = incomes.filter(i => isActiveOnDate(i, day));
      // Daily = monthly / 30 approximation
      const totalCharges = activeCharges.reduce((s, c) => s + c.amount / 30, 0);
      const totalIncomes = activeIncomes.reduce((s, i) => s + i.amount / 30, 0);

      let projC = 0, projI = 0;
      if (showProjections) {
        projC = projectedCharges.filter(c => isActiveOnDate(c, day)).reduce((s, c) => s + c.amount / 30, 0);
        projI = projectedIncomes.filter(i => isActiveOnDate(i, day)).reduce((s, i) => s + i.amount / 30, 0);
      }

      return {
        name: `${DAYS_FR[day.getDay() === 0 ? 6 : day.getDay() - 1]} ${day.getDate()}`,
        depenses: Math.round(totalCharges),
        revenus: Math.round(totalIncomes),
        solde: Math.round(totalIncomes - totalCharges),
        ...(showProjections ? {
          depensesProj: Math.round(totalCharges + projC),
          revenusProj: Math.round(totalIncomes + projI),
          soldeProj: Math.round((totalIncomes + projI) - (totalCharges + projC)),
        } : {}),
      };
    });
  }, [charges, incomes, projectedCharges, projectedIncomes, year, month, weekOffset, viewMode, showProjections, currentMonday]);

  const navigatePrev = () => {
    if (viewMode === 'year') setYear(y => y - 1);
    else if (viewMode === 'month') {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
      setWeekOffset(0);
    } else {
      const weeks = getWeeksOfMonth(year, month);
      if (weekOffset > 0) setWeekOffset(w => w - 1);
      else {
        // Go to previous month last week
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        setMonth(prevMonth);
        setYear(prevYear);
        const prevWeeks = getWeeksOfMonth(prevYear, prevMonth);
        setWeekOffset(prevWeeks.length - 1);
      }
    }
  };

  const navigateNext = () => {
    if (viewMode === 'year') setYear(y => y + 1);
    else if (viewMode === 'month') {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
      setWeekOffset(0);
    } else {
      const weeks = getWeeksOfMonth(year, month);
      if (weekOffset < weeks.length - 1) setWeekOffset(w => w + 1);
      else {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        setMonth(nextMonth);
        setYear(nextYear);
        setWeekOffset(0);
      }
    }
  };

  const navigateToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setWeekOffset(0);
  };

  const getTitle = () => {
    if (viewMode === 'year') return `${year}`;
    if (viewMode === 'month') return `${MONTHS_FR[month]} ${year}`;
    const weeks = getWeeksOfMonth(year, month);
    const w = weeks[Math.min(weekOffset, weeks.length - 1)];
    return w ? `Semaine du ${w.label}` : `${MONTHS_FR[month]} ${year}`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => { if (v) setViewMode(v as ViewMode); }}
            className="bg-secondary/50 rounded-lg p-1"
          >
            <ToggleGroupItem value="week" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Semaine
            </ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Mois
            </ToggleGroupItem>
            <ToggleGroupItem value="year" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Année
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[180px] text-center">{getTitle()}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="ml-2 gap-1 text-xs" onClick={navigateToday}>
              <Calendar className="h-3 w-3" />
              Aujourd'hui
            </Button>
          </div>

          {/* Month selector for month/week views */}
          {viewMode !== 'year' && (
            <Select value={month.toString()} onValueChange={(v) => { setMonth(parseInt(v)); setWeekOffset(0); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS_FR.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
            <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(220 18% 12%)', border: '1px solid hsl(220 14% 22%)', borderRadius: '8px', color: 'hsl(210 20% 92%)' }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend />
            <Bar dataKey="revenus" name="Revenus" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="depenses" name="Dépenses" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="solde" name="Solde" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ fill: 'hsl(217 91% 60%)' }} />
            {showProjections && (
              <Line type="monotone" dataKey="soldeProj" name="Solde projeté" stroke="hsl(38 92% 50%)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'hsl(38 92% 50%)' }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
