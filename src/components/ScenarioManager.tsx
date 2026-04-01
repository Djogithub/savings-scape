import { useState } from 'react';
import { Scenario, Charge, Income, PatrimoineItem } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChargeList } from './ChargeList';
import { ChargeForm } from './ChargeForm';
import { IncomeList } from './IncomeList';
import { IncomeForm } from './IncomeForm';
import { PatrimoineList } from './PatrimoineList';
import { PatrimoineForm } from './PatrimoineForm';
import { SummaryCards } from './SummaryCards';
import { ScenarioComparison } from './ScenarioComparison';
import { Plus, Copy, Trash2, Edit2, FolderOpen, MoreHorizontal, Palette, Scale, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_COLORS = [
  'hsl(152, 44%, 42%)', 'hsl(220, 70%, 55%)', 'hsl(340, 65%, 50%)',
  'hsl(45, 85%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(180, 50%, 45%)',
  'hsl(15, 75%, 55%)', 'hsl(200, 65%, 50%)',
];

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
  const [createMode, setCreateMode] = useState<'empty' | 'copy'>('copy');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [view, setView] = useState<'detail' | 'compare'>('detail');

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = onCreateScenario(
      newName.trim(),
      createMode === 'copy' ? actualCharges : [],
      createMode === 'copy' ? actualIncomes : [],
      createMode === 'copy' ? actualPatrimoine : [],
    );
    setActiveScenarioId(id);
    setNewName('');
    setCreateOpen(false);
    toast.success(`Scénario "${newName.trim()}" créé`);
  };

  const handleRename = () => {
    if (renameId && renameValue.trim()) {
      onRenameScenario(renameId, renameValue.trim());
      setRenameId(null);
    }
  };

  return (
    <div className="space-y-6">
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
              <div className="flex gap-2">
                <Button
                  variant={createMode === 'copy' ? 'default' : 'outline'}
                  size="sm" onClick={() => setCreateMode('copy')} className="gap-2"
                >
                  <Copy className="h-4 w-4" /> Copier données actuelles
                </Button>
                <Button
                  variant={createMode === 'empty' ? 'default' : 'outline'}
                  size="sm" onClick={() => setCreateMode('empty')} className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" /> Vide
                </Button>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newName.trim()}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Comparison view */}
      {view === 'compare' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <ScenarioComparison
              scenarios={scenarios}
              actualCharges={actualCharges}
              actualIncomes={actualIncomes}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Detail view */}
      {view === 'detail' && (
        <div className="space-y-6">
          {scenarios.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">Aucun scénario</p>
              <p className="text-sm">Créez votre premier scénario pour commencer à simuler.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s) => {
                const isActive = s.id === activeScenarioId;
                return (
                  <div key={s.id} className="flex items-center gap-0.5">
                    <motion.button
                      onClick={() => setActiveScenarioId(s.id)}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScenario.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <SummaryCards charges={activeScenario.charges} incomes={activeScenario.incomes} compact />

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
                    />
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
