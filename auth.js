const SUPABASE_URL = 'https://ihcnmjjnpjtnjheyypqv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cRNRKzPL0rMXvRtT-is7dg_6veyGjGM';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}
