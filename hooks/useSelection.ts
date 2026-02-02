import { useState, useCallback } from 'react';

export interface UseSelectionResult<T> {
  selectedKeys: Set<string>;
  toggle: (key: string) => void;
  toggleAll: (shouldSelect: boolean) => void;
  clear: () => void;
  count: number;
}

export const useSelection = <T>(
  items: T[], 
  keyExtractor: (item: T) => string
): UseSelectionResult<T> => {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((shouldSelect: boolean) => {
    if (shouldSelect) {
      const allKeys = items.map(keyExtractor);
      setSelectedKeys(new Set(allKeys));
    } else {
      setSelectedKeys(new Set());
    }
  }, [items, keyExtractor]);

  const clear = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  return {
    selectedKeys,
    toggle,
    toggleAll,
    clear,
    count: selectedKeys.size
  };
};