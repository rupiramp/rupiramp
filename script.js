// Replace with your Supabase settings
const SUPABASE_URL = "https://xfeowxupfiwloubukvhv.supabase.co";   // <= paste your Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZW93eHVwZml3bG91YnVrdmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODEwMDAsImV4cCI6MjA3MzI1NzAwMH0.SpwqThd7lqK-fYdRfElypkhDvliF3c-36L3j18EKlvg";                     // <= paste your anon public key

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('waitlist-form');
const emailEl = document.getElementById('email');
const msgEl = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (emailEl.value || '').trim().toLowerCase();
  if(!email){ msgEl.textContent = 'Please enter an email.'; return; }

  msgEl.textContent = 'Saving…';

  try {
    const { error } = await client.from('waitlist').insert({ email });
    if(error){
      if(error.message && error.message.includes('relation "waitlist" does not exist')){
        msgEl.innerHTML = 'Table <b>waitlist</b> not found. Open Supabase → SQL and run the SQL from README to create it.';
      } else {
        msgEl.textContent = 'Error: ' + error.message;
      }
      return;
    }
    form.reset();
    msgEl.textContent = 'Thanks! You’re on the list. We’ll keep you posted.';
  } catch(err){
    msgEl.textContent = 'Unexpected error. Try again.';
  }
});
