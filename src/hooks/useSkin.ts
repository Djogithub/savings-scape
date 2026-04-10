import { useEffect, useState } from 'react';

export type Skin = 'legacy' | 'focus';

export function useSkin() {
  const [skin, setSkin] = useState<Skin>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app-skin') as Skin) || 'legacy';
    }
    return 'legacy';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-skin', skin);
    localStorage.setItem('app-skin', skin);
  }, [skin]);

  return { skin, setSkin };
}
