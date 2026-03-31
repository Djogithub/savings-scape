import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Income } from '@/types/finance';
import { Plus } from 'lucide-react';
import { DatePicker } from './DatePicker';

interface IncomeFormProps {
  onSubmit: (income: Omit<Income, 'id'>) => void;
  isProjection?: boolean;
  editIncome?: Income;
  onUpdate?: (id: string, updates: Partial<Income>) => void;
  trigger?: React.ReactNode;
}

export function IncomeForm({ onSubmit, isProjection = false, editIncome, onUpdate, trigger }: IncomeFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editIncome?.name ?? '');
  const [amount, setAmount] = useState(editIncome?.amount?.toString() ?? '');
  const [isRecurring, setIsRecurring] = useState(editIncome?.isRecurring ?? true);
  const [startDate, setStartDate] = useState(editIncome?.startDate ?? '');
  const [endDate, setEndDate] = useState(editIncome?.endDate ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeData: Omit<Income, 'id'> = {
      name,
      amount: parseFloat(amount),
      isRecurring,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isProjection,
    };

    if (editIncome && onUpdate) {
      onUpdate(editIncome.id, incomeData);
    } else {
      onSubmit(incomeData);
    }
    setOpen(false);
    if (!editIncome) {
      setName(''); setAmount('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {isProjection ? 'Ajouter revenu projeté' : 'Ajouter un revenu'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editIncome ? 'Modifier' : 'Nouveau'} revenu {isProjection ? '(projection)' : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Salaire" required />
          </div>
          <div className="space-y-2">
            <Label>Montant mensuel (€)</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label>Récurrent</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <Button type="submit" className="w-full">{editIncome ? 'Mettre à jour' : 'Ajouter'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
