function openViewModal(docId){
  var s=studies.find(function(x){return x._docId===docId;});if(!s)return;
  var h='';
  h+='<div class="vc-row"><span class="vc-label">Patient ID</span><span class="vc-val">'+(s.pid||'—')+'</span></div>';
  h+='<div class="vc-row"><span class="vc-label">Date</span><span class="vc-val">'+(s.date||'—')+'</span></div>';
  h+='<div class="vc-row"><span class="vc-label">Exam Type</span><span class="vc-val">'+(s.type||'—')+'</span></div>';
  h+='<div class="vc-row"><span class="vc-label">Physician</span><span class="vc-val">'+(s.physician||'—')+'</span></div>';
  h+='<div class="vc-row"><span class="vc-label">Diagnosis</span><span class="vc-val">'+(s.diagnosis||'—')+'</span></div>';
  if(s.is_normal){h+='<div style="text-align:center;margin-top:16px"><span class="badge-normal"><i class="fa fa-check-circle"></i> Normal Study</span></div>';}
  else{
    var hm=s.lvef||s.lv_diam||s.lavi||s.ee_ratio||s.ea_ratio||s.esep||s.elat||s.tr_vmax||s.gls||s.diastolic||s.cardiomyopathy||s.pericardial||s.congenital||(s.valvular&&s.valvular.length);
    if(hm){
      h+='<div class="section-label">Measurements</div>';
      if(s.lvef)h+='<div class="vc-row"><span class="vc-label">LVEF</span><span class="vc-val">'+s.lvef+' %</span></div>';
      if(s.lv_diam)h+='<div class="vc-row"><span class="vc-label">LVIDd</span><span class="vc-val">'+s.lv_diam+' cm</span></div>';
      if(s.gls)h+='<div class="vc-row"><span class="vc-label">GLS</span><span class="vc-val">'+s.gls+' %</span></div>';
      if(s.lavi)h+='<div class="vc-row"><span class="vc-label">LAVI</span><span class="vc-val">'+s.lavi+' ml/m²</span></div>';
      if(s.ea_ratio)h+='<div class="vc-row"><span class="vc-label">MV E/A</span><span class="vc-val">'+s.ea_ratio+'</span></div>';
      if(s.ee_ratio)h+='<div class="vc-row"><span class="vc-label">Avg E/e\'</span><span class="vc-val">'+s.ee_ratio+'</span></div>';
      if(s.esep)h+='<div class="vc-row"><span class="vc-label">MV E\' Sept</span><span class="vc-val">'+s.esep+' cm/s</span></div>';
      if(s.elat)h+='<div class="vc-row"><span class="vc-label">MV E\' Lat</span><span class="vc-val">'+s.elat+' cm/s</span></div>';
      if(s.tr_vmax)h+='<div class="vc-row"><span class="vc-label">TR Vmax</span><span class="vc-val">'+s.tr_vmax+' m/s</span></div>';
      if(s.tapse)h+='<div class="vc-row"><span class="vc-label">TAPSE</span><span class="vc-val">'+s.tapse+' mm</span></div>';
      if(s.pasp)h+='<div class="vc-row"><span class="vc-label">PASP</span><span class="vc-val">'+s.pasp+' mmHg</span></div>';
      if(s.diastolic)h+='<div class="vc-row"><span class="vc-label">Diastolic Fn</span><span class="vc-val">'+s.diastolic+(s.dd_overridden?' <span style="font-size:0.65rem;color:var(--teal)">(physician override)</span>':'')+'</span></div>';
      if(s.as_mpg||s.as_ava){h+='<div class="section-label" style="margin-top:12px">Aortic Stenosis</div>';if(s.as_mpg)h+='<div class="vc-row"><span class="vc-label">Mean PG</span><span class="vc-val">'+s.as_mpg+' mmHg</span></div>';if(s.as_ava)h+='<div class="vc-row"><span class="vc-label">AVA</span><span class="vc-val">'+s.as_ava+' cm²</span></div>';}
      if(s.mr_mech||s.mr_vc||s.mr_eroa){h+='<div class="section-label" style="margin-top:12px">Severe MR</div>';if(s.mr_mech)h+='<div class="vc-row"><span class="vc-label">Mechanism</span><span class="vc-val">'+s.mr_mech+'</span></div>';if(s.mr_vc)h+='<div class="vc-row"><span class="vc-label">Vena Contracta</span><span class="vc-val">'+s.mr_vc+' mm</span></div>';if(s.mr_eroa)h+='<div class="vc-row"><span class="vc-label">EROA</span><span class="vc-val">'+s.mr_eroa+' cm²</span></div>';}
      if(s.ms_mva||s.ms_mpg){h+='<div class="section-label" style="margin-top:12px">Severe MS</div>';if(s.ms_mva)h+='<div class="vc-row"><span class="vc-label">MVA</span><span class="vc-val">'+s.ms_mva+' cm²</span></div>';if(s.ms_mpg)h+='<div class="vc-row"><span class="vc-label">Mean PG</span><span class="vc-val">'+s.ms_mpg+' mmHg</span></div>';}
      if(s.ar_pht){h+='<div class="section-label" style="margin-top:12px">Severe AR</div>';h+='<div class="vc-row"><span class="vc-label">PHT</span><span class="vc-val">'+s.ar_pht+' ms</span></div>';}
      if(s.tr_vc){h+='<div class="section-label" style="margin-top:12px">Severe TR</div>';h+='<div class="vc-row"><span class="vc-label">Vena Contracta</span><span class="vc-val">'+s.tr_vc+' mm</span></div>';}
      if(s.hcm_wt||s.hcm_lvot_rest||s.hcm_lvot_val||s.hcm_sam){h+='<div class="section-label" style="margin-top:12px">HCM Parameters</div>';if(s.hcm_wt)h+='<div class="vc-row"><span class="vc-label">Max Wall</span><span class="vc-val">'+s.hcm_wt+' mm</span></div>';if(s.hcm_lvot_rest)h+='<div class="vc-row"><span class="vc-label">LVOT Rest</span><span class="vc-val">'+s.hcm_lvot_rest+' mmHg</span></div>';if(s.hcm_lvot_val)h+='<div class="vc-row"><span class="vc-label">LVOT Valsalva</span><span class="vc-val">'+s.hcm_lvot_val+' mmHg</span></div>';if(s.hcm_sam)h+='<div class="vc-row"><span class="vc-label">SAM</span><span class="vc-val">'+s.hcm_sam+'</span></div>';}
      var dt='';
      if(s.cardiomyopathy)dt+='<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+s.cardiomyopathy+'</span> ';
      if(s.pericardial)dt+='<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+s.pericardial+'</span> ';
      if(s.congenital)dt+='<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+s.congenital+'</span> ';
      if(s.valvular&&s.valvular.length)dt+=s.valvular.map(function(v){return'<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+v+'</span>';}).join(' ');
      if(dt)h+='<div class="vc-row" style="flex-direction:column;gap:8px;margin-top:10px"><span class="vc-label">Findings</span><div class="ind-cloud">'+dt+'</div></div>';
    }else{h+='<div style="text-align:center;color:var(--text3);font-size:0.8rem;padding:20px">No clinical data entered yet</div>';}
  }
  document.getElementById('view-body').innerHTML=h;
  document.getElementById('viewModal').classList.add('show');
}
function closeViewModal(){document.getElementById('viewModal').classList.remove('show');}

function calcDiastolic(){
  var badge=document.getElementById('dd-badge'),sel=document.getElementById('edit-diastolic'),lbl=document.getElementById('dd-algo-label');
  var ee=parseFloat(document.getElementById('edit-ee').value),lavi=parseFloat(document.getElementById('edit-lavi').value);
  var tr=parseFloat(document.getElementById('edit-tr').value),esep=parseFloat(document.getElementById('edit-esep').value);
  var elat=parseFloat(document.getElementById('edit-elat').value),ea=parseFloat(document.getElementById('edit-ea').value);
  var age=parseInt(document.getElementById('edit-age').value)||0;
  var sepCut=age>=65?5:7,latCut=age>=65?8:10;
  var c_ee=!isNaN(ee)?(ee>14):null,c_lavi=!isNaN(lavi)?(lavi>34):null,c_tr=!isNaN(tr)?(tr>2.8):null,c_eprime=null;
  if(!isNaN(esep)&&!isNaN(elat)){c_eprime=(esep<sepCut)||(elat<latCut);}
  else if(!isNaN(esep)){c_eprime=esep<sepCut;}
  else if(!isNaN(elat)){c_eprime=elat<latCut;}
  var entered=[];
  if(c_ee!==null)entered.push({name:"E/e'",val:ee.toFixed(1),cut:'>14',ab:c_ee});
  if(c_lavi!==null)entered.push({name:"LAVI",val:lavi,cut:'>34',ab:c_lavi});
  if(c_tr!==null)entered.push({name:"TR Vmax",val:tr.toFixed(1),cut:'>2.8',ab:c_tr});
  if(c_eprime!==null){
    var epLabel='',epCutLabel='';
    if(!isNaN(esep)&&!isNaN(elat)){epLabel="e' sep "+esep+"/lat "+elat;epCutLabel='<'+sepCut+'/'+latCut;}
    else if(!isNaN(esep)){epLabel="Septal e' "+esep;epCutLabel='<'+sepCut;}
    else{epLabel="Lateral e' "+elat;epCutLabel='<'+latCut;}
    entered.push({name:epLabel,val:'',cut:epCutLabel,ab:c_eprime});
  }
  if(entered.length===0){badge.className='dd-badge';lbl.textContent='';return;}
  var nTotal=entered.length,nAbnormal=entered.filter(function(c){return c.ab;}).length,nNormal=nTotal-nAbnormal;
  var grade='',note='',gradeColor='',bgColor='',borderColor='';
  if(nTotal<2){grade='';note='Enter ≥2 criteria to auto-grade';}
  else if(nAbnormal===0){grade='Normal';note='All entered criteria within normal range';gradeColor='#065f46';bgColor='#ecfdf5';borderColor='#6ee7b7';}
  else if(nAbnormal===nTotal){
    if(!isNaN(ea)&&ea>=2){grade='Grade II';note='All criteria abnormal + E/A ≥ 2 — consider upgrading to Grade III if restrictive mitral inflow pattern confirmed';}
    else{grade='Grade II';note='All entered criteria abnormal → elevated LVFP';}
    gradeColor='#7f1d1d';bgColor='#fef2f2';borderColor='#fca5a5';
  }else if(nAbnormal>nNormal){grade='Grade II';note=nAbnormal+'/'+nTotal+' criteria abnormal (majority) → elevated LVFP';gradeColor='#7f1d1d';bgColor='#fef2f2';borderColor='#fca5a5';}
  else if(nNormal>nAbnormal){
    var onlyEprimeAb=(nAbnormal===1&&c_eprime===true);
    if(onlyEprimeAb||(!isNaN(ea)&&ea<0.8&&nAbnormal<=1)){grade='Grade I';note='Impaired relaxation: reduced e\''+(!isNaN(ea)&&ea<0.8?' + E/A < 0.8':'')+', normal LVFP';gradeColor='#92400e';bgColor='#fffbeb';borderColor='#fcd34d';}
    else{grade='Normal';note=nNormal+'/'+nTotal+' criteria normal (majority)';gradeColor='#065f46';bgColor='#ecfdf5';borderColor='#6ee7b7';}
  }else{grade='Indeterminate';note='Equal split ('+nAbnormal+'/'+nTotal+'). No LARS available to resolve — apply clinical judgment';gradeColor='#374151';bgColor='#f3f4f6';borderColor='#d1d5db';}
  ddAutoGrade=grade;
  if(!ddOverridden&&grade){sel.value=grade;lbl.textContent='● ASE 2025 auto';autoFillDiagnosis();}
  else if(ddOverridden){lbl.textContent='✎ Physician override';}
  var chips=entered.map(function(c){var cls=c.ab?'ab':'ok';return'<span class="dd-chip '+cls+'">'+(c.ab?'✗':'✓')+' '+c.name+(c.val?' '+c.val:'')+(c.cut?' '+c.cut:'')+'</span>';}).join('');
  if(!isNaN(ea)){var eaNote=ea<0.8?'ok':ea>=2?'ab':'na';chips+='<span class="dd-chip '+eaNote+'">E/A '+ea.toFixed(2)+(ea<0.8?' (imp. relax.)':ea>=2?' (restrictive)':' (mid-range)')+'</span>';}
  var gradeHtml=grade?'<div class="dd-grade" style="color:'+gradeColor+'">⟶ '+grade+'</div>':'';
  var noteHtml=note?'<div class="dd-note">'+note+'</div>':'';
  var overrideHtml=ddOverridden?'<div class="dd-override"><i class="fa fa-pen" style="margin-right:4px"></i>Physician has overridden auto-grade (saved value: '+sel.value+')</div>':'';
  badge.className='dd-badge show';
  badge.style.background=bgColor||'#f8fafc';
  badge.style.borderColor=borderColor||'#e2e8f0';
  badge.innerHTML='<div style="font-size:0.65rem;font-weight:700;color:#6b7280;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px">ASE 2025 · '+nTotal+' criteria entered</div><div class="dd-badge-row">'+chips+'</div>'+gradeHtml+noteHtml+overrideHtml;
}

function onDiastolicOverride(){
  var sel=document.getElementById('edit-diastolic'),lbl=document.getElementById('dd-algo-label');
  if(sel.value!==ddAutoGrade){ddOverridden=true;lbl.textContent='✎ Physician override';}
  else{ddOverridden=false;lbl.textContent=ddAutoGrade?'● ASE 2025 auto':'';}
  autoFillDiagnosis();calcDiastolic();
}
function openAddModal(){
  pendingEditId=null;ddAutoGrade='';ddOverridden=false;_autoGenDiag='';
  document.getElementById('edit-modal-title').textContent='Add New Study';
  var today=new Date(),dd=String(today.getDate()).padStart(2,'0'),mm=String(today.getMonth()+1).padStart(2,'0');
  document.getElementById('edit-date').value=mm+'/'+dd+'/'+today.getFullYear();
  document.getElementById('edit-type').value='TTE';
  ['edit-pid','edit-age','edit-phys','edit-ind','edit-ef','edit-lv','edit-lavi',
   'edit-ea','edit-ee','edit-esep','edit-elat','edit-tr','edit-gls'].forEach(function(id){document.getElementById(id).value='';});
  ['edit-cm','edit-peri','edit-cong'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('edit-diastolic').value='';
  document.getElementById('edit-normal').checked=false;
  document.getElementById('as-fields').style.display='none';
  document.getElementById('as-mpg').value='';document.getElementById('as-ava').value='';
  ['edit-tapse','edit-pasp','hcm-wt','hcm-lvot-rest','hcm-lvot-val',
   'mr-vc','mr-eroa','ms-mva','ms-mpg','ar-pht','tr-vc'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('hcm-sam').value='';document.getElementById('mr-mech').value='';
  document.getElementById('hcm-fields').style.display='none';
  document.getElementById('mr-fields').style.display='none';
  document.getElementById('ms-fields').style.display='none';
  document.getElementById('ar-fields').style.display='none';
  document.getElementById('tr-fields').style.display='none';
  document.getElementById('dd-badge').className='dd-badge';
  document.getElementById('dd-algo-label').textContent='';
  document.querySelectorAll('.v-cb').forEach(function(c){c.checked=false;});
  document.getElementById('editModal').classList.add('show');
}

function openEditModal(docId){
  var study=studies.find(function(s){return s._docId===docId;});if(!study)return;
  pendingEditId=docId;ddAutoGrade='';ddOverridden=study.dd_overridden||false;_autoGenDiag='';
  document.getElementById('edit-modal-title').textContent='Edit Study';
  document.getElementById('edit-date').value=study.date||'';
  document.getElementById('edit-type').value=study.type||'TTE';
  document.getElementById('edit-pid').value=study.pid||'';
  document.getElementById('edit-age').value=study.age!==undefined&&study.age!=='—'?study.age:'';
  document.getElementById('edit-phys').value=study.physician||'';
  document.getElementById('edit-ind').value=study.diagnosis||'';
  document.getElementById('edit-normal').checked=study.is_normal||false;
  document.getElementById('edit-ef').value=study.lvef||'';
  document.getElementById('edit-lv').value=study.lv_diam||'';
  document.getElementById('edit-lavi').value=study.lavi||'';
  document.getElementById('edit-ea').value=study.ea_ratio||'';
  document.getElementById('edit-ee').value=study.ee_ratio||'';
  document.getElementById('edit-esep').value=study.esep||'';
  document.getElementById('edit-elat').value=study.elat||'';
  document.getElementById('edit-tr').value=study.tr_vmax||'';
  document.getElementById('edit-gls').value=study.gls||'';
  document.getElementById('edit-diastolic').value=study.diastolic||'';
  document.getElementById('edit-cm').value=study.cardiomyopathy||'';
  document.getElementById('edit-peri').value=study.pericardial||'';
  document.getElementById('edit-cong').value=study.congenital||'';
  var sv=study.valvular||[];
  document.querySelectorAll('.v-cb').forEach(function(c){c.checked=sv.includes(c.value);});
  document.getElementById('as-mpg').value=study.as_mpg||'';document.getElementById('as-ava').value=study.as_ava||'';
  document.getElementById('edit-tapse').value=study.tapse||'';
  document.getElementById('edit-pasp').value=study.pasp||'';
  document.getElementById('hcm-wt').value=study.hcm_wt||'';
  document.getElementById('hcm-lvot-rest').value=study.hcm_lvot_rest||'';
  document.getElementById('hcm-lvot-val').value=study.hcm_lvot_val||'';
  document.getElementById('hcm-sam').value=study.hcm_sam||'';
  document.getElementById('mr-mech').value=study.mr_mech||'';
  document.getElementById('mr-vc').value=study.mr_vc||'';
  document.getElementById('mr-eroa').value=study.mr_eroa||'';
  document.getElementById('ms-mva').value=study.ms_mva||'';
  document.getElementById('ms-mpg').value=study.ms_mpg||'';
  document.getElementById('ar-pht').value=study.ar_pht||'';
  document.getElementById('tr-vc').value=study.tr_vc||'';
  toggleASFields();toggleValveFields();toggleCMFields();calcDiastolic();
  if(ddOverridden)document.getElementById('dd-algo-label').textContent='✎ Physician override';
  document.getElementById('editModal').classList.add('show');
}

function closeEditModal(){
  document.getElementById('editModal').classList.remove('show');
  document.getElementById('ocr-badge').style.display='none';
  pendingEditId=null;ddAutoGrade='';ddOverridden=false;_autoGenDiag='';
}

function saveEdit(){
  var pid=document.getElementById('edit-pid').value.replace(/\D/g,'').trim();
  if(!pid){toast('Patient ID is required');return;}
  if(pid.length!==12){toast('Patient ID must be exactly 12 digits');return;}
  var date=document.getElementById('edit-date').value.trim(),type=document.getElementById('edit-type').value,
      phys=document.getElementById('edit-phys').value||'',ind=document.getElementById('edit-ind').value.trim(),
      age=document.getElementById('edit-age').value.trim(),isN=document.getElementById('edit-normal').checked;
  var valves=[];
  document.querySelectorAll('.v-cb:checked').forEach(function(c){valves.push(c.value);});
  var btn=document.getElementById('save-edit-btn');btn.disabled=true;btn.textContent='Saving...';
  var finalAge=age!==''?parseInt(age):calculateAgeAtScan(null,date,pid);
  var isNew=(pendingEditId===null);
  var docId=isNew?(pid+'_'+date.replace(/\//g,'-')):pendingEditId;
  var parts=date.replace(/[\-\.]/g,'/').split('/');
  var monthStr='';
  if(parts.length===3){var p0=parseInt(parts[0],10),p1=parseInt(parts[1],10);monthStr=(p0>12?parts[1]:parts[0]).padStart(2,'0');}
  var diastolicVal=document.getElementById('edit-diastolic').value;
  var u={
    pid:pid,date:date,type:type,physician:phys,diagnosis:ind,indication:ind,
    age:finalAge,month:monthStr,is_normal:isN,
    lvef:    isN?null:document.getElementById('edit-ef').value||null,
    lv_diam: isN?null:document.getElementById('edit-lv').value||null,
    lavi:    isN?null:document.getElementById('edit-lavi').value||null,
    ea_ratio:isN?null:document.getElementById('edit-ea').value||null,
    ee_ratio:isN?null:document.getElementById('edit-ee').value||null,
    esep:    isN?null:document.getElementById('edit-esep').value||null,
    elat:    isN?null:document.getElementById('edit-elat').value||null,
    tr_vmax: isN?null:document.getElementById('edit-tr').value||null,
    gls:     isN?null:document.getElementById('edit-gls').value||null,
    diastolic:     isN?null:diastolicVal||null,
    dd_auto_grade: isN?null:ddAutoGrade||null,
    dd_overridden: isN?false:ddOverridden,
    cardiomyopathy:isN?null:document.getElementById('edit-cm').value||null,
    pericardial:   isN?null:document.getElementById('edit-peri').value||null,
    congenital:    isN?null:document.getElementById('edit-cong').value||null,
    valvular:      isN?[]:valves,
    as_mpg:        isN?null:document.getElementById('as-mpg').value||null,
    as_ava:        isN?null:document.getElementById('as-ava').value||null,
    tapse:         isN?null:document.getElementById('edit-tapse').value||null,
    pasp:          isN?null:document.getElementById('edit-pasp').value||null,
    hcm_wt:        isN?null:document.getElementById('hcm-wt').value||null,
    hcm_lvot_rest: isN?null:document.getElementById('hcm-lvot-rest').value||null,
    hcm_lvot_val:  isN?null:document.getElementById('hcm-lvot-val').value||null,
    hcm_sam:       isN?null:document.getElementById('hcm-sam').value||null,
    mr_mech:       isN?null:document.getElementById('mr-mech').value||null,
    mr_vc:         isN?null:document.getElementById('mr-vc').value||null,
    mr_eroa:       isN?null:document.getElementById('mr-eroa').value||null,
    ms_mva:        isN?null:document.getElementById('ms-mva').value||null,
    ms_mpg:        isN?null:document.getElementById('ms-mpg').value||null,
    ar_pht:        isN?null:document.getElementById('ar-pht').value||null,
    tr_vc:         isN?null:document.getElementById('tr-vc').value||null
  };
  var op=isNew?(function(){u.importedAt=new Date().toISOString();return db.collection('echo_studies').doc(docId).set(u);}):
    (function(){return db.collection('echo_studies').doc(docId).update(u);});
  op().then(function(){
    toast(isNew?'Study added':'Study updated');
    u._docId=docId;
    if(isNew){studies.unshift(u);}else{var idx=studies.findIndex(function(s){return s._docId===docId;});if(idx>=0)studies[idx]=u;}
    closeEditModal();btn.disabled=false;btn.textContent='Save Changes';
    doFilter();buildDash();
  }).catch(function(e){toast('Error: '+e.message);btn.disabled=false;btn.textContent='Save Changes';});
}

function toggleNormalStudy(){
  var isN=document.getElementById('edit-normal').checked,ind=document.getElementById('edit-ind');
  if(isN){if(!ind.value.toLowerCase().includes('normal'))ind.value=ind.value?ind.value+' - Normal Study':'Normal Study';}
  else{if(ind.value==='Normal Study')ind.value='';else if(ind.value.includes(' - Normal Study'))ind.value=ind.value.replace(' - Normal Study','');}
}

function toggleASFields(){
  var modAS=document.querySelector('.v-cb[value="Moderate AS"]').checked;
  var sevAS=document.querySelector('.v-cb[value="Severe AS"]').checked;
  var asBox=document.getElementById('as-fields');
  if(modAS||sevAS){asBox.style.display='block';}
  else{asBox.style.display='none';document.getElementById('as-mpg').value='';document.getElementById('as-ava').value='';}
}

function toggleValveFields(){
  var sevMR=document.querySelector('.v-cb[value="Severe MR"]').checked,
      sevMS=document.querySelector('.v-cb[value="Severe MS"]').checked,
      sevAR=document.querySelector('.v-cb[value="Severe AR"]').checked,
      sevTR=document.querySelector('.v-cb[value="Severe TR"]').checked;
  document.getElementById('mr-fields').style.display=sevMR?'block':'none';
  document.getElementById('ms-fields').style.display=sevMS?'block':'none';
  document.getElementById('ar-fields').style.display=sevAR?'block':'none';
  document.getElementById('tr-fields').style.display=sevTR?'block':'none';
  if(!sevMR){['mr-mech','mr-vc','mr-eroa'].forEach(function(id){document.getElementById(id).value='';})}
  if(!sevMS){['ms-mva','ms-mpg'].forEach(function(id){document.getElementById(id).value='';})}
  if(!sevAR){document.getElementById('ar-pht').value='';}
  if(!sevTR){document.getElementById('tr-vc').value='';}
}

function toggleCMFields(){
  var isHCM=document.getElementById('edit-cm').value==='Hypertrophic (HCM)';
  document.getElementById('hcm-fields').style.display=isHCM?'block':'none';
  if(!isHCM){['hcm-wt','hcm-lvot-rest','hcm-lvot-val'].forEach(function(id){document.getElementById(id).value='';});document.getElementById('hcm-sam').value='';}
}

function autoFillDiagnosis(){
  var ind=document.getElementById('edit-ind');
  if(ind.value.trim()&&ind.value.trim()!==_autoGenDiag)return;
  var parts=[];
  var cm=document.getElementById('edit-cm').value,peri=document.getElementById('edit-peri').value,
      cong=document.getElementById('edit-cong').value,dd=document.getElementById('edit-diastolic').value;
  if(cm)parts.push(cm);if(peri)parts.push(peri);if(cong)parts.push(cong);
  document.querySelectorAll('.v-cb:checked').forEach(function(c){parts.push(c.value);});
  if(dd&&dd!=='Normal'&&dd!=='')parts.push('DD '+dd);
  _autoGenDiag=parts.join(', ');
  ind.value=_autoGenDiag;
}

function onDiagnosisManualEdit(){
  var ind=document.getElementById('edit-ind');
  if(ind.value!==_autoGenDiag)_autoGenDiag='';
}

function onCivilIdInput(el){
  el.value=el.value.replace(/\D/g,'').slice(0,12);
  var pid=el.value;
  if(pid.length===12){
    var date=document.getElementById('edit-date').value.trim();
    var age=calculateAgeAtScan(null,date,pid);
    document.getElementById('edit-age').value=(age!=='—'&&age!==undefined)?age:'';
    calcDiastolic();
  }else{document.getElementById('edit-age').value='';}
}
