let connected = false;

document.getElementById("connectBtn").onclick = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      connected = true;
      document.getElementById("connectBtn").innerText = "Wallet Connected";
    } catch (err) {
      alert("Connection rejected");
    }
  } else {
    alert("Install MetaMask");
  }
};

document.getElementById("swapBtn").onclick = async () => {
  if (!connected) return alert("Connect wallet first");
  alert("Swap logic would execute here (integrate 1inch/0x API)");
};
