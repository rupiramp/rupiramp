// RupiRamp — resilient Transak launcher (staging-safe)
(() => {
  const input = document.getElementById('inrInput');
  const btn   = document.getElementById('startBtn');

  // --------- Toggle when you go live ----------
  const IS_PROD = false;                // set true when KYB is approved + live key
  const API_KEY_STAGING = 'YOUR_STAGING_API_KEY';
  const API_KEY_PROD    = 'YOUR_PRODUCTION_API_KEY';
  const API_KEY = IS_PROD ? API_KEY_PROD : API_KEY_STAGING;

  // Staging usually doesn't support INR; use a safe fiat there.
  const FIAT_STAGING = 'GBP';
  const FIAT_PROD    = 'INR';
  const ENV  = IS_PROD ? 'PRODUCTION' : 'STAGING';
  const HOST = IS_PROD ? 'https://global.transak.com' : 'https://global-stg.transak.com';

  // --------- 1) SDK loader with timeout ----------
  function loadScript(src, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      // Already present?
      if (window.Transak) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('script error'));
      document.head.appendChild(s);
      setTimeout(() => {
        if (!window.Transak) reject(new Error('timeout'));
      }, timeoutMs);
    });
  }

  // Build a full config object shared by SDK + hosted fallback
  function buildConfig() {
    const amount = Number(input?.value) || undefined;
    const cfg = {
      apiKey: API_KEY,
      environment: ENV,
      productsAvailed: 'SELL',
      defaultCryptoCurrency: 'USDT,USDC',
      fiatCurrency: IS_PROD ? FIAT_PROD : FIAT_STAGING,
      hideMenu: true,
      themeColor: '#0b0a16',
      hostURL: window.location.origin
    };
    if (amount) {
      cfg.isAmountInFiat = true;
      cfg.fiatAmount = amount;
    }
    if (IS_PROD) {
      cfg.defaultCountry = 'IN';
      cfg.defaultPaymentMethod = 'upi';
    }
    return cfg;
  }

  // Convert config to query-string for hosted-page fallback
  function configToQuery(cfg) {
    const q = new URLSearchParams();
    Object.entries(cfg).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.set(k, String(v));
    });
    return q.toString();
  }

  async function launch() {
    const cfg = buildConfig();

    // Try to load SDK first
    try {
      await loadScript(`${HOST}/sdk/v1.1/widget.js`);
      if (!window.Transak) throw new Error('not defined after load');

      const transak = new Transak(cfg);
      transak.on('ALL_EVENTS', e => console.log('[Transak]', e));
      transak.on('TRANSAK_ORDER_SUCCESS', () => transak.close());
      transak.on('TRANSAK_ORDER_CANCELLED', () => transak.close());
      transak.on('TRANSAK_WIDGET_CLOSE', () => transak.close());
      transak.init();
      return;
    } catch (err) {
      console.warn('Transak SDK load failed:', err?.message || err);

      // --------- 2) Hosted page fallback ----------
      // Opens a new tab/window with your params. Works even when SDK is blocked.
      const url = `${HOST}/?${configToQuery(buildConfig())}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  btn?.addEventListener('click', launch);
})();
