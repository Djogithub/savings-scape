import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'custom-categories';

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('custom-categories-changed'));
  }, [customCategories]);

  const addCategory = useCallback((key: string, label: string) => {
    setCustomCategories(prev => ({ ...prev, [key]: label }));
  }, []);

  const removeCategory = useCallback((key: string) => {
    setCustomCategories(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  return { customCategories, addCategory, removeCategory };
}

/** Read-only access to custom categories (for components that just need the labels) */
export function getCustomCategories(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
