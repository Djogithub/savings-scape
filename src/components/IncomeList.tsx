import { useState, useEffect } from 'react';
import { Income } from '@/types/finance';
import { INCOME_ICON } from '@/lib/categoryIcons';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus, Minus, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IncomeForm } from './IncomeForm';
import { motion, AnimatePresence } from 'framer-motion';

interface IncomeListProps {
  incomes: Income[];
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Income>) => void;
  onAdd?: (income: Omit<Income, 'id'>) => void;
  isProjection?: boolean;
  storageKey?: string;
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

function useItemOrder(key: string, ids: string[]) {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (order.length > 0) localStorage.setItem(key, JSON.stringify(order));
  }, [order, key]);

  const effectiveOrder = [
    ...order.filter(id => ids.includes(id)),
    ...ids.filter(id => !order.includes(id)),
  ];

  return { effectiveOrder, setOrder };
}

export function IncomeList({ incomes, onDelete, onUpdate, onAdd, isProjection = false, storageKey = 'income-order' }: IncomeListProps) {
  const totalMonthly = incomes.reduce((sum, i) => sum + i.amount, 0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const incomeIds = incomes.map(i => i.id);
  const { effectiveOrder, setOrder } = useItemOrder(storageKey, incomeIds);
  const sortedIncomes = effectiveOrder.map(id => incomes.find(i => i.id === id)).filter(Boolean) as Income[];

  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const newOrder = [...effectiveOrder];
    const from = newOrder.indexOf(draggedId);
    const to = newOrder.indexOf(targetId);
    if (from === -1 || to === -1) return;
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, draggedId);
    setOrder(newOrder);
  };
  const handleDragEnd = () => setDraggedId(null);

  const IncIcon = INCOME_ICON;

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

      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {sortedIncomes.map((income, i) => {
            const isExpanded = expandedIds.has(income.id);

            return (
              <motion.div
                key={income.id}
                className={`glass-card group hover:shadow-md transition-shadow duration-200 overflow-hidden ${draggedId === income.id ? 'opacity-50' : ''}`}
                custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
                draggable
                onDragStart={() => handleDragStart(income.id)}
                onDragOver={(e) => handleDragOver(e, income.id)}
                onDragEnd={handleDragEnd}
              >
                {/* Compact view */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0" />
                  <IncIcon className="h-4 w-4 text-muted-foreground shrink-0" />
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
                      <div className="px-4 pb-4 pt-3 border-t border-border/40 space-y-3">
                        {/* Tags */}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px] font-medium border-0 bg-primary/10 text-primary">
                            {income.isRecurring ? 'Récurrent' : 'Ponctuel'}
                          </Badge>
                        </div>

                        {/* Grid content */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-0.5">Montant</div>
                            <div className="font-bold text-base tabular-nums text-primary">+{formatCurrency(income.amount)}</div>
                            <div className="text-[10px] text-muted-foreground">/mois</div>
                          </div>

                          {income.startDate && (
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-0.5">Période</div>
                              <div className="text-xs">
                                {new Date(income.startDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                                {income.endDate && ` → ${new Date(income.endDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}`}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-1 pt-1">
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
