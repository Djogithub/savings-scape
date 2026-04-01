import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatrimoineItem, PatrimoineCategory, PATRIMOINE_CATEGORY_LABELS } from '@/types/finance';
import { Plus } from 'lucide-react';
import { DatePicker } from './DatePicker';

interface PatrimoineFormProps {
  onSubmit: (item: Omit<PatrimoineItem, 'id'>) => void;
  editItem?: PatrimoineItem;
  onUpdate?: (id: string, updates: Partial<PatrimoineItem>) => void;
  trigger?: React.ReactNode;
}

export function PatrimoineForm({ onSubmit, editItem, onUpdate, trigger }: PatrimoineFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editItem?.name ?? '');
  const [category, setCategory] = useState<PatrimoineCategory>(editItem?.category ?? 'epargne');
  const [currentValue, setCurrentValue] = useState(editItem?.currentValue?.toString() ?? '');
  const [annualGrowthRate, setAnnualGrowthRate] = useState(editItem?.annualGrowthRate?.toString() ?? '0');
  const [entryDate, setEntryDate] = useState(editItem?.entryDate ?? new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editItem?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<PatrimoineItem, 'id'> = {
      name,
      category,
      currentValue: parseFloat(currentValue),
      annualGrowthRate: parseFloat(annualGrowthRate) || 0,
      entryDate,
      notes: notes || undefined,
    };

    if (editItem && onUpdate) {
      onUpdate(editItem.id, data);
    } else {
      onSubmit(data);
    }
    setOpen(false);
    if (!editItem) {
      setName(''); setCurrentValue(''); setAnnualGrowthRate('0'); setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un patrimoine
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Modifier' : 'Nouveau'} patrimoine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Livret A, Appartement Paris..." required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={category} onValueChange={(v: PatrimoineCategory) => setCategory(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PATRIMOINE_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valeur actuelle (€)</Label>
              <Input type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Gain annuel (%)</Label>
              <Input type="number" step="0.1" value={annualGrowthRate} onChange={e => setAnnualGrowthRate(e.target.value)} placeholder="Ex: 3.0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date de valorisation</Label>
            <DatePicker value={entryDate} onChange={setEntryDate} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes optionnelles" />
          </div>
          <Button type="submit" className="w-full">{editItem ? 'Mettre à jour' : 'Ajouter'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
