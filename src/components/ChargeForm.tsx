import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Charge, ChargeType, ChargeCategory, CATEGORY_LABELS, CHARGE_TYPE_LABELS } from '@/types/finance';
import { Plus } from 'lucide-react';

interface ChargeFormProps {
  onSubmit: (charge: Omit<Charge, 'id'>) => void;
  isProjection?: boolean;
  editCharge?: Charge;
  onUpdate?: (id: string, updates: Partial<Charge>) => void;
  trigger?: React.ReactNode;
}

export function ChargeForm({ onSubmit, isProjection = false, editCharge, onUpdate, trigger }: ChargeFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editCharge?.name ?? '');
  const [amount, setAmount] = useState(editCharge?.amount?.toString() ?? '');
  const [type, setType] = useState<ChargeType>(editCharge?.type ?? 'fixed');
  const [category, setCategory] = useState<ChargeCategory>(editCharge?.category ?? 'autre');
  const [startDate, setStartDate] = useState(editCharge?.startDate ?? new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(editCharge?.endDate ?? '');
  const [totalAmount, setTotalAmount] = useState(editCharge?.totalAmount?.toString() ?? '');
  const [paidAmount, setPaidAmount] = useState(editCharge?.paidAmount?.toString() ?? '');
  const [monthlyDay, setMonthlyDay] = useState(editCharge?.monthlyDay?.toString() ?? '1');
  const [notes, setNotes] = useState(editCharge?.notes ?? '');

  const isCredit = category.startsWith('credit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chargeData: Omit<Charge, 'id'> = {
      name,
      amount: parseFloat(amount),
      type,
      category,
      startDate,
      endDate: endDate || undefined,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
      monthlyDay: monthlyDay ? parseInt(monthlyDay) : undefined,
      isProjection,
      notes: notes || undefined,
    };

    if (editCharge && onUpdate) {
      onUpdate(editCharge.id, chargeData);
    } else {
      onSubmit(chargeData);
    }
    setOpen(false);
    if (!editCharge) {
      setName(''); setAmount(''); setTotalAmount(''); setPaidAmount(''); setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {isProjection ? 'Ajouter projection' : 'Ajouter une charge'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCharge ? 'Modifier' : 'Nouvelle'} charge {isProjection ? '(projection)' : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Crédit immobilier" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant mensuel (€)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Jour du mois</Label>
              <Input type="number" min="1" max="31" value={monthlyDay} onChange={e => setMonthlyDay(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: ChargeType) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CHARGE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={(v: ChargeCategory) => setCategory(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          {isCredit && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant total du crédit (€)</Label>
                <Input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Déjà remboursé (€)</Label>
                <Input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes optionnelles" />
          </div>
          <Button type="submit" className="w-full">{editCharge ? 'Mettre à jour' : 'Ajouter'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
