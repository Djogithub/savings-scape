import { useState, useCallback, useEffect } from 'react';
import { FinanceData, Charge, Income, PatrimoineItem } from '@/types/finance';

const STORAGE_KEY = 'finance-app-data';
const BACKUP_KEY = 'finance-app-backup';
const CURRENT_VERSION = 2;

function loadData(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        // Migration: add patrimoine array if missing
        if (!Array.isArray(parsed.patrimoine)) parsed.patrimoine = [];
        parsed.version = CURRENT_VERSION;
        return parsed;
      }
    }
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      if (parsed) {
        if (!Array.isArray(parsed.patrimoine)) parsed.patrimoine = [];
        parsed.version = CURRENT_VERSION;
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load finance data:', e);
  }
  return { charges: [], incomes: [], patrimoine: [], version: CURRENT_VERSION };
}

function saveData(data: FinanceData) {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem(BACKUP_KEY, json);
  } catch (e) {
    console.error('Failed to save finance data:', e);
  }
}

export function exportData(data: FinanceData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monbudget-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<FinanceData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed && Array.isArray(parsed.charges) && Array.isArray(parsed.incomes)) {
          if (!Array.isArray(parsed.patrimoine)) parsed.patrimoine = [];
          resolve({ ...parsed, version: CURRENT_VERSION });
        } else {
          reject(new Error('Format de fichier invalide'));
        }
      } catch {
        reject(new Error('Fichier JSON invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture'));
    reader.readAsText(file);
  });
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

  // Patrimoine CRUD
  const addPatrimoine = useCallback((item: Omit<PatrimoineItem, 'id'>) => {
    setData(prev => ({
      ...prev,
      patrimoine: [...prev.patrimoine, { ...item, id: crypto.randomUUID() }],
    }));
  }, []);

  const updatePatrimoine = useCallback((id: string, updates: Partial<PatrimoineItem>) => {
    setData(prev => ({
      ...prev,
      patrimoine: prev.patrimoine.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePatrimoine = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      patrimoine: prev.patrimoine.filter(p => p.id !== id),
    }));
  }, []);

  const loadFromImport = useCallback((imported: FinanceData) => {
    setData(imported);
  }, []);

  const actualCharges = data.charges.filter(c => !c.isProjection);
  const projectedCharges = data.charges.filter(c => c.isProjection);
  const actualIncomes = data.incomes.filter(i => !i.isProjection);
  const projectedIncomes = data.incomes.filter(i => i.isProjection);

  return {
    data,
    charges: data.charges,
    incomes: data.incomes,
    patrimoine: data.patrimoine,
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
    addPatrimoine,
    updatePatrimoine,
    deletePatrimoine,
    loadFromImport,
  };
}
