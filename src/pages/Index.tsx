import { useFinanceData } from '@/hooks/useFinanceData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCards } from '@/components/SummaryCards';
import { ChargeList } from '@/components/ChargeList';
import { IncomeList } from '@/components/IncomeList';
import { IncomeForm } from '@/components/IncomeForm';
import { TimelineChart } from '@/components/TimelineChart';
import { ChargeForm } from '@/components/ChargeForm';
import { BarChart3, ListChecks, GitCompare } from 'lucide-react';

const Index = () => {
  const {
    actualCharges, projectedCharges,
    actualIncomes, projectedIncomes,
    addCharge, updateCharge, deleteCharge,
    addIncome, deleteIncome,
  } = useFinanceData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">MonBudget</h1>
            <p className="text-xs text-muted-foreground">Gestion de comptes personnels</p>
          </div>
          <div className="flex gap-2">
            <IncomeForm onSubmit={addIncome} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="actual" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="actual" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ListChecks className="h-4 w-4" />
              Situation actuelle
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="projections" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitCompare className="h-4 w-4" />
              Scénarios
            </TabsTrigger>
          </TabsList>

          {/* Actual Tab */}
          <TabsContent value="actual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne Charges */}
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

              {/* Colonne Revenus */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Revenus</h2>
                  <IncomeForm onSubmit={addIncome} />
                </div>
                <IncomeList incomes={actualIncomes} onDelete={deleteIncome} />
              </div>
            </div>

            {/* Solde disponible below both columns */}
            <SummaryCards charges={actualCharges} incomes={actualIncomes} />
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
