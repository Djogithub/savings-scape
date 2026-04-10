import { useRef, useState, useEffect } from 'react';
import { useFinanceData, exportData, importData } from '@/hooks/useFinanceData';
import { useScenarios } from '@/hooks/useScenarios';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SummaryCards } from '@/components/SummaryCards';
import { ChargeList } from '@/components/ChargeList';
import { IncomeList } from '@/components/IncomeList';
import { IncomeForm } from '@/components/IncomeForm';
import { TimelineChart } from '@/components/TimelineChart';
import { ChargeForm } from '@/components/ChargeForm';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { ScenarioManager } from '@/components/ScenarioManager';
import { PatrimoineList } from '@/components/PatrimoineList';
import { PatrimoineForm } from '@/components/PatrimoineForm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Button } from '@/components/ui/button';
import { Download, Upload, Sun, Moon, Wallet, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useSkin } from '@/hooks/useSkin';
import { SkinSelector } from '@/components/SkinSelector';
import { motion, AnimatePresence } from 'framer-motion';

const tabContentVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2 } },
};

const Index = () => {
  const {
    data,
    actualCharges, projectedCharges,
    actualIncomes, projectedIncomes,
    patrimoine,
    addCharge, updateCharge, deleteCharge,
    addIncome, updateIncome, deleteIncome,
    addPatrimoine, updatePatrimoine, deletePatrimoine,
    loadFromImport,
  } = useFinanceData();

  const {
    scenarios,
    createScenario, deleteScenario, renameScenario, updateScenarioColor, duplicateScenario,
    addChargeToScenario, updateChargeInScenario, deleteChargeFromScenario,
    addIncomeToScenario, updateIncomeInScenario, deleteIncomeFromScenario,
    addPatrimoineToScenario, updatePatrimoineInScenario, deletePatrimoineFromScenario,
    syncWithBase,
  } = useScenarios();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { skin, setSkin } = useSkin();
  const [activeTab, setActiveTab] = useState('actual');

  useEffect(() => {
    if (scenarios.length > 0) {
      syncWithBase(data.charges, data.incomes, data.patrimoine);
    }
  }, [data.charges, data.incomes, data.patrimoine]);

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="mr-1" />
                <motion.div
                  className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Wallet className="h-5 w-5 text-primary" />
                </motion.div>
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
                <SkinSelector skin={skin} setSkin={setSkin} />
                <motion.div whileTap={{ scale: 0.9, rotate: 180 }} transition={{ duration: 0.3 }}>
                  <Button
                    variant="ghost" size="icon"
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
                  >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </motion.div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 space-y-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial="hidden" animate="visible" exit="exit" variants={tabContentVariants}>
                {activeTab === 'actual' && (
                  <div className="space-y-8">
                    <SummaryCards charges={actualCharges} incomes={actualIncomes} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="glass-card p-5 space-y-4">
                        <Collapsible>
                          <div className="flex items-center justify-between">
                            <CollapsibleTrigger className="flex items-center gap-2 group cursor-pointer">
                              <h2 className="text-base font-semibold tracking-tight">Charges</h2>
                              <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{actualCharges.length}</span>
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <ChargeForm onSubmit={addCharge} />
                          </div>
                          <CollapsibleContent className="pt-4">
                            <ChargeList charges={actualCharges} onDelete={deleteCharge} onUpdate={updateCharge} onAdd={addCharge} />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      <div className="glass-card p-5 space-y-4">
                        <Collapsible>
                          <div className="flex items-center justify-between">
                            <CollapsibleTrigger className="flex items-center gap-2 group cursor-pointer">
                              <h2 className="text-base font-semibold tracking-tight">Revenus</h2>
                              <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{actualIncomes.length}</span>
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <IncomeForm onSubmit={addIncome} />
                          </div>
                          <CollapsibleContent className="pt-4">
                            <IncomeList incomes={actualIncomes} onDelete={deleteIncome} onUpdate={updateIncome} onAdd={addIncome} />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      <div className="glass-card p-5 space-y-4">
                        <Collapsible>
                          <div className="flex items-center justify-between">
                            <CollapsibleTrigger className="flex items-center gap-2 group cursor-pointer">
                              <h2 className="text-base font-semibold tracking-tight">Patrimoine</h2>
                              <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{patrimoine.length}</span>
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <PatrimoineForm onSubmit={addPatrimoine} />
                          </div>
                          <CollapsibleContent className="pt-4">
                            <PatrimoineList items={patrimoine} onDelete={deletePatrimoine} onUpdate={updatePatrimoine} onAdd={addPatrimoine} />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <TimelineChart charges={actualCharges} incomes={actualIncomes} />
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <CategoryBreakdown charges={actualCharges} incomes={actualIncomes} />
                  </div>
                )}

                {activeTab === 'projections' && (
                  <div className="space-y-6">
                    <motion.div
                      className="glass-card p-4 border-l-4 border-l-warning/60"
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                    >
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Scénarios</span> — Simulez différentes situations financières.
                      </p>
                    </motion.div>
                    <ScenarioManager
                      scenarios={scenarios}
                      actualCharges={actualCharges}
                      actualIncomes={actualIncomes}
                      actualPatrimoine={patrimoine}
                      onCreateScenario={createScenario}
                      onDeleteScenario={deleteScenario}
                      onRenameScenario={renameScenario}
                      onUpdateScenarioColor={updateScenarioColor}
                      onDuplicateScenario={duplicateScenario}
                      onAddCharge={addChargeToScenario}
                      onUpdateCharge={updateChargeInScenario}
                      onDeleteCharge={deleteChargeFromScenario}
                      onAddIncome={addIncomeToScenario}
                      onUpdateIncome={updateIncomeInScenario}
                      onDeleteIncome={deleteIncomeFromScenario}
                      onAddPatrimoine={addPatrimoineToScenario}
                      onUpdatePatrimoine={updatePatrimoineInScenario}
                      onDeletePatrimoine={deletePatrimoineFromScenario}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
