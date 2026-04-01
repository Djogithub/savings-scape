import { PatrimoineItem, PATRIMOINE_CATEGORY_LABELS } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, TrendingUp, Building2, PiggyBank, Briefcase, Landmark } from 'lucide-react';
import { PatrimoineForm } from './PatrimoineForm';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface PatrimoineListProps {
  items: PatrimoineItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PatrimoineItem>) => void;
  onAdd: (item: Omit<PatrimoineItem, 'id'>) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function getCategoryIcon(cat: string) {
  const icons: Record<string, typeof PiggyBank> = {
    'epargne': PiggyBank,
    'immobilier': Building2,
    'placement': TrendingUp,
    'epargne-salariale': Briefcase,
    'epargne-retraite': Landmark,
  };
  return icons[cat] ?? PiggyBank;
}

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    'epargne': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    'immobilier': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    'placement': 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    'epargne-salariale': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    'epargne-retraite': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  };
  return colors[cat] ?? colors['epargne'];
}

/**
 * Project value from entry date to now using annual growth rate.
 */
function getProjectedValue(item: PatrimoineItem): number {
  const entryDate = new Date(item.entryDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - entryDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsElapsed <= 0 || item.annualGrowthRate === 0) return item.currentValue;
  return item.currentValue * Math.pow(1 + item.annualGrowthRate / 100, yearsElapsed);
}

/**
 * Project value N months from now.
 */
export function getProjectedValueAtMonth(item: PatrimoineItem, months: number): number {
  const projected = getProjectedValue(item);
  const yearsForward = months / 12;
  return projected * Math.pow(1 + item.annualGrowthRate / 100, yearsForward);
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, x: 12, height: 0, marginBottom: 0, transition: { duration: 0.2 } },
};

export function PatrimoineList({ items, onDelete, onUpdate, onAdd }: PatrimoineListProps) {
  const totalValue = items.reduce((sum, i) => sum + getProjectedValue(i), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{items.length} poste{items.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-semibold text-primary">{formatCurrency(totalValue)}</span>
      </div>

      {items.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12 text-muted-foreground text-sm">
          Aucun patrimoine enregistré. Ajoutez votre premier poste.
        </motion.div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const Icon = getCategoryIcon(item.category);
            const projected = getProjectedValue(item);
            const gain = projected - item.currentValue;
            return (
              <motion.div
                key={item.id}
                className="glass-card p-4 flex items-center justify-between gap-4 group hover:shadow-md transition-shadow duration-200"
                custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm truncate">{item.name}</span>
                    <Badge variant="secondary" className={`text-[11px] font-medium border-0 ${getCategoryColor(item.category)}`}>
                      {PATRIMOINE_CATEGORY_LABELS[item.category]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Valeur initiale : {formatCurrency(item.currentValue)}</span>
                    {item.annualGrowthRate > 0 && (
                      <span className="text-primary font-medium">+{item.annualGrowthRate}%/an</span>
                    )}
                    {gain > 0 && (
                      <span className="text-primary">+{formatCurrency(gain)} depuis saisie</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-base tabular-nums text-primary">{formatCurrency(projected)}</div>
                  <div className="text-[11px] text-muted-foreground">valeur estimée</div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PatrimoineForm
                    editItem={item}
                    onSubmit={onAdd}
                    onUpdate={onUpdate}
                    trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></Button>}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
