export function registerServiceWorker() {
  if ('serviceWorker' in navigator && typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registered:', reg.scope);
          reg.update();
        })
        .catch((err) => {
          console.warn('[SW] Service Worker registration failed:', err);
        });
    });
  }
}
