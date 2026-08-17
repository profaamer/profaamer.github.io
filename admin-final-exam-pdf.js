(function(){
  function injectButton(){
    const head=document.querySelector('#answerModal .modalHead');
    if(!head||document.getElementById('exportFinalExamPdfBtn'))return;
    const actions=document.createElement('div');
    actions.style.display='flex';actions.style.gap='8px';actions.style.flexWrap='wrap';
    const pdf=document.createElement('button');
    pdf.id='exportFinalExamPdfBtn';pdf.className='btn primary';pdf.textContent='EXPORT PDF';pdf.onclick=exportCurrentFinalExamPdf;
    const close=head.querySelector('.closeBtn');
    if(close){actions.appendChild(pdf);actions.appendChild(close);head.appendChild(actions)}else head.appendChild(pdf);
  }
  function loadJsPdf(){return new Promise((resolve,reject)=>{
    if(window.jspdf?.jsPDF)return resolve(window.jspdf.jsPDF);
    const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.onload=()=>resolve(window.jspdf.jsPDF);s.onerror=()=>reject(new Error('Unable to load PDF library'));document.head.appendChild(s);
  })}
  function cleanFile(s){return String(s||'student').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'student'}
  async function exportCurrentFinalExamPdf(){
    try{
      const title=document.getElementById('reviewTitle')?.textContent||'';
      const name=title.replace(/^Final Exam Answer Review\s*[—-]\s*/i,'').trim()||'Student';
      const x=(window.rows||[]).find(r=>r.full_name===name) || (window.rows||[]).find(r=>title.includes(r.full_name));
      if(!x)return alert('Unable to identify the student record. Close and reopen VIEW ANSWERS, then try again.');
      const rev=x.final_exam_review||[];if(!rev.length)return alert('No final examination answers are available for this student.');
      const jsPDF=await loadJsPdf();const doc=new jsPDF({unit:'mm',format:'a4'});const pw=210,margin=15,maxW=pw-margin*2;let y=16;
      function addText(text,size=10,bold=false,indent=0){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(String(text??''),maxW-indent);for(const line of lines){if(y>282){doc.addPage();y=16}doc.text(line,margin+indent,y);y+=size*0.46+1.8}}
      doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('Final Examination Answer Review',pw/2,y,{align:'center'});y+=9;
      addText('Student Name: '+(x.full_name||'-'),11,true);
      addText('Email: '+(x.email||'-'),9,false);
      addText('Course: '+(window.courseInfo?.title||'-')+(window.courseInfo?.course_code?' ('+window.courseInfo.course_code+')':''),10,true);
      addText('ESE Score: '+(x.ese_total==null?'-':x.ese_total)+' / '+Number(window.courseInfo?.ese_marks||0),10,true);
      addText('ESE Result: '+(x.ese_status||'-'),10,true);
      addText('Submitted: '+(x.final_exam_submitted_at?new Date(x.final_exam_submitted_at).toLocaleString('en-IN'):'-'),9,false);
      y+=3;doc.setDrawColor(180);doc.line(margin,y,pw-margin,y);y+=6;
      rev.forEach(r=>{addText('Q'+r.number+'. '+r.question_text,10,true);addText('Student Answer: '+(r.selected_option?(r.selected_option+'. '+r.selected_text):'Not Answered'),9,false,2);addText('Correct Answer: '+((r.correct_option||'')+(r.correct_option?'. ':'')+(r.correct_text||'')),9,true,2);addText('Result: '+(r.is_correct?'Correct':'Incorrect'),9,true,2);y+=3;});
      if(y>270){doc.addPage();y=16}doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Generated from Commerce and Management Learning Portal - Administrator Area',pw/2,292,{align:'center'});
      const fn=cleanFile(x.full_name)+'-'+cleanFile(window.courseInfo?.course_code||window.courseInfo?.title)+'-final-exam-answers.pdf';doc.save(fn);
    }catch(e){alert(e.message||'Unable to export PDF.');}
  }
  window.exportCurrentFinalExamPdf=exportCurrentFinalExamPdf;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectButton);else injectButton();
})();
