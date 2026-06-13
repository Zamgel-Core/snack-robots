import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('sr-pwa-install-dismissed') === 'true');

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setInstallEvent(promptEvent);

      if (!dismissed && !isStandaloneMode()) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  async function handleInstall() {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === 'accepted') {
      setVisible(false);
      setInstallEvent(null);
    }
  }

  function closePrompt() {
    localStorage.setItem('sr-pwa-install-dismissed', 'true');
    setDismissed(true);
    setVisible(false);
  }

  if (!visible || !installEvent || isStandaloneMode()) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] w-[min(92vw,380px)] rounded-[28px] border border-white/20 bg-blue-950/90 p-4 text-white shadow-2xl backdrop-blur-xl">
      <button
        type="button"
        onClick={closePrompt}
        className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
        aria-label="Cerrar instalación"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-4 pr-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
          <Smartphone className="h-6 w-6" />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-300">Modo App</p>
          <h3 className="text-lg font-black">Instalar Snack Robots POS</h3>
          <p className="mt-1 text-sm font-semibold text-blue-100">
            Agrégalo a la tablet para abrirlo como aplicación, sin barra del navegador.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstall}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-400 active:scale-95"
      >
        <Download className="h-4 w-4" />
        Instalar en tablet
      </button>
    </div>
  );
}
