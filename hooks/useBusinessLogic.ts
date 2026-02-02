import { useMemo } from 'react';

// Helper function to find the last Friday of a given month
const getLastFridayOfMonth = (year: number, month: number) => {
    // Get the last day of the month (month + 1, day 0)
    const lastDay = new Date(year, month + 1, 0);
    // 0 is Sunday, 5 is Friday
    const subtract = (lastDay.getDay() - 5 + 7) % 7;
    lastDay.setDate(lastDay.getDate() - subtract);
    return lastDay;
};

export const useBusinessLogic = () => {
  // --- LOGIC ĐẢO KHO (STOCK ROTATION) ---
  const stockRotation = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 (CN) -> 6 (T7)
    // Calc difference to next Friday (5)
    const daysUntilFriday = (5 - currentDay + 7) % 7;
    
    const nextFridayDate = new Date(today);
    nextFridayDate.setDate(today.getDate() + daysUntilFriday);
    
    const fDay = nextFridayDate.getDate().toString().padStart(2, '0');
    const fMonth = (nextFridayDate.getMonth() + 1).toString().padStart(2, '0');

    return {
      dateDisplay: `${fDay}/${fMonth}`,
      daysLeft: daysUntilFriday
    };
  }, []);

  // --- LOGIC KIỂM KHO (STOCK TAKE) ---
  const stockCheck = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0); 

    let targetDate = getLastFridayOfMonth(today.getFullYear(), today.getMonth());
    targetDate.setHours(0,0,0,0);

    // If today has passed this month's check, move to next month
    if (today.getTime() > targetDate.getTime()) {
        targetDate = getLastFridayOfMonth(today.getFullYear(), today.getMonth() + 1);
        targetDate.setHours(0,0,0,0);
    }

    const diffTime = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const fDay = targetDate.getDate().toString().padStart(2, '0');
    const fMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0');

    return {
        dateDisplay: `${fDay}/${fMonth}`,
        daysLeft: daysLeft
    };
  }, []);

  // --- LOGIC KIỂM TỔNG (TOTAL CHECK) ---
  const totalCheck = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total Check happens quarterly: Mar(2), Jun(5), Sep(8), Dec(11)
      let endMonth = Math.floor(today.getMonth() / 3) * 3 + 2;
      let year = today.getFullYear();

      let targetDate = getLastFridayOfMonth(year, endMonth);
      targetDate.setHours(0, 0, 0, 0);

      // If today has passed this quarter's check, move to next quarter
      if (today.getTime() > targetDate.getTime()) {
          endMonth += 3;
          if (endMonth > 11) {
              endMonth = 2; 
              year++;
          }
          targetDate = getLastFridayOfMonth(year, endMonth);
          targetDate.setHours(0, 0, 0, 0);
      }

      const diffTime = targetDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const fDay = targetDate.getDate().toString().padStart(2, '0');
      const fMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0');

      return {
          dateDisplay: `${fDay}/${fMonth}`,
          daysLeft: daysLeft
      };
  }, []);

  return {
    stockRotation,
    stockCheck,
    totalCheck
  };
};