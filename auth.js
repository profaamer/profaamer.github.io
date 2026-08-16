const SUPABASE_URL = 'https://ihcnmjjnpjtnjheyypqv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cRNRKzPL0rMXvRtT-is7dg_6veyGjGM';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const COURSE_ACCESS_RULES = {
  'direct-tax-course.html': 'direct-taxes-law-practice-1',
  'direct-tax-course-info.html': 'direct-taxes-law-practice-1',
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
    window.location.replace('econtent.html?enrol_required=' + encodeURIComponent(courseKey));
    return null;
  }
  return currentUser;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Automatic direct-URL protection for enrolled-course pages.
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
      window.location.replace('econtent.html?enrol_required=' + encodeURIComponent(courseKey));
      return;
    }
    document.documentElement.style.visibility = 'visible';
  } catch (e) {
    window.location.replace('econtent.html?enrol_required=' + encodeURIComponent(courseKey));
  }
})();
