import { useState, useCallback, useEffect } from 'react';
import { FinanceData, Charge, Income } from '@/types/finance';

const STORAGE_KEY = 'finance-app-data';
const CURRENT_VERSION = 1;

function loadData(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === CURRENT_VERSION) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load finance data:', e);
  }
  return { charges: [], incomes: [], version: CURRENT_VERSION };
}

function saveData(data: FinanceData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save finance data:', e);
  }
}

export function useFinanceData() {
  const [data, setData] = useState<FinanceData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addCharge = useCallback((charge: Omit<Charge, 'id'>) => {
    setData(prev => ({
      ...prev,
      charges: [...prev.charges, { ...charge, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateCharge = useCallback((id: string, updates: Partial<Charge>) => {
    setData(prev => ({
      ...prev,
      charges: prev.charges.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const deleteCharge = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      charges: prev.charges.filter(c => c.id !== id),
    }));
  }, []);

  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    setData(prev => ({
      ...prev,
      incomes: [...prev.incomes, { ...income, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateIncome = useCallback((id: string, updates: Partial<Income>) => {
    setData(prev => ({
      ...prev,
      incomes: prev.incomes.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(i => i.id !== id),
    }));
  }, []);

  const actualCharges = data.charges.filter(c => !c.isProjection);
  const projectedCharges = data.charges.filter(c => c.isProjection);
  const actualIncomes = data.incomes.filter(i => !i.isProjection);
  const projectedIncomes = data.incomes.filter(i => i.isProjection);

  return {
    data,
    charges: data.charges,
    incomes: data.incomes,
    actualCharges,
    projectedCharges,
    actualIncomes,
    projectedIncomes,
    addCharge,
    updateCharge,
    deleteCharge,
    addIncome,
    updateIncome,
    deleteIncome,
  };
}
