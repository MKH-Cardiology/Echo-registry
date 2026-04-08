function runOCR(event){
  var file=event.target.files[0];if(!file)return;
  var badge=document.getElementById('ocr-badge');
  badge.style.display='block';
  badge.innerHTML='<i class="fa fa-spinner fa-spin" style="margin-right:6px"></i>Reading report — please wait...';
  badge.style.background='#eff6ff';badge.style.borderColor='#93c5fd';badge.style.color='#1d4ed8';
  event.target.value='';
  Tesseract.recognize(file,'eng',{
    logger:function(m){
      if(m.status==='recognizing text')
        badge.innerHTML='<i class="fa fa-spinner fa-spin" style="margin-right:6px"></i>Reading report... '+Math.round(m.progress*100)+'%';
    }
  }).then(function(result){
    parseOCRText(result.data.text);
  }).catch(function(err){
    badge.style.background='#fef2f2';badge.style.borderColor='#fca5a5';badge.style.color='#dc2626';
    badge.innerHTML='<i class="fa fa-circle-exclamation" style="margin-right:6px"></i>OCR failed: '+err.message;
  });
}

function parseOCRText(text){
  var badge=document.getElementById('ocr-badge');
  var filled=[],missed=[],flags=[];

  function preProcess(t){
    return t
      .replace(/E[`''′ʼ]/g,"E'")
      .replace(/e[`''′ʼ]/g,"e'")
      .replace(/E\s*\/\s*E'/g,"E/E'")
      .replace(/E\s*\/\s*e'/g,"E/e'")
      .replace(/E\s*\/\s*A/g,"E/A")
      .replace(/\bl\b/g,'1')
      .replace(/[\u00AD\u200B\u200C\u200D\uFEFF]/g,'')
      .replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  }
  text=preProcess(text);

  function extractAny(patterns,src){
    for(var i=0;i<patterns.length;i++){var m=src.match(patterns[i]);if(m)return m[1].trim();}
    return null;
  }

  // Patient ID
  var pid=extractAny([
    /Patient\s*Id[:\s]+(\d{10,12})/i,
    /Patient\s*ID[:\s]+(\d{10,12})/i,
    /\bPID[:\s]+(\d{10,12})/i,
    /ID[:\s#]+(\d{12})/i,
    /Patient[:\s]+.*?(\d{12})/i
  ],text);
  if(pid&&pid.length===12){
    document.getElementById('edit-pid').value=pid;
    onCivilIdInput(document.getElementById('edit-pid'));
    filled.push('Patient ID: '+pid);
  }else{missed.push('Patient ID');}

  // LVEF
  var lvef=null,efSource='';
  var efCandidates=[
    {re:/LVEF\s*\(Auto\s*EF\s*A4C\)\s+([\d\.]+)\s*%/i,src:'Auto EF A4C (biplane)'},
    {re:/LVEF\s*4\s*Ch\s*[_\s]*Q\s+([\d\.]+)\s*%/i,src:'biplane 4Ch Q'},
    {re:/LVEF\s*(?:Biplane|BP)\s+([\d\.]+)\s*%/i,src:'biplane'},
    {re:/LVEF\s*\(Teich\)\s+([\d\.]+)\s*%/i,src:'M-mode Teichholz',flag:'⚠ LVEF from M-mode (Teichholz) — confirm with biplane'},
    {re:/EF\s*\(Teich\)\s+([\d\.]+)\s*%/i,src:'M-mode Teichholz',flag:'⚠ LVEF from M-mode (Teichholz) — confirm with biplane'},
    {re:/LVEF\s*\(Cube\)\s+([\d\.]+)\s*%/i,src:'Cube',flag:'⚠ LVEF from Cube method — less accurate'},
    {re:/EF\s+\(?\s*%\s*\)?\s+([\d]{2,3})/i,src:'generic EF field'},
    {re:/ejection\s+fraction\s+(?:is\s+)?([\d]{2,3})\s*[-–]?\s*([\d]{2,3})?\s*%/i,src:'summary text',flag:'⚠ LVEF from summary text — confirm',range:true}
  ];
  for(var ci=0;ci<efCandidates.length;ci++){
    var cand=efCandidates[ci],em=text.match(cand.re);
    if(em){
      lvef=(cand.range&&em[2])?String(Math.round((parseInt(em[1])+parseInt(em[2]))/2)):em[1];
      efSource=cand.src;if(cand.flag)flags.push(cand.flag);break;
    }
  }
  if(lvef){document.getElementById('edit-ef').value=lvef;filled.push('LVEF: '+lvef+'% ('+efSource+')');}
  else{missed.push('LVEF');}

  // LVIDd
  var lvidd=extractAny([/LVIDd\s+([\d\.]+)\s*cm/i,/LVID\s*d\s+([\d\.]+)\s*cm/i,/LVIDd[:\s]+([\d\.]+)/i,/LV\s+Diastolic\s+Diameter[:\s]+([\d\.]+)/i],text);
  if(lvidd){document.getElementById('edit-lv').value=parseFloat(lvidd).toFixed(1);filled.push('LVIDd: '+lvidd+' cm');}
  else{missed.push('LVIDd');}

  // TAPSE
  var tapse=extractAny([/TAPSE[:\s]+([\d\.]+)\s*cm/i,/TAPSE[:\s]+([\d\.]+)\s*mm/i,/TAPSE[:\s]+([\d\.]+)/i,/TA\s*PSE[:\s]+([\d\.]+)/i],text);
  if(tapse){
    var tapseVal=parseFloat(tapse);
    var tapseMm=tapseVal<10?Math.round(tapseVal*10):Math.round(tapseVal);
    document.getElementById('edit-tapse').value=tapseMm;
    filled.push('TAPSE: '+tapseMm+' mm');
  }else{missed.push('TAPSE');}

  // LAVI
  var lavi=extractAny([
    /LAESVInd\s+MOD\s+BP\s+([\d\.]+)\s*ml/i,
    /LAESVInd\s+MOD\s+BP\s+([\d\.]+)/i,
    /LAESV\s+Index\s*\(\s*A[-\s]?L\s*\)\s+([\d\.]+)\s*ml/i,
    /LAESV\s+Index\s*\(\s*A[-\s]?L\s*\)\s+([\d\.]+)/i,
    /LAESV\s+Index\s+A[-\s]?L\s+([\d\.]+)\s*ml/i,
    /LAESV\s+Index\s+A[-\s]?L\s+([\d\.]+)/i,
    /LA\s*ESV\s*Index[:\s]+([\d\.]+)/i,
    /LAVI[:\s]+([\d\.]+)\s*ml/i,
    /LAVI[:\s]+([\d\.]+)/i,
    /LA\s*Volume\s*Index[:\s]+([\d\.]+)/i
  ],text);
  if(lavi){document.getElementById('edit-lavi').value=parseFloat(lavi).toFixed(1);filled.push('LAVI: '+lavi+' ml/m²');calcDiastolic();}
  else{missed.push('LAVI');}

  // MV E/A
  var ea=extractAny([/MV\s*E\/A\s*Ratio\s+([\d\.]+)/i,/MV\s*E\s*\/\s*A\s+([\d\.]+)/i,/E\/A\s*Ratio[:\s]+([\d\.]+)/i,/MV\s*E\/A[:\s]+([\d\.]+)/i,/\bE\/A[:\s]+([\d\.]+)/i],text);
  if(ea){document.getElementById('edit-ea').value=parseFloat(ea).toFixed(2);filled.push('MV E/A: '+ea);calcDiastolic();}
  else{missed.push('MV E/A');}

  // Average E/e'
  var ee=extractAny([
    /MV\s*E\/E'\s*Avg[:\s]+([\d\.]+)/i,
    /MV\s*E\s*\/\s*E'\s*Avg[:\s]+([\d\.]+)/i,
    /MV\s*E\/e'\s*Avg[:\s]+([\d\.]+)/i,
    /E\/E'\s*Avg[:\s]+([\d\.]+)/i,
    /E\/e'\s*Avg[:\s]+([\d\.]+)/i,
    /E\/E'\s*Average[:\s]+([\d\.]+)/i,
    /E\/e'\s*Average[:\s]+([\d\.]+)/i,
    /E\/e'\s*\(avg\)[:\s]+([\d\.]+)/i,
    /Avg\s*E\/e'[:\s]+([\d\.]+)/i,
    /Average\s*E\/e'[:\s]+([\d\.]+)/i,
    /E\/E'[:\s]+([\d\.]+)/i,
    /E\/e'[:\s]+([\d\.]+)/i
  ],text);
  if(ee){document.getElementById('edit-ee').value=parseFloat(ee).toFixed(1);filled.push("Avg E/e': "+ee);calcDiastolic();}
  else{missed.push("Avg E/e'");}

  // MV E' Septal
  var eSept=extractAny([
    /MV\s*E'\s*Sept[:\s]+([\d\.]+)\s*m\/s/i,/MV\s*E'\s*Sept[:\s]+([\d\.]+)\s*cm\/s/i,
    /MV\s*E'\s*Sept[:\s]+([\d\.]+)/i,/E'\s*Sept[:\s]+([\d\.]+)\s*m\/s/i,
    /E'\s*Sept[:\s]+([\d\.]+)/i,/Septal\s*[Ee]'[:\s]+([\d\.]+)/i,/e'\s*sep[t]?[:\s]+([\d\.]+)/i
  ],text);
  if(eSept){
    var eSeptVal=parseFloat(eSept);
    var eSeptCm=eSeptVal<2?(eSeptVal*100).toFixed(1):eSeptVal.toFixed(1);
    document.getElementById('edit-esep').value=eSeptCm;
    filled.push("MV E' Sept: "+eSeptCm+' cm/s');calcDiastolic();
  }else{missed.push("MV E' Sept");}

  // MV E' Lateral
  var eLat=extractAny([
    /MV\s*E'\s*Lat[:\s]+([\d\.]+)\s*m\/s/i,/MV\s*E'\s*Lat[:\s]+([\d\.]+)\s*cm\/s/i,
    /MV\s*E'\s*Lat[:\s]+([\d\.]+)/i,/E'\s*Lat[:\s]+([\d\.]+)\s*m\/s/i,
    /E'\s*Lat[:\s]+([\d\.]+)/i,/Lateral\s*[Ee]'[:\s]+([\d\.]+)/i,/e'\s*lat[:\s]+([\d\.]+)/i
  ],text);
  if(eLat){
    var eLatVal=parseFloat(eLat);
    var eLatCm=eLatVal<2?(eLatVal*100).toFixed(1):eLatVal.toFixed(1);
    document.getElementById('edit-elat').value=eLatCm;
    filled.push("MV E' Lat: "+eLatCm+' cm/s');calcDiastolic();
  }else{missed.push("MV E' Lat");}

  // TR Vmax
  var trv=extractAny([/TR\s*Vmax[:\s]+([\d\.]+)\s*m\/s/i,/TR\s*V\s*max[:\s]+([\d\.]+)\s*m\/s/i,/TR\s*Vmax[:\s]+([\d\.]+)/i,/Tricusp\w*\s*Vmax[:\s]+([\d\.]+)/i],text);
  if(trv){
    var trvVal=parseFloat(trv);
    if(trvVal>=1.0&&trvVal<=5.0){document.getElementById('edit-tr').value=trvVal.toFixed(2);filled.push('TR Vmax: '+trvVal.toFixed(2)+' m/s');calcDiastolic();}
  }else{missed.push('TR Vmax');}

  // PASP from TR maxPG
  var trPG=extractAny([/TR\s*maxPG\s+([\d\.]+)\s*mmHg/i,/TR\s*maxPG\s+([\d\.]+)/i,/TR\s*Max\s*PG[:\s]+([\d\.]+)/i,/TR\s*Peak\s*Gradient[:\s]+([\d\.]+)/i],text);
  if(trPG){
    var pasp=Math.round(parseFloat(trPG)+5);
    document.getElementById('edit-pasp').value=pasp;
    filled.push('PASP: ~'+pasp+' mmHg (TR maxPG+5)');
    flags.push('ℹ PASP estimated as TR maxPG + 5 mmHg (assumed RAP 5 mmHg)');
  }

  // GLS
  var gls=extractAny([/GLS[:\s]+(-?[\d\.]+)\s*%/i,/Global\s*Longitudinal\s*Strain[:\s]+(-?[\d\.]+)/i,/LV\s*GLS[:\s]+(-?[\d\.]+)/i],text);
  if(gls){document.getElementById('edit-gls').value=parseFloat(gls).toFixed(1);filled.push('GLS: '+gls+'%');}

  // Indication
  var indication=extractAny([/Indication[:\s]+([A-Za-z0-9\s\,\/\-\.]+?)[\n\r]/i,/Reason[:\s]+([A-Za-z0-9\s\,\/\-\.]+?)[\n\r]/i,/Clinical\s*Info[:\s]+([A-Za-z0-9\s\,\/\-\.]+?)[\n\r]/i],text);
  if(indication&&indication.trim()){
    var ind=document.getElementById('edit-ind');
    if(!ind.value.trim()){ind.value=indication.trim();_autoGenDiag='';filled.push('Indication: '+indication.trim());}
  }

  // Build badge
  var html='<div style="font-weight:700;margin-bottom:6px;font-size:0.78rem">✓ OCR Complete — Review all values before saving</div>';
  if(filled.length)html+='<div style="margin-bottom:6px"><b>Extracted ('+filled.length+'):</b><br>'+filled.map(function(f){return'<span style="color:#166534">✓ '+f+'</span>';}).join('<br>')+'</div>';
  if(flags.length)html+='<div style="margin-bottom:6px;color:#92400e">'+flags.map(function(f){return'<span>'+f+'</span>';}).join('<br>')+'</div>';
  if(missed.length)html+='<div style="color:#6b7280"><b>Not found ('+missed.length+'):</b> '+missed.join(', ')+'</div>';
  html+='<div style="margin-top:8px;font-style:italic;font-size:0.68rem;color:#6b7280">Always verify extracted values against the original report</div>';
  badge.style.background='#f0fdf4';badge.style.borderColor='#86efac';badge.style.color='#166534';
  badge.innerHTML=html;
}
