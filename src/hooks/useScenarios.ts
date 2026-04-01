import { useState, useCallback, useEffect } from 'react';
import { Scenario, Charge, Income } from '@/types/finance';

const SCENARIOS_KEY = 'finance-app-scenarios';

const SCENARIO_COLORS = [
  'hsl(152, 44%, 42%)', 'hsl(220, 70%, 55%)', 'hsl(340, 65%, 50%)',
  'hsl(45, 85%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(180, 50%, 45%)',
  'hsl(15, 75%, 55%)', 'hsl(200, 65%, 50%)',
];

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load scenarios:', e);
  }
  return [];
}

function saveScenarios(scenarios: Scenario[]) {
  try {
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  } catch (e) {
    console.error('Failed to save scenarios:', e);
  }
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios);

  useEffect(() => {
    saveScenarios(scenarios);
  }, [scenarios]);

  const createScenario = useCallback((name: string, baseCharges: Charge[] = [], baseIncomes: Income[] = []) => {
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      charges: baseCharges.map(c => ({ ...c, id: crypto.randomUUID(), isProjection: true })),
      incomes: baseIncomes.map(i => ({ ...i, id: crypto.randomUUID(), isProjection: true })),
      createdAt: new Date().toISOString(),
      color: SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length],
    };
    setScenarios(prev => [...prev, newScenario]);
    return newScenario.id;
  }, [scenarios.length]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, []);

  const renameScenario = useCallback((id: string, name: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }, []);

  const updateScenarioColor = useCallback((id: string, color: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, color } : s));
  }, []);

  const duplicateScenario = useCallback((id: string) => {
    setScenarios(prev => {
      const source = prev.find(s => s.id === id);
      if (!source) return prev;
      const dup: Scenario = {
        ...source,
        id: crypto.randomUUID(),
        name: `${source.name} (copie)`,
        charges: source.charges.map(c => ({ ...c, id: crypto.randomUUID() })),
        incomes: source.incomes.map(i => ({ ...i, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
        color: SCENARIO_COLORS[prev.length % SCENARIO_COLORS.length],
      };
      return [...prev, dup];
    });
  }, []);

  const addChargeToScenario = useCallback((scenarioId: string, charge: Omit<Charge, 'id'>) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, charges: [...s.charges, { ...charge, id: crypto.randomUUID(), isProjection: true }] }
        : s
    ));
  }, []);

  const updateChargeInScenario = useCallback((scenarioId: string, chargeId: string, updates: Partial<Charge>) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, charges: s.charges.map(c => c.id === chargeId ? { ...c, ...updates } : c) }
        : s
    ));
  }, []);

  const deleteChargeFromScenario = useCallback((scenarioId: string, chargeId: string) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, charges: s.charges.filter(c => c.id !== chargeId) }
        : s
    ));
  }, []);

  const addIncomeToScenario = useCallback((scenarioId: string, income: Omit<Income, 'id'>) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, incomes: [...s.incomes, { ...income, id: crypto.randomUUID(), isProjection: true }] }
        : s
    ));
  }, []);

  const updateIncomeInScenario = useCallback((scenarioId: string, incomeId: string, updates: Partial<Income>) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, incomes: s.incomes.map(i => i.id === incomeId ? { ...i, ...updates } : i) }
        : s
    ));
  }, []);

  const deleteIncomeFromScenario = useCallback((scenarioId: string, incomeId: string) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, incomes: s.incomes.filter(i => i.id !== incomeId) }
        : s
    ));
  }, []);

  return {
    scenarios,
    createScenario,
    deleteScenario,
    renameScenario,
    duplicateScenario,
    addChargeToScenario,
    updateChargeInScenario,
    deleteChargeFromScenario,
    addIncomeToScenario,
    updateIncomeInScenario,
    deleteIncomeFromScenario,
  };
}
