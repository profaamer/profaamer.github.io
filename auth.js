const SUPABASE_URL='https://ihcnmjjnpjtnjheyypqv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_cRNRKzPL0rMXvRtT-is7dg_6veyGjGM';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

async function getCurrentUser(){
  const {data:{user}}=await supabaseClient.auth.getUser();
  return user;
}

async function recordActivity(eventType,portalArea='student'){
  try{
    const user=await getCurrentUser();
    if(!user)return false;
    const {error}=await supabaseClient.from('user_activity_log').insert({user_id:user.id,event_type:eventType,portal_area:portalArea,user_agent:navigator.userAgent||null});
    return !error;
  }catch(e){return false}
}

async function isAdminUser(user){
  if(!user)return false;
  const {data}=await supabaseClient.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  return !!data;
}

async function signInStudentWithGoogle(){
  const redirectTo=window.location.origin+window.location.pathname.replace(/[^/]*$/,'')+'login.html';
  const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}});
  if(error)throw error;
}

async function getStudentProfile(userId){
  const {data}=await supabaseClient.from('student_profiles').select('*').eq('user_id',userId).maybeSingle();
  return data||null;
}

function isStudentProfileComplete(profile){
  return !!(profile&&String(profile.full_name||'').trim()&&String(profile.mobile||'').trim()&&String(profile.state||'').trim()&&String(profile.district||'').trim()&&String(profile.college_name||'').trim());
}

async function requireAuth(){
  const user=await getCurrentUser();
  if(!user){window.location.href='login.html';return null}
  return user;
}

async function requireCourseEnrollment(courseKey,user){
  const currentUser=user||await requireAuth();
  if(!currentUser)return null;
  const {data,error}=await supabaseClient.from('course_enrollments').select('id').eq('user_id',currentUser.id).eq('course_key',courseKey).eq('status','active').maybeSingle();
  if(error||!data){window.location.replace('course-info.html?course='+encodeURIComponent(courseKey));return null}
  return currentUser;
}

async function logout(){
  await recordActivity('logout','student');
  await supabaseClient.auth.signOut();
  window.location.replace('index.html');
}

async function adminLogoutTracked(){
  await recordActivity('logout','admin');
  await supabaseClient.auth.signOut();
  window.location.replace('index.html');
}
