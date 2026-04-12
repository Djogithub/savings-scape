import { useState, useCallback, useEffect } from 'react';
import { Scenario, Charge, Income, PatrimoineItem } from '@/types/finance';

const SCENARIOS_KEY = 'finance-app-scenarios';

const SCENARIO_COLORS = [
  'hsl(152, 44%, 42%)', 'hsl(220, 70%, 55%)', 'hsl(340, 65%, 50%)',
  'hsl(45, 85%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(180, 50%, 45%)',
  'hsl(15, 75%, 55%)', 'hsl(200, 65%, 50%)',
];

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: add patrimoine array if missing
      return parsed.map((s: any) => ({ ...s, patrimoine: s.patrimoine || [] }));
    }
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

  const createScenario = useCallback((name: string, baseCharges: Charge[] = [], baseIncomes: Income[] = [], basePatrimoine: PatrimoineItem[] = []) => {
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      charges: baseCharges.map(c => ({ ...c, id: crypto.randomUUID(), isProjection: true, originId: c.id })),
      incomes: baseIncomes.map(i => ({ ...i, id: crypto.randomUUID(), isProjection: true, originId: i.id })),
      patrimoine: basePatrimoine.map(p => ({ ...p, id: crypto.randomUUID() })),
      createdAt: new Date().toISOString(),
      color: SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length],
    };
    setScenarios(prev => [...prev, newScenario]);
    return newScenario.id;
  }, [scenarios.length]);

  const syncWithBase = useCallback((baseCharges: Charge[], baseIncomes: Income[], basePatrimoine: PatrimoineItem[] = []) => {
    setScenarios(prev => prev.map(scenario => {
      const deletedChargeOrigins = new Set(scenario.deletedChargeOriginIds || []);
      const deletedIncomeOrigins = new Set(scenario.deletedIncomeOriginIds || []);

      // --- Sync charges ---
      const baseChargeIds = new Set(baseCharges.map(c => c.id));
      const syncedCharges = scenario.charges.filter(sc => {
        if (!sc.originId) return true;
        return baseChargeIds.has(sc.originId);
      }).map(sc => {
        if (!sc.originId) return sc;
        const base = baseCharges.find(c => c.id === sc.originId);
        if (!base) return sc;
        return { ...base, id: sc.id, isProjection: true, originId: sc.originId };
      });
      const existingOriginIds = new Set(syncedCharges.map(c => c.originId).filter(Boolean));
      const newCharges = baseCharges
        .filter(c => !existingOriginIds.has(c.id) && !deletedChargeOrigins.has(c.id))
        .map(c => ({ ...c, id: crypto.randomUUID(), isProjection: true, originId: c.id }));

      // --- Sync incomes ---
      const baseIncomeIds = new Set(baseIncomes.map(i => i.id));
      const syncedIncomes = scenario.incomes.filter(si => {
        if (!si.originId) return true;
        return baseIncomeIds.has(si.originId);
      }).map(si => {
        if (!si.originId) return si;
        const base = baseIncomes.find(i => i.id === si.originId);
        if (!base) return si;
        return { ...base, id: si.id, isProjection: true, originId: si.originId };
      });
      const existingIncomeOriginIds = new Set(syncedIncomes.map(i => i.originId).filter(Boolean));
      const newIncomes = baseIncomes
        .filter(i => !existingIncomeOriginIds.has(i.id) && !deletedIncomeOrigins.has(i.id))
        .map(i => ({ ...i, id: crypto.randomUUID(), isProjection: true, originId: i.id }));

      return {
        ...scenario,
        charges: [...syncedCharges, ...newCharges],
        incomes: [...syncedIncomes, ...newIncomes],
      };
    }));
  }, []);

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
        patrimoine: source.patrimoine.map(p => ({ ...p, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
        color: SCENARIO_COLORS[prev.length % SCENARIO_COLORS.length],
      };
      return [...prev, dup];
    });
  }, []);

  // Charge CRUD
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
    setScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      const charge = s.charges.find(c => c.id === chargeId);
      const deletedOrigins = [...(s.deletedChargeOriginIds || [])];
      if (charge?.originId) deletedOrigins.push(charge.originId);
      return { ...s, charges: s.charges.filter(c => c.id !== chargeId), deletedChargeOriginIds: deletedOrigins };
    }));
  }, []);

  // Income CRUD
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
    setScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      const income = s.incomes.find(i => i.id === incomeId);
      const deletedOrigins = [...(s.deletedIncomeOriginIds || [])];
      if (income?.originId) deletedOrigins.push(income.originId);
      return { ...s, incomes: s.incomes.filter(i => i.id !== incomeId), deletedIncomeOriginIds: deletedOrigins };
    }));
  }, []);

  // Patrimoine CRUD
  const addPatrimoineToScenario = useCallback((scenarioId: string, item: Omit<PatrimoineItem, 'id'>) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, patrimoine: [...s.patrimoine, { ...item, id: crypto.randomUUID() }] }
        : s
    ));
  }, []);

  const updatePatrimoineInScenario = useCallback((scenarioId: string, itemId: string, updates: Partial<PatrimoineItem>) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, patrimoine: s.patrimoine.map(p => p.id === itemId ? { ...p, ...updates } : p) }
        : s
    ));
  }, []);

  const deletePatrimoineFromScenario = useCallback((scenarioId: string, itemId: string) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, patrimoine: s.patrimoine.filter(p => p.id !== itemId) }
        : s
    ));
  }, []);

  return {
    scenarios,
    createScenario,
    deleteScenario,
    renameScenario,
    updateScenarioColor,
    duplicateScenario,
    addChargeToScenario,
    updateChargeInScenario,
    deleteChargeFromScenario,
    addIncomeToScenario,
    updateIncomeInScenario,
    deleteIncomeFromScenario,
    addPatrimoineToScenario,
    updatePatrimoineInScenario,
    deletePatrimoineFromScenario,
    syncWithBase,
  };
}
