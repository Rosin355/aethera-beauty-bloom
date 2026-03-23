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

// Utility function to detect Safari Mobile
const isSafariMobile = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isMobile = /mobile|android|iphone|ipad/.test(ua);
  return isSafari && isMobile;
};

export const useYouTubeAPI = () => {
  const [isReady, setIsReady] = useState(false);
  const [hasTimeout, setHasTimeout] = useState(false);

  useEffect(() => {
    // Su Safari Mobile, evitiamo l'embedding per ridurre problemi
    if (isSafariMobile()) {
      console.log('[useYouTubeAPI] Safari Mobile rilevato, skip embedding');
      setIsReady(false);
      return;
    }

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
      
      // Timeout per evitare attese infinite
      const timeoutId = setTimeout(() => {
        console.warn('[useYouTubeAPI] Timeout caricamento API');
        setHasTimeout(true);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }

    console.log('[useYouTubeAPI] Carico l\'API YouTube');
    
    // Timeout per il caricamento dell'API
    const timeoutId = setTimeout(() => {
      console.warn('[useYouTubeAPI] Timeout caricamento API');
      setHasTimeout(true);
    }, 10000);
    
    // Imposta il callback prima di caricare lo script
    window.onYouTubeIframeAPIReady = () => {
      console.log('[useYouTubeAPI] API ready callback');
      clearTimeout(timeoutId);
      setIsReady(true);
    };

    // Carica l'API YouTube
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      console.error('[useYouTubeAPI] Errore caricamento script');
      clearTimeout(timeoutId);
      setHasTimeout(true);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: rimuovi il callback se il componente viene smontato
      clearTimeout(timeoutId);
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  return { isReady: isReady && !hasTimeout, hasTimeout, isSafariMobile: isSafariMobile() };
};