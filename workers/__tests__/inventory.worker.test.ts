import { describe, it, expect } from 'vitest';
import { 
  formatDate, 
  transformData, 
  mergeInventory, 
  parseDateToTimestamp,
  COL 
} from '../inventory.worker';

describe('Inventory Worker Logic', () => {
  describe('formatDate', () => {
    it('should format date string correctly', () => {
      expect(formatDate('2024-02-14')).toBe('14/02/2024');
      expect(formatDate(new Date(2024, 1, 14))).toBe('14/02/2024');
    });

    it('should return original string if invalid date', () => {
      expect(formatDate('invalid')).toBe('invalid');
      expect(formatDate('')).toBe('');
    });
  });

  describe('transformData', () => {
    it('should transform raw array data to object', () => {
      const rawRow = [];
      rawRow[COL.SKU] = 'SKU001';
      rawRow[COL.WIDTH] = 100;
      rawRow[COL.WEIGHT] = 500;
      rawRow[COL.LAST_UPDATED] = '2024-02-14T10:00:00';

      const result = transformData([rawRow]);

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('SKU001');
      expect(result[0].width).toBe(100);
      expect(result[0].weight).toBe(500);
      // Checking formatDateTime logic inside transform
      expect(result[0].lastUpdated).toContain('14/02/2024');
    });

    it('should handle empty or invalid input', () => {
      expect(transformData([])).toEqual([]);
      // @ts-ignore
      expect(transformData(null)).toBe(null);
    });
  });

  describe('mergeInventory', () => {
    it('should merge new items into existing inventory (update)', () => {
      const current = [{ sku: 'A', quantity: 10 }, { sku: 'B', quantity: 5 }] as any[];
      const newItems = [{ sku: 'A', quantity: 20 }] as any[]; // Update A

      const result = mergeInventory(current, newItems);
      
      expect(result).toHaveLength(2);
      const itemA = result.find(i => i.sku === 'A');
      const itemB = result.find(i => i.sku === 'B');

      expect(itemA.quantity).toBe(20);
      expect(itemB.quantity).toBe(5);
    });

    it('should insert new items', () => {
      const current = [{ sku: 'A', quantity: 10 }] as any[];
      const newItems = [{ sku: 'C', quantity: 15 }] as any[];

      const result = mergeInventory(current, newItems);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.sku === 'C')).toBeDefined();
    });
  });
  
  describe('parseDateToTimestamp', () => {
      it('should parse dd/MM/yyyy HH:mm:ss correctly', () => {
          const str = '14/02/2024 10:30:00';
          const ts = parseDateToTimestamp(str);
          const date = new Date(ts);
          
          expect(date.getFullYear()).toBe(2024);
          expect(date.getMonth()).toBe(1); // Feb is 1
          expect(date.getDate()).toBe(14);
          expect(date.getHours()).toBe(10);
      });

      it('should return -1 for invalid format', () => {
          expect(parseDateToTimestamp('invalid')).toBe(-1);
      });
  });
});