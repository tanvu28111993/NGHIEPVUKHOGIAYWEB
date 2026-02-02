
/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { SyncService } from './services/sync';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// 1. Precache standard assets (được inject bởi Vite)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Listen to Sync Event (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === SyncService.CONSTANTS.SYNC_TAG) {
    console.log('[SW] Background Sync triggered:', event.tag);
    event.waitUntil(SyncService.processQueue());
  }
});

// 3. Handle Skip Waiting (Update SW ngay lập tức)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
