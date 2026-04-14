import { useState, useEffect, useRef } from 'react';
import { Scenario, Charge, Income, PatrimoineItem, getCurrentMonthChargesTotal, getCurrentMonthIncomesTotal, getChargeAmountForMonth, getIncomeAmountForMonth } from '@/types/finance';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChargeList } from './ChargeList';
import { ChargeForm } from './ChargeForm';
import { IncomeList } from './IncomeList';
import { IncomeForm } from './IncomeForm';
import { PatrimoineList } from './PatrimoineList';
import { PatrimoineForm } from './PatrimoineForm';
import { SummaryCards } from './SummaryCards';
import { ScenarioPieChart } from './ScenarioPieChart';
import { ScenarioComparison } from './ScenarioComparison';
import { Plus, Copy, Trash2, Edit2, FolderOpen, MoreHorizontal, Palette, Scale, ChevronDown, FileStack, GripVertical, CheckCircle2, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_COLORS = [
  'hsl(152, 44%, 42%)', 'hsl(220, 70%, 55%)', 'hsl(340, 65%, 50%)',
  'hsl(45, 85%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(180, 50%, 45%)',
  'hsl(15, 75%, 55%)', 'hsl(200, 65%, 50%)',
];

const SOFT_COLORS = [
  'hsl(160, 45%, 52%)', 'hsl(220, 55%, 62%)', 'hsl(340, 50%, 62%)',
  'hsl(45, 70%, 58%)', 'hsl(280, 45%, 62%)', 'hsl(180, 40%, 52%)',
  'hsl(15, 55%, 60%)', 'hsl(200, 50%, 58%)',
];

function getSoftColor(scenario: Scenario, index: number): string {
  const color = scenario.color;
  if (color) {
    const hueMatch = color.match(/hsl\((\d+)/);
    if (hueMatch) {
      const hue = parseInt(hueMatch[1]);
      return `hsl(${hue}, 45%, 60%)`;
    }
  }
  return SOFT_COLORS[index % SOFT_COLORS.length];
}

interface ScenarioManagerProps {
  scenarios: Scenario[];
  actualCharges: Charge[];
  actualIncomes: Income[];
  actualPatrimoine: PatrimoineItem[];
  onCreateScenario: (name: string, charges?: Charge[], incomes?: Income[], patrimoine?: PatrimoineItem[]) => string;
  onDeleteScenario: (id: string) => void;
  onRenameScenario: (id: string, name: string) => void;
  onUpdateScenarioColor: (id: string, color: string) => void;
  onDuplicateScenario: (id: string) => void;
  onAddCharge: (scenarioId: string, charge: Omit<Charge, 'id'>) => void;
  onUpdateCharge: (scenarioId: string, chargeId: string, updates: Partial<Charge>) => void;
  onDeleteCharge: (scenarioId: string, chargeId: string) => void;
  onAddIncome: (scenarioId: string, income: Omit<Income, 'id'>) => void;
  onUpdateIncome: (scenarioId: string, incomeId: string, updates: Partial<Income>) => void;
  onDeleteIncome: (scenarioId: string, incomeId: string) => void;
  onAddPatrimoine: (scenarioId: string, item: Omit<PatrimoineItem, 'id'>) => void;
  onUpdatePatrimoine: (scenarioId: string, itemId: string, updates: Partial<PatrimoineItem>) => void;
  onDeletePatrimoine: (scenarioId: string, itemId: string) => void;
}

type CreateSource = 'situation' | 'scenario' | 'empty';

export function ScenarioManager({
  scenarios, actualCharges, actualIncomes, actualPatrimoine,
  onCreateScenario, onDeleteScenario, onRenameScenario, onUpdateScenarioColor, onDuplicateScenario,
  onAddCharge, onUpdateCharge, onDeleteCharge,
  onAddIncome, onUpdateIncome, onDeleteIncome,
  onAddPatrimoine, onUpdatePatrimoine, onDeletePatrimoine,
}: ScenarioManagerProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(scenarios[0]?.id ?? null);
  const [newName, setNewName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createSource, setCreateSource] = useState<CreateSource>('situation');
  const [sourceScenarioId, setSourceScenarioId] = useState<string>('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [view, setView] = useState<'detail' | 'compare'>('detail');
  const [compareView, setCompareView] = useState<'cards' | 'table'>('cards');
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Compare view state (lifted from ScenarioComparison)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(scenarios.map(s => s.id));
  const [scenarioOrder, setScenarioOrder] = useState<string[]>(['__actual__', ...scenarios.map(s => s.id)]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  // Detect scroll to collapse menu
  useEffect(() => {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (!scrollContainer) return;
    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 40);
    };
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute effective order for compare view
  const currentOrder = scenarioOrder.filter(id => id === '__actual__' || scenarios.some(s => s.id === id && selectedScenarios.includes(s.id)));
  const missingIds = selectedScenarios.filter(id => !currentOrder.includes(id));
  const effectiveOrder = [...currentOrder, ...missingIds];
  if (!effectiveOrder.includes('__actual__')) effectiveOrder.unshift('__actual__');

  const softActualColor = 'hsl(160, 45%, 52%)';
  const colorMap: Record<string, string> = { '__actual__': softActualColor };
  scenarios.filter(s => selectedScenarios.includes(s.id)).forEach((s, i) => { colorMap[s.id] = getSoftColor(s, i + 1); });

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;
    setDropTarget(targetId);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;
    const newOrder = [...effectiveOrder];
    const fromIdx = newOrder.indexOf(draggedItem);
    const toIdx = newOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedItem);
    setScenarioOrder(newOrder);
    setDropTarget(null);
  };
  const handleDragEnd = () => { setDraggedItem(null); setDropTarget(null); };

  const handleCreate = () => {
    if (!newName.trim()) return;
    let baseCharges: Charge[] = [];
    let baseIncomes: Income[] = [];
    let basePatrimoine: PatrimoineItem[] = [];

    if (createSource === 'situation') {
      baseCharges = actualCharges;
      baseIncomes = actualIncomes;
      basePatrimoine = actualPatrimoine;
    } else if (createSource === 'scenario') {
      const source = scenarios.find(s => s.id === sourceScenarioId);
      if (source) {
        baseCharges = source.charges;
        baseIncomes = source.incomes;
        basePatrimoine = source.patrimoine;
      }
    }

    const id = onCreateScenario(newName.trim(), baseCharges, baseIncomes, basePatrimoine);
    setActiveScenarioId(id);
    setNewName('');
    setCreateOpen(false);
    setSelectedScenarios(prev => [...prev, id]);
    setScenarioOrder(prev => [...prev, id]);
    toast.success(`Scénario "${newName.trim()}" créé`);
  };

  const handleRename = () => {
    if (renameId && renameValue.trim()) {
      onRenameScenario(renameId, renameValue.trim());
      setRenameId(null);
    }
  };

  return (
    <div className="space-y-0">
      {/* Sticky header: view toggle + scenario tabs */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/20 -mx-3 sm:-mx-6 px-3 sm:px-6">
        {/* Collapsed bar when scrolled */}
        {isScrolled && !menuOpen ? (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{view === 'detail' ? (activeScenario?.name || 'Scénarios') : 'Comparaison'}</span>
              {view === 'detail' && activeScenario && (
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeScenario.color }} />
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="pb-4 space-y-3 pt-2">
            {/* Close button when menu forced open while scrolled */}
            {isScrolled && menuOpen && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setMenuOpen(false)}>
                  Réduire
                </Button>
              </div>
            )}
            {/* View toggle + Create */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
                <button
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'detail' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setView('detail')}
                >
                  Scénarios
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${view === 'compare' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setView('compare')}
                >
                  <Scale className="h-3.5 w-3.5" />
                  Comparer
                </button>
              </div>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Nouveau
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un scénario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Ex: Scénario optimiste"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Partir de :</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={createSource === 'situation' ? 'default' : 'outline'}
                          size="sm" onClick={() => setCreateSource('situation')} className="gap-2"
                        >
                          <Copy className="h-4 w-4" /> Ma situation
                        </Button>
                        <Button
                          variant={createSource === 'scenario' ? 'default' : 'outline'}
                          size="sm" onClick={() => setCreateSource('scenario')} className="gap-2"
                          disabled={scenarios.length === 0}
                        >
                          <FileStack className="h-4 w-4" /> Un scénario
                        </Button>
                        <Button
                          variant={createSource === 'empty' ? 'default' : 'outline'}
                          size="sm" onClick={() => setCreateSource('empty')} className="gap-2"
                        >
                          <FolderOpen className="h-4 w-4" /> Vide
                        </Button>
                      </div>
                      {createSource === 'scenario' && scenarios.length > 0 && (
                        <Select value={sourceScenarioId} onValueChange={setSourceScenarioId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir un scénario source" />
                          </SelectTrigger>
                          <SelectContent>
                            {scenarios.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button
                      onClick={handleCreate} className="w-full"
                      disabled={!newName.trim() || (createSource === 'scenario' && !sourceScenarioId)}
                    >
                      Créer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Scenario tabs - detail view */}
            {view === 'detail' && scenarios.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {scenarios.map((s) => {
                  const isActive = s.id === activeScenarioId;
                  return (
                    <div key={s.id} className="flex items-center gap-0.5">
                      <motion.button
                        onClick={() => { setActiveScenarioId(s.id); if (isScrolled) setMenuOpen(false); }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          isActive
                            ? 'bg-card border-border shadow-sm'
                            : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </motion.button>

                      {isActive && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="start">
                            <div className="space-y-1">
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors"
                                onClick={() => { setRenameId(s.id); setRenameValue(s.name); }}
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Renommer
                              </button>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors"
                                onClick={() => onDuplicateScenario(s.id)}
                              >
                                <Copy className="h-3.5 w-3.5" /> Dupliquer
                              </button>
                              <div className="px-3 py-2">
                                <div className="flex items-center gap-2 text-sm mb-2">
                                  <Palette className="h-3.5 w-3.5" /> Couleur
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {PRESET_COLORS.map(c => (
                                    <button
                                      key={c}
                                      className={`w-6 h-6 rounded-full border-2 transition-all ${s.color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-110'}`}
                                      style={{ backgroundColor: c }}
                                      onClick={() => onUpdateScenarioColor(s.id, c)}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="h-px bg-border my-1" />
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                onClick={() => {
                                  onDeleteScenario(s.id);
                                  setActiveScenarioId(scenarios.find(x => x.id !== s.id)?.id ?? null);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scenario toggle checkboxes - compare view */}
            {view === 'compare' && scenarios.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {scenarios.map((s) => {
                  const isSelected = selectedScenarios.includes(s.id);
                  return (
                    <motion.button
                      key={s.id}
                      onClick={() => toggleScenario(s.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                        isSelected ? 'bg-card border-border shadow-sm' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40'
                      }`}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorMap[s.id] || softActualColor }} />
                      {s.name}
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison view */}
      {view === 'compare' && (
        <div className="pt-4 space-y-6">
          {/* Switch cards / table */}
          <div className="flex items-center gap-3">
            <Label htmlFor="compare-view-switch" className={`text-sm font-medium ${compareView === 'cards' ? 'text-foreground' : 'text-muted-foreground'}`}>Cards</Label>
            <Switch
              id="compare-view-switch"
              checked={compareView === 'table'}
              onCheckedChange={(checked) => setCompareView(checked ? 'table' : 'cards')}
            />
            <Label htmlFor="compare-view-switch" className={`text-sm font-medium ${compareView === 'table' ? 'text-foreground' : 'text-muted-foreground'}`}>Tableau</Label>
          </div>

          {compareView === 'cards' ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {effectiveOrder.map((id) => {
                const isActual = id === '__actual__';
                const scenario = isActual ? null : scenarios.find(s => s.id === id);
                if (!isActual && (!scenario || !selectedScenarios.includes(id))) return null;
                const label = isActual ? 'Actuel' : scenario!.name;
                const charges = isActual ? actualCharges : scenario!.charges;
                const incomes = isActual ? actualIncomes : scenario!.incomes;
                const color = colorMap[id] || softActualColor;

                const now = new Date();
                const cy = now.getFullYear();
                const cm = now.getMonth();

                const recCharges = charges.filter(c => c.type !== 'one-time').reduce((s, c) => s + getChargeAmountForMonth(c, cy, cm), 0);
                const recIncomes = incomes.filter(i => i.isRecurring).reduce((s, i) => s + getIncomeAmountForMonth(i, cy, cm), 0);
                const otCharges = charges.filter(c => c.type === 'one-time').reduce((s, c) => s + getChargeAmountForMonth(c, cy, cm), 0);
                const otIncomes = incomes.filter(i => !i.isRecurring).reduce((s, i) => s + getIncomeAmountForMonth(i, cy, cm), 0);
                const recBalance = recIncomes - recCharges;
                const totalGlobal = (recIncomes + otIncomes) - (recCharges + otCharges);

                // Écart vs actuel
                const actualRecI = actualIncomes.filter(i => i.isRecurring).reduce((s, i) => s + getIncomeAmountForMonth(i, cy, cm), 0);
                const actualRecC = actualCharges.filter(c => c.type !== 'one-time').reduce((s, c) => s + getChargeAmountForMonth(c, cy, cm), 0);
                const actualBal = actualRecI - actualRecC;
                const diff = recBalance - actualBal;

                const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

                const isDropTarget_ = dropTarget === id && draggedItem !== id;

                return (
                  <motion.div
                    key={id}
                    draggable
                    onDragStart={() => handleDragStart(id)}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDrop={(e) => handleDrop(e, id)}
                    onDragLeave={() => { if (dropTarget === id) setDropTarget(null); }}
                    onDragEnd={handleDragEnd}
                    className={`relative glass-card p-4 cursor-grab active:cursor-grabbing transition-all ${
                      draggedItem === id ? 'opacity-50 scale-95' : ''
                    } ${isDropTarget_ ? 'ring-2 ring-primary/50' : ''}`}
                    whileHover={{ y: -2 }}
                    layout
                  >
                    {isDropTarget_ && (
                      <div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-primary animate-pulse" />
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-semibold truncate">{label}</span>
                    </div>
                    <ScenarioPieChart charges={charges} incomes={incomes} bare />

                    {/* Table data integrated */}
                    <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rev. récurrents</span>
                        <span className="font-medium text-primary tabular-nums">{fmt(recIncomes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ch. récurrentes</span>
                        <span className="font-medium text-destructive tabular-nums">{fmt(recCharges)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Solde récurrent</span>
                        <span className={`tabular-nums ${recBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(recBalance)}</span>
                      </div>

                      {(otIncomes > 0 || otCharges > 0) && (
                        <>
                          <div className="h-px bg-border/30 my-1" />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground italic">Rev. ponctuels</span>
                            <span className="font-medium text-primary tabular-nums">{fmt(otIncomes)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground italic">Ch. ponctuelles</span>
                            <span className="font-medium text-destructive tabular-nums">{fmt(otCharges)}</span>
                          </div>
                        </>
                      )}

                      <div className="h-px bg-border/50 my-1" />
                      <div className="flex justify-between font-bold">
                        <span>Total global</span>
                        <span className={`tabular-nums ${totalGlobal >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(totalGlobal)}</span>
                      </div>

                      {!isActual && (
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Écart vs actuel</span>
                          <span className={`font-semibold tabular-nums inline-flex items-center gap-0.5 ${diff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Table view — reuse ScenarioComparison which already has the table */
            null
          )}

          <ScenarioComparison
            scenarios={scenarios}
            actualCharges={actualCharges}
            actualIncomes={actualIncomes}
            selectedScenarios={selectedScenarios}
            effectiveOrder={effectiveOrder}
            hideTable={compareView === 'cards'}
          />
        </div>
      )}

      {/* Detail view */}
      {view === 'detail' && (
        <div className="space-y-6 pt-4">
          {scenarios.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">Aucun scénario</p>
              <p className="text-sm">Créez votre premier scénario pour commencer à simuler.</p>
            </div>
          )}

          {/* Rename dialog */}
          <Dialog open={renameId !== null} onOpenChange={(o) => !o && setRenameId(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Renommer le scénario</DialogTitle></DialogHeader>
              <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} />
              <Button onClick={handleRename} className="w-full">Renommer</Button>
            </DialogContent>
          </Dialog>

          {/* Active scenario content */}
          {activeScenario && (
              <div
                key={activeScenario.id}
                className="space-y-5"
              >
                <div className="rounded-xl border bg-card p-3 sm:p-4">
                  <h3 className="text-sm font-semibold mb-3">Répartition mensuelle</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2 min-h-[200px]">
                      <ScenarioPieChart charges={activeScenario.charges} incomes={activeScenario.incomes} bare />
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center">
                      <SummaryCards charges={activeScenario.charges} incomes={activeScenario.incomes} compact grid2x2 />
                    </div>
                  </div>
                </div>

                {/* Charges collapsible */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-semibold">Charges</h2>
                      <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{activeScenario.charges.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChargeForm onSubmit={(c) => onAddCharge(activeScenario.id, c)} isProjection />
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <ChargeList
                      charges={activeScenario.charges}
                      onDelete={(cid) => onDeleteCharge(activeScenario.id, cid)}
                      onUpdate={(cid, u) => onUpdateCharge(activeScenario.id, cid, u)}
                      onAdd={(c) => onAddCharge(activeScenario.id, c)}
                      isProjection
                      storageKey={`charge-order-${activeScenario.id}`}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Revenus collapsible */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-semibold">Revenus</h2>
                      <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{activeScenario.incomes.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IncomeForm onSubmit={(i) => onAddIncome(activeScenario.id, i)} isProjection />
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <IncomeList
                      incomes={activeScenario.incomes}
                      onDelete={(iid) => onDeleteIncome(activeScenario.id, iid)}
                      onUpdate={(iid, u) => onUpdateIncome(activeScenario.id, iid, u)}
                      onAdd={(i) => onAddIncome(activeScenario.id, i)}
                      isProjection
                      storageKey={`income-order-${activeScenario.id}`}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Patrimoine collapsible */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-semibold">Patrimoine</h2>
                      <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{activeScenario.patrimoine.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PatrimoineForm onSubmit={(p) => onAddPatrimoine(activeScenario.id, p)} />
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <PatrimoineList
                      items={activeScenario.patrimoine}
                      onDelete={(pid) => onDeletePatrimoine(activeScenario.id, pid)}
                      onUpdate={(pid, u) => onUpdatePatrimoine(activeScenario.id, pid, u)}
                      onAdd={(p) => onAddPatrimoine(activeScenario.id, p)}
                      storageKey={`patrimoine-order-${activeScenario.id}`}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
          )}
        </div>
      )}
    </div>
  );
}
