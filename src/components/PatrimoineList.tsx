import { useState, useEffect } from 'react';
import { PatrimoineItem, PATRIMOINE_CATEGORY_LABELS } from '@/types/finance';
import { getPatrimoineCategoryIcon } from '@/lib/categoryIcons';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, TrendingUp, Plus, Minus, GripVertical } from 'lucide-react';
import { PatrimoineForm } from './PatrimoineForm';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface PatrimoineListProps {
  items: PatrimoineItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PatrimoineItem>) => void;
  onAdd: (item: Omit<PatrimoineItem, 'id'>) => void;
  storageKey?: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
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

function getProjectedValue(item: PatrimoineItem): number {
  const entryDate = new Date(item.entryDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - entryDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsElapsed <= 0 || item.annualGrowthRate === 0) return item.currentValue;
  return item.currentValue * Math.pow(1 + item.annualGrowthRate / 100, yearsElapsed);
}

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

export function PatrimoineList({ items, onDelete, onUpdate, onAdd, storageKey = 'patrimoine-order' }: PatrimoineListProps) {
  const totalValue = items.reduce((sum, i) => sum + getProjectedValue(i), 0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const itemIds = items.map(i => i.id);
  const { effectiveOrder, setOrder } = useItemOrder(storageKey, itemIds);
  const sortedItems = effectiveOrder.map(id => items.find(i => i.id === id)).filter(Boolean) as PatrimoineItem[];

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
        <span className="text-muted-foreground">{items.length} poste{items.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-semibold text-primary">{formatCurrency(totalValue)}</span>
      </div>

      {items.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12 text-muted-foreground text-sm">
          Aucun patrimoine enregistré. Ajoutez votre premier poste.
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item, i) => {
            const Icon = getPatrimoineCategoryIcon(item.category);
            const projected = getProjectedValue(item);
            const gain = projected - item.currentValue;
            const isExpanded = expandedIds.has(item.id);

            return (
              <motion.div
                key={item.id}
                className={`glass-card group hover:shadow-md transition-shadow duration-200 overflow-hidden ${draggedId === item.id ? 'opacity-50' : ''}`}
                custom={i} initial="hidden" animate="visible" exit="exit" variants={itemVariants} layout
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
              >
                {/* Compact view */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0" />
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
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
