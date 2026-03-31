import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Income } from '@/types/finance';
import { Plus } from 'lucide-react';

interface IncomeFormProps {
  onSubmit: (income: Omit<Income, 'id'>) => void;
  isProjection?: boolean;
}

export function IncomeForm({ onSubmit, isProjection = false }: IncomeFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      amount: parseFloat(amount),
      isRecurring,
      startDate,
      endDate: endDate || undefined,
      isProjection,
    });
    setOpen(false);
    setName(''); setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {isProjection ? 'Ajouter revenu projeté' : 'Ajouter un revenu'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau revenu {isProjection ? '(projection)' : ''}</DialogTitle>
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
              <Label>Date de début</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full">Ajouter</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
