// ── Import ViewPoint CSV ──────────────────────────────────────────────────────
function onFile(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){var raw=ev.target.result;raw=raw.replace(/\u0000/g,'');parseAndImport(raw);};
  reader.readAsText(file,'UTF-16');
}

function parseAndImport(raw){
  if(raw.charCodeAt(0)===0xFEFF)raw=raw.slice(1);
  raw=raw.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  var rows=[],row=[],field='',inQ=false;
  for(var i=0;i<raw.length;i++){
    var c=raw[i];
    if(c==='"'){if(inQ&&raw[i+1]==='"'){field+='"';i++;}else inQ=!inQ;}
    else if(c===','&&!inQ){row.push(field);field='';}
    else if(c==='\n'&&!inQ){row.push(field);field='';if(row.some(function(f){return f.trim();}))rows.push(row);row=[];}
    else field+=c;
  }
  if(row.length){row.push(field);if(row.some(function(f){return f.trim();}))rows.push(row);}
  if(rows.length<2){toast('CSV appears empty');return;}
  var hdrs=rows[0].map(function(h){return h.trim();});
  function col(n){for(var i=0;i<hdrs.length;i++){if(hdrs[i].toLowerCase().indexOf(n.toLowerCase())>=0)return i;}return -1;}
  var cPID=col('Patient'),cDate=col('date'),cType=col('type'),cStatus=col('status');
  var cPhysR=col('Reading'),cPhysP=col('Performing'),cAcc=col('Accession'),cDOB=col('DOB');
  if(cPID<0||cDate<0||cStatus<0){toast('Required columns not found');return;}
  var fmt=document.getElementById('import-date-format').value;
  var list=[],skip=0;
  for(var i=1;i<rows.length;i++){
    var r=rows[i];if(!r||r.length<3){skip++;continue;}
    var status=cStatus>=0?(r[cStatus]||'').trim():'';
    var type=cType>=0?(r[cType]||'').trim():'';
    var pid=cPID>=0?(r[cPID]||'').replace(/[\s\n\r]+/g,''):'';
    if(pid.length>12&&pid.length%2===0){var h1=pid.substring(0,pid.length/2);if(h1===pid.substring(pid.length/2))pid=h1;}
    if(status.toLowerCase().indexOf('scan')<0){skip++;continue;}
    if(type&&type!=='TTE'&&type!=='TEE'){skip++;continue;}
    if(!pid||pid.length<3){skip++;continue;}
    var dateRaw=cDate>=0?(r[cDate]||'').trim():'';
    var dp=dateRaw.split(' ')[0].replace(/[\-\.]/g,'/').split('/');
    var finalDate=dateRaw,finalMonth='';
    if(dp.length===3){
      if(fmt==='MM/DD/YYYY'){finalDate=dp[1].padStart(2,'0')+'/'+dp[0].padStart(2,'0')+'/'+dp[2];finalMonth=dp[0].padStart(2,'0');}
      else{finalDate=dp[0].padStart(2,'0')+'/'+dp[1].padStart(2,'0')+'/'+dp[2];finalMonth=dp[1].padStart(2,'0');}
    }
    var physRaw=cPhysR>=0?(r[cPhysR]||'').trim():'';
    if(!physRaw&&cPhysP>=0)physRaw=(r[cPhysP]||'').trim();
    var ind=cAcc>=0?(r[cAcc]||'').trim():'';
    var dob=cDOB>=0?(r[cDOB]||'').trim():'';
    list.push({pid:pid,date:finalDate,type:type||'TTE',physician:normalizePhysicianName(physRaw),
      diagnosis:ind,indication:ind,dob:dob,age:calculateAgeAtScan(dob,finalDate,pid),
      month:finalMonth,importedAt:new Date().toISOString()});
  }
  if(!list.length){toast('No completed TTE/TEE studies found');return;}
  toast('Found '+list.length+' studies — saving...');
  batchSave(list, fmt);
}

function batchSave(list, fmt){
  var wrap=document.getElementById('prwrap'),fill=document.getElementById('prfill'),txt=document.getElementById('prtxt');
  wrap.style.display='block';
  var BATCH=400,done=0,batches=[];
  for(var i=0;i<list.length;i+=BATCH)batches.push(list.slice(i,i+BATCH));
  function next(idx){
    if(idx>=batches.length){fill.style.width='100%';txt.textContent='Complete! '+done+' studies saved.';document.getElementById('dblast').textContent=new Date().toLocaleString();toast('✓ '+done+' studies imported');setTimeout(function(){wrap.style.display='none';loadData();},2000);return;}
    var batch=db.batch();
    batches[idx].forEach(function(s){var id=buildDocId(s.pid,s.date,fmt||'MM/DD/YYYY');batch.set(db.collection('echo_studies').doc(id),s,{merge:true});done++;});
    batch.commit().then(function(){var p=Math.round((idx+1)/batches.length*100);fill.style.width=p+'%';txt.textContent='Saving '+Math.min(done,list.length)+' / '+list.length+'...';next(idx+1);})
      .catch(function(e){txt.textContent='Error: '+e.message;console.error(e);});
  }
  next(0);
}

// ── Clean Duplicates ──────────────────────────────────────────────────────────
function cleanDuplicates(){
  if(!confirm('This will scan all '+studies.length+' studies and remove duplicates.\n\nStudies with clinical data are always kept.\nThis cannot be undone. Continue?'))return;
  var wrap=document.getElementById('cleanPrWrap'),fill=document.getElementById('cleanPrFill'),txt=document.getElementById('cleanPrTxt');
  wrap.style.display='block';fill.style.width='10%';txt.textContent='Loading all studies from Firebase...';
  db.collection('echo_studies').get().then(function(snap){
    var allDocs=[];
    snap.forEach(function(d){var data=d.data();data._docId=d.id;allDocs.push(data);});
    fill.style.width='30%';txt.textContent='Analyzing '+allDocs.length+' studies...';
    var groups={};
    allDocs.forEach(function(doc){
      var p=String(doc.date||'').split(' ')[0].replace(/[\-\.]/g,'/').split('/');
      var dateKey='';
      if(p.length===3){var p0=parseInt(p[0],10),p1=parseInt(p[1],10),y=parseInt(p[2],10);var m,d;if(p0>12){d=p0;m=p1;}else{m=p0;d=p1;}dateKey=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');}
      else{dateKey=doc.date||'unknown';}
      var key=(doc.pid||'nopid')+'_'+dateKey;
      if(!groups[key])groups[key]=[];
      groups[key].push(doc);
    });
    var toDelete=[];
    Object.values(groups).forEach(function(group){
      if(group.length<=1)return;
      var scored=group.map(function(doc){
        var score=0;
        ['lvef','lv_diam','lavi','ea_ratio','ee_ratio','esep','elat','tr_vmax','gls','diastolic','cardiomyopathy','pericardial','congenital'].forEach(function(f){if(doc[f])score++;});
        if(doc.valvular&&doc.valvular.length)score+=doc.valvular.length;
        if(doc.is_normal)score+=1;
        if(doc.diagnosis&&doc.diagnosis.trim())score+=1;
        return{doc:doc,score:score};
      });
      scored.sort(function(a,b){if(b.score!==a.score)return b.score-a.score;return(b.doc.importedAt||'')>(a.doc.importedAt||'')?1:-1;});
      for(var i=1;i<scored.length;i++)toDelete.push(scored[i].doc._docId);
    });
    if(toDelete.length===0){fill.style.width='100%';txt.textContent='No duplicates found — database is clean ✓';toast('No duplicates found');return;}
    fill.style.width='50%';txt.textContent='Found '+toDelete.length+' duplicates — deleting...';
    var BATCH=400,deleted=0,batches=[];
    for(var i=0;i<toDelete.length;i+=BATCH)batches.push(toDelete.slice(i,i+BATCH));
    function delNext(idx){
      if(idx>=batches.length){fill.style.width='100%';txt.textContent='Done! Removed '+deleted+' duplicates. Database now has '+(allDocs.length-deleted)+' studies.';toast('✓ Removed '+deleted+' duplicates');setTimeout(function(){wrap.style.display='none';loadData();},3000);return;}
      var batch=db.batch();
      batches[idx].forEach(function(id){batch.delete(db.collection('echo_studies').doc(id));deleted++;});
      batch.commit().then(function(){var p=50+Math.round((idx+1)/batches.length*50);fill.style.width=p+'%';txt.textContent='Deleting... '+deleted+' / '+toDelete.length;delNext(idx+1);}).catch(function(e){txt.textContent='Error: '+e.message;console.error(e);});
    }
    delNext(0);
  }).catch(function(e){txt.textContent='Error loading: '+e.message;console.error(e);});
}

// ── Export to Excel (CSV format) ──────────────────────────────────────────────
function exportExcel() {
  var data = filtered.length ? filtered : studies;
  if(!data.length){toast('No studies to export');return;}
  var headers = ['Civil ID','Date','Type','Age','Physician','Diagnosis','LVEF (%)','LVIDd (cm)','GLS (%)','LAVI (ml/m²)','TAPSE (mm)','PASP (mmHg)','E/A Ratio','Avg E/e\'','MV E\' Sept','MV E\' Lat','TR Vmax (m/s)','Diastolic Function','DD Auto Grade','DD Overridden','Cardiomyopathy','Pericardial','Congenital','Valvular Lesions','AS Mean PG','AS AVA','MR Mechanism','MR Vena Contracta','MR EROA','MS MVA','MS Mean PG','AR PHT','TR Vena Contracta','HCM Wall Thickness','HCM LVOT Rest','HCM LVOT Valsalva','HCM SAM','Normal Study','Import Date'];
  var rows = data.map(function(s){return [s.pid||'',s.date||'',s.type||'',s.age||'',s.physician||'',s.diagnosis||'',s.lvef||'',s.lv_diam||'',s.gls||'',s.lavi||'',s.tapse||'',s.pasp||'',s.ea_ratio||'',s.ee_ratio||'',s.esep||'',s.elat||'',s.tr_vmax||'',s.diastolic||'',s.dd_auto_grade||'',s.dd_overridden?'Yes':'No',s.cardiomyopathy||'',s.pericardial||'',s.congenital||'',s.valvular&&s.valvular.length?s.valvular.join('; '):'',s.as_mpg||'',s.as_ava||'',s.mr_mech||'',s.mr_vc||'',s.mr_eroa||'',s.ms_mva||'',s.ms_mpg||'',s.ar_pht||'',s.tr_vc||'',s.hcm_wt||'',s.hcm_lvot_rest||'',s.hcm_lvot_val||'',s.hcm_sam||'',s.is_normal?'Yes':'No',s.importedAt?s.importedAt.split('T')[0]:''];});
  var csv=[headers].concat(rows).map(function(row){return row.map(function(cell){var c=String(cell).replace(/"/g,'""');return (c.includes(',')||c.includes('"')||c.includes('\n'))?'"'+c+'"':c;}).join(',');}).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='echo_registry_'+(new Date().toISOString().split('T')[0])+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('✓ Exported '+data.length+' studies');
}
