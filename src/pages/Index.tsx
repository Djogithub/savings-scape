import { useRef, useState, useEffect } from 'react';
import { useFinanceData, exportData, importData } from '@/hooks/useFinanceData';
import { useScenarios } from '@/hooks/useScenarios';
import { MobileNav } from '@/components/MobileNav';
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
import { Download, Upload, Sun, Moon, Wallet, ChevronDown, ListChecks, PieChart, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useSkin } from '@/hooks/useSkin';
import { SkinSelector } from '@/components/SkinSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useCallback } from 'react';
import { CopyTarget } from '@/components/CopyToDropdown';
import { Charge, Income, PatrimoineItem } from '@/types/finance';
const tabContentVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2 } },
};

const navItems = [
  { title: 'Situation', value: 'actual', icon: ListChecks },
  { title: 'Catégories', value: 'categories', icon: PieChart },
  { title: 'Scénarios', value: 'projections', icon: GitCompare },
];

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

  const copyTargets: CopyTarget[] = useMemo(() =>
    scenarios.map(s => ({ id: s.id, name: s.name, color: s.color })),
    [scenarios]
  );

  const handleCopyChargeToPersonal = useCallback((charge: Charge) => {
    const { id, isProjection, originId, ...rest } = charge;
    addCharge(rest);
  }, [addCharge]);

  const handleCopyIncomeToPersonal = useCallback((income: Income) => {
    const { id, isProjection, originId, ...rest } = income;
    addIncome(rest);
  }, [addIncome]);

  const handleCopyPatrimoineToPersonal = useCallback((item: PatrimoineItem) => {
    const { id, ...rest } = item;
    addPatrimoine(rest);
  }, [addPatrimoine]);

  const handleCopyChargeToScenario = useCallback((scenarioId: string, charge: Charge) => {
    const { id, ...rest } = charge;
    addChargeToScenario(scenarioId, rest);
  }, [addChargeToScenario]);

  const handleCopyIncomeToScenario = useCallback((scenarioId: string, income: Income) => {
    const { id, ...rest } = income;
    addIncomeToScenario(scenarioId, rest);
  }, [addIncomeToScenario]);

  const handleCopyPatrimoineToScenario = useCallback((scenarioId: string, item: PatrimoineItem) => {
    const { id, ...rest } = item;
    addPatrimoineToScenario(scenarioId, rest);
  }, [addPatrimoineToScenario]);

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
    <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Wallet className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">MonBudget</h1>
              <p className="text-[11px] text-muted-foreground leading-none">Gestion de comptes personnels</p>
            </div>
          </div>

          {/* Navigation tabs - hidden on mobile (bottom nav used instead) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.value}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(item.value)}
                className={`gap-2 transition-colors ${
                  activeTab === item.value
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </nav>

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

      <div className="flex-1 overflow-y-auto">
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 pb-32 md:pb-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial="hidden" animate="visible" exit="exit" variants={tabContentVariants}>
              {activeTab === 'actual' && (
                <div className="space-y-8">
                  <h1 className="text-2xl font-bold tracking-tight">Situation personnelle</h1>
                  <p className="text-sm text-muted-foreground -mt-6">Vue d'ensemble de vos finances actuelles.</p>
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
                          <ChargeList charges={actualCharges} onDelete={deleteCharge} onUpdate={updateCharge} onAdd={addCharge} copyTargets={copyTargets} isPersonal onCopyToPersonal={handleCopyChargeToPersonal} onCopyToScenario={handleCopyChargeToScenario} />
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
                          <IncomeList incomes={actualIncomes} onDelete={deleteIncome} onUpdate={updateIncome} onAdd={addIncome} copyTargets={copyTargets} isPersonal onCopyToPersonal={handleCopyIncomeToPersonal} onCopyToScenario={handleCopyIncomeToScenario} />
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
                          <PatrimoineList items={patrimoine} onDelete={deletePatrimoine} onUpdate={updatePatrimoine} onAdd={addPatrimoine} copyTargets={copyTargets} isPersonal onCopyToPersonal={handleCopyPatrimoineToPersonal} onCopyToScenario={handleCopyPatrimoineToScenario} />
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <TimelineChart charges={actualCharges} incomes={actualIncomes} />
                  </div>
                </div>
              )}


              {activeTab === 'projections' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold tracking-tight">Scénarios</h1>
                  <p className="text-sm text-muted-foreground -mt-4">Simulez différentes situations financières.</p>
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
                    onCopyChargeToPersonal={handleCopyChargeToPersonal}
                    onCopyIncomeToPersonal={handleCopyIncomeToPersonal}
                    onCopyPatrimoineToPersonal={handleCopyPatrimoineToPersonal}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
