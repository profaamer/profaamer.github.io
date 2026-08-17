(function(){
  function assignmentMix(total){
    total=Math.max(0,Math.floor(Number(total)||0));
    return {easy:Math.ceil(total/2),moderate:Math.floor(total/2),hard:0};
  }
  function finalMix(total){
    total=Math.max(0,Math.floor(Number(total)||0));
    const weights=[{k:'easy',p:.20},{k:'moderate',p:.50},{k:'hard',p:.30}];
    const raw=weights.map(x=>({k:x.k,v:total*x.p,b:Math.floor(total*x.p)}));
    let left=total-raw.reduce((a,x)=>a+x.b,0);
    raw.sort((a,b)=>(b.v-b.b)-(a.v-a.b));
    for(let i=0;i<left;i++)raw[i%raw.length].b++;
    const out={easy:0,moderate:0,hard:0};raw.forEach(x=>out[x.k]=x.b);return out;
  }
  window.assessmentPolicy={assignmentMix,finalMix};

  function patchAdminCourseManagement(){
    if(typeof window.row!=='function')return;
    ['aEasy','aModerate','aHard','fEasy','fModerate','fHard'].forEach(id=>{
      const el=document.getElementById(id);if(el&&el.closest('.field'))el.closest('.field').style.display='none';
    });
    const aq=document.getElementById('assignmentQuestions'),fq=document.getElementById('finalQuestions');
    if(aq&&!document.getElementById('dynamicMixNote')){
      const note=document.createElement('div');note.id='dynamicMixNote';note.className='full';note.style.cssText='background:#f8fafc;border:1px solid #e5e7eb;border-radius:9px;padding:12px;font-size:13px;line-height:1.55';
      aq.closest('.grid').appendChild(note);
      const refresh=()=>{const a=assignmentMix(aq.value),f=finalMix(fq?.value);note.innerHTML='<strong>Automatic Difficulty Policy</strong><br>Assignments: 50% Easy + 50% Moderate + 0% Hard → <b>'+a.easy+' Easy + '+a.moderate+' Moderate + '+a.hard+' Hard</b><br>Final Examination: 20% Easy + 50% Moderate + 30% Hard → <b>'+f.easy+' Easy + '+f.moderate+' Moderate + '+f.hard+' Hard</b>';};
      aq.addEventListener('input',refresh);fq?.addEventListener('input',refresh);refresh();
    }
    const originalRow=window.row;
    window.row=function(){const r=originalRow();const a=assignmentMix(r.assignment_questions),f=finalMix(r.final_exam_questions);r.assignment_easy_questions=a.easy;r.assignment_moderate_questions=a.moderate;r.assignment_hard_questions=a.hard;r.final_easy_questions=f.easy;r.final_moderate_questions=f.moderate;r.final_hard_questions=f.hard;return r;};
    window.validate=function(r){if(!r.title||!r.course_key)return'Course Title and Course Key are required.';if(Number(r.assignment_questions||0)<1)return'Questions per Assignment must be at least 1.';if(Number(r.final_exam_questions||0)<1)return'Final Exam Questions must be at least 1.';if(Number(r.final_exam_minutes||0)<1)return'Final Exam Duration must be at least 1 minute.';return'';};
  }

  function patchQuestionBank(){
    if(typeof window.updateScheme!=='function')return;
    window.updateScheme=function(){const c=window.courses?.find(x=>x.course_key===document.getElementById('course')?.value);if(!c)return;const a=assignmentMix(c.assignment_questions),f=finalMix(c.final_exam_questions),scheme=document.getElementById('scheme');if(scheme)scheme.innerHTML='<strong>'+String(c.title||'')+'</strong><br>Assignment: '+Number(c.assignment_questions||0)+' questions ('+a.easy+' Easy + '+a.moderate+' Moderate + '+a.hard+' Hard) — automatic 50/50 policy.<br>Final Exam: '+Number(c.final_exam_questions||0)+' questions ('+f.easy+' Easy + '+f.moderate+' Moderate + '+f.hard+' Hard) — automatic 20/50/30 policy.';};
    setTimeout(()=>window.updateScheme(),50);
  }

  window.addEventListener('DOMContentLoaded',()=>{
    const p=(location.pathname.split('/').pop()||'').toLowerCase();
    setTimeout(()=>{
      if(p==='admin-course-management.html')patchAdminCourseManagement();
      if(p==='admin-question-bank.html')patchQuestionBank();
    },0);
  });
})();