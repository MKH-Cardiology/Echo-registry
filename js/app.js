// Global App Variables
var studies = [], filtered = [], curPage = 1, PAGE = 25;
var mChart = null, tChart = null, dayChart = null;
var ptChart = null;
var efChart=null, ddChart=null, valveChart=null, cmChart=null, ageChart=null;
var ddAgeChart=null, vAgeChart=null;

var pendingEditId = null, isSessionAdmin = false;
var ddAutoGrade = '';
var ddOverridden = false;
var _autoGenDiag = '';

// Helper Functions
function normalizePhysicianName(name) {
  if (!name || !name.trim()) return '—';
  var lower = name.toLowerCase();
  if (lower.includes('samir')) return 'Dr. Samir';
  if (lower.includes('zaher')) return 'Dr. Zaher';
  if (lower.includes('shafie')) return 'Dr. Shafie';
  if (lower.includes('ashraf')) return 'Dr. Ashraf';
  if (lower.includes('akmal')) return 'Dr. Akmal';
  if (lower.includes('fawzy')) return 'Dr. Fawzy';
  if (lower.includes('ibrahim')) return 'Dr. Ibrahim';
  if (lower.includes('ehab') || lower.includes('ihab')) return 'Dr. Ihab';
  if (lower.includes('maged')) return 'Dr. Maged';
  if (lower.includes('hany')) return 'Dr. Hany';
  if (lower.includes('farouk')) return 'Dr. Farouk';
  if (lower.includes('ramy')) return 'Dr. Ramy';
  if (lower.includes('hamza')) return 'Dr. Hamza';
  var c = name.trim();
  if (!lower.startsWith('dr')) return 'Dr. ' + c.charAt(0).toUpperCase() + c.slice(1);
  var rest = c.replace(/^dr\.?\s*/i, '');
  return rest ? 'Dr. ' + rest.charAt(0).toUpperCase() + rest.slice(1) : c;
}

function parseDateToInt(ds) {
  if (!ds) return 0;
  var p = String(ds).trim().split(' ')[0].replace(/[\-\.]/g, '/').split('/');
  if (p.length !== 3) return 0;
  var p0 = parseInt(p[0], 10) || 0;
  var p1 = parseInt(p[1], 10) || 0;
  var y  = parseInt(p[2], 10) || 0;
  if (y < 100) y += 2000;
  if (y < 1000) return 0;
  var month, day;
  if (p0 > 12) { day = p0; month = p1; }
  else if (p1 > 12) { month = p0; day = p1; }
  else { month = p0; day = p1; }
  return (y * 10000) + (month * 100) + day;
}

function calculateAgeAtScan(dobStr,scanDateStr,pid){
  if(!scanDateStr)return'—';
  var p=String(scanDateStr).trim().split(' ')[0].replace(/[\-\.]/g,'/').split('/');
  if(p.length!==3)return'—';
  var p0=parseInt(p[0],10),p1=parseInt(p[1],10),y=parseInt(p[2],10);
  if(y<100)y+=2000;
  var month,day;
  if(p0>12){day=p0;month=p1;}else{month=p0;day=p1;}
  var scanDate=new Date(y,month-1,day);
  if(isNaN(scanDate))return'—';
  var dob;
  if(pid&&pid.length===12&&(pid[0]==='2'||pid[0]==='3')){
    var cy=pid[0]==='2'?1900:2000;
    dob=new Date(cy+parseInt(pid.substring(1,3)),parseInt(pid.substring(3,5))-1,parseInt(pid.substring(5,7)));
  }else if(dobStr){dob=new Date(dobStr);}
  if(!dob||isNaN(dob))return'—';
  var age=scanDate.getFullYear()-dob.getFullYear();
  var m=scanDate.getMonth()-dob.getMonth();
  if(m<0||(m===0&&scanDate.getDate()<dob.getDate()))age--;
  return age>=0?age:'—';
}

function buildDocId(pid, dateStr, fmt) {
  var p = dateStr.replace(/[\-\.]/g,'/').split('/');
  if (p.length !== 3) return pid + '_' + dateStr.replace(/\//g,'-');
  var p0=parseInt(p[0],10), p1=parseInt(p[1],10), y=parseInt(p[2],10);
  if (y < 100) y += 2000;
  var month, day;
  if (fmt === 'MM/DD/YYYY') { month=p0; day=p1; }
  else if (fmt === 'DD/MM/YYYY') { day=p0; month=p1; }
  else if (p0 > 12) { day=p0; month=p1; }
  else { month=p0; day=p1; }
  return pid + '_' + y + String(month).padStart(2,'0') + String(day).padStart(2,'0');
}

function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(function(){t.style.display='none';},3500);}

// Data Loading
function loadData() {
  document.getElementById('dbdot').className = 'db-dot';
  document.getElementById('dblabel').textContent = 'loading...';
  db.collection('echo_studies').get().then(function(snap) {
    studies = [];
    snap.forEach(function(d) {
      var data = d.data();
      data._docId = d.id;
      data.diagnosis = data.diagnosis || data.indication || '';
      data.physician = normalizePhysicianName(data.physician);
      studies.push(data);
    });
    studies.sort(function(a, b) { return parseDateToInt(b.date) - parseDateToInt(a.date); });
    document.getElementById('dbdot').className = 'db-dot on';
    document.getElementById('dblabel').textContent = studies.length.toLocaleString() + ' studies';
    document.getElementById('dbtotal').textContent = studies.length.toLocaleString();
    if (studies.length > 0) { buildDash(); buildReg(); } else { showEmpty(); }
  }).catch(function(e) { document.getElementById('dblabel').textContent = 'connection error'; console.error(e); });
}

function showEmpty() {
  ['k-total','k-pts','k-tte','k-tee'].forEach(function(id){ document.getElementById(id).textContent='0'; });
  document.getElementById('tbody').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No studies yet — use Import tab</td></tr>';
}

// Navigation
function showTab(n,b){
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.tbtn').forEach(function(x){x.classList.remove('active');});
  document.getElementById('tab-'+n).classList.add('active');
  if(b)b.classList.add('active');
  if(n==='clin') buildClinicalAnalytics();
}

// Dashboard
function buildDash() {
  var n = studies.length;
  var tte = studies.filter(function(s){return s.type==='TTE';}).length;
  var tee = studies.filter(function(s){return s.type==='TEE';}).length;
  var pts = new Set(studies.filter(function(s){return s.pid;}).map(function(s){return s.pid;})).size;
  document.getElementById('k-total').textContent = n.toLocaleString();
  document.getElementById('k-pts').textContent = pts.toLocaleString();
  document.getElementById('k-tte').textContent = tte.toLocaleString();
  document.getElementById('k-tee').textContent = tee.toLocaleString();
  document.getElementById('k-tte-p').textContent = n ? Math.round(tte/n*100)+'% of total' : '—';
  document.getElementById('k-tee-p').textContent = n ? Math.round(tee/n*100)+'% of total' : '—';

  var mn = {'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'};
  var mc = {};
  studies.forEach(function(s){ if(s.month) mc[s.month]=(mc[s.month]||0)+1; });
  var sm = Object.keys(mc).sort();
  if (!sm.length) return;
  var maxMonth = sm.reduce(function(a,b){ return mc[a]>mc[b]?a:b; }, sm[0]);
  document.getElementById('peak-month').textContent = 'Peak: '+(mn[maxMonth]||'')+' ('+mc[maxMonth]+')';

  if(mChart) mChart.destroy();
  mChart = new Chart(document.getElementById('mChart'), {
    type:'bar', data:{labels:sm.map(function(m){return mn[m]||m;}),datasets:[{data:sm.map(function(m){return mc[m];}),backgroundColor:sm.map(function(m){return m===maxMonth?'#2563eb':'#bfdbfe';}),borderRadius:8,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], dc=[0,0,0,0,0,0,0];
  studies.forEach(function(s){
    if(!s.date) return;
    var p=s.date.replace(/[\-\.]/g,'/').split('/');
    if(p.length===3){
      var p0=parseInt(p[0],10),p1=parseInt(p[1],10),y=parseInt(p[2],10);
      var month,day;
      if(p0>12){day=p0;month=p1;}else{month=p0;day=p1;}
      var d=new Date(y,month-1,day);
      if(!isNaN(d)) dc[d.getDay()]++;
    }
  });
  if(dayChart) dayChart.destroy();
  dayChart = new Chart(document.getElementById('dayChart'), {
    type:'bar',data:{labels:days,datasets:[{data:dc,backgroundColor:dc.map(function(v){return v===Math.max.apply(null,dc)?'#0d9488':'#a5f3fc';}),borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  if(tChart) tChart.destroy();
  tChart = new Chart(document.getElementById('tChart'), {
    type:'doughnut',data:{labels:['TTE','TEE'],datasets:[{data:[tte,tee],backgroundColor:['#2563eb','#d97706'],borderColor:['#fff','#fff'],borderWidth:3,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'70%',plugins:{legend:{position:'right',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:12},padding:20,usePointStyle:true}}}}
  });

  var pc={};
  studies.forEach(function(s){ var p=s.physician||'—'; pc[p]=(pc[p]||0)+1; });
  var sp=Object.entries(pc).sort(function(a,b){return b[1]-a[1];}).slice(0,10);
  var mx=sp[0]?sp[0][1]:1;
  document.getElementById('top-phys').textContent = sp[0]?sp[0][0].replace('Dr. ',''):'';
  document.getElementById('physList').innerHTML = sp.map(function(x,i){return '<li class="phys-item"><span class="phys-rank">'+(i+1)+'</span><span class="phys-name">'+x[0]+'</span><div class="phys-bar-wrap"><div class="phys-bar" style="width:'+Math.round(x[1]/mx*100)+'%"></div></div><span class="phys-count">'+x[1]+'</span></li>';}).join('');

  var fp=document.getElementById('fphys');
  fp.innerHTML='<option value="">All Physicians</option>';
  Object.keys(pc).filter(function(n){return n!=='—';}).sort().forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;fp.appendChild(o);});

  var ic={};
  studies.forEach(function(s){
    if(s.diagnosis&&s.diagnosis.trim()){var k=s.diagnosis.trim().toLowerCase();ic[k]=(ic[k]||0)+1;}
    if(s.cardiomyopathy){var k=s.cardiomyopathy.toLowerCase();ic[k]=(ic[k]||0)+1;}
    if(s.pericardial){var k=s.pericardial.toLowerCase();ic[k]=(ic[k]||0)+1;}
    if(s.congenital){var k=s.congenital.toLowerCase();ic[k]=(ic[k]||0)+1;}
    if(s.valvular)s.valvular.forEach(function(v){var k=v.toLowerCase();ic[k]=(ic[k]||0)+1;});
  });
  var si=Object.entries(ic).sort(function(a,b){return b[1]-a[1];}).slice(0,25);
  document.getElementById('ind-count').textContent=si.length+' types found';
  var maxInd=si[0]?si[0][1]:1;
  document.getElementById('indCloud').innerHTML=si.map(function(x){var sz=x[1]/maxInd>0.6?'lg':x[1]/maxInd>0.3?'md':'';return '<span class="ind-tag '+sz+'">'+x[0]+' <b>'+x[1]+'</b></span>';}).join('');
}

// Registry Table
function buildReg(){filtered=studies.slice();curPage=1;renderTable();}

function doFilter(){
  var q=document.getElementById('srch').value.trim().toLowerCase();
  var ft=document.getElementById('ftype').value,fm=document.getElementById('fmonth').value,fp=document.getElementById('fphys').value;
  filtered=studies.filter(function(s){
    if(ft&&s.type!==ft)return false;
    if(fm&&s.month!==fm)return false;
    if(fp&&s.physician!==fp)return false;
    var str=s.pid+' '+s.date+' '+s.physician+' '+(s.diagnosis||'')+' '+(s.cardiomyopathy||'')+' '+(s.pericardial||'')+' '+(s.congenital||'');
    if(s.valvular)str+=' '+s.valvular.join(' ');
    if(q&&!str.toLowerCase().includes(q))return false;
    return true;
  });
  curPage=1;renderTable();
}

function renderTable(){
  document.getElementById('thead-row').innerHTML='<tr><th>Patient ID</th><th>Diagnosis</th><th>Date<br><span style="font-size:0.55rem;color:var(--text3);font-weight:400;letter-spacing:0;text-transform:none">MM/DD/YYYY</span></th><th>Type</th><th>Age</th><th>Physician</th><th style="text-align:right">Action</th></tr>';
  var s=(curPage-1)*PAGE,e=s+PAGE,pg=filtered.slice(s,e),n=filtered.length;
  document.getElementById('rinfo').textContent=n.toLocaleString()+' studies found';
  document.getElementById('pgi').textContent='Page '+curPage+' of '+Math.max(1,Math.ceil(n/PAGE));
  document.getElementById('pbprev').disabled=curPage===1;
  document.getElementById('pbnext').disabled=e>=n;
  if(!pg.length){document.getElementById('tbody').innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No studies match filters</td></tr>';return;}
  var tb=function(t){return t==='TTE'?'badge-tte':t==='TEE'?'badge-tee':'badge-other';};
  document.getElementById('tbody').innerHTML=pg.map(function(s){
    var tags=[];
    if(s.diagnosis)tags.push('<span class="ind-tag" style="background:var(--surface2);color:var(--text2)"><i class="fa fa-tag" style="margin-right:4px;color:var(--text3)"></i>'+s.diagnosis+'</span>');
    if(s.cardiomyopathy)tags.push('<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+s.cardiomyopathy+'</span>');
    if(s.pericardial)tags.push('<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+s.pericardial+'</span>');
    if(s.congenital)tags.push('<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+s.congenital+'</span>');
    if(s.valvular&&s.valvular.length)s.valvular.forEach(function(v){tags.push('<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+v+'</span>');});
    var ind=tags.length?tags.join(' '):'<span style="color:var(--border)">—</span>';
    var adm=isSessionAdmin?'<button class="btn-icon" onclick="openEditModal(\''+s._docId+'\')"><i class="fa fa-pen"></i></button><button class="btn-icon" style="color:var(--red)" onclick="deleteStudy(\''+s._docId+'\')"><i class="fa fa-trash"></i></button>':'';
    return '<tr><td style="font-weight:600;color:var(--accent);white-space:nowrap;cursor:pointer" onclick="openPtModal(\''+s.pid+'\')">'+(s.pid||'—')+'</td><td style="max-width:280px;padding:8px 16px">'+ind+'</td><td style="font-weight:500;white-space:nowrap">'+s.date+'</td><td><span class="'+tb(s.type)+'">'+s.type+'</span></td><td style="color:var(--text2)">'+(s.age!==undefined?s.age:'—')+'</td><td style="color:var(--text2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(s.physician||'—')+'</td><td style="text-align:right;white-space:nowrap"><button class="btn-icon" onclick="openViewModal(\''+s._docId+'\')"><i class="fa fa-eye"></i></button>'+adm+'</td></tr>';
  }).join('');
}

function goPage(d){curPage=Math.max(1,Math.min(Math.ceil(filtered.length/PAGE),curPage+d));renderTable();}

// Admin Mode
function toggleAdmin(){
  if(isSessionAdmin){isSessionAdmin=false;toast('Admin Mode Disabled');var b=document.getElementById('btn-admin-toggle');b.innerHTML='<i class="fa fa-lock"></i> Admin Mode';b.classList.remove('btn-admin-active');renderTable();}
  else{document.getElementById('admin-pin').value='';document.getElementById('pinModal').classList.add('show');setTimeout(function(){document.getElementById('admin-pin').focus();},100);}
}
function closePinModal(){document.getElementById('pinModal').classList.remove('show');}
function verifyPin(){
  if(document.getElementById('admin-pin').value==='1234'){
    isSessionAdmin=true;closePinModal();toast('Admin Mode Unlocked');
    var b=document.getElementById('btn-admin-toggle');b.innerHTML='<i class="fa fa-unlock"></i> Admin Mode ON';b.classList.add('btn-admin-active');renderTable();
  }else{toast('Incorrect PIN');document.getElementById('admin-pin').value='';document.getElementById('admin-pin').focus();}
}
function deleteStudy(id){if(!isSessionAdmin)return;if(confirm('Delete this study permanently?')){db.collection('echo_studies').doc(id).delete().then(function(){toast('Study deleted');loadData();}).catch(function(e){toast('Error: '+e.message);});}}

// View & Edit Modals
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
      if(s.valvular&&s.valvular.length)dt+=s.valvular.map(function(v){return '<span class="ind-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">'+v+'</span>';}).join(' ');
      if(dt)h+='<div class="vc-row" style="flex-direction:column;gap:8px;margin-top:10px"><span class="vc-label">Findings</span><div class="ind-cloud">'+dt+'</div></div>';
    }else{h+='<div style="text-align:center;color:var(--text3);font-size:0.8rem;padding:20px">No clinical data entered yet</div>';}
  }
  document.getElementById('view-body').innerHTML=h;
  document.getElementById('viewModal').classList.add('show');
}
function closeViewModal(){document.getElementById('viewModal').classList.remove('show');}

function toggleNormalStudy(){
  var isN = document.getElementById('edit-normal').checked;
  var ind  = document.getElementById('edit-ind');
  if(isN){if(!ind.value.toLowerCase().includes('normal'))ind.value = ind.value ? ind.value+' - Normal Study' : 'Normal Study';}
  else{if(ind.value==='Normal Study') ind.value='';else if(ind.value.includes(' - Normal Study')) ind.value=ind.value.replace(' - Normal Study','');}
}

function toggleASFields() {
  var modAS = document.querySelector('.v-cb[value="Moderate AS"]').checked;
  var sevAS = document.querySelector('.v-cb[value="Severe AS"]').checked;
  var asBox = document.getElementById('as-fields');
  if (modAS || sevAS) { asBox.style.display = 'block'; }
  else { asBox.style.display = 'none'; document.getElementById('as-mpg').value = ''; document.getElementById('as-ava').value  = ''; }
}

function toggleValveFields() {
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

function toggleCMFields() {
  var isHCM = document.getElementById('edit-cm').value === 'Hypertrophic (HCM)';
  document.getElementById('hcm-fields').style.display = isHCM ? 'block' : 'none';
  if(!isHCM){['hcm-wt','hcm-lvot-rest','hcm-lvot-val'].forEach(function(id){document.getElementById(id).value='';});document.getElementById('hcm-sam').value='';}
}

function onCivilIdInput(el) {
  el.value = el.value.replace(/\D/g,'').slice(0,12);
  var pid = el.value;
  if (pid.length === 12) {
    var date = document.getElementById('edit-date').value.trim();
    var age  = calculateAgeAtScan(null, date, pid);
    document.getElementById('edit-age').value = (age !== '—' && age !== undefined) ? age : '';
    calcDiastolic();
  } else { document.getElementById('edit-age').value = ''; }
}

function autoFillDiagnosis() {
  var ind = document.getElementById('edit-ind');
  if (ind.value.trim() && ind.value.trim() !== _autoGenDiag) return;
  var parts = [];
  var cm=document.getElementById('edit-cm').value, peri=document.getElementById('edit-peri').value,
      cong=document.getElementById('edit-cong').value, dd=document.getElementById('edit-diastolic').value;
  if (cm) parts.push(cm); if (peri) parts.push(peri); if (cong) parts.push(cong);
  document.querySelectorAll('.v-cb:checked').forEach(function(c){parts.push(c.value);});
  if (dd && dd !== 'Normal' && dd !== '') parts.push('DD ' + dd);
  _autoGenDiag = parts.join(', ');
  ind.value = _autoGenDiag;
}

function onDiagnosisManualEdit() {
  var ind = document.getElementById('edit-ind');
  if (ind.value !== _autoGenDiag) _autoGenDiag = '';
}

// ASE 2025 Diastolic Function Auto-Calculator
function calcDiastolic() {
  var badge  = document.getElementById('dd-badge');
  var sel    = document.getElementById('edit-diastolic');
  var lbl    = document.getElementById('dd-algo-label');
  var ee     = parseFloat(document.getElementById('edit-ee').value);
  var lavi   = parseFloat(document.getElementById('edit-lavi').value);
  var tr     = parseFloat(document.getElementById('edit-tr').value);
  var esep   = parseFloat(document.getElementById('edit-esep').value);
  var elat   = parseFloat(document.getElementById('edit-elat').value);
  var ea     = parseFloat(document.getElementById('edit-ea').value);
  var age    = parseInt(document.getElementById('edit-age').value) || 0;
  var sepCut = age >= 65 ? 5 : 7;
  var latCut = age >= 65 ? 8 : 10;
  var c_ee     = !isNaN(ee)   ? (ee > 14)   : null;
  var c_lavi   = !isNaN(lavi) ? (lavi > 34) : null;
  var c_tr     = !isNaN(tr)   ? (tr > 2.8)  : null;
  var c_eprime = null;
  if (!isNaN(esep) && !isNaN(elat)) { c_eprime = (esep < sepCut) || (elat < latCut); }
  else if (!isNaN(esep)) { c_eprime = esep < sepCut; }
  else if (!isNaN(elat)) { c_eprime = elat < latCut; }
  var entered = [];
  if (c_ee !== null)     entered.push({name:"E/e'", val: ee.toFixed(1), cut:'>14', ab: c_ee});
  if (c_lavi !== null)   entered.push({name:"LAVI", val: lavi, cut:'>34', ab: c_lavi});
  if (c_tr !== null)     entered.push({name:"TR Vmax", val: tr.toFixed(1), cut:'>2.8', ab: c_tr});
  if (c_eprime !== null) {
    var epLabel = '';
    if (!isNaN(esep) && !isNaN(elat)) epLabel = "e' sep "+esep+"/lat "+elat;
    else if (!isNaN(esep)) epLabel = "Septal e' "+esep;
    else epLabel = "Lateral e' "+elat;
    var epCutLabel = !isNaN(esep) && !isNaN(elat) ? '<'+sepCut+'/'+latCut : (!isNaN(esep) ? '<'+sepCut : '<'+latCut);
    entered.push({name: epLabel, val: '', cut: epCutLabel, ab: c_eprime});
  }
  if (entered.length === 0) { badge.className = 'dd-badge'; lbl.textContent = ''; return; }
  var nTotal = entered.length, nAbnormal = entered.filter(function(c){ return c.ab; }).length, nNormal = nTotal - nAbnormal;
  var grade = '', note = '', gradeColor = '', bgColor = '', borderColor = '';
  if (nTotal < 2) { grade = ''; note = 'Enter ≥2 criteria to auto-grade'; }
  else if (nAbnormal === 0) { grade = 'Normal'; note = 'All entered criteria within normal range'; gradeColor = '#065f46'; bgColor = '#ecfdf5'; borderColor = '#6ee7b7'; }
  else if (nAbnormal === nTotal) {
    if (!isNaN(ea) && ea >= 2) { grade = 'Grade II'; note = 'All criteria abnormal + E/A ≥ 2 — consider upgrading to Grade III if restrictive mitral inflow pattern confirmed'; }
    else { grade = 'Grade II'; note = 'All entered criteria abnormal → elevated LVFP'; }
    gradeColor = '#7f1d1d'; bgColor = '#fef2f2'; borderColor = '#fca5a5';
  } else if (nAbnormal > nNormal) { grade = 'Grade II'; note = nAbnormal+'/'+nTotal+' criteria abnormal (majority) → elevated LVFP'; gradeColor = '#7f1d1d'; bgColor = '#fef2f2'; borderColor = '#fca5a5'; }
  else if (nNormal > nAbnormal) {
    var onlyEprimeAb = (nAbnormal === 1 && c_eprime === true);
    if (onlyEprimeAb || (!isNaN(ea) && ea < 0.8 && nAbnormal <= 1)) { grade = 'Grade I'; note = 'Impaired relaxation: reduced e\''+(!isNaN(ea) && ea < 0.8?' + E/A < 0.8':'')+', normal LVFP'; gradeColor = '#92400e'; bgColor = '#fffbeb'; borderColor = '#fcd34d'; }
    else { grade = 'Normal'; note = nNormal+'/'+nTotal+' criteria normal (majority)'; gradeColor = '#065f46'; bgColor = '#ecfdf5'; borderColor = '#6ee7b7'; }
  } else { grade = 'Indeterminate'; note = 'Equal split ('+nAbnormal+'/'+nTotal+'). No LARS available to resolve — apply clinical judgment'; gradeColor = '#374151'; bgColor = '#f3f4f6'; borderColor = '#d1d5db'; }
  ddAutoGrade = grade;
  if (!ddOverridden && grade) { sel.value = grade; lbl.textContent = '● ASE 2025 auto'; autoFillDiagnosis(); }
  else if (ddOverridden) { lbl.textContent = '✎ Physician override'; }
  var chips = entered.map(function(c) { var cls = c.ab ? 'ab' : 'ok'; return '<span class="dd-chip '+cls+'">'+(c.ab?'✗':'✓')+' '+c.name+(c.val?' '+c.val:'')+(c.cut?' '+c.cut:'')+'</span>'; }).join('');
  if (!isNaN(ea)) { var eaNote = ea < 0.8 ? 'ok' : ea >= 2 ? 'ab' : 'na'; chips += '<span class="dd-chip '+eaNote+'">E/A '+ea.toFixed(2)+(ea<0.8?' (imp. relax.)':ea>=2?' (restrictive)':' (mid-range)')+'</span>'; }
  var gradeHtml = grade ? '<div class="dd-grade" style="color:'+gradeColor+'">⟶ '+grade+'</div>' : '';
  var noteHtml  = note  ? '<div class="dd-note">'+note+'</div>' : '';
  var overrideHtml = ddOverridden ? '<div class="dd-override"><i class="fa fa-pen" style="margin-right:4px"></i>Physician has overridden auto-grade (saved value: '+sel.value+')</div>' : '';
  badge.className = 'dd-badge show';
  badge.style.background  = bgColor   || '#f8fafc';
  badge.style.borderColor = borderColor || '#e2e8f0';
  badge.innerHTML = '<div style="font-size:0.65rem;font-weight:700;color:#6b7280;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px">ASE 2025 · '+nTotal+' criteria entered</div><div class="dd-badge-row">'+chips+'</div>'+gradeHtml+noteHtml+overrideHtml;
}

function onDiastolicOverride() {
  var sel = document.getElementById('edit-diastolic'), lbl = document.getElementById('dd-algo-label');
  if (sel.value !== ddAutoGrade) { ddOverridden = true; lbl.textContent = '✎ Physician override'; }
  else { ddOverridden = false; lbl.textContent = ddAutoGrade ? '● ASE 2025 auto' : ''; }
  autoFillDiagnosis(); calcDiastolic();
}

function openAddModal(){
  pendingEditId = null;
  ddAutoGrade = ''; ddOverridden = false; _autoGenDiag = '';
  document.getElementById('edit-modal-title').textContent = 'Add New Study';
  var today=new Date(),dd=String(today.getDate()).padStart(2,'0'),mm=String(today.getMonth()+1).padStart(2,'0');
  document.getElementById('edit-date').value = mm+'/'+dd+'/'+today.getFullYear();
  document.getElementById('edit-type').value = 'TTE';
  ['edit-pid','edit-age','edit-phys','edit-ind','edit-ef','edit-lv','edit-lavi',
   'edit-ea','edit-ee','edit-esep','edit-elat','edit-tr','edit-gls'].forEach(function(id){
    document.getElementById(id).value='';
  });
  ['edit-cm','edit-peri','edit-cong'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('edit-diastolic').value = '';
  document.getElementById('edit-normal').checked = false;
  document.getElementById('as-fields').style.display = 'none';
  document.getElementById('as-mpg').value = ''; document.getElementById('as-ava').value = '';
  ['edit-tapse','edit-pasp','hcm-wt','hcm-lvot-rest','hcm-lvot-val',
   'mr-vc','mr-eroa','ms-mva','ms-mpg','ar-pht','tr-vc'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('hcm-sam').value=''; document.getElementById('mr-mech').value='';
  document.getElementById('hcm-fields').style.display='none';
  document.getElementById('mr-fields').style.display='none';
  document.getElementById('ms-fields').style.display='none';
  document.getElementById('ar-fields').style.display='none';
  document.getElementById('tr-fields').style.display='none';
  document.getElementById('dd-badge').className = 'dd-badge';
  document.getElementById('dd-algo-label').textContent = '';
  document.querySelectorAll('.v-cb').forEach(function(c){c.checked=false;});
  document.getElementById('editModal').classList.add('show');
}

function openEditModal(docId){
  var study=studies.find(function(s){return s._docId===docId;});if(!study)return;
  pendingEditId = docId; ddAutoGrade = ''; ddOverridden = study.dd_overridden || false; _autoGenDiag = '';
  document.getElementById('edit-modal-title').textContent = 'Edit Study';
  document.getElementById('edit-date').value   = study.date||'';
  document.getElementById('edit-type').value   = study.type||'TTE';
  document.getElementById('edit-pid').value    = study.pid||'';
  document.getElementById('edit-age').value    = study.age!==undefined&&study.age!=='—'?study.age:'';
  document.getElementById('edit-phys').value   = study.physician||'';
  document.getElementById('edit-ind').value    = study.diagnosis||'';
  document.getElementById('edit-normal').checked = study.is_normal||false;
  document.getElementById('edit-ef').value     = study.lvef||'';
  document.getElementById('edit-lv').value     = study.lv_diam||'';
  document.getElementById('edit-lavi').value   = study.lavi||'';
  document.getElementById('edit-ea').value     = study.ea_ratio||'';
  document.getElementById('edit-ee').value     = study.ee_ratio||'';
  document.getElementById('edit-esep').value   = study.esep||'';
  document.getElementById('edit-elat').value   = study.elat||'';
  document.getElementById('edit-tr').value     = study.tr_vmax||'';
  document.getElementById('edit-gls').value    = study.gls||'';
  document.getElementById('edit-diastolic').value = study.diastolic||'';
  document.getElementById('edit-cm').value     = study.cardiomyopathy||'';
  document.getElementById('edit-peri').value   = study.pericardial||'';
  document.getElementById('edit-cong').value   = study.congenital||'';
  var sv=study.valvular||[];
  document.querySelectorAll('.v-cb').forEach(function(c){c.checked=sv.includes(c.value);});
  document.getElementById('as-mpg').value = study.as_mpg||''; document.getElementById('as-ava').value = study.as_ava||'';
  document.getElementById('edit-tapse').value    = study.tapse||'';
  document.getElementById('edit-pasp').value     = study.pasp||'';
  document.getElementById('hcm-wt').value        = study.hcm_wt||'';
  document.getElementById('hcm-lvot-rest').value = study.hcm_lvot_rest||'';
  document.getElementById('hcm-lvot-val').value  = study.hcm_lvot_val||'';
  document.getElementById('hcm-sam').value       = study.hcm_sam||'';
  document.getElementById('mr-mech').value       = study.mr_mech||'';
  document.getElementById('mr-vc').value         = study.mr_vc||'';
  document.getElementById('mr-eroa').value       = study.mr_eroa||'';
  document.getElementById('ms-mva').value        = study.ms_mva||'';
  document.getElementById('ms-mpg').value        = study.ms_mpg||'';
  document.getElementById('ar-pht').value        = study.ar_pht||'';
  document.getElementById('tr-vc').value         = study.tr_vc||'';
  toggleASFields(); toggleValveFields(); toggleCMFields(); calcDiastolic();
  if (ddOverridden) document.getElementById('dd-algo-label').textContent = '✎ Physician override';
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
  var date=document.getElementById('edit-date').value.trim(), type=document.getElementById('edit-type').value,
      phys=document.getElementById('edit-phys').value||'', ind=document.getElementById('edit-ind').value.trim(),
      age=document.getElementById('edit-age').value.trim(), isN=document.getElementById('edit-normal').checked;
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
    pid:pid, date:date, type:type, physician:phys, diagnosis:ind, indication:ind,
    age:finalAge, month:monthStr, is_normal:isN,
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
    u._docId = docId;
    if(isNew){studies.unshift(u);}else{var idx=studies.findIndex(function(s){return s._docId===docId;});if(idx>=0)studies[idx]=u;}
    closeEditModal(); btn.disabled=false; btn.textContent='Save Changes';
    doFilter(); buildDash();
  }).catch(function(e){toast('Error: '+e.message);btn.disabled=false;btn.textContent='Save Changes';});
}

// Clinical Analytics
function buildClinicalAnalytics() {
  var s = studies;
  var n = s.length;
  if (!n) return;

  var withEF = s.filter(function(x){ return x.lvef !== undefined && x.lvef !== null && x.lvef !== ''; });
  var efVals  = withEF.map(function(x){ return parseFloat(x.lvef); }).filter(function(v){ return !isNaN(v); });
  var efMean  = efVals.length ? (efVals.reduce(function(a,b){return a+b;},0)/efVals.length).toFixed(1) : '—';
  var refN  = efVals.filter(function(v){return v<50;}).length;
  var mrefN = efVals.filter(function(v){return v>=50&&v<55;}).length;
  var pefN  = efVals.filter(function(v){return v>=55;}).length;
  document.getElementById('ca-ef-mean').textContent = efMean !== '—' ? efMean+'%' : '—';
  document.getElementById('ca-ef-sub').textContent   = 'of '+efVals.length+' studies with EF recorded';
  document.getElementById('ca-ref').textContent      = refN;
  document.getElementById('ca-ref-sub').textContent  = efVals.length ? Math.round(refN/efVals.length*100)+'% of studies with EF' : '—';
  document.getElementById('ca-mref').textContent     = mrefN;
  document.getElementById('ca-mref-sub').textContent = efVals.length ? Math.round(mrefN/efVals.length*100)+'% of studies with EF' : '—';
  document.getElementById('ca-pef').textContent      = pefN;
  document.getElementById('ca-pef-sub').textContent  = efVals.length ? Math.round(pefN/efVals.length*100)+'% of studies with EF' : '—';
  document.getElementById('ca-ef-badge').textContent = efVals.length + ' studies with EF';

  var bins = [0,0,0,0,0,0,0,0,0,0,0];
  var binLabels=['<20','20-29','30-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','≥75'];
  efVals.forEach(function(v){
    if(v<20) bins[0]++;
    else if(v<30) bins[1]++;
    else if(v<40) bins[2]++;
    else if(v<45) bins[3]++;
    else if(v<50) bins[4]++;
    else if(v<55) bins[5]++;
    else if(v<60) bins[6]++;
    else if(v<65) bins[7]++;
    else if(v<70) bins[8]++;
    else if(v<75) bins[9]++;
    else bins[10]++;
  });
  var efColors = ['#dc2626','#dc2626','#dc2626','#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981','#059669','#047857'];
  if(efChart) efChart.destroy();
  efChart = new Chart(document.getElementById('efChart'), {
    type:'bar', data:{labels:binLabels, datasets:[{data:bins, backgroundColor:efColors, borderRadius:6, borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  var ddMap = {Normal:0, 'Grade I':0, 'Grade II':0, 'Grade III':0, Indeterminate:0};
  s.forEach(function(x){ if(x.diastolic && ddMap.hasOwnProperty(x.diastolic)) ddMap[x.diastolic]++; });
  var ddTotal = Object.values(ddMap).reduce(function(a,b){return a+b;},0);
  document.getElementById('ca-dd-badge').textContent = ddTotal + ' studies with DD grade';
  var ddLabels=['Normal','Grade I','Grade II','Grade III','Indeterminate'];
  var ddColors=['#10b981','#fbbf24','#f97316','#dc2626','#94a3b8'];
  if(ddChart) ddChart.destroy();
  ddChart = new Chart(document.getElementById('ddChart'), {
    type:'doughnut',
    data:{labels:ddLabels, datasets:[{data:ddLabels.map(function(l){return ddMap[l]||0;}), backgroundColor:ddColors, borderColor:'#fff', borderWidth:3, hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:12,usePointStyle:true}}}}
  });
  var ddKpis = document.getElementById('ca-dd-kpis');
  ddKpis.innerHTML = ddLabels.map(function(l,i){
    var c=ddMap[l]||0, pct=ddTotal?Math.round(c/ddTotal*100):0;
    var icons=['✓','I','II','III','?'];
    return '<div class="kpi" style="padding:16px"><div class="kpi-label">'+l+'</div><div class="kpi-val" style="color:'+ddColors[i]+'">'+c+'</div><div class="kpi-sub">'+pct+'% of graded</div></div>';
  }).join('');

  var valveMap = {
    'Severe AS':0,'Moderate AS':0,'Severe AR':0,'Moderate AR':0,
    'Severe MS':0,'Moderate MS':0,'Severe MR':0,'Moderate MR':0,
    'Severe TR':0,'Moderate TR':0
  };
  s.forEach(function(x){
    if(x.valvular&&x.valvular.length) x.valvular.forEach(function(v){if(valveMap.hasOwnProperty(v)) valveMap[v]++;});
  });
  var valveKeys = Object.keys(valveMap).filter(function(k){return valveMap[k]>0;});
  valveKeys.sort(function(a,b){return valveMap[b]-valveMap[a];});
  var valveTotal = Object.values(valveMap).reduce(function(a,b){return a+b;},0);
  document.getElementById('ca-valve-badge').textContent = valveTotal + ' lesions recorded';
  var valveColors2 = valveKeys.map(function(k){ return k.startsWith('Severe')?'#dc2626':'#f97316'; });
  if(valveChart) valveChart.destroy();
  valveChart = new Chart(document.getElementById('valveChart'), {
    type:'bar', data:{labels:valveKeys, datasets:[{data:valveKeys.map(function(k){return valveMap[k];}), backgroundColor:valveColors2, borderRadius:6, borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}},y:{ticks:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}}}}
  });

  var asStudies = s.filter(function(x){ return x.valvular && (x.valvular.includes('Severe AS')||x.valvular.includes('Moderate AS')); });
  document.getElementById('ca-as-badge').textContent = asStudies.length + ' AS studies';
  if(asStudies.length){
    var sevAS=asStudies.filter(function(x){return x.valvular.includes('Severe AS');}).length;
    var modAS=asStudies.filter(function(x){return x.valvular.includes('Moderate AS');}).length;
    var withMPG=asStudies.filter(function(x){return x.as_mpg;}), mpgVals=withMPG.map(function(x){return parseFloat(x.as_mpg);}).filter(function(v){return !isNaN(v);});
    var withAVA=asStudies.filter(function(x){return x.as_ava;}), avaVals=withAVA.map(function(x){return parseFloat(x.as_ava);}).filter(function(v){return !isNaN(v);});
    var mpgMean=mpgVals.length?(mpgVals.reduce(function(a,b){return a+b;},0)/mpgVals.length).toFixed(1):'—';
    var avaMean=avaVals.length?(avaVals.reduce(function(a,b){return a+b;},0)/avaVals.length).toFixed(2):'—';
    var vLow=avaVals.filter(function(v){return v<1.0;}).length;
    document.getElementById('ca-as-body').innerHTML =
      '<div class="grid-2" style="gap:16px;margin-bottom:12px">'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Severe AS</div><div class="kpi-val" style="color:#dc2626">'+sevAS+'</div></div>'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Moderate AS</div><div class="kpi-val" style="color:#f97316">'+modAS+'</div></div>'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Mean PG</div><div class="kpi-val" style="font-size:1.6rem">'+mpgMean+'</div><div class="kpi-sub">mmHg avg ('+mpgVals.length+' recorded)</div></div>'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Mean AVA</div><div class="kpi-val" style="font-size:1.6rem">'+avaMean+'</div><div class="kpi-sub">cm² avg · '+vLow+' &lt;1.0 cm²</div></div>'+
      '</div>';
  } else { document.getElementById('ca-as-body').textContent = 'No AS studies recorded yet'; }

  var cmMap = {};
  s.forEach(function(x){ if(x.cardiomyopathy){ var k=x.cardiomyopathy; cmMap[k]=(cmMap[k]||0)+1; } });
  var cmKeys=Object.keys(cmMap).sort(function(a,b){return cmMap[b]-cmMap[a];});
  var cmTotal=cmKeys.reduce(function(a,k){return a+cmMap[k];},0);
  document.getElementById('ca-cm-badge').textContent = cmTotal + ' cardiomyopathy cases';
  var cmColors2=['#2563eb','#8b5cf6','#ec4899','#f97316','#10b981','#eab308','#06b6d4'];
  if(cmChart) cmChart.destroy();
  if(cmKeys.length){
    cmChart = new Chart(document.getElementById('cmChart'), {
      type:'doughnut', data:{labels:cmKeys, datasets:[{data:cmKeys.map(function(k){return cmMap[k];}), backgroundColor:cmColors2.slice(0,cmKeys.length), borderColor:'#fff', borderWidth:3, hoverOffset:4}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:12,usePointStyle:true}}}}
    });
  }

  var coocRows = '';
  var ddGrades = ['Normal','Grade I','Grade II','Grade III','Indeterminate'];
  var efCats = [
    {label:'Reduced EF <50%', fn:function(x){return x.lvef&&parseFloat(x.lvef)<50;}},
    {label:'Mildly Reduced 50-54%', fn:function(x){return x.lvef&&parseFloat(x.lvef)>=50&&parseFloat(x.lvef)<55;}},
    {label:'Preserved EF ≥55%', fn:function(x){return x.lvef&&parseFloat(x.lvef)>=55;}}
  ];
  efCats.forEach(function(cat){
    ddGrades.forEach(function(dd){
      var cnt=s.filter(function(x){return cat.fn(x)&&x.diastolic===dd;}).length;
      if(cnt>0) coocRows+='<div class="vc-row"><span class="vc-label" style="width:180px">'+cat.label+'</span><span style="flex:1;font-size:0.8rem;color:var(--text2)">'+dd+'</span><span class="vc-val">'+cnt+'</span></div>';
    });
  });
  document.getElementById('ca-cooc').innerHTML = coocRows || '<div style="color:var(--text3);font-size:0.8rem">No studies with both EF and DD grade recorded yet</div>';

  var ageVals = s.map(function(x){return parseInt(x.age);}).filter(function(v){return !isNaN(v)&&v>0&&v<120;});
  var ageMean = ageVals.length ? (ageVals.reduce(function(a,b){return a+b;},0)/ageVals.length).toFixed(0) : '—';
  var withData = s.filter(function(x){return x.lvef||x.diastolic||x.cardiomyopathy||(x.valvular&&x.valvular.length);}).length;
  document.getElementById('ca-age-mean').textContent = ageMean !== '—' ? ageMean : '—';
  document.getElementById('ca-withdata').textContent = withData;
  document.getElementById('ca-withdata-sub').textContent = n ? Math.round(withData/n*100)+'% of all studies' : '—';
  document.getElementById('ca-age-badge').textContent = ageVals.length + ' studies with age';

  var ageBins=[0,0,0,0,0,0,0,0,0], ageBinLabels=['<20','20-29','30-39','40-49','50-59','60-69','70-79','80-89','≥90'];
  ageVals.forEach(function(v){
    if(v<20)ageBins[0]++;else if(v<30)ageBins[1]++;else if(v<40)ageBins[2]++;else if(v<50)ageBins[3]++;
    else if(v<60)ageBins[4]++;else if(v<70)ageBins[5]++;else if(v<80)ageBins[6]++;else if(v<90)ageBins[7]++;else ageBins[8]++;
  });
  if(ageChart) ageChart.destroy();
  ageChart = new Chart(document.getElementById('ageChart'), {
    type:'bar', data:{labels:ageBinLabels, datasets:[{data:ageBins, backgroundColor:'#a5b4fc', borderRadius:6, borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  var decades=['<40','40s','50s','60s','70s','80+'];
  function ageBin(age){if(age<40)return 0;if(age<50)return 1;if(age<60)return 2;if(age<70)return 3;if(age<80)return 4;return 5;}
  var ddAgeData = {Normal:new Array(6).fill(0),'Grade I':new Array(6).fill(0),'Grade II':new Array(6).fill(0),'Grade III':new Array(6).fill(0)};
  s.forEach(function(x){
    var age=parseInt(x.age), dd=x.diastolic;
    if(isNaN(age)||age<=0||!dd||!ddAgeData[dd])return;
    ddAgeData[dd][ageBin(age)]++;
  });
  var ddAgeTotal=Object.values(ddAgeData).reduce(function(a,arr){return a+arr.reduce(function(s,v){return s+v;},0);},0);
  document.getElementById('ca-ddage-badge').textContent = ddAgeTotal + ' studies';
  var ddAgeColors={Normal:'#10b981','Grade I':'#fbbf24','Grade II':'#f97316','Grade III':'#dc2626'};
  if(ddAgeChart) ddAgeChart.destroy();
  ddAgeChart = new Chart(document.getElementById('ddAgeChart'), {
    type:'bar',
    data:{labels:decades, datasets:Object.keys(ddAgeData).map(function(dd){return{label:dd,data:ddAgeData[dd],backgroundColor:ddAgeColors[dd],borderRadius:4};})} ,
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:16,usePointStyle:true}}},scales:{x:{stacked:true,ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{stacked:true,ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  var topValves=['Severe AS','Severe MR','Moderate MR','Moderate AS','Severe TR'];
  var vAgeDatasets = topValves.map(function(valve,i){
    var counts=new Array(6).fill(0);
    s.forEach(function(x){
      var age=parseInt(x.age);
      if(isNaN(age)||age<=0||!x.valvular)return;
      if(x.valvular.includes(valve)) counts[ageBin(age)]++;
    });
    var palette=['#2563eb','#dc2626','#f97316','#f59e0b','#8b5cf6'];
    return{label:valve,data:counts,backgroundColor:palette[i],borderRadius:4};
  });
  var vAgeTotal=vAgeDatasets.reduce(function(a,d){return a+d.data.reduce(function(s,v){return s+v;},0);},0);
  document.getElementById('ca-vage-badge').textContent = vAgeTotal + ' lesions';
  if(vAgeChart) vAgeChart.destroy();
  vAgeChart = new Chart(document.getElementById('vAgeChart'), {
    type:'bar',data:{labels:decades,datasets:vAgeDatasets},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:12,usePointStyle:true}}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  var pefStudies = s.filter(function(x){return x.lvef&&parseFloat(x.lvef)>=55;});
  var hfpefStudies = pefStudies.filter(function(x){
    var criteria=0;
    if(x.lavi&&parseFloat(x.lavi)>34) criteria++;
    if(x.ee_ratio&&parseFloat(x.ee_ratio)>14) criteria++;
    if(x.tr_vmax&&parseFloat(x.tr_vmax)>2.8) criteria++;
    if(x.diastolic&&(x.diastolic==='Grade I'||x.diastolic==='Grade II'||x.diastolic==='Grade III')) criteria++;
    return criteria>=2;
  });
  var hfpefPct = pefStudies.length ? Math.round(hfpefStudies.length/pefStudies.length*100) : 0;
  document.getElementById('ca-hfpef-n').textContent   = hfpefStudies.length;
  document.getElementById('ca-hfpef-pct').textContent = hfpefPct + '%';
  document.getElementById('ca-hfpef-sub').textContent = 'LVEF≥55% + ≥2 echo criteria';
  document.getElementById('ca-hfpef-badge').textContent = pefStudies.length + ' preserved EF studies';
  var c_lavi_ab = pefStudies.filter(function(x){return x.lavi&&parseFloat(x.lavi)>34;}).length;
  var c_ee_ab   = pefStudies.filter(function(x){return x.ee_ratio&&parseFloat(x.ee_ratio)>14;}).length;
  var c_tr_ab   = pefStudies.filter(function(x){return x.tr_vmax&&parseFloat(x.tr_vmax)>2.8;}).length;
  var c_dd_ab   = pefStudies.filter(function(x){return x.diastolic&&x.diastolic!=='Normal'&&x.diastolic!=='';}).length;
  document.getElementById('ca-hfpef-body').innerHTML =
    '<div class="vc-row"><span class="vc-label">LAVI &gt;34 ml/m²</span><span class="vc-val" style="color:var(--accent)">'+c_lavi_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_lavi_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row"><span class="vc-label">E/e\' &gt;14</span><span class="vc-val" style="color:var(--accent)">'+c_ee_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_ee_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row"><span class="vc-label">TR Vmax &gt;2.8 m/s</span><span class="vc-val" style="color:var(--accent)">'+c_tr_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_tr_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row"><span class="vc-label">DD Grade ≥I</span><span class="vc-val" style="color:var(--accent)">'+c_dd_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_dd_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row" style="border-top:2px solid #e2e8f0;margin-top:4px"><span class="vc-label" style="color:#9333ea;font-weight:700">HFpEF Profile (≥2)</span><span class="vc-val" style="color:#9333ea;font-weight:700">'+hfpefStudies.length+' <span style="font-size:0.7rem">('+hfpefPct+'% of pEF)</span></span></div>';

  var coocPairs=[
    {a:'Severe AS',b:'Severe MR',label:'AS+MR (combined valve)'},
    {a:'Severe AS',b:'Severe TR',label:'AS+TR'},
    {a:'Severe MR',b:'DD Grade II+', label:'Severe MR + DD Grade ≥II'},
    {a:'HCM',b:'LVOTO',label:'HCM obstructive'}
  ];
  var cooc2Html='';
  var asMR  = s.filter(function(x){return x.valvular&&x.valvular.includes('Severe AS')&&x.valvular.includes('Severe MR');}).length;
  var asTR  = s.filter(function(x){return x.valvular&&x.valvular.includes('Severe AS')&&x.valvular.includes('Severe TR');}).length;
  var mrDD  = s.filter(function(x){return x.valvular&&x.valvular.includes('Severe MR')&&x.diastolic&&(x.diastolic==='Grade II'||x.diastolic==='Grade III');}).length;
  var hcmOb = s.filter(function(x){return x.cardiomyopathy==='Hypertrophic (HCM)'&&x.hcm_lvot_rest&&parseFloat(x.hcm_lvot_rest)>=30;}).length;
  var refDD = s.filter(function(x){return x.lvef&&parseFloat(x.lvef)<50&&x.diastolic&&(x.diastolic==='Grade II'||x.diastolic==='Grade III');}).length;
  var sevValveRefEF = s.filter(function(x){return x.valvular&&x.valvular.some(function(v){return v.startsWith('Severe');})&&x.lvef&&parseFloat(x.lvef)<50;}).length;
  [
    {label:'Severe AS + Severe MR (combined valve disease)', count:asMR},
    {label:'Severe AS + Severe TR', count:asTR},
    {label:'Severe MR + DD Grade ≥II', count:mrDD},
    {label:'HCM with obstructive physiology (LVOT ≥30 mmHg)', count:hcmOb},
    {label:'Reduced EF + DD Grade ≥II', count:refDD},
    {label:'Severe valve disease + Reduced EF', count:sevValveRefEF}
  ].forEach(function(pair){
    cooc2Html+='<div class="vc-row"><span class="vc-label" style="width:auto;flex:1;font-size:0.75rem;color:var(--text2)">'+pair.label+'</span><span style="font-weight:700;color:var(--accent);font-size:0.95rem;flex-shrink:0;width:50px;text-align:right">'+pair.count+'</span></div>';
  });
  document.getElementById('ca-cooc2').innerHTML = cooc2Html || '<div style="color:var(--text3);font-size:0.8rem">No co-occurring conditions recorded yet</div>';

  var sevKeys=['Severe AS','Severe AR','Severe MR','Severe MS','Severe TR'];
  document.getElementById('ca-sev-badge').textContent = s.filter(function(x){return x.valvular&&x.valvular.some(function(v){return v.startsWith('Severe');});}).length + ' studies';
  var sevHtml='';
  sevKeys.forEach(function(valve){
    var total=s.filter(function(x){return x.valvular&&x.valvular.includes(valve);}).length;
    if(!total) return;
    var withRefEF=s.filter(function(x){return x.valvular&&x.valvular.includes(valve)&&x.lvef&&parseFloat(x.lvef)<50;}).length;
    var withPEF  =s.filter(function(x){return x.valvular&&x.valvular.includes(valve)&&x.lvef&&parseFloat(x.lvef)>=55;}).length;
    sevHtml+='<div class="vc-row"><span class="vc-label" style="width:130px">'+valve+'</span><span style="flex:1;font-size:0.78rem;color:var(--text2)">n='+total+' · <span style="color:#dc2626">'+withRefEF+' reduced EF</span> · <span style="color:#059669">'+withPEF+' preserved EF</span></span></div>';
  });
  document.getElementById('ca-sev-body').innerHTML = sevHtml || '<div style="color:var(--text3);font-size:0.8rem">No severe valve disease recorded yet</div>';
}

// Patient Timeline
function openPtModal(pid) {
  if(!pid) return;
  var ptStudies=studies.filter(function(s){return s.pid===pid;}).sort(function(a,b){return parseDateToInt(a.date)-parseDateToInt(b.date);});
  if(!ptStudies.length){toast('No studies found for this patient');return;}
  document.getElementById('pt-title').textContent='Patient '+pid+' — '+ptStudies.length+' stud'+(ptStudies.length===1?'y':'ies');
  var withEF=ptStudies.filter(function(s){return s.lvef;}), efTrend=withEF.length>1;
  var html='';
  if(efTrend) html+='<div style="margin-bottom:16px"><div style="font-size:0.7rem;font-weight:700;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">LVEF Trend</div><div style="position:relative;height:160px"><canvas id="ptEfChart"></canvas></div></div>';
  html+='<div style="font-size:0.7rem;font-weight:700;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">Visit History</div>';
  ptStudies.forEach(function(s,idx){
    var ddColor=s.diastolic==='Grade III'?'#dc2626':s.diastolic==='Grade II'?'#f97316':s.diastolic==='Grade I'?'#fbbf24':s.diastolic==='Normal'?'#059669':'#94a3b8';
    var efColor=s.lvef?(parseFloat(s.lvef)<50?'#dc2626':parseFloat(s.lvef)<55?'#f97316':'#059669'):'var(--text3)';
    html+='<div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;background:'+(idx%2===0?'#fff':'#fafafa')+'">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:700;color:var(--text);font-size:0.85rem">'+s.date+'</span><span style="font-size:0.7rem;font-weight:600;color:var(--text2)">'+s.type+'</span></div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
    if(s.lvef) html+='<span class="ind-tag" style="background:#eff6ff;color:'+efColor+';font-weight:700">EF '+s.lvef+'%</span>';
    if(s.diastolic) html+='<span class="ind-tag" style="background:#f8fafc;color:'+ddColor+';font-weight:700">'+s.diastolic+'</span>';
    if(s.tapse) html+='<span class="ind-tag">TAPSE '+s.tapse+'mm</span>';
    if(s.pasp) html+='<span class="ind-tag">PASP '+s.pasp+'mmHg</span>';
    if(s.lavi) html+='<span class="ind-tag">LAVI '+s.lavi+'</span>';
    if(s.ee_ratio) html+='<span class="ind-tag">E/e\' '+s.ee_ratio+'</span>';
    if(s.gls) html+='<span class="ind-tag">GLS '+s.gls+'%</span>';
    html+='</div>';
    var findings=[];
    if(s.cardiomyopathy)findings.push(s.cardiomyopathy);
    if(s.pericardial)findings.push(s.pericardial);
    if(s.valvular&&s.valvular.length)findings=findings.concat(s.valvular);
    if(s.diagnosis)findings.unshift(s.diagnosis);
    if(findings.length)html+='<div style="font-size:0.72rem;color:var(--text2)">'+findings.join(' · ')+'</div>';
    if(s.physician)html+='<div style="font-size:0.68rem;color:var(--text3);margin-top:4px">'+s.physician+'</div>';
    html+='</div>';
  });
  if(ptStudies.length>1&&withEF.length>1){
    var firstEF=parseFloat(withEF[0].lvef),lastEF=parseFloat(withEF[withEF.length-1].lvef),delta=lastEF-firstEF;
    var arrow=delta>0?'↑':delta<0?'↓':'→',dColor=delta>0?'#059669':delta<0?'#dc2626':'#94a3b8';
    html+='<div style="background:linear-gradient(135deg,#eff6ff,#f0fdff);border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-top:4px;font-size:0.78rem"><span style="font-weight:700;color:var(--accent)">EF Change: </span><span style="color:'+dColor+';font-weight:700">'+arrow+' '+(delta>0?'+':'')+delta.toFixed(0)+'% </span><span style="color:var(--text2)">('+firstEF+'% → '+lastEF+'%)</span></div>';
  }
  document.getElementById('pt-body').innerHTML=html;
  document.getElementById('ptModal').classList.add('show');
  if(efTrend){
    setTimeout(function(){
      var ctx=document.getElementById('ptEfChart');if(!ctx)return;
      if(ptChart)ptChart.destroy();
      ptChart=new Chart(ctx,{type:'line',data:{labels:withEF.map(function(s){return s.date;}),datasets:[{data:withEF.map(function(s){return parseFloat(s.lvef);}),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,0.08)',pointBackgroundColor:'#2563eb',pointRadius:5,tension:0.3,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:10}},grid:{display:false}},y:{min:0,max:80,ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11},callback:function(v){return v+'%';}},grid:{color:'#f1f5f9'}}}}});
    },80);
  }
}

function closePtModal(){document.getElementById('ptModal').classList.remove('show');if(ptChart){ptChart.destroy();ptChart=null;}}
