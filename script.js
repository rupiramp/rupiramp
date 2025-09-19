
(function(){
  const btn = document.getElementById('startBtn');
  const amountEl = document.getElementById('inrInput');
  const API_KEY = '6e9f90f3-1202-4fca-a6ba-dd69391878f8'; // <-- replace and keep quotes

  function openWidget(){
    const amount = parseFloat(amountEl.value || '0') || undefined;

    try{
      // Prefer SDK
      const transak = new window.transakSDK.default({
        apiKey: API_KEY,
        environment: 'STAGING',
        productsAvailed: ['SELL'],
        defaultCryptoCurrency: 'USDT',
        defaultFiatCurrency: 'INR',
        defaultPaymentMethod: 'upi',
        walletAddress: '', // not required for SELL
        themeColor: '#7f7bff',
        exchangeScreenTitle: 'Cash out to INR',
        partnerOrderId: 'rupiramp-' + Date.now(),
        hostURL: window.location.origin,
        widgetHeight: '640px',
        widgetWidth: '460px',
        ...(amount ? {fiatAmount: amount} : {})
      });
      transak.init();
      return;
    }catch(e){
      console.warn('SDK init failed, falling back', e);
    }

    // Fallback to URL (works even if SDK blocked)
    const params = new URLSearchParams({
      apiKey: API_KEY,
      productsAvailed: 'SELL',
      cryptoCurrencyCode: 'USDT',
      fiatCurrency: 'INR',
      paymentMethod: 'upi',
      ...(amount ? {fiatAmount: amount} : {}),
      redirectURL: window.location.href
    });
    window.open('https://global-stg.transak.com/?' + params.toString(), '_blank');
  }

  if(btn){ btn.addEventListener('click', openWidget); }
})();
