import { useEffect, useRef } from 'react';
import { User } from '../types';

export const useSessionTimeout = (user: User | null, logout: () => void) => {
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 phút

  useEffect(() => {
    if (!user) {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      return;
    }

    let lastActivityTime = Date.now();
    const THROTTLE_TIME = 120 * 1000; // Reset timer tối đa 1 lần mỗi 120 giây

    const checkActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;
      
      if (timeSinceLastActivity >= TIMEOUT_DURATION) {
        console.log('Auto-logout due to inactivity');
        logout();
      } else {
        const remainingTime = TIMEOUT_DURATION - timeSinceLastActivity;
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = setTimeout(checkActivity, Math.max(100, remainingTime));
      }
    };

    const startTimer = () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(checkActivity, TIMEOUT_DURATION);
    };

    let lastResetTimestamp = Date.now();
    
    const throttledResetTimer = () => {
        const now = Date.now();
        lastActivityTime = now;

        if (now - lastResetTimestamp > THROTTLE_TIME) {
            lastResetTimestamp = now;
            startTimer();
        }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];
    events.forEach((event) => {
      document.addEventListener(event, throttledResetTimer, { passive: true });
    });

    startTimer();

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach((event) => {
        document.removeEventListener(event, throttledResetTimer);
      });
    };
  }, [user, logout]);
};