import { useState, useEffect, useCallback } from 'react';
import { Charge, CATEGORY_LABELS, CHARGE_TYPE_LABELS, SEASON_LABELS, Season } from '@/types/finance';
import { getCustomCategories } from '@/hooks/useCustomCategories';
import { getChargeCategoryIcon } from '@/lib/categoryIcons';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Calendar, CreditCard, Plus, Minus, GripVertical } from 'lucide-react';
import { ChargeForm } from './ChargeForm';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface ChargeListProps {
  charges: Charge[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Charge>) => void;
  isProjection?: boolean;
  onAdd: (charge: Omit<Charge, 'id'>) => void;
  storageKey?: string;
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

export function ChargeList({ charges, onDelete, onUpdate, isProjection = false, onAdd, storageKey = 'charge-order' }: ChargeListProps) {
  const totalMonthly = charges.reduce((sum, c) => sum + c.amount, 0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const chargeIds = charges.map(c => c.id);
  const { effectiveOrder, setOrder } = useItemOrder(storageKey, chargeIds);

  const sortedCharges = effectiveOrder.map(id => charges.find(c => c.id === id)).filter(Boolean) as Charge[];

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

      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {sortedCharges.map((charge, i) => {
            const isExpanded = expandedIds.has(charge.id);
            const categoryLabel = (CATEGORY_LABELS as Record<string, string>)[charge.category] ?? getCustomCategories()[charge.category] ?? charge.category;
            const Icon = getChargeCategoryIcon(charge.category);

            return (
              <motion.div
                key={charge.id}
                className={`glass-card group hover:shadow-md transition-shadow duration-200 overflow-hidden ${draggedId === charge.id ? 'opacity-50' : ''}`}
                custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
                draggable
                onDragStart={() => handleDragStart(charge.id)}
                onDragOver={(e) => handleDragOver(e, charge.id)}
                onDragEnd={handleDragEnd}
              >
                {/* Compact view */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0" />
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm truncate flex-1 min-w-0">{charge.name}</span>
                  
                  {charge.endDate && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      → {new Date(charge.endDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                    </span>
                  )}

                  <span className="font-bold text-sm tabular-nums shrink-0">{formatCurrency(charge.amount)}</span>

                  {/* Color dot tags — expand on hover */}
                  <div className="flex items-center gap-1 shrink-0 group/tags">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${getCategoryColor(charge.category).split(' ')[0]}`} />
                    <span className="hidden group-hover/tags:inline text-[10px] text-muted-foreground whitespace-nowrap transition-all">
                      {categoryLabel}
                    </span>
                    <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-muted-foreground/30" />
                    <span className="hidden group-hover/tags:inline text-[10px] text-muted-foreground whitespace-nowrap transition-all">
                      {CHARGE_TYPE_LABELS[charge.type]}
                    </span>
                  </div>

                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => toggle(charge.id)}>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={`text-[11px] font-medium border-0 ${getCategoryColor(charge.category)}`}>
                            {categoryLabel}
                          </Badge>
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {CHARGE_TYPE_LABELS[charge.type]}
                          </Badge>
                        </div>

                        {/* Grid content */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-0.5">Montant</div>
                            <div className="font-bold text-base tabular-nums">{formatCurrency(charge.amount)}</div>
                            <div className="text-[10px] text-muted-foreground">{charge.type === 'seasonal' ? 'moy./mois' : '/mois'}</div>
                          </div>

                          {charge.startDate && (
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-0.5">Période</div>
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(charge.startDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</span>
                                {charge.endDate && <span>→ {new Date(charge.endDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</span>}
                              </div>
                            </div>
                          )}

                          {charge.totalAmount != null && (() => {
                            let remaining = charge.totalAmount - (charge.paidAmount ?? 0);
                            if (charge.startDate && charge.amount > 0) {
                              const start = new Date(charge.startDate);
                              const now = new Date();
                              const monthsElapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
                              remaining = Math.max(0, charge.totalAmount - (charge.paidAmount ?? 0) - (monthsElapsed * charge.amount));
                            }
                            return (
                              <div>
                                <div className="text-[11px] text-muted-foreground mb-0.5">Capital restant</div>
                                <div className="flex items-center gap-1 text-xs font-medium">
                                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                                  {formatCurrency(remaining)}
                                </div>
                              </div>
                            );
                          })()}

                          {charge.interestRate != null && (
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-0.5">Taux</div>
                              <div className="text-xs font-medium text-warning">{charge.interestRate}%</div>
                            </div>
                          )}
                        </div>

                        {/* Seasonal amounts */}
                        {charge.type === 'seasonal' && charge.seasonalAmounts && (
                          <div className="flex flex-wrap gap-1.5">
                            {(Object.entries(charge.seasonalAmounts) as [Season, number][]).map(([season, amt]) => (
                              <span key={season} className="inline-flex items-center gap-0.5 bg-muted/60 px-2 py-1 rounded-lg text-[10px]">
                                {SEASON_LABELS[season].split(' ')[0]}: {formatCurrency(amt)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-1 pt-1">
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
