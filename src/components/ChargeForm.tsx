import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Charge, ChargeType, ChargeCategory, CATEGORY_LABELS, CHARGE_TYPE_LABELS, SEASON_LABELS, SeasonalAmounts, Season } from '@/types/finance';
import { Plus } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { useCustomCategories } from '@/hooks/useCustomCategories';

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
  const [category, setCategory] = useState<string>(editCharge?.category ?? 'autre');
  const [startDate, setStartDate] = useState(editCharge?.startDate ?? '');
  const [endDate, setEndDate] = useState(editCharge?.endDate ?? '');
  const [totalAmount, setTotalAmount] = useState(editCharge?.totalAmount?.toString() ?? '');
  const [paidAmount, setPaidAmount] = useState(editCharge?.paidAmount?.toString() ?? '');
  const [interestRate, setInterestRate] = useState(editCharge?.interestRate?.toString() ?? '');
  const [monthlyDay, setMonthlyDay] = useState(editCharge?.monthlyDay?.toString() ?? '1');
  const [notes, setNotes] = useState(editCharge?.notes ?? '');
  const [seasonalAmounts, setSeasonalAmounts] = useState<SeasonalAmounts>(
    editCharge?.seasonalAmounts ?? { spring: 0, summer: 0, autumn: 0, winter: 0 }
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { customCategories, addCategory } = useCustomCategories();

  const allCategories: Record<string, string> = { ...CATEGORY_LABELS, ...customCategories };

  const isCredit = category.startsWith('credit');
  const isSeasonal = type === 'seasonal';

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setIsAddingCategory(true);
    } else {
      setCategory(value);
      setIsAddingCategory(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const key = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    addCategory(key, newCategoryName.trim());
    setCategory(key);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const avgSeasonal = isSeasonal
      ? (seasonalAmounts.spring + seasonalAmounts.summer + seasonalAmounts.autumn + seasonalAmounts.winter) / 4
      : parseFloat(amount);

    const chargeData: Omit<Charge, 'id'> = {
      name,
      amount: isSeasonal ? avgSeasonal : parseFloat(amount),
      type,
      category: category as ChargeCategory,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      monthlyDay: monthlyDay ? parseInt(monthlyDay) : undefined,
      isProjection,
      notes: notes || undefined,
      seasonalAmounts: isSeasonal ? seasonalAmounts : undefined,
    };

    if (editCharge && onUpdate) {
      onUpdate(editCharge.id, chargeData);
    } else {
      onSubmit(chargeData);
    }
    setOpen(false);
    if (!editCharge) {
      setName(''); setAmount(''); setTotalAmount(''); setPaidAmount(''); setInterestRate(''); setNotes('');
      setSeasonalAmounts({ spring: 0, summer: 0, autumn: 0, winter: 0 });
    }
  };

  const updateSeason = (season: Season, value: string) => {
    setSeasonalAmounts(prev => ({ ...prev, [season]: parseFloat(value) || 0 }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
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
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la catégorie"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                      if (e.key === 'Escape') setIsAddingCategory(false);
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                    OK
                  </Button>
                </div>
              ) : (
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(allCategories).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-primary font-medium">
                      <span className="flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Nouvelle catégorie…
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {isSeasonal ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Montants saisonniers (€/mois)</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(SEASON_LABELS) as [Season, string][]).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={seasonalAmounts[key] || ''}
                      onChange={e => updateSeason(key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Moyenne mensuelle : {((seasonalAmounts.spring + seasonalAmounts.summer + seasonalAmounts.autumn + seasonalAmounts.winter) / 4).toFixed(2)} €
              </p>
            </div>
          ) : (
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début {isCredit && <span className="text-destructive">*</span>}</Label>
              <DatePicker value={startDate} onChange={setStartDate} required={isCredit} />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          {isCredit && (
            <>
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
              <div className="space-y-2">
                <Label>Taux d'intérêt annuel (%)</Label>
                <Input type="number" step="0.01" min="0" max="100" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Ex: 3.5" />
              </div>
            </>
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
