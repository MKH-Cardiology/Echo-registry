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
  if(!pg.length){
    document.getElementById('tbody').innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No studies match filters</td></tr>';
    return;
  }
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
    return'<tr><td style="font-weight:600;color:var(--accent);white-space:nowrap;cursor:pointer" onclick="openPtModal(\''+s.pid+'\')">'+(s.pid||'—')+'</td><td style="max-width:280px;padding:8px 16px">'+ind+'</td><td style="font-weight:500;white-space:nowrap">'+s.date+'</td><td><span class="'+tb(s.type)+'">'+s.type+'</span></td><td style="color:var(--text2)">'+(s.age!==undefined?s.age:'—')+'</td><td style="color:var(--text2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(s.physician||'—')+'</td><td style="text-align:right;white-space:nowrap"><button class="btn-icon" onclick="openViewModal(\''+s._docId+'\')"><i class="fa fa-eye"></i></button>'+adm+'</td></tr>';
  }).join('');
}

function goPage(d){curPage=Math.max(1,Math.min(Math.ceil(filtered.length/PAGE),curPage+d));renderTable();}

function toggleAdmin(){
  if(isSessionAdmin){
    isSessionAdmin=false;toast('Admin Mode Disabled');
    var b=document.getElementById('btn-admin-toggle');
    b.innerHTML='<i class="fa fa-lock"></i> Admin Mode';
    b.classList.remove('btn-admin-active');
    renderTable();
  }else{
    document.getElementById('admin-pin').value='';
    document.getElementById('pinModal').classList.add('show');
    setTimeout(function(){document.getElementById('admin-pin').focus();},100);
  }
}

function closePinModal(){document.getElementById('pinModal').classList.remove('show');}

function verifyPin(){
  if(document.getElementById('admin-pin').value==='1234'){
    isSessionAdmin=true;closePinModal();toast('Admin Mode Unlocked');
    var b=document.getElementById('btn-admin-toggle');
    b.innerHTML='<i class="fa fa-unlock"></i> Admin Mode ON';
    b.classList.add('btn-admin-active');
    renderTable();
  }else{
    toast('Incorrect PIN');
    document.getElementById('admin-pin').value='';
    document.getElementById('admin-pin').focus();
  }
}

function deleteStudy(id){
  if(!isSessionAdmin)return;
  if(confirm('Delete this study permanently?')){
    db.collection('echo_studies').doc(id).delete().then(function(){
      toast('Study deleted');loadData();
    }).catch(function(e){toast('Error: '+e.message);});
  }
}

function openPtModal(pid){
  if(!pid)return;
  var ptStudies=studies.filter(function(s){return s.pid===pid;}).sort(function(a,b){return parseDateToInt(a.date)-parseDateToInt(b.date);});
  if(!ptStudies.length){toast('No studies found for this patient');return;}
  document.getElementById('pt-title').textContent='Patient '+pid+' — '+ptStudies.length+' stud'+(ptStudies.length===1?'y':'ies');
  var withEF=ptStudies.filter(function(s){return s.lvef;}),efTrend=withEF.length>1;
  var html='';
  if(efTrend)html+='<div style="margin-bottom:16px"><div style="font-size:0.7rem;font-weight:700;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">LVEF Trend</div><div style="position:relative;height:160px"><canvas id="ptEfChart"></canvas></div></div>';
  html+='<div style="font-size:0.7rem;font-weight:700;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">Visit History</div>';
  ptStudies.forEach(function(s,idx){
    var ddColor=s.diastolic==='Grade III'?'#dc2626':s.diastolic==='Grade II'?'#f97316':s.diastolic==='Grade I'?'#fbbf24':s.diastolic==='Normal'?'#059669':'#94a3b8';
    var efColor=s.lvef?(parseFloat(s.lvef)<50?'#dc2626':parseFloat(s.lvef)<55?'#f97316':'#059669'):'var(--text3)';
    html+='<div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;background:'+(idx%2===0?'#fff':'#fafafa')+'">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:700;color:var(--text);font-size:0.85rem">'+s.date+'</span><span style="font-size:0.7rem;font-weight:600;color:var(--text2)">'+s.type+'</span></div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
    if(s.lvef)html+='<span class="ind-tag" style="background:#eff6ff;color:'+efColor+';font-weight:700">EF '+s.lvef+'%</span>';
    if(s.diastolic)html+='<span class="ind-tag" style="background:#f8fafc;color:'+ddColor+';font-weight:700">'+s.diastolic+'</span>';
    if(s.tapse)html+='<span class="ind-tag">TAPSE '+s.tapse+'mm</span>';
    if(s.pasp)html+='<span class="ind-tag">PASP '+s.pasp+'mmHg</span>';
    if(s.lavi)html+='<span class="ind-tag">LAVI '+s.lavi+'</span>';
    if(s.ee_ratio)html+='<span class="ind-tag">E/e\' '+s.ee_ratio+'</span>';
    if(s.gls)html+='<span class="ind-tag">GLS '+s.gls+'%</span>';
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

function closePtModal(){
  document.getElementById('ptModal').classList.remove('show');
  if(ptChart){ptChart.destroy();ptChart=null;}
}
