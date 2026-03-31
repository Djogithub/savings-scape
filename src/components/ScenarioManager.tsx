import { useState } from 'react';
import { Scenario, Charge, Income } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChargeList } from './ChargeList';
import { ChargeForm } from './ChargeForm';
import { IncomeList } from './IncomeList';
import { IncomeForm } from './IncomeForm';
import { SummaryCards } from './SummaryCards';
import { Plus, Copy, Trash2, Edit2, FolderOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ScenarioManagerProps {
  scenarios: Scenario[];
  actualCharges: Charge[];
  actualIncomes: Income[];
  onCreateScenario: (name: string, charges?: Charge[], incomes?: Income[]) => string;
  onDeleteScenario: (id: string) => void;
  onRenameScenario: (id: string, name: string) => void;
  onDuplicateScenario: (id: string) => void;
  onAddCharge: (scenarioId: string, charge: Omit<Charge, 'id'>) => void;
  onUpdateCharge: (scenarioId: string, chargeId: string, updates: Partial<Charge>) => void;
  onDeleteCharge: (scenarioId: string, chargeId: string) => void;
  onAddIncome: (scenarioId: string, income: Omit<Income, 'id'>) => void;
  onUpdateIncome: (scenarioId: string, incomeId: string, updates: Partial<Income>) => void;
  onDeleteIncome: (scenarioId: string, incomeId: string) => void;
}

export function ScenarioManager({
  scenarios, actualCharges, actualIncomes,
  onCreateScenario, onDeleteScenario, onRenameScenario, onDuplicateScenario,
  onAddCharge, onUpdateCharge, onDeleteCharge,
  onAddIncome, onUpdateIncome, onDeleteIncome,
}: ScenarioManagerProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(scenarios[0]?.id ?? null);
  const [newName, setNewName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'empty' | 'copy'>('copy');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = onCreateScenario(
      newName.trim(),
      createMode === 'copy' ? actualCharges : [],
      createMode === 'copy' ? actualIncomes : [],
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
      {/* Scenario selector bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        {scenarios.length > 0 && (
          <Select value={activeScenarioId ?? ''} onValueChange={setActiveScenarioId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Sélectionner un scénario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Nouveau scénario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un scénario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Ex: Scénario optimiste"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={createMode === 'copy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateMode('copy')}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" /> Copier les données actuelles
                </Button>
                <Button
                  variant={createMode === 'empty' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateMode('empty')}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" /> Vide
                </Button>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newName.trim()}>
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {activeScenario && (
          <div className="flex gap-1 ml-auto">
            <Button
              variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => { setRenameId(activeScenario.id); setRenameValue(activeScenario.name); }}
              title="Renommer"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => onDuplicateScenario(activeScenario.id)}
              title="Dupliquer"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-9 w-9 text-destructive"
              onClick={() => {
                onDeleteScenario(activeScenario.id);
                setActiveScenarioId(scenarios.find(s => s.id !== activeScenario.id)?.id ?? null);
              }}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Rename dialog */}
      <Dialog open={renameId !== null} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renommer le scénario</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} />
          <Button onClick={handleRename} className="w-full">Renommer</Button>
        </DialogContent>
      </Dialog>

      {/* Active scenario content */}
      {!activeScenario ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Aucun scénario</p>
          <p className="text-sm">Créez votre premier scénario pour commencer à simuler.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <SummaryCards charges={activeScenario.charges} incomes={activeScenario.incomes} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Charges</h2>
                <ChargeForm
                  onSubmit={(c) => onAddCharge(activeScenario.id, c)}
                  isProjection
                />
              </div>
              <ChargeList
                charges={activeScenario.charges}
                onDelete={(cid) => onDeleteCharge(activeScenario.id, cid)}
                onUpdate={(cid, u) => onUpdateCharge(activeScenario.id, cid, u)}
                onAdd={(c) => onAddCharge(activeScenario.id, c)}
                isProjection
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Revenus</h2>
                <IncomeForm
                  onSubmit={(i) => onAddIncome(activeScenario.id, i)}
                  isProjection
                />
              </div>
              <IncomeList
                incomes={activeScenario.incomes}
                onDelete={(iid) => onDeleteIncome(activeScenario.id, iid)}
                onUpdate={(iid, u) => onUpdateIncome(activeScenario.id, iid, u)}
                onAdd={(i) => onAddIncome(activeScenario.id, i)}
                isProjection
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
