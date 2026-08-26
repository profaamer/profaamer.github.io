(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.YMOOCWeekStructure={
    weeksFromCredits(c){const n=Number(c);return Number.isInteger(n)&&n>0?n:Math.max(1,Math.round(n||1));},
    weekForModule(moduleNo,moduleCount,weekCount){const m=Math.max(1,Number(moduleNo)||1),mc=Math.max(1,Number(moduleCount)||1),wc=Math.max(1,Number(weekCount)||1);return Math.max(1,Math.min(wc,Math.floor(((m-1)*wc)/mc)+1));},
    groupModules(mods,weekCount){const groups=[];for(let w=1;w<=weekCount;w++)groups.push({week_no:w,modules:[]});(mods||[]).forEach(m=>{const w=Math.max(1,Math.min(weekCount,Number(m.week_no)||1));groups[w-1].modules.push(m)});return groups;},
    label(m){return `Week ${m.week_no} • Module ${m.module_no}: ${m.module_title||''}`;},
    esc
  };

  function addWizardWeekUI(){
    const credits=document.getElementById('credits');
    const moduleCount=document.getElementById('moduleCount');
    const modules=document.getElementById('modules');
    if(!credits||!moduleCount||!modules||window.__ymoocWeekWizard)return;
    window.__ymoocWeekWizard=true;
    credits.step='1';credits.min='1';
    const cf=credits.closest('.field');if(cf){const l=cf.querySelector('label');if(l)l.textContent='Credits (1 Credit = 1 Week)';if(!cf.querySelector('.weekHint')){const d=document.createElement('div');d.className='weekHint';d.style.cssText='font-size:11px;color:#6b7280;margin-top:5px';d.textContent='Number of course weeks is automatically equal to credits.';cf.appendChild(d)}}
    const mf=moduleCount.closest('.field');if(mf){const l=mf.querySelector('label');if(l)l.textContent='Number of Modules (distributed across Weeks)'}
    const panel=modules.closest('.panel');if(panel){const h=panel.querySelector('h2');if(h)h.textContent=h.textContent.replace('Course Structure','Weeks & Module Structure')}
    const oldBuild=window.buildModules;
    if(typeof oldBuild==='function'){
      window.buildModules=function(existing=[]){
        oldBuild(existing);
        const n=Math.max(1,Number(moduleCount.value)||1),w=window.YMOOCWeekStructure.weeksFromCredits(credits.value);
        const cards=[...modules.querySelectorAll('.module')];
        let current=0;
        cards.forEach((card,i)=>{
          const week=window.YMOOCWeekStructure.weekForModule(i+1,n,w);
          card.dataset.weekNo=week;
          if(week!==current){current=week;const head=document.createElement('div');head.className='weekHeading';head.style.cssText='margin:16px 0 6px;padding:9px 12px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;color:#3730a3;font-weight:800';head.textContent=`Week ${week} of ${w}`;card.parentNode.insertBefore(head,card)}
          const strong=card.querySelector('strong');if(strong)strong.textContent=`Week ${week} → Module ${i+1}`;
        });
      };
      credits.addEventListener('input',()=>window.buildModules([...modules.querySelectorAll('.module')].map(card=>({module_title:card.querySelector('.mt,.modTitle')?.value||'',module_description:card.querySelector('.md,.modDesc')?.value||''}))));
      moduleCount.addEventListener('change',()=>setTimeout(()=>window.buildModules(),0));
      setTimeout(()=>window.buildModules(),100);
    }
  }

  function validateCredits(){
    const credits=document.getElementById('credits');if(!credits)return true;
    const n=Number(credits.value);if(!Number.isInteger(n)||n<1){alert('Credits must be a positive whole number because 1 Credit = 1 Week.');credits.focus();return false}return true;
  }
  window.validateYMOOCWeekCredits=validateCredits;

  async function relabelModuleOptions(){
    if(!window.supabaseClient)return;
    const selects=[...document.querySelectorAll('select')].filter(s=>[...s.options].some(o=>/^Module\s*\d+/i.test(o.textContent.trim())));
    for(const s of selects){
      if(s.dataset.weekRelabelled==='busy')continue;
      let key=new URLSearchParams(location.search).get('course')||'';
      if(!key){const candidates=['course','courseKey','courseSelect','courseFilter','currentCourse'];for(const id of candidates){const e=document.getElementById(id);if(e?.value){key=e.value;break}}}
      if(!key)continue;s.dataset.weekRelabelled='busy';
      const {data}=await supabaseClient.from('course_modules').select('module_no,module_title,week_no').eq('course_key',key).order('module_no');
      const map=new Map((data||[]).map(m=>[String(m.module_no),m]));
      [...s.options].forEach(o=>{const mt=o.textContent.match(/Module\s*(\d+)/i);if(!mt)return;const m=map.get(mt[1]);if(m)o.textContent=`Week ${m.week_no} • Module ${m.module_no}${m.module_title?' — '+m.module_title:''}`});
      s.dataset.weekRelabelled='1';
    }
  }
  const obs=new MutationObserver(()=>{setTimeout(addWizardWeekUI,20);setTimeout(relabelModuleOptions,60)});
  window.addEventListener('DOMContentLoaded',()=>{addWizardWeekUI();relabelModuleOptions();obs.observe(document.body,{childList:true,subtree:true});setTimeout(addWizardWeekUI,500);setTimeout(relabelModuleOptions,700)});
})();