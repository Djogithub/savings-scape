import { useRef } from 'react';
import { useFinanceData, exportData, importData } from '@/hooks/useFinanceData';
import { useScenarios } from '@/hooks/useScenarios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCards } from '@/components/SummaryCards';
import { ChargeList } from '@/components/ChargeList';
import { IncomeList } from '@/components/IncomeList';
import { IncomeForm } from '@/components/IncomeForm';
import { TimelineChart } from '@/components/TimelineChart';
import { ChargeForm } from '@/components/ChargeForm';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { ScenarioManager } from '@/components/ScenarioManager';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { Button } from '@/components/ui/button';
import { BarChart3, ListChecks, GitCompare, PieChart, Download, Upload, Sun, Moon, Scale, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

const Index = () => {
  const {
    data,
    actualCharges, projectedCharges,
    actualIncomes, projectedIncomes,
    addCharge, updateCharge, deleteCharge,
    addIncome, updateIncome, deleteIncome,
    loadFromImport,
  } = useFinanceData();

  const {
    scenarios,
    createScenario, deleteScenario, renameScenario, duplicateScenario,
    addChargeToScenario, updateChargeInScenario, deleteChargeFromScenario,
    addIncomeToScenario, updateIncomeInScenario, deleteIncomeFromScenario,
  } = useScenarios();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const handleExport = () => {
    exportData(data);
    toast.success('Données exportées avec succès');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      loadFromImport(imported);
      toast.success('Données importées avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'import');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MonBudget</h1>
              <p className="text-[11px] text-muted-foreground leading-none">Gestion de comptes personnels</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        <Tabs defaultValue="actual" className="space-y-8">
          {/* Premium pill navigation */}
          <div className="flex justify-center">
            <TabsList className="bg-muted/60 backdrop-blur-sm p-1 rounded-2xl border border-border/40 gap-0.5 h-auto">
              <TabsTrigger value="actual" className="gap-2 tab-pill data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">Situation</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2 tab-pill data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Catégories</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2 tab-pill data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="projections" className="gap-2 tab-pill data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <GitCompare className="h-4 w-4" />
                <span className="hidden sm:inline">Scénarios</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2 tab-pill data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Comparer</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Actual Tab */}
          <TabsContent value="actual" className="space-y-6">
            <SummaryCards charges={actualCharges} incomes={actualIncomes} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Charges</h2>
                  <ChargeForm onSubmit={addCharge} />
                </div>
                <ChargeList
                  charges={actualCharges}
                  onDelete={deleteCharge}
                  onUpdate={updateCharge}
                  onAdd={addCharge}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Revenus</h2>
                  <IncomeForm onSubmit={addIncome} />
                </div>
                <IncomeList
                  incomes={actualIncomes}
                  onDelete={deleteIncome}
                  onUpdate={updateIncome}
                  onAdd={addIncome}
                />
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <CategoryBreakdown charges={actualCharges} incomes={actualIncomes} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <SummaryCards charges={actualCharges} incomes={actualIncomes} />
            <TimelineChart charges={actualCharges} incomes={actualIncomes} />
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="projections" className="space-y-6">
            <div className="glass-card p-4 border-l-4 border-l-warning/60">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Scénarios</span> — Simulez différentes situations financières. Chaque scénario peut partir de vos données actuelles ou être créé de zéro.
              </p>
            </div>
            <ScenarioManager
              scenarios={scenarios}
              actualCharges={actualCharges}
              actualIncomes={actualIncomes}
              onCreateScenario={createScenario}
              onDeleteScenario={deleteScenario}
              onRenameScenario={renameScenario}
              onDuplicateScenario={duplicateScenario}
              onAddCharge={addChargeToScenario}
              onUpdateCharge={updateChargeInScenario}
              onDeleteCharge={deleteChargeFromScenario}
              onAddIncome={addIncomeToScenario}
              onUpdateIncome={updateIncomeInScenario}
              onDeleteIncome={deleteIncomeFromScenario}
            />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <ScenarioComparison
              scenarios={scenarios}
              actualCharges={actualCharges}
              actualIncomes={actualIncomes}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Need Wallet icon
import { Wallet } from 'lucide-react';

export default Index;
