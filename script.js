// RupiRamp — Transak launcher (staging only, popup-safe)
(() => {
  const input = document.getElementById('inrInput');
  const btn   = document.getElementById('startBtn');

  // ====== CONFIG: staging only ======
  const API_KEY = '6e9f90f3-1202-4fca-a6ba-dd69391878f8';
  const HOST    = 'https://global-stg.transak.com';
  const FIAT    = 'GBP'; // staging usually doesn’t support INR
  // ==================================

  function buildConfig() {
    const amount = Number(input?.value) || undefined;
    const cfg = {
      apiKey: API_KEY,
      environment: 'STAGING',
      productsAvailed: 'SELL',
      defaultCryptoCurrency: 'USDT,USDC',
      fiatCurrency: FIAT,
      themeColor: '#0b0a16',
      hideMenu: true,
      hostURL: window.location.origin
    };
    if (amount) {
      cfg.isAmountInFiat = true;
      cfg.fiatAmount = amount;
    }
    return cfg;
  }

  function configToQuery(cfg) {
    const q = new URLSearchParams();
    Object.entries(cfg).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    return q.toString();
  }

  function loadSdkWithTimeout(src, ms = 4000) {
    return new Promise((resolve, reject) => {
      if (window.transakSDK || window.Transak) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload  = () => resolve();
      s.onerror = () => reject(new Error('script error'));
      document.head.appendChild(s);
      setTimeout(() => {
        if (!window.transakSDK && !window.Transak) reject(new Error('timeout'));
      }, ms);
    });
  }

  async function launch() {
    // 1) Pre-open a blank tab (avoids popup blocking)
    let popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) {
      alert('Please allow pop-ups for this site to start the cash out.');
      return;
    }
    try {
      popup.document.write('<!doctype html><title>Loading…</title><style>body{background:#0b0a16;color:#e8eef6;font:16px system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style><div>Opening secure widget…</div>');
    } catch {}

    const cfg = buildConfig();

    // 2) Try loading SDK
    try {
      await loadSdkWithTimeout(`${HOST}/sdk/v1.1/widget.js`, 4000);
      const SDKCtor =
        (window.transakSDK && window.transakSDK.default) ||
        (window.Transak && window.Transak);
      if (!SDKCtor) throw new Error('SDK global missing');

      // close pre-opened tab, use modal
      try { popup.close(); } catch {}

      const transak = new SDKCtor(cfg);
      transak.on('TRANSAK_ORDER_SUCCESS', () => transak.close());
      transak.on('TRANSAK_ORDER_CANCELLED', () => transak.close());
      transak.on('TRANSAK_WIDGET_CLOSE', () => transak.close());
      transak.init();
      return;
    } catch (err) {
      console.warn('SDK load failed, fallback to hosted page:', err?.message || err);
      const url = `${HOST}/?${configToQuery(cfg)}`;
      try { popup.location.replace(url); } catch { window.location.href = url; }
    }
  }

  btn?.addEventListener('click', launch);
})();
