// Minor UX niceties
const inputs = document.querySelectorAll('.input');
inputs.forEach(el => {
  el.addEventListener('focus', () => el.parentElement.classList.add('is-focus'));
  el.addEventListener('blur', () => el.parentElement.classList.remove('is-focus'));
});

// Work around iOS viewport jumps by locking --vh
function setVhUnit(){
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVhUnit();
window.addEventListener('resize', setVhUnit);
