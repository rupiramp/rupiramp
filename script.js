// ---------- RupiRamp x Transak (staging-safe) ----------
(() => {
  const input = document.getElementById('inrInput');
  const btn   = document.getElementById('startBtn');

  // Flip this to true when you switch to the live key.
  const IS_PROD = false;

  // Put your own keys here (or keep how you already set them).
  const API_KEY_STAGING   = '6e9f90f3-1202-4fca-a6ba-dd69391878f8';
  const API_KEY_PROD      = 'YOUR_PRODUCTION_API_KEY';

  const API_KEY = IS_PROD ? API_KEY_PROD : API_KEY_STAGING;

  // Staging usually doesn't have INR — use a safe fallback (GBP).
  const STAGING_FIAT = 'GBP';
  const PROD_FIAT    = 'INR';

  function openTransak() {
    // amount (optional)
    const amount = Number(input && input.value) || undefined;

    if (!window.Transak) {
      alert('Transak SDK failed to load. Please disable any content blocker and try again.');
      return;
    }

    // Base config (SELL only)
    const config = {
      apiKey: API_KEY,
      environment: IS_PROD ? 'PRODUCTION' : 'STAGING',
      productsAvailed: 'SELL',
      partnerOrderId: undefined,
      defaultCryptoCurrency: 'USDT,USDC',
      walletAddress: '',                 // user chooses in widget
      themeColor: '#0b0a16',
      widgetHeight: '680px',
      widgetWidth:  '100%',
      hideMenu: true,
      // hostURL is used for security; helps some blockers
      hostURL: window.location.origin
    };

    // Prefill amount if provided
    if (amount) {
      config.isAmountInFiat = true;
      config.fiatAmount = amount;
    }

    // Currency handling
    if (IS_PROD) {
      // Live: INR
      config.fiatCurrency = PROD_FIAT;
      config.defaultPaymentMethod = 'upi';
      config.defaultCountry = 'IN';
    } else {
      // Staging: DO NOT set INR. Use a supported fiat (GBP).
      config.fiatCurrency = STAGING_FIAT;
      // If you see “Something went wrong”, try removing defaultCountry entirely.
    }

    try {
      const transak = new Transak(config);

      // Helpful logs during testing
      transak.on('ALL_EVENTS', (e) => console.log('[Transak]', e));
      transak.on('TRANSAK_ORDER_SUCCESS', (e) => {
        console.log('Order Success:', e);
        transak.close();
      });
      transak.on('TRANSAK_ORDER_CANCELLED', () => transak.close());
      transak.on('TRANSAK_WIDGET_CLOSE',    () => transak.close());

      transak.init();
    } catch (err) {
      console.error('Transak init error', err);
      alert('Could not start the cash-out widget. If you use Safari, try turning off “Hide IP Address” for this site or any content blockers, then reload.');
    }
  }

  if (btn) btn.addEventListener('click', openTransak);
})();
