import { useEffect } from 'react';
import { useChallenge } from '@/contexts/ChallengeContext';

/**
 * Injects CSS variables from the active challenge's theme colors.
 * Falls back to the default theme when no challenge is active.
 */
const ChallengeThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeChallenge } = useChallenge();

  useEffect(() => {
    const root = document.documentElement;

    if (activeChallenge?.primary_color) {
      root.style.setProperty('--primary', activeChallenge.primary_color);
      root.style.setProperty('--ring', activeChallenge.primary_color);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
    }

    if (activeChallenge?.secondary_color) {
      root.style.setProperty('--secondary', activeChallenge.secondary_color);
    } else {
      root.style.removeProperty('--secondary');
    }

    if (activeChallenge?.accent_color) {
      root.style.setProperty('--accent', activeChallenge.accent_color);
    } else {
      root.style.removeProperty('--accent');
    }

    // Inject custom CSS
    let styleEl = document.getElementById('challenge-custom-css');
    if (activeChallenge?.custom_css) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'challenge-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = activeChallenge.custom_css;
    } else if (styleEl) {
      styleEl.remove();
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
      const el = document.getElementById('challenge-custom-css');
      if (el) el.remove();
    };
  }, [activeChallenge]);

  return <>{children}</>;
};

export default ChallengeThemeProvider;
