import { useState, useEffect } from 'react';

// Dichiarazione globale per TypeScript
declare global {
  interface Window {
    YT: {
      Player: new (element: string | HTMLElement, config: any) => any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const useYouTubeAPI = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verifica se l'API è già caricata
    if (window.YT && window.YT.Player) {
      console.log('[useYouTubeAPI] API già caricata');
      setIsReady(true);
      return;
    }

    // Verifica se lo script è già presente
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      console.log('[useYouTubeAPI] Script già presente, aspetto il ready');
      window.onYouTubeIframeAPIReady = () => {
        console.log('[useYouTubeAPI] API ready callback');
        setIsReady(true);
      };
      return;
    }

    console.log('[useYouTubeAPI] Carico l\'API YouTube');
    
    // Imposta il callback prima di caricare lo script
    window.onYouTubeIframeAPIReady = () => {
      console.log('[useYouTubeAPI] API ready callback');
      setIsReady(true);
    };

    // Carica l'API YouTube
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: rimuovi il callback se il componente viene smontato
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  return isReady;
};