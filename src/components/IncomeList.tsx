import { Income } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IncomeForm } from './IncomeForm';

interface IncomeListProps {
  incomes: Income[];
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Income>) => void;
  onAdd?: (income: Omit<Income, 'id'>) => void;
  isProjection?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function IncomeList({ incomes, onDelete, onUpdate, onAdd, isProjection = false }: IncomeListProps) {
  const totalMonthly = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{incomes.length} revenu{incomes.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-semibold text-primary">{formatCurrency(totalMonthly)}/mois</span>
      </div>

      {incomes.length === 0 && (
        <div className="glass-card text-center py-12 text-muted-foreground text-sm">
          Aucun revenu enregistré. Ajoutez votre premier revenu.
        </div>
      )}

      <div className="space-y-2">
        {incomes.map(income => (
          <div key={income.id} className="glass-card p-4 flex items-center justify-between gap-4 group">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{income.name}</span>
              <Badge variant="secondary" className="text-[11px] font-medium border-0 bg-primary/10 text-primary">
                {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-base tabular-nums text-primary">+{formatCurrency(income.amount)}</span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onUpdate && onAdd && (
                  <IncomeForm
                    editIncome={income}
                    onSubmit={onAdd}
                    onUpdate={onUpdate}
                    isProjection={isProjection}
                    trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></Button>}
                  />
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(income.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
