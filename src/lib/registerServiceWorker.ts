export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('No se pudo registrar el Service Worker de Snack Robots:', error);
      });
  });
}

export function injectPwaHeadTags() {
  const ensureLink = (rel: string, href: string, attrs: Record<string, string> = {}) => {
    const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
    document.head.appendChild(link);
  };

  const ensureMeta = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  ensureLink('manifest', '/manifest.webmanifest');
  ensureLink('apple-touch-icon', '/apple-touch-icon.png');
  ensureMeta('theme-color', '#2563eb');
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  ensureMeta('apple-mobile-web-app-title', 'Snack Robots');
  ensureMeta('mobile-web-app-capable', 'yes');
}
