import { Charge, CATEGORY_LABELS, CHARGE_TYPE_LABELS, SEASON_LABELS, Season } from '@/types/finance';
import { getCustomCategories } from '@/hooks/useCustomCategories';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Calendar, CreditCard } from 'lucide-react';
import { ChargeForm } from './ChargeForm';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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
    'credit-regroup': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    'credit-conso': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    'credit-immo': 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    'ecole': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    'digital': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    'impots': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    'impots-exceptionnels': 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
    'energie': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    'auto': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    'nourriture': 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    'vetements': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400',
    'sante': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    'loisirs': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    'autre': 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  };
  return colors[cat] ?? colors['autre'];
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, x: 12, height: 0, marginBottom: 0, transition: { duration: 0.2 } },
};

export function ChargeList({ charges, onDelete, onUpdate, isProjection = false, onAdd }: ChargeListProps) {
  const totalMonthly = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{charges.length} charge{charges.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-semibold text-destructive">{formatCurrency(totalMonthly)}/mois</span>
      </div>

      {charges.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12 text-muted-foreground text-sm">
          Aucune charge enregistrée. Ajoutez votre première charge.
        </motion.div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {charges.map((charge, i) => (
            <motion.div
              key={charge.id}
              className="glass-card p-4 flex items-center justify-between gap-4 group hover:shadow-md transition-shadow duration-200"
              custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm truncate">{charge.name}</span>
                  <Badge variant="secondary" className={`text-[11px] font-medium border-0 ${getCategoryColor(charge.category)}`}>
                    {(CATEGORY_LABELS as Record<string, string>)[charge.category] ?? getCustomCategories()[charge.category] ?? charge.category}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-normal">
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
                  {charge.type === 'seasonal' && charge.seasonalAmounts && (
                    <span className="flex items-center gap-1 flex-wrap">
                      {(Object.entries(charge.seasonalAmounts) as [Season, number][]).map(([season, amt]) => (
                        <span key={season} className="inline-flex items-center gap-0.5 bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                          {SEASON_LABELS[season].split(' ')[0]}: {formatCurrency(amt)}
                        </span>
                      ))}
                    </span>
                  )}
                  {charge.totalAmount && (() => {
                    let remaining = charge.totalAmount - (charge.paidAmount ?? 0);
                    if (charge.startDate && charge.amount > 0) {
                      const start = new Date(charge.startDate);
                      const now = new Date();
                      const monthsElapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
                      remaining = Math.max(0, charge.totalAmount - (charge.paidAmount ?? 0) - (monthsElapsed * charge.amount));
                    }
                    return (
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Reste: {formatCurrency(remaining)}
                      </span>
                    );
                  })()}
                  {charge.interestRate != null && (
                    <span className="text-warning font-medium">Taux: {charge.interestRate}%</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-base tabular-nums">{formatCurrency(charge.amount)}</div>
                <div className="text-[11px] text-muted-foreground">{charge.type === 'seasonal' ? 'moy./mois' : '/mois'}</div>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChargeForm
                  editCharge={charge}
                  onSubmit={onAdd}
                  onUpdate={onUpdate}
                  isProjection={isProjection}
                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></Button>}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(charge.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
