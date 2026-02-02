import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBusinessLogic } from '../useBusinessLogic';

describe('useBusinessLogic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('stockRotation (Đảo kho)', () => {
    it('should calculate next Friday correctly when today is Monday', () => {
      // Monday, Feb 12, 2024
      const date = new Date(2024, 1, 12); 
      vi.setSystemTime(date);

      const { result } = renderHook(() => useBusinessLogic());

      // Expected Friday is Feb 16, 2024
      // Days left: Mon(1) -> Fri(5) = 4 days left
      expect(result.current.stockRotation.daysLeft).toBe(4);
      expect(result.current.stockRotation.dateDisplay).toBe('16/02');
    });

    it('should calculate next Friday correctly when today is Friday', () => {
      // Friday, Feb 16, 2024
      const date = new Date(2024, 1, 16);
      vi.setSystemTime(date);

      const { result } = renderHook(() => useBusinessLogic());

      // Should be next Friday (Feb 23), days left = 7
      expect(result.current.stockRotation.daysLeft).toBe(7); 
      expect(result.current.stockRotation.dateDisplay).toBe('23/02');
    });
  });

  describe('stockCheck (Kiểm kho - Thứ 6 cuối tháng)', () => {
    it('should show correct days left if today is before last Friday of month', () => {
        // Feb 12, 2024 (Monday). Last Friday of Feb 2024 is Feb 23.
        const date = new Date(2024, 1, 12);
        vi.setSystemTime(date);

        const { result } = renderHook(() => useBusinessLogic());
        
        // 12 to 23 = 11 days
        expect(result.current.stockCheck.dateDisplay).toBe('23/02');
        expect(result.current.stockCheck.daysLeft).toBe(11);
    });

    it('should switch to next month if today is AFTER last Friday', () => {
        // Feb 24, 2024 (Saturday). Last Friday was Feb 23.
        // Target should be last Friday of March 2024 (Mar 29).
        const date = new Date(2024, 1, 24);
        vi.setSystemTime(date);

        const { result } = renderHook(() => useBusinessLogic());

        // Feb 24 to Mar 29 (2024 is leap year, Feb has 29 days)
        // 29-24 = 5 days in Feb + 29 days in Mar = 34 days
        expect(result.current.stockCheck.dateDisplay).toBe('29/03');
        expect(result.current.stockCheck.daysLeft).toBe(34);
    });
  });
});