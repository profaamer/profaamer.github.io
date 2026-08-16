const SUPABASE_URL = 'https://ihcnmjjnpjtnjheyypqv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cRNRKzPL0rMXvRtT-is7dg_6veyGjGM';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const COURSE_ACCESS_RULES = {
  'direct-tax-course.html': 'direct-taxes-law-practice-1',
  'direct-taxes-law-practice-1.html': 'direct-taxes-law-practice-1',
  'direct-tax-law-practice-1.html': 'direct-taxes-law-practice-1',
  'direct-tax-study-material.html': 'direct-taxes-law-practice-1',
  'direct-tax-web-resources.html': 'direct-taxes-law-practice-1',
  'direct-tax-self-assessment.html': 'direct-taxes-law-practice-1',
  'direct-tax-discussion.html': 'direct-taxes-law-practice-1',
  'direct-tax-final-exam.html': 'direct-taxes-law-practice-1',
  'direct-tax-scorecard.html': 'direct-taxes-law-practice-1',
  'direct-tax-module-assignment.html': 'direct-taxes-law-practice-1',
  'direct-tax-module-1-assignment.html': 'direct-taxes-law-practice-1'
};

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

async function recordActivity(eventType, portalArea='student') {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const { error } = await supabaseClient.from('user_activity_log').insert({
      user_id: user.id,
      event_type: eventType,
      portal_area: portalArea,
      user_agent: navigator.userAgent || null
    });
    return !error;
  } catch (e) { return false; }
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

async function requireCourseEnrollment(courseKey, user) {
  const currentUser = user || await requireAuth();
  if (!currentUser) return null;
  const { data, error } = await supabaseClient
    .from('course_enrollments')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('course_key', courseKey)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) {
    window.location.replace('direct-tax-course-info.html');
    return null;
  }
  return currentUser;
}

async function logout() {
  await recordActivity('logout','student');
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

async function adminLogoutTracked() {
  await recordActivity('logout','admin');
  await supabaseClient.auth.signOut();
  window.location.replace('admin-login.html');
}

(async () => {
  const page = window.location.pathname.split('/').pop() || '';
  const courseKey = COURSE_ACCESS_RULES[page];
  if (!courseKey) return;
  document.documentElement.style.visibility = 'hidden';
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    const { data, error } = await supabaseClient
      .from('course_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_key', courseKey)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !data) {
      window.location.replace('direct-tax-course-info.html');
      return;
    }
    document.documentElement.style.visibility = 'visible';
  } catch (e) {
    window.location.replace('direct-tax-course-info.html');
  }
})();
