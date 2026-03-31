import { Income } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IncomeListProps {
  incomes: Income[];
  onDelete: (id: string) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function IncomeList({ incomes, onDelete }: IncomeListProps) {
  const totalMonthly = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-muted-foreground text-sm">{incomes.length} revenu{incomes.length !== 1 ? 's' : ''}</span>
          <span className="text-muted-foreground text-sm mx-2">·</span>
          <span className="text-sm font-semibold text-primary">{formatCurrency(totalMonthly)}/mois</span>
        </div>
      </div>

      {incomes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun revenu enregistré. Ajoutez votre premier revenu.
        </div>
      )}

      <div className="space-y-2">
        {incomes.map(income => (
          <div key={income.id} className="glass-card p-4 flex items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="font-medium">{income.name}</span>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg text-primary">+{formatCurrency(income.amount)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => onDelete(income.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
