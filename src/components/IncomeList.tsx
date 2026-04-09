import { useState } from 'react';
import { Income } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IncomeForm } from './IncomeForm';
import { motion, AnimatePresence } from 'framer-motion';

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

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, x: 12, height: 0, marginBottom: 0, transition: { duration: 0.2 } },
};

export function IncomeList({ incomes, onDelete, onUpdate, onAdd, isProjection = false }: IncomeListProps) {
  const totalMonthly = incomes.reduce((sum, i) => sum + i.amount, 0);
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
        <span className="text-muted-foreground">{incomes.length} revenu{incomes.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-semibold text-primary">{formatCurrency(totalMonthly)}/mois</span>
      </div>

      {incomes.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12 text-muted-foreground text-sm">
          Aucun revenu enregistré. Ajoutez votre premier revenu.
        </motion.div>
      )}

      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {incomes.map((income, i) => {
            const isExpanded = expandedIds.has(income.id);

            return (
              <motion.div
                key={income.id}
                className="glass-card group hover:shadow-md transition-shadow duration-200 overflow-hidden"
                custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
              >
                {/* Compact view */}
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="font-medium text-sm truncate flex-1 min-w-0">{income.name}</span>

                  {income.endDate && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      → {new Date(income.endDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                    </span>
                  )}

                  <span className="font-bold text-sm tabular-nums text-primary shrink-0">+{formatCurrency(income.amount)}</span>

                  {/* Color dot tags */}
                  <div className="flex items-center gap-1 shrink-0 group/tags">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${income.isRecurring ? 'bg-primary/60' : 'bg-amber-400/60'}`} />
                    <span className="hidden group-hover/tags:inline text-[10px] text-muted-foreground whitespace-nowrap">
                      {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
                    </span>
                  </div>

                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => toggle(income.id)}>
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
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-[11px] font-medium border-0 bg-primary/10 text-primary">
                            {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
                          </Badge>
                        </div>
                        {income.startDate && (
                          <div className="text-xs text-muted-foreground mb-2">
                            {new Date(income.startDate).toLocaleDateString('fr-FR')}
                            {income.endDate && ` → ${new Date(income.endDate).toLocaleDateString('fr-FR')}`}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-base tabular-nums text-primary">+{formatCurrency(income.amount)}</div>
                            <div className="text-[11px] text-muted-foreground">/mois</div>
                          </div>
                          <div className="flex gap-0.5">
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
