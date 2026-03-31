import { Charge, CATEGORY_LABELS, CHARGE_TYPE_LABELS } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Calendar, CreditCard } from 'lucide-react';
import { ChargeForm } from './ChargeForm';
import { Badge } from '@/components/ui/badge';

interface ChargeListProps {
  charges: Charge[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Charge>) => void;
  isProjection?: boolean;
  onAdd: (charge: Omit<Charge, 'id'>) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    'credit-regroup': 'bg-orange-500/20 text-orange-400',
    'credit-conso': 'bg-amber-500/20 text-amber-400',
    'credit-immo': 'bg-red-500/20 text-red-400',
    'ecole': 'bg-blue-500/20 text-blue-400',
    'digital': 'bg-violet-500/20 text-violet-400',
    'impots': 'bg-rose-500/20 text-rose-400',
    'impots-exceptionnels': 'bg-pink-500/20 text-pink-400',
    'energie': 'bg-yellow-500/20 text-yellow-400',
    'auto': 'bg-cyan-500/20 text-cyan-400',
    'nourriture': 'bg-green-500/20 text-green-400',
    'vetements': 'bg-fuchsia-500/20 text-fuchsia-400',
    'sante': 'bg-teal-500/20 text-teal-400',
    'loisirs': 'bg-indigo-500/20 text-indigo-400',
    'autre': 'bg-gray-500/20 text-gray-400',
  };
  return colors[cat] ?? colors['autre'];
}

export function ChargeList({ charges, onDelete, onUpdate, isProjection = false, onAdd }: ChargeListProps) {
  const totalMonthly = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-3">
      <div>
        <span className="text-muted-foreground text-sm">{charges.length} charge{charges.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground text-sm mx-2">·</span>
        <span className="text-sm font-semibold text-destructive">{formatCurrency(totalMonthly)}/mois</span>
      </div>

      {charges.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucune charge enregistrée. Ajoutez votre première charge.
        </div>
      )}

      <div className="space-y-2">
        {charges.map(charge => (
          <div key={charge.id} className="glass-card p-4 flex items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{charge.name}</span>
                <Badge variant="secondary" className={getCategoryColor(charge.category)}>
                  {CATEGORY_LABELS[charge.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {CHARGE_TYPE_LABELS[charge.type]}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {charge.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(charge.startDate).toLocaleDateString('fr-FR')}
                    {charge.endDate && ` → ${new Date(charge.endDate).toLocaleDateString('fr-FR')}`}
                  </span>
                )}
                {charge.totalAmount && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Reste: {formatCurrency(charge.totalAmount - (charge.paidAmount ?? 0))}
                  </span>
                )}
                {charge.interestRate != null && (
                  <span className="text-amber-400">
                    Taux: {charge.interestRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{formatCurrency(charge.amount)}</div>
              <div className="text-xs text-muted-foreground">/mois</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChargeForm
                editCharge={charge}
                onSubmit={onAdd}
                onUpdate={onUpdate}
                isProjection={isProjection}
                trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(charge.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
