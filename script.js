/* =====================================================
   RUPIRAMP INTERACTIONS + ANIMATIONS
   Canvas particles, tilt, reveal, wallet stub, quote stub
   ===================================================== */

const qs = (s, d=document)=>d.querySelector(s);
const qsa = (s, d=document)=>[...d.querySelectorAll(s)];

const toast = qs('#toast');
function showToast(t){
  toast.textContent = t;
  toast.classList.add('on');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove('on'), 2400);
}

/* ---- Mobile menu ---- */
(() => {
  const btn = qs('#navToggle'), sheet = qs('#mobileMenu');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const open = sheet.classList.toggle('show');
    btn.setAttribute('aria-expanded', String(open));
  });
})();

/* ---- Hero 3D tilt for swap card ---- */
(() => {
  const wrap = qs('.tilt');
  const card = qs('#swapCard');
  if (!wrap || !card) return;
  const fine = matchMedia('(pointer:fine)').matches;
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ card.classList.add('show'); io.disconnect(); }});
  }, {threshold:.25});
  io.observe(card);

  if (!fine) return;
  wrap.addEventListener('mousemove', (e)=>{
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const dy = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    card.style.transform = `rotateX(${-dy*4}deg) rotateY(${dx*6}deg)`;
  });
  wrap.addEventListener('mouseleave', ()=> card.style.transform = '');
})();

/* ---- Canvas background particles ---- */
(() => {
  const c = qs('#bg'); const ctx = c.getContext('2d');
  let W, H, DPR;
  function resize(){
    DPR = Math.min(2, devicePixelRatio||1);
    W = c.width = innerWidth; H = c.height = innerHeight;
    c.width = W*DPR; c.height = H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize(); addEventListener('resize', resize, {passive:true});

  const dots = Array.from({length:100}, () => ({
    x: Math.random()*W, y: Math.random()*H, r: Math.random()*2+0.6,
    a: Math.random()*Math.PI*2, s: Math.random()*0.4+0.1,
    hue: Math.random()>.5 ? 210 : 260
  }));

  function tick(){
    ctx.clearRect(0,0,W,H);
    for(const d of dots){
      d.x += Math.cos(d.a)*d.s; d.y += Math.sin(d.a)*d.s;
      d.a += (Math.random()-.5)*0.04;
      if(d.x<-50)d.x=W+50; if(d.x>W+50)d.x=-50;
      if(d.y<-50)d.y=H+50; if(d.y>H+50)d.y=-50;
      const g = ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r*12);
      g.addColorStop(0, `hsla(${d.hue}, 100%, 75%, .10)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x,d.y,d.r*12,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---- Swap interactions (placeholder aggregator) ---- */
const connectBtn = qs('#connect');
connectBtn?.addEventListener('click', async ()=>{
  if (!window.ethereum) { showToast('Install MetaMask to connect.'); return; }
  try{
    await ethereum.request({ method: 'eth_requestAccounts' });
    connectBtn.innerHTML = '<span class="chromeText">Connected</span>';
    showToast('Wallet connected.');
  }catch(e){ showToast('Connection rejected.'); }
});

qs('#flip')?.addEventListener('click', ()=>{
  const a = qs('#fromToken'), b = qs('#toToken');
  [a.textContent, b.textContent] = [b.textContent, a.textContent];
  const from = qs('#fromAmount'), to = qs('#toAmount');
  to.value = ''; from.value = '';
});

qs('#fromAmount')?.addEventListener('input', (e)=>{
  // Fake quote: 1:1 with a tiny offset to show motion
  const v = parseFloat(e.target.value || '0');
  qs('#toAmount').value = v ? (v*0.997).toFixed(4) : '';
  qs('#quote').textContent = v ? `Route via 0x • est. received ${ (v*0.997).toFixed(4) }` : '—';
});

qs('#swap')?.addEventListener('click', ()=>{
  showToast('Swap routed via best price (demo). Hook up 0x/1inch to go live.');
});

/* ---- Reveal on scroll ---- */
(() => {
  const obs = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); obs.unobserve(e.target); }});
  }, {threshold:.15});
  qsa('.reveal').forEach(el=>obs.observe(el));
})();

/* ---- Marquee slow bounce ---- */
(() => {
  const rib = qs('#ribbon'); if(!rib) return;
  let dir = -1, x = 0;
  function loop(){
    x += 0.2*dir;
    if (x < -rib.scrollWidth/2) x = 0;
    rib.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(loop);
  }
  loop();
})();
