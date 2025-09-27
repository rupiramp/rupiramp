/* ===================== Config ===================== */
const CHAIN_ID = 137; // Polygon
const TOKENS = {
  USDT: '0xc2132D05D31c914a87C6611C10748AaCB4FE7390',
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
};
const FEE_BPS = 30; // 0.30%
const FEE_RECIPIENT = '0xYOUR_BUSINESS_WALLET'; // TODO: replace with your wallet to collect fees
const OX_HEADERS = {}; // e.g. { '0x-api-key': 'YOUR_0X_KEY' } later

/* ===================== Tiny helpers ===================== */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const toast = (msg)=>{
  const t = $('#toast'); t.textContent = msg;
  t.classList.add('show'); clearTimeout(toast._id);
  toast._id = setTimeout(()=> t.classList.remove('show'), 2400);
};
const toWei = (n, dec=6)=> BigInt(Math.floor(parseFloat(n||'0') * 10**dec)).toString();
const fmt = (n, d=6)=> Number(n||0).toLocaleString('en-IN', { maximumFractionDigits:d });

/* ===================== Background field (GPU-ish) ===================== */
(()=>{
  const c = document.getElementById('field');
  const ctx = c.getContext('2d');
  let W, H, DPR;
  function size(){
    DPR = Math.min(2, window.devicePixelRatio||1);
    W = c.width = innerWidth * DPR;
    H = c.height = innerHeight * DPR;
    c.style.width = innerWidth + 'px';
    c.style.height= innerHeight + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  size(); addEventListener('resize', size, {passive:true});

  const P = Array.from({length: 140}, () => ({
    x: Math.random()*innerWidth,
    y: Math.random()*innerHeight,
    r: Math.random()*1.6 + .6,
    a: Math.random()*Math.PI*2,
    s: Math.random()*0.4 + 0.08,
    hue: Math.random()>.5? 208: 262
  }));

  function tick(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of P){
      p.x += Math.cos(p.a)*p.s; p.y += Math.sin(p.a)*p.s; p.a += (Math.random()-.5)*0.03;
      if(p.x<-50) p.x=innerWidth+50; if(p.x>innerWidth+50) p.x=-50;
      if(p.y<-50) p.y=innerHeight+50; if(p.y>innerHeight+50) p.y=-50;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*12);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 75%, .12)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*12,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ===================== Parallax ===================== */
(()=>{
  const layers = $$('#parallax .layer');
  addEventListener('mousemove', (e)=>{
    const x = (e.clientX / innerWidth - .5);
    const y = (e.clientY / innerHeight - .5);
    layers.forEach((el, i)=>{
      const depth = (i+1) * 6;
      el.style.transform = `translate(${x*depth}px, ${y*depth}px)`;
    });
  }, {passive:true});
})();

/* ===================== Reveal on view ===================== */
(()=>{
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }
    });
  }, { threshold: .18 });
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
})();

/* ===================== Gooey bubbles ===================== */
(()=>{
  const wrap = document.getElementById('bubbles');
  const N = 14;
  for(let i=0;i<N;i++){
    const b = document.createElement('div');
    b.className = 'bubble';
    const s = 40 + Math.random()*100;
    Object.assign(b.style, {
      position:'absolute',
      width: s+'px', height: s+'px', borderRadius:'50%',
      background: 'radial-gradient(circle at 30% 30%, #ffffff88, #7c4dff44 60%, transparent)',
      left: Math.random()*100+'%', top: Math.random()*100+'%',
      animation: `float ${(8+Math.random()*6).toFixed(1)}s ease-in-out ${Math.random().toFixed(2)}s infinite`
    });
    wrap.appendChild(b);
  }
})();

/* ===================== Wallet connect ===================== */
async function ensureWallet(){
  if(!window.ethereum) throw new Error('Install MetaMask');
  const [acc] = await ethereum.request({ method:'eth_requestAccounts' });
  const chainIdHex = await ethereum.request({ method:'eth_chainId' });
  const chainNow = parseInt(chainIdHex, 16);
  if (chainNow !== CHAIN_ID){
    try{
      await ethereum.request({
        method:'wallet_switchEthereumChain',
        params:[{ chainId: '0x' + CHAIN_ID.toString(16) }]
      });
    }catch(e){
      throw new Error('Switch to Polygon in MetaMask');
    }
  }
  return acc;
}
document.getElementById('connectBtn')?.addEventListener('click', async()=>{
  try{ await ensureWallet(); toast('Wallet connected'); }catch(e){ toast(e.message); }
});
document.getElementById('swapBottom')?.addEventListener('click', async()=>{
  try{ await ensureWallet(); document.getElementById('amount')?.focus(); }catch(e){ toast(e.message); }
});

/* ===================== 0x Swap flow ===================== */
async function fetchQuote(taker, sellAmount){
  const params = new URLSearchParams({
    chainId: String(CHAIN_ID),
    sellToken: TOKENS.USDT,
    buyToken:  TOKENS.USDC,
    sellAmount,
    takerAddress: taker,
    slippagePercentage: '0.01',
    feeRecipient: FEE_RECIPIENT,
    buyTokenPercentageFee: (FEE_BPS/10000).toString()
  });
  const url = `https://api.0x.org/swap/v1/quote?${params.toString()}`;
  const res = await fetch(url, { headers: OX_HEADERS });
  if (!res.ok){
    const text = await res.text();
    throw new Error('Quote failed: ' + text.slice(0,120));
  }
  return res.json();
}

// minimal ABI encoding for approve(spender, value)
function encodeApprove(spender, value){
  const sig = '0x095ea7b3';
  const addr = spender.toLowerCase().replace(/^0x/,'').padStart(64,'0');
  const val  = BigInt(value).toString(16).padStart(64,'0');
  return sig + addr + val;
}

async function ensureAllowance(taker, token, spender, amount){
  // call eth_call to check allowance
  const sig = '0xdd62ed3e'; // allowance(owner,spender)
  const ownerP = taker.toLowerCase().replace(/^0x/,'').padStart(64,'0');
  const spendP = spender.toLowerCase().replace(/^0x/,'').padStart(64,'0');
  const data = sig + ownerP + spendP;
  const allowanceHex = await ethereum.request({
    method:'eth_call',
    params:[{ to: token, data }, 'latest']
  });
  const allowance = BigInt(allowanceHex);
  if (allowance >= BigInt(amount)) return;

  // send approve
  const approveData = encodeApprove(spender, amount);
  const tx = { from: taker, to: token, data: approveData };
  const hash = await ethereum.request({ method:'eth_sendTransaction', params:[tx] });
  toast('Approval sent: ' + hash.slice(0,10) + '…');
}

async function doSwap(){
  try{
    if (!FEE_RECIPIENT || FEE_RECIPIENT.includes('YOUR_BUSINESS_WALLET')) {
      toast('Set FEE_RECIPIENT in script.js (your wallet to earn fees).');
      return;
    }
    const taker = await ensureWallet();
    const amt = ($('#amount')?.value || '').trim();
    if (!amt || parseFloat(amt) <= 0) return toast('Enter an amount');

    const sellAmount = toWei(amt, 6); // USDT 6 decimals

    const quote = await fetchQuote(taker, sellAmount);
    // Show est out (USDC 6 decimals)
    const out = Number(quote.buyAmount) / 1e6;
    $('#estOut').value = fmt(out, 6);

    // Ensure allowance
    await ensureAllowance(taker, TOKENS.USDT, quote.allowanceTarget, sellAmount);

    // Send swap tx
    const tx = {
      from: quote.from,
      to: quote.to,
      data: quote.data,
      value: quote.value || '0x0'
    };
    const hash = await ethereum.request({ method:'eth_sendTransaction', params:[tx] });
    toast('Swap sent: ' + hash.slice(0,10) + '…');
  }catch(e){
    console.error(e);
    toast(e.message || 'Swap failed');
  }
}
document.getElementById('swapBtn')?.addEventListener('click', doSwap);

/* ===================== Learn scroll ===================== */
document.getElementById('learnBtn')?.addEventListener('click', ()=>{
  document.getElementById('learn').scrollIntoView({behavior:'smooth', block:'start'});
});

/* ===================== Micro-interactions ===================== */
(()=>{
  // tilt card
  const card = document.getElementById('swapCard');
  const wrap = card;
  if (matchMedia('(pointer:fine)').matches){
    wrap.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
      const dy = (e.clientY - (r.top + r.height/2)) / (r.height/2);
      card.style.transform = `rotateX(${(-dy*5).toFixed(2)}deg) rotateY(${(dx*8).toFixed(2)}deg)`;
    });
    wrap.addEventListener('mouseleave', ()=> card.style.transform = 'none');
  }

  // input live estimate (cosmetic, before quote)
  const amt = document.getElementById('amount');
  const out = document.getElementById('estOut');
  amt?.addEventListener('input', ()=>{
    const v = parseFloat(amt.value||'0');
    out.value = v ? fmt(v*1, 6) : '';
  });
})();

/* ===================== CSS-in-JS bits for bubbles keyframes ===================== */
(()=>{
  const css = document.createElement('style');
  css.textContent = `@keyframes float{
    0%,100%{ transform:translateY(0) }
    50%{ transform:translateY(-30px) }
  }`;
  document.head.appendChild(css);
})();
