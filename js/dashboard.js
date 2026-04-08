function buildDash(){
  var n=studies.length;
  var tte=studies.filter(function(s){return s.type==='TTE';}).length;
  var tee=studies.filter(function(s){return s.type==='TEE';}).length;
  var pts=new Set(studies.filter(function(s){return s.pid;}).map(function(s){return s.pid;})).size;
  document.getElementById('k-total').textContent=n.toLocaleString();
  document.getElementById('k-pts').textContent=pts.toLocaleString();
  document.getElementById('k-tte').textContent=tte.toLocaleString();
  document.getElementById('k-tee').textContent=tee.toLocaleString();
  document.getElementById('k-tte-p').textContent=n?Math.round(tte/n*100)+'% of total':'—';
  document.getElementById('k-tee-p').textContent=n?Math.round(tee/n*100)+'% of total':'—';

  var mn={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'};
  var mc={};
  studies.forEach(function(s){if(s.month)mc[s.month]=(mc[s.month]||0)+1;});
  var sm=Object.keys(mc).sort();
  if(!sm.length)return;
  var maxMonth=sm.reduce(function(a,b){return mc[a]>mc[b]?a:b;},sm[0]);
  document.getElementById('peak-month').textContent='Peak: '+(mn[maxMonth]||'')+' ('+mc[maxMonth]+')';

  if(mChart)mChart.destroy();
  mChart=new Chart(document.getElementById('mChart'),{
    type:'bar',data:{labels:sm.map(function(m){return mn[m]||m;}),datasets:[{data:sm.map(function(m){return mc[m];}),backgroundColor:sm.map(function(m){return m===maxMonth?'#2563eb':'#bfdbfe';}),borderRadius:8,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],dc=[0,0,0,0,0,0,0];
  studies.forEach(function(s){
    if(!s.date)return;
    var p=s.date.replace(/[\-\.]/g,'/').split('/');
    if(p.length===3){
      var p0=parseInt(p[0],10),p1=parseInt(p[1],10),y=parseInt(p[2],10);
      var month,day;
      if(p0>12){day=p0;month=p1;}else{month=p0;day=p1;}
      var d=new Date(y,month-1,day);
      if(!isNaN(d))dc[d.getDay()]++;
    }
  });
  if(dayChart)dayChart.destroy();
  dayChart=new Chart(document.getElementById('dayChart'),{
    type:'bar',data:{labels:days,datasets:[{data:dc,backgroundColor:dc.map(function(v){return v===Math.max.apply(null,dc)?'#0d9488':'#a5f3fc';}),borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{display:false}},y:{ticks:{color:'#94a3b8',font:{family:'Plus Jakarta Sans',size:11}},grid:{color:'#f1f5f9'}}}}
  });

  if(tChart)tChart.destroy();
  tChart=new Chart(document.getElementById('tChart'),{
    type:'doughnut',data:{labels:['TTE','TEE'],datasets:[{data:[tte,tee],backgroundColor:['#2563eb','#d97706'],borderColor:['#fff','#fff'],borderWidth:3,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'70%',plugins:{legend:{position:'right',labels:{color:'#475569',font:{family:'Plus Jakarta Sans',size:12},padding:20,usePointStyle:true}}}}
  });

  var pc={};
  studies.forEach(function(s){var p=s.physician||'—';pc[p]=(pc[p]||0)+1;});
  var sp=Object.entries(pc).sort(function(a,b){return b[1]-a[1];}).slice(0,10);
  var mx=sp[0]?sp[0][1]:1;
  document.getElementById('top-phys').textContent=sp[0]?sp[0][0].replace('Dr. ',''):'';
  document.getElementById('physList').innerHTML=sp.map(function(x,i){
    return'<li class="phys-item"><span class="phys-rank">'+(i+1)+'</span><span class="phys-name">'+x[0]+'</span><div class="phys-bar-wrap"><div class="phys-bar" style="width:'+Math.round(x[1]/mx*100)+'%"></div></div><span class="phys-count">'+x[1]+'</span></li>';
  }).join('');

  var fp=document.getElementById('fphys');
  fp.innerHTML='<option value="">All Physicians</option>';
  Object.keys(pc).filter(function(n){return n!=='—';}).sort().forEach(function(n){
    var o=document.createElement('option');o.value=n;o.textContent=n;fp.appendChild(o);
  });

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
  document.getElementById('indCloud').innerHTML=si.map(function(x){
    var sz=x[1]/maxInd>0.6?'lg':x[1]/maxInd>0.3?'md':'';
    return'<span class="ind-tag '+sz+'">'+x[0]+' <b>'+x[1]+'</b></span>';
  }).join('');
}
