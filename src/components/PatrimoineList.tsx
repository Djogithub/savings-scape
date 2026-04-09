import { useState } from 'react';
import { PatrimoineItem, PATRIMOINE_CATEGORY_LABELS } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, TrendingUp, Building2, PiggyBank, Briefcase, Landmark, Plus, Minus } from 'lucide-react';
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

function getCategoryDotColor(cat: string): string {
  const colors: Record<string, string> = {
    'epargne': 'bg-emerald-400',
    'immobilier': 'bg-blue-400',
    'placement': 'bg-purple-400',
    'epargne-salariale': 'bg-amber-400',
    'epargne-retraite': 'bg-teal-400',
  };
  return colors[cat] ?? 'bg-emerald-400';
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const Icon = getCategoryIcon(item.category);
            const projected = getProjectedValue(item);
            const gain = projected - item.currentValue;
            const isExpanded = expandedIds.has(item.id);

            return (
              <motion.div
                key={item.id}
                className="glass-card group hover:shadow-md transition-shadow duration-200 overflow-hidden"
                custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
              >
                {/* Compact view */}
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="font-medium text-sm truncate flex-1 min-w-0">{item.name}</span>

                  <span className="font-bold text-sm tabular-nums text-primary shrink-0">{formatCurrency(projected)}</span>

                  {/* Color dot tags */}
                  <div className="flex items-center gap-1 shrink-0 group/tags">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${getCategoryDotColor(item.category)}`} />
                    <span className="hidden group-hover/tags:inline text-[10px] text-muted-foreground whitespace-nowrap">
                      {PATRIMOINE_CATEGORY_LABELS[item.category]}
                    </span>
                    {item.annualGrowthRate > 0 && (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-primary/50" />
                        <span className="hidden group-hover/tags:inline text-[10px] text-muted-foreground whitespace-nowrap">
                          +{item.annualGrowthRate}%/an
                        </span>
                      </>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => toggle(item.id)}>
                    {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>

                {/* Expanded view */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-border/40">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary" className={`text-[11px] font-medium border-0 ${getCategoryColor(item.category)}`}>
                            {PATRIMOINE_CATEGORY_LABELS[item.category]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mb-2">
                          <span>Valeur initiale : {formatCurrency(item.currentValue)}</span>
                          {item.annualGrowthRate > 0 && (
                            <span className="text-primary font-medium">+{item.annualGrowthRate}%/an</span>
                          )}
                          {gain > 0 && (
                            <span className="text-primary">+{formatCurrency(gain)} depuis saisie</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-base tabular-nums text-primary">{formatCurrency(projected)}</div>
                            <div className="text-[11px] text-muted-foreground">valeur estimée</div>
                          </div>
                          <div className="flex gap-0.5">
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
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
