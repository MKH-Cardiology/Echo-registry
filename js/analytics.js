function buildClinicalAnalytics(){
  var s=studies,n=s.length;
  if(!n)return;

  // LVEF
  var withEF=s.filter(function(x){return x.lvef!==undefined&&x.lvef!==null&&x.lvef!=='';});
  var efVals=withEF.map(function(x){return parseFloat(x.lvef);}).filter(function(v){return!isNaN(v);});
  var efMean=efVals.length?(efVals.reduce(function(a,b){return a+b;},0)/efVals.length).toFixed(1):'—';
  var refN=efVals.filter(function(v){return v<50;}).length;
  var mrefN=efVals.filter(function(v){return v>=50&&v<55;}).length;
  var pefN=efVals.filter(function(v){return v>=55;}).length;
  document.getElementById('ca-ef-mean').textContent=efMean!=='—'?efMean+'%':'—';
  document.getElementById('ca-ef-sub').textContent='of '+efVals.length+' studies with EF recorded';
  document.getElementById('ca-ref').textContent=refN;
  document.getElementById('ca-ref-sub').textContent=efVals.length?Math.round(refN/efVals.length*100)+'% of studies with EF':'—';
  document.getElementById('ca-mref').textContent=mrefN;
  document.getElementById('ca-mref-sub').textContent=efVals.length?Math.round(mrefN/efVals.length*100)+'% of studies with EF':'—';
  document.getElementById('ca-pef').textContent=pefN;
  document.getElementById('ca-pef-sub').textContent=efVals.length?Math.round(pefN/efVals.length*100)+'% of studies with EF':'—';
  document.getElementById('ca-ef-badge').textContent=efVals.length+' studies with EF';

  var bins=[0,0,0,0,0,0,0,0,0,0,0];
  var binLabels=['<20','20-29','30-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','≥75'];
  efVals.forEach(function(v){
    if(v<20)bins[0]++;else if(v<30)bins[1]++;else if(v<40)bins[2]++;else if(v<45)bins[3]++;
    else if(v<50)bins[4]++;else if(v<55)bins[5]++;else if(v<60)bins[6]++;else if(v<65)bins[7]++;
    else if(v<70)bins[8]++;else if(v<75)bins[9]++;else bins[10]++;
  });
  var efColors=['#dc2626','#dc2626','#dc2626','#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981','#059669','#047857'];
  if(efChart)efChart.destroy();
  efChart=new Chart(document.getElementById('efChart'),{
    type:'bar',data:{labels:binLabels,datasets:[{data:bins,backgroundColor:efColors,borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  // Diastolic Function
  var ddMap={Normal:0,'Grade I':0,'Grade II':0,'Grade III':0,Indeterminate:0};
  s.forEach(function(x){if(x.diastolic&&ddMap.hasOwnProperty(x.diastolic))ddMap[x.diastolic]++;});
  var ddTotal=Object.values(ddMap).reduce(function(a,b){return a+b;},0);
  document.getElementById('ca-dd-badge').textContent=ddTotal+' studies with DD grade';
  var ddLabels=['Normal','Grade I','Grade II','Grade III','Indeterminate'];
  var ddColors=['#10b981','#fbbf24','#f97316','#dc2626','#94a3b8'];
  if(ddChart)ddChart.destroy();
  ddChart=new Chart(document.getElementById('ddChart'),{
    type:'doughnut',
    data:{labels:ddLabels,datasets:[{data:ddLabels.map(function(l){return ddMap[l]||0;}),backgroundColor:ddColors,borderColor:'#fff',borderWidth:3,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:12,usePointStyle:true}}}}
  });
  var ddKpis=document.getElementById('ca-dd-kpis');
  ddKpis.innerHTML=ddLabels.map(function(l,i){
    var c=ddMap[l]||0,pct=ddTotal?Math.round(c/ddTotal*100):0;
    return'<div class="kpi" style="padding:16px"><div class="kpi-label">'+l+'</div><div class="kpi-val" style="color:'+ddColors[i]+'">'+c+'</div><div class="kpi-sub">'+pct+'% of graded</div></div>';
  }).join('');

  // Valvular Disease
  var valveMap={'Severe AS':0,'Moderate AS':0,'Severe AR':0,'Moderate AR':0,'Severe MS':0,'Moderate MS':0,'Severe MR':0,'Moderate MR':0,'Severe TR':0,'Moderate TR':0};
  s.forEach(function(x){if(x.valvular&&x.valvular.length)x.valvular.forEach(function(v){if(valveMap.hasOwnProperty(v))valveMap[v]++;});});
  var valveKeys=Object.keys(valveMap).filter(function(k){return valveMap[k]>0;});
  valveKeys.sort(function(a,b){return valveMap[b]-valveMap[a];});
  var valveTotal=Object.values(valveMap).reduce(function(a,b){return a+b;},0);
  document.getElementById('ca-valve-badge').textContent=valveTotal+' lesions recorded';
  var valveColors2=valveKeys.map(function(k){return k.startsWith('Severe')?'#dc2626':'#f97316';});
  if(valveChart)valveChart.destroy();
  valveChart=new Chart(document.getElementById('valveChart'),{
    type:'bar',data:{labels:valveKeys,datasets:[{data:valveKeys.map(function(k){return valveMap[k];}),backgroundColor:valveColors2,borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}},y:{ticks:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}}}}
  });

  // AS Detail
  var asStudies=s.filter(function(x){return x.valvular&&(x.valvular.includes('Severe AS')||x.valvular.includes('Moderate AS'));});
  document.getElementById('ca-as-badge').textContent=asStudies.length+' AS studies';
  if(asStudies.length){
    var sevAS=asStudies.filter(function(x){return x.valvular.includes('Severe AS');}).length;
    var modAS=asStudies.filter(function(x){return x.valvular.includes('Moderate AS');}).length;
    var mpgVals=asStudies.filter(function(x){return x.as_mpg;}).map(function(x){return parseFloat(x.as_mpg);}).filter(function(v){return!isNaN(v);});
    var avaVals=asStudies.filter(function(x){return x.as_ava;}).map(function(x){return parseFloat(x.as_ava);}).filter(function(v){return!isNaN(v);});
    var mpgMean=mpgVals.length?(mpgVals.reduce(function(a,b){return a+b;},0)/mpgVals.length).toFixed(1):'—';
    var avaMean=avaVals.length?(avaVals.reduce(function(a,b){return a+b;},0)/avaVals.length).toFixed(2):'—';
    var vLow=avaVals.filter(function(v){return v<1.0;}).length;
    document.getElementById('ca-as-body').innerHTML=
      '<div class="grid-2" style="gap:16px;margin-bottom:12px">'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Severe AS</div><div class="kpi-val" style="color:#dc2626">'+sevAS+'</div></div>'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Moderate AS</div><div class="kpi-val" style="color:#f97316">'+modAS+'</div></div>'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Mean PG</div><div class="kpi-val" style="font-size:1.6rem">'+mpgMean+'</div><div class="kpi-sub">mmHg avg ('+mpgVals.length+' recorded)</div></div>'+
      '<div class="kpi" style="padding:14px;margin:0"><div class="kpi-label">Mean AVA</div><div class="kpi-val" style="font-size:1.6rem">'+avaMean+'</div><div class="kpi-sub">cm² avg · '+vLow+' &lt;1.0 cm²</div></div>'+
      '</div>';
  }else{document.getElementById('ca-as-body').textContent='No AS studies recorded yet';}

  // Cardiomyopathy
  var cmMap={};
  s.forEach(function(x){if(x.cardiomyopathy){var k=x.cardiomyopathy;cmMap[k]=(cmMap[k]||0)+1;}});
  var cmKeys=Object.keys(cmMap).sort(function(a,b){return cmMap[b]-cmMap[a];});
  var cmTotal=cmKeys.reduce(function(a,k){return a+cmMap[k];},0);
  document.getElementById('ca-cm-badge').textContent=cmTotal+' cardiomyopathy cases';
  var cmColors2=['#2563eb','#8b5cf6','#ec4899','#f97316','#10b981','#eab308','#06b6d4'];
  if(cmChart)cmChart.destroy();
  if(cmKeys.length){
    cmChart=new Chart(document.getElementById('cmChart'),{
      type:'doughnut',data:{labels:cmKeys,datasets:[{data:cmKeys.map(function(k){return cmMap[k];}),backgroundColor:cmColors2.slice(0,cmKeys.length),borderColor:'#fff',borderWidth:3,hoverOffset:4}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:12,usePointStyle:true}}}}
    });
  }

  // EF + DD Co-occurrence
  var coocRows='';
  var ddGrades=['Normal','Grade I','Grade II','Grade III','Indeterminate'];
  var efCats=[
    {label:'Reduced EF <50%',fn:function(x){return x.lvef&&parseFloat(x.lvef)<50;}},
    {label:'Mildly Reduced 50-54%',fn:function(x){return x.lvef&&parseFloat(x.lvef)>=50&&parseFloat(x.lvef)<55;}},
    {label:'Preserved EF ≥55%',fn:function(x){return x.lvef&&parseFloat(x.lvef)>=55;}}
  ];
  efCats.forEach(function(cat){
    ddGrades.forEach(function(dd){
      var cnt=s.filter(function(x){return cat.fn(x)&&x.diastolic===dd;}).length;
      if(cnt>0)coocRows+='<div class="vc-row"><span class="vc-label" style="width:180px">'+cat.label+'</span><span style="flex:1;font-size:0.8rem;color:var(--text2)">'+dd+'</span><span class="vc-val">'+cnt+'</span></div>';
    });
  });
  document.getElementById('ca-cooc').innerHTML=coocRows||'<div style="color:var(--text3);font-size:0.8rem">No studies with both EF and DD grade recorded yet</div>';

  // Demographics
  var ageVals=s.map(function(x){return parseInt(x.age);}).filter(function(v){return!isNaN(v)&&v>0&&v<120;});
  var ageMean=ageVals.length?(ageVals.reduce(function(a,b){return a+b;},0)/ageVals.length).toFixed(0):'—';
  var withData=s.filter(function(x){return x.lvef||x.diastolic||x.cardiomyopathy||(x.valvular&&x.valvular.length);}).length;
  document.getElementById('ca-age-mean').textContent=ageMean!=='—'?ageMean:'—';
  document.getElementById('ca-withdata').textContent=withData;
  document.getElementById('ca-withdata-sub').textContent=n?Math.round(withData/n*100)+'% of all studies':'—';
  document.getElementById('ca-age-badge').textContent=ageVals.length+' studies with age';

  var ageBins=[0,0,0,0,0,0,0,0,0],ageBinLabels=['<20','20-29','30-39','40-49','50-59','60-69','70-79','80-89','≥90'];
  ageVals.forEach(function(v){
    if(v<20)ageBins[0]++;else if(v<30)ageBins[1]++;else if(v<40)ageBins[2]++;else if(v<50)ageBins[3]++;
    else if(v<60)ageBins[4]++;else if(v<70)ageBins[5]++;else if(v<80)ageBins[6]++;else if(v<90)ageBins[7]++;else ageBins[8]++;
  });
  if(ageChart)ageChart.destroy();
  ageChart=new Chart(document.getElementById('ageChart'),{
    type:'bar',data:{labels:ageBinLabels,datasets:[{data:ageBins,backgroundColor:'#a5b4fc',borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  // DD by Age Decade
  var decades=['<40','40s','50s','60s','70s','80+'];
  function ageBin(age){if(age<40)return 0;if(age<50)return 1;if(age<60)return 2;if(age<70)return 3;if(age<80)return 4;return 5;}
  var ddAgeData={Normal:new Array(6).fill(0),'Grade I':new Array(6).fill(0),'Grade II':new Array(6).fill(0),'Grade III':new Array(6).fill(0)};
  s.forEach(function(x){
    var age=parseInt(x.age),dd=x.diastolic;
    if(isNaN(age)||age<=0||!dd||!ddAgeData[dd])return;
    ddAgeData[dd][ageBin(age)]++;
  });
  var ddAgeTotal=Object.values(ddAgeData).reduce(function(a,arr){return a+arr.reduce(function(s,v){return s+v;},0);},0);
  document.getElementById('ca-ddage-badge').textContent=ddAgeTotal+' studies';
  var ddAgeColors={Normal:'#10b981','Grade I':'#fbbf24','Grade II':'#f97316','Grade III':'#dc2626'};
  if(ddAgeChart)ddAgeChart.destroy();
  ddAgeChart=new Chart(document.getElementById('ddAgeChart'),{
    type:'bar',
    data:{labels:decades,datasets:Object.keys(ddAgeData).map(function(dd){return{label:dd,data:ddAgeData[dd],backgroundColor:ddAgeColors[dd],borderRadius:4};})},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:16,usePointStyle:true}}},scales:{x:{stacked:true,ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{stacked:true,ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  // Valve by Age Decade
  var topValves=['Severe AS','Severe MR','Moderate MR','Moderate AS','Severe TR'];
  var vAgeDatasets=topValves.map(function(valve,i){
    var counts=new Array(6).fill(0);
    s.forEach(function(x){
      var age=parseInt(x.age);
      if(isNaN(age)||age<=0||!x.valvular)return;
      if(x.valvular.includes(valve))counts[ageBin(age)]++;
    });
    var palette=['#2563eb','#dc2626','#f97316','#f59e0b','#8b5cf6'];
    return{label:valve,data:counts,backgroundColor:palette[i],borderRadius:4};
  });
  var vAgeTotal=vAgeDatasets.reduce(function(a,d){return a+d.data.reduce(function(s,v){return s+v;},0);},0);
  document.getElementById('ca-vage-badge').textContent=vAgeTotal+' lesions';
  if(vAgeChart)vAgeChart.destroy();
  vAgeChart=new Chart(document.getElementById('vAgeChart'),{
    type:'bar',data:{labels:decades,datasets:vAgeDatasets},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:11},padding:12,usePointStyle:true}}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  // HFpEF
  var pefStudies=s.filter(function(x){return x.lvef&&parseFloat(x.lvef)>=55;});
  var hfpefStudies=pefStudies.filter(function(x){
    var criteria=0;
    if(x.lavi&&parseFloat(x.lavi)>34)criteria++;
    if(x.ee_ratio&&parseFloat(x.ee_ratio)>14)criteria++;
    if(x.tr_vmax&&parseFloat(x.tr_vmax)>2.8)criteria++;
    if(x.diastolic&&(x.diastolic==='Grade I'||x.diastolic==='Grade II'||x.diastolic==='Grade III'))criteria++;
    return criteria>=2;
  });
  var hfpefPct=pefStudies.length?Math.round(hfpefStudies.length/pefStudies.length*100):0;
  document.getElementById('ca-hfpef-n').textContent=hfpefStudies.length;
  document.getElementById('ca-hfpef-pct').textContent=hfpefPct+'%';
  document.getElementById('ca-hfpef-sub').textContent='LVEF≥55% + ≥2 echo criteria';
  document.getElementById('ca-hfpef-badge').textContent=pefStudies.length+' preserved EF studies';
  var c_lavi_ab=pefStudies.filter(function(x){return x.lavi&&parseFloat(x.lavi)>34;}).length;
  var c_ee_ab=pefStudies.filter(function(x){return x.ee_ratio&&parseFloat(x.ee_ratio)>14;}).length;
  var c_tr_ab=pefStudies.filter(function(x){return x.tr_vmax&&parseFloat(x.tr_vmax)>2.8;}).length;
  var c_dd_ab=pefStudies.filter(function(x){return x.diastolic&&x.diastolic!=='Normal'&&x.diastolic!=='';}).length;
  document.getElementById('ca-hfpef-body').innerHTML=
    '<div class="vc-row"><span class="vc-label">LAVI &gt;34 ml/m²</span><span class="vc-val" style="color:var(--accent)">'+c_lavi_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_lavi_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row"><span class="vc-label">E/e\' &gt;14</span><span class="vc-val" style="color:var(--accent)">'+c_ee_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_ee_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row"><span class="vc-label">TR Vmax &gt;2.8 m/s</span><span class="vc-val" style="color:var(--accent)">'+c_tr_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_tr_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row"><span class="vc-label">DD Grade ≥I</span><span class="vc-val" style="color:var(--accent)">'+c_dd_ab+' <span style="font-size:0.7rem;color:var(--text3)">/ '+pefStudies.length+' ('+Math.round(c_dd_ab/Math.max(pefStudies.length,1)*100)+'%)</span></span></div>'+
    '<div class="vc-row" style="border-top:2px solid #e2e8f0;margin-top:4px"><span class="vc-label" style="color:#9333ea;font-weight:700">HFpEF Profile (≥2)</span><span class="vc-val" style="color:#9333ea;font-weight:700">'+hfpefStudies.length+' <span style="font-size:0.7rem">('+hfpefPct+'% of pEF)</span></span></div>';

  // Disease Co-occurrence
  var asMR=s.filter(function(x){return x.valvular&&x.valvular.includes('Severe AS')&&x.valvular.includes('Severe MR');}).length;
  var asTR=s.filter(function(x){return x.valvular&&x.valvular.includes('Severe AS')&&x.valvular.includes('Severe TR');}).length;
  var mrDD=s.filter(function(x){return x.valvular&&x.valvular.includes('Severe MR')&&x.diastolic&&(x.diastolic==='Grade II'||x.diastolic==='Grade III');}).length;
  var hcmOb=s.filter(function(x){return x.cardiomyopathy==='Hypertrophic (HCM)'&&x.hcm_lvot_rest&&parseFloat(x.hcm_lvot_rest)>=30;}).length;
  var refDD=s.filter(function(x){return x.lvef&&parseFloat(x.lvef)<50&&x.diastolic&&(x.diastolic==='Grade II'||x.diastolic==='Grade III');}).length;
  var sevValveRefEF=s.filter(function(x){return x.valvular&&x.valvular.some(function(v){return v.startsWith('Severe');})&&x.lvef&&parseFloat(x.lvef)<50;}).length;
  var cooc2Html='';
  [{label:'Severe AS + Severe MR (combined valve disease)',count:asMR},
   {label:'Severe AS + Severe TR',count:asTR},
   {label:'Severe MR + DD Grade ≥II',count:mrDD},
   {label:'HCM with obstructive physiology (LVOT ≥30 mmHg)',count:hcmOb},
   {label:'Reduced EF + DD Grade ≥II',count:refDD},
   {label:'Severe valve disease + Reduced EF',count:sevValveRefEF}
  ].forEach(function(pair){
    cooc2Html+='<div class="vc-row"><span class="vc-label" style="width:auto;flex:1;font-size:0.75rem;color:var(--text2)">'+pair.label+'</span><span style="font-weight:700;color:var(--accent);font-size:0.95rem;flex-shrink:0;width:50px;text-align:right">'+pair.count+'</span></div>';
  });
  document.getElementById('ca-cooc2').innerHTML=cooc2Html||'<div style="color:var(--text3);font-size:0.8rem">No co-occurring conditions recorded yet</div>';

  // Severe Valve + EF
  var sevKeys=['Severe AS','Severe AR','Severe MR','Severe MS','Severe TR'];
  document.getElementById('ca-sev-badge').textContent=s.filter(function(x){return x.valvular&&x.valvular.some(function(v){return v.startsWith('Severe');});}).length+' studies';
  var sevHtml='';
  sevKeys.forEach(function(valve){
    var total=s.filter(function(x){return x.valvular&&x.valvular.includes(valve);}).length;
    if(!total)return;
    var withRefEF=s.filter(function(x){return x.valvular&&x.valvular.includes(valve)&&x.lvef&&parseFloat(x.lvef)<50;}).length;
    var withPEF=s.filter(function(x){return x.valvular&&x.valvular.includes(valve)&&x.lvef&&parseFloat(x.lvef)>=55;}).length;
    sevHtml+='<div class="vc-row"><span class="vc-label" style="width:130px">'+valve+'</span><span style="flex:1;font-size:0.78rem;color:var(--text2)">n='+total+' · <span style="color:#dc2626">'+withRefEF+' reduced EF</span> · <span style="color:#059669">'+withPEF+' preserved EF</span></span></div>';
  });
  document.getElementById('ca-sev-body').innerHTML=sevHtml||'<div style="color:var(--text3);font-size:0.8rem">No severe valve disease recorded yet</div>';
}
