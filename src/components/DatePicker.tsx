import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getDaysInMonth(month: number, year: number) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

export function DatePicker({ value, onChange, required }: DatePickerProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m ? String(parseInt(m)) : '');
      setDay(d ? String(parseInt(d)) : '');
    }
  }, []);

  const updateDate = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      onChange(`${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`);
    } else if (!required) {
      onChange('');
    }
  };

  const handleDay = (v: string) => { setDay(v); updateDate(v, month, year); };
  const handleMonth = (v: string) => {
    setMonth(v);
    const maxDays = getDaysInMonth(parseInt(v), parseInt(year) || 2025);
    const newDay = parseInt(day) > maxDays ? String(maxDays) : day;
    if (newDay !== day) setDay(newDay);
    updateDate(newDay || day, v, year);
  };
  const handleYear = (v: string) => { setYear(v); updateDate(day, month, v); };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - 10 + i);
  const maxDays = getDaysInMonth(parseInt(month) || 1, parseInt(year) || currentYear);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="flex gap-2">
      <Select value={day} onValueChange={handleDay}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Jour" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {days.map(d => (
            <SelectItem key={d} value={String(d)}>{String(d).padStart(2, '0')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={handleMonth}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Mois" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={handleYear}>
        <SelectTrigger className="w-[85px]">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
