import { useRef } from 'react';
import { useFinanceData, exportData, importData } from '@/hooks/useFinanceData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCards } from '@/components/SummaryCards';
import { ChargeList } from '@/components/ChargeList';
import { IncomeList } from '@/components/IncomeList';
import { IncomeForm } from '@/components/IncomeForm';
import { TimelineChart } from '@/components/TimelineChart';
import { ChargeForm } from '@/components/ChargeForm';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { Button } from '@/components/ui/button';
import { BarChart3, ListChecks, GitCompare, PieChart, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const {
    data,
    actualCharges, projectedCharges,
    actualIncomes, projectedIncomes,
    addCharge, updateCharge, deleteCharge,
    addIncome, deleteIncome,
    loadFromImport,
  } = useFinanceData();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold gradient-text text-3xl">MonBudget</h1>
            <p className="text-xs text-muted-foreground">Gestion de comptes personnels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Importer
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="actual" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 rounded-lg">
            <TabsTrigger value="actual" className="gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ListChecks className="h-4 w-4" />
              Situation actuelle
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PieChart className="h-4 w-4" />
              Par catégorie
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="projections" className="gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitCompare className="h-4 w-4" />
              Scénarios
            </TabsTrigger>
          </TabsList>

          {/* Actual Tab */}
          <TabsContent value="actual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Charges</h2>
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
                  <h2 className="text-xl font-semibold">Revenus</h2>
                  <IncomeForm onSubmit={addIncome} />
                </div>
                <IncomeList incomes={actualIncomes} onDelete={deleteIncome} />
              </div>
            </div>
            <SummaryCards charges={actualCharges} incomes={actualIncomes} />
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

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-6">
            <div className="glass-card p-4 border-warning/30">
              <p className="text-sm text-warning">
                ⚡ Mode projection — Ajoutez des charges et revenus hypothétiques pour comparer avec votre situation actuelle.
              </p>
            </div>
            <TimelineChart
              charges={actualCharges}
              incomes={actualIncomes}
              projectedCharges={projectedCharges}
              projectedIncomes={projectedIncomes}
              showProjections
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Charges projetées</h2>
                  <ChargeForm onSubmit={(c) => addCharge({ ...c, isProjection: true })} isProjection />
                </div>
                <ChargeList
                  charges={projectedCharges}
                  onDelete={deleteCharge}
                  onUpdate={updateCharge}
                  isProjection
                  onAdd={(c) => addCharge({ ...c, isProjection: true })}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Revenus projetés</h2>
                  <IncomeForm onSubmit={(i) => addIncome({ ...i, isProjection: true })} isProjection />
                </div>
                <IncomeList incomes={projectedIncomes} onDelete={deleteIncome} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
