const DIRECT_TAX_COURSE_KEY='direct-taxes-law-practice-1';
const DIRECT_TAX_PROGRESS_ITEMS=[
 {key:'tutorial',label:'E-Tutorial',manual:true},
 {key:'econtent',label:'E-Content',manual:true},
 {key:'web_resources',label:'Web Resources',manual:true},
 {key:'assignment_1',label:'Module 1 Assignment'},
 {key:'assignment_2',label:'Module 2 Assignment'},
 {key:'assignment_3',label:'Module 3 Assignment'},
 {key:'assignment_4',label:'Module 4 Assignment'},
 {key:'assignment_5',label:'Module 5 Assignment'},
 {key:'final_exam',label:'Final Examination'}
];

async function getDirectTaxProgress(){
 const user=await requireAuth(); if(!user)return null;
 const completed=new Set();
 const {data:manual}=await supabaseClient.from('course_progress').select('item_key,completed').eq('user_id',user.id).eq('course_key',DIRECT_TAX_COURSE_KEY).eq('completed',true);
 (manual||[]).forEach(x=>completed.add(x.item_key));
 const {data:assignments}=await supabaseClient.from('assignment_attempts').select('module_no,status').eq('user_id',user.id).eq('course_key',DIRECT_TAX_COURSE_KEY).eq('status','submitted');
 (assignments||[]).forEach(x=>completed.add('assignment_'+x.module_no));
 const {data:exam}=await supabaseClient.from('final_exam_attempts').select('status').eq('user_id',user.id).eq('course_key',DIRECT_TAX_COURSE_KEY).eq('status','submitted').limit(1);
 if(exam&&exam.length)completed.add('final_exam');
 return {completed,total:DIRECT_TAX_PROGRESS_ITEMS.length,percent:Math.round((completed.size/DIRECT_TAX_PROGRESS_ITEMS.length)*100)};
}

async function markDirectTaxProgress(itemKey){
 const user=await requireAuth(); if(!user)return false;
 const allowed=['tutorial','econtent','web_resources'];
 if(!allowed.includes(itemKey))return false;
 const {error}=await supabaseClient.from('course_progress').upsert({user_id:user.id,course_key:DIRECT_TAX_COURSE_KEY,item_key:itemKey,completed:true,completed_at:new Date().toISOString()},{onConflict:'user_id,course_key,item_key'});
 return !error;
}

async function renderDirectTaxProgress(){
 const box=document.getElementById('courseProgressBox'); if(!box)return;
 const p=await getDirectTaxProgress(); if(!p)return;
 const fill=document.getElementById('progressFill'),pct=document.getElementById('progressPercent');
 if(fill)fill.style.width=p.percent+'%'; if(pct)pct.textContent=p.percent+'%';
 const list=document.getElementById('progressItems'); if(!list)return;
 list.innerHTML=DIRECT_TAX_PROGRESS_ITEMS.map(item=>{
   const done=p.completed.has(item.key);
   const action=item.manual&&!done?`<button class="progressMark" onclick="completeProgressItem('${item.key}',this)">MARK COMPLETE</button>`:'';
   return `<div class="progressRow"><span class="progressState ${done?'done':'pending'}">${done?'✓':'○'}</span><span class="progressLabel">${item.label}</span><span class="progressText ${done?'doneText':''}">${done?'Completed':'Pending'}</span>${action}</div>`;
 }).join('');
}

async function completeProgressItem(itemKey,button){
 if(button){button.disabled=true;button.textContent='SAVING...'}
 const ok=await markDirectTaxProgress(itemKey);
 if(!ok){if(button){button.disabled=false;button.textContent='MARK COMPLETE'}alert('Unable to update progress. Please try again.');return}
 await renderDirectTaxProgress();
}
