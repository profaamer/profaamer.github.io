const SUPABASE_URL='https://ihcnmjjnpjtnjheyypqv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_cRNRKzPL0rMXvRtT-is7dg_6veyGjGM';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

(function applyUnifiedPortalHeader(){
  const style=document.createElement('style');
  style.id='unifiedPortalHeaderStyle';
  style.textContent=`
    .header,.head{height:106px !important;min-height:106px !important;box-sizing:border-box !important;padding:0 16px !important;background:#111827 !important;color:#fff !important;font-family:Arial,Helvetica,sans-serif !important;display:flex !important;align-items:center !important;text-align:left !important}
    .header:has(.headin){justify-content:center !important}.header:has(.headin) .headin,.head .headin{width:100% !important;max-width:980px !important;margin:0 auto !important;display:flex !important;flex-direction:column !important;align-items:flex-start !important;justify-content:center !important;gap:0 !important;text-align:left !important}
    .header:has(.headin) .headin>h1,.header:has(.headin) .headin>h2,.header:has(.headin) .headin>p,.head .headin>h1,.head .headin>h2,.head .headin>p{width:100% !important;display:block !important;text-align:left !important}
    .header:not(:has(.headin)){flex-direction:column !important;justify-content:center !important;align-items:stretch !important}
    .header:not(:has(.headin))>h1,.header:not(:has(.headin))>h2,.header:not(:has(.headin))>p,.header:not(:has(.headin))>div,.head>h1,.head>h2,.head>p,.head>div:not(.headin){width:100% !important;max-width:980px !important;margin-left:auto !important;margin-right:auto !important;text-align:left !important}
    .header h1,.head h1,.header h2,.head h2{font-size:25px !important;line-height:1.15 !important;font-weight:700 !important;margin-top:0 !important;margin-bottom:0 !important;text-align:left !important}
    .header p,.head p,.header #courseTitle,.head #who{font-size:14px !important;line-height:1.35 !important;font-weight:400 !important;margin-top:5px !important;margin-bottom:0 !important;text-align:left !important}
    @media(max-width:700px){.header,.head{height:106px !important;min-height:106px !important;padding:0 14px !important}.header h1,.header h2,.head h1,.head h2{font-size:22px !important}.header p,.head p,.header #courseTitle,.head #who{font-size:13px !important}}
  `;
  document.head.appendChild(style);
})();

function applyLockedAssessmentPolicyUI(){
  const caPass=document.getElementById('caPass');
  const esePass=document.getElementById('esePass');
  [caPass,esePass].forEach(input=>{if(!input)return;input.value='40';input.readOnly=true;input.disabled=true;input.style.background='#f3f4f6';input.style.color='#6b7280';input.title='Locked by portal policy at 40%';const label=input.closest('.field')?.querySelector('label');if(label&&!label.textContent.includes('Locked'))label.textContent=label.textContent.replace('Passing %','Passing % — Locked')});
  if((caPass||esePass)&&!document.getElementById('lockedPassPolicyNote')){const parent=(caPass||esePass).closest('.grid');if(parent){const note=document.createElement('div');note.id='lockedPassPolicyNote';note.className='full';note.style.cssText='background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.45;color:#475569';note.innerHTML='<strong>Passing Rule:</strong> 40% separately in CA and ESE is locked for every course. CA/ESE weightage remains configurable, but the two components must total 100 marks.';parent.appendChild(note)}}
}

function applyMoocCertificatePolicyUI(){
  const category=document.getElementById('category');
  const cert=document.getElementById('certificateEnabled')||document.getElementById('cert');
  if(!category||!cert)return;
  const wrap=cert.closest('label')||cert.parentElement;
  const sync=()=>{const mooc=String(category.value).toLowerCase()==='mooc';if(!mooc)cert.checked=false;cert.disabled=!mooc;if(wrap){wrap.style.display=mooc?'':'none';wrap.title=mooc?'Certificate can be enabled for MOOC courses only.':''}};
  if(!category.dataset.certPolicyBound){category.addEventListener('change',sync);category.dataset.certPolicyBound='1'}
  sync();
}

async function getCurrentUser(){const {data:{user}}=await supabaseClient.auth.getUser();return user}
async function recordActivity(eventType,portalArea='student'){try{const user=await getCurrentUser();if(!user)return false;const {error}=await supabaseClient.from('user_activity_log').insert({user_id:user.id,event_type:eventType,portal_area:portalArea,user_agent:navigator.userAgent||null});return !error}catch(e){return false}}
async function isAdminUser(user){if(!user)return false;const {data}=await supabaseClient.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();return !!data}
async function signInStudentWithGoogle(){const redirectTo=window.location.origin+window.location.pathname.replace(/[^/]*$/,'')+'login.html';const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}});if(error)throw error}
async function getStudentProfile(userId){const {data}=await supabaseClient.from('student_profiles').select('*').eq('user_id',userId).maybeSingle();return data||null}
function isStudentProfileComplete(profile){return !!(profile&&String(profile.full_name||'').trim()&&String(profile.mobile||'').trim()&&String(profile.state||'').trim()&&String(profile.district||'').trim()&&String(profile.college_name||'').trim())}
async function getActiveFinalExam(userId){try{const {data:student}=await supabaseClient.from('student_profiles').select('user_id').eq('user_id',userId).maybeSingle();if(!student)return null;const {data}=await supabaseClient.from('final_exam_attempts').select('course_key,status,expires_at,started_at').eq('user_id',userId).eq('status','in_progress').order('started_at',{ascending:false}).limit(1).maybeSingle();if(!data)return null;if(data.expires_at&&new Date(data.expires_at).getTime()<=Date.now())return null;return data}catch(e){return null}}
async function enforceActiveFinalExamRedirect(){try{const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();if(page==='course-final-exam.html')return false;const user=await getCurrentUser();if(!user)return false;const active=await getActiveFinalExam(user.id);if(!active)return false;location.replace('course-final-exam.html?course='+encodeURIComponent(active.course_key));return true}catch(e){return false}}
async function requireAuth(){const user=await getCurrentUser();if(!user){window.location.href='login.html';return null}const redirected=await enforceActiveFinalExamRedirect();if(redirected)return null;return user}
async function requireCourseEnrollment(courseKey,user){const currentUser=user||await requireAuth();if(!currentUser)return null;const {data,error}=await supabaseClient.from('course_enrollments').select('id').eq('user_id',currentUser.id).eq('course_key',courseKey).eq('status','active').maybeSingle();if(error||!data){window.location.replace('course-info.html?course='+encodeURIComponent(courseKey));return null}return currentUser}
async function logout(){await recordActivity('logout','student');await supabaseClient.auth.signOut();window.location.replace('index.html')}
async function adminLogoutTracked(){await recordActivity('logout','admin');await supabaseClient.auth.signOut();window.location.replace('index.html')}
window.addEventListener('DOMContentLoaded',()=>{enforceActiveFinalExamRedirect();applyLockedAssessmentPolicyUI();applyMoocCertificatePolicyUI();setTimeout(()=>{applyLockedAssessmentPolicyUI();applyMoocCertificatePolicyUI()},300);if((location.pathname.split('/').pop()||'').toLowerCase()==='admin-student-results.html'){const s=document.createElement('script');s.src='admin-final-exam-pdf.js?v=20260817-pdf1';document.head.appendChild(s)}});