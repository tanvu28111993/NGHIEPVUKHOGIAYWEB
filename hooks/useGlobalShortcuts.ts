
import { useEffect } from 'react';

export const GLOBAL_EVENTS = {
  FOCUS_SEARCH: 'GLOBAL_FOCUS_SEARCH',
  TRIGGER_PRINT: 'GLOBAL_TRIGGER_PRINT',
  TRIGGER_SYNC: 'GLOBAL_TRIGGER_SYNC'
};

export const useGlobalShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý khi nhấn kèm Ctrl (Windows) hoặc Meta (Mac)
      if (!(e.ctrlKey || e.metaKey)) return;

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(GLOBAL_EVENTS.FOCUS_SEARCH));
          break;
        case 'p':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(GLOBAL_EVENTS.TRIGGER_PRINT));
          break;
        case 's':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(GLOBAL_EVENTS.TRIGGER_SYNC));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
