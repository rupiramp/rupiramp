document.getElementById('connectBtn').addEventListener('click', async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      alert('Connected: ' + accounts[0]);
    } catch (e) {
      alert('Connection rejected');
    }
  } else {
    alert('Please install MetaMask');
  }
});

document.getElementById('swapBtn').addEventListener('click', () => {
  alert('Swap logic will be integrated with 0x API');
});
