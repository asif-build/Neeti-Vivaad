/**
 * Google reCAPTCHA v3 Client Utility for Neeti Saarthi.
 * 
 * Frictionless risk-based verification:
 * - Loads the reCAPTCHA v3 script dynamically only when enabled.
 * - Executes action-specific tokens without displaying intrusive checkboxes.
 * - Fails safely in local development or if blocked by client privacy extensions.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="google.com/recaptcha/api.js"]');
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => {
        console.warn('[reCAPTCHA] Failed to load Google reCAPTCHA script:', err);
        resolve(); // resolve rather than hard reject to avoid blocking users with strict content blockers
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  const isEnabled = (process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED || process.env.VITE_RECAPTCHA_ENABLED) === 'true';
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.VITE_RECAPTCHA_SITE_KEY;

  // In local development or if disabled, return dev fallback token
  if (!isEnabled || !siteKey) {
    return 'test-recaptcha-token';
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    await loadRecaptchaScript(siteKey);

    if (!window.grecaptcha) {
      console.warn('[reCAPTCHA] grecaptcha object not available after load.');
      return 'test-recaptcha-token';
    }

    return await new Promise<string | null>((resolve) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, { action });
          resolve(token);
        } catch (execError) {
          console.warn(`[reCAPTCHA] execute failed for action "${action}":`, execError);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn('[reCAPTCHA] Error executing reCAPTCHA:', err);
    return null;
  }
}

// Backwards compatibility alias
export const executeRecaptcha = getRecaptchaToken;
