var studies = [], filtered = [], curPage = 1, PAGE = 25;
var mChart = null, tChart = null, dayChart = null;
var pendingEditId = null, isSessionAdmin = false;
var ddAutoGrade = '', ddOverridden = false;
var ptChart = null;
var efChart=null, ddChart=null, valveChart=null, cmChart=null, ageChart=null;
var ddAgeChart=null, vAgeChart=null;
var _autoGenDiag = '';

function toast(msg){
  var t=document.getElementById('toast');
  t.textContent=msg;
  t.style.display='block';
  setTimeout(function(){t.style.display='none';},3500);
}

function parseDateToInt(ds){
  if(!ds)return 0;
  var p=String(ds).trim().split(' ')[0].replace(/[\-\.]/g,'/').split('/');
  if(p.length!==3)return 0;
  var p0=parseInt(p[0],10)||0,p1=parseInt(p[1],10)||0,y=parseInt(p[2],10)||0;
  if(y<100)y+=2000;if(y<1000)return 0;
  var month,day;
  if(p0>12){day=p0;month=p1;}else if(p1>12){month=p0;day=p1;}else{month=p0;day=p1;}
  return(y*10000)+(month*100)+day;
}

function normalizePhysicianName(name){
  if(!name||!name.trim())return'—';
  var lower=name.toLowerCase();
  if(lower.includes('samir'))return'Dr. Samir';
  if(lower.includes('zaher'))return'Dr. Zaher';
  if(lower.includes('shafie'))return'Dr. Shafie';
  if(lower.includes('ashraf'))return'Dr. Ashraf';
  if(lower.includes('akmal'))return'Dr. Akmal';
  if(lower.includes('fawzy'))return'Dr. Fawzy';
  if(lower.includes('ibrahim'))return'Dr. Ibrahim';
  if(lower.includes('ehab')||lower.includes('ihab'))return'Dr. Ihab';
  if(lower.includes('maged'))return'Dr. Maged';
  if(lower.includes('hany'))return'Dr. Hany';
  if(lower.includes('farouk'))return'Dr. Farouk';
  if(lower.includes('ramy'))return'Dr. Ramy';
  if(lower.includes('hamza'))return'Dr. Hamza';
  var c=name.trim();
  if(!lower.startsWith('dr'))return'Dr. '+c.charAt(0).toUpperCase()+c.slice(1);
  var rest=c.replace(/^dr\.?\s*/i,'');
  return rest?'Dr. '+rest.charAt(0).toUpperCase()+rest.slice(1):c;
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

function buildDocId(pid,dateStr,fmt){
  var p=dateStr.replace(/[\-\.]/g,'/').split('/');
  if(p.length!==3)return pid+'_'+dateStr.replace(/\//g,'-');
  var p0=parseInt(p[0],10),p1=parseInt(p[1],10),y=parseInt(p[2],10);
  if(y<100)y+=2000;
  var month,day;
  if(fmt==='MM/DD/YYYY'){month=p0;day=p1;}
  else if(fmt==='DD/MM/YYYY'){day=p0;month=p1;}
  else if(p0>12){day=p0;month=p1;}
  else{month=p0;day=p1;}
  return pid+'_'+y+String(month).padStart(2,'0')+String(day).padStart(2,'0');
}

function showTab(n,b){
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.tbtn').forEach(function(x){x.classList.remove('active');});
  document.getElementById('tab-'+n).classList.add('active');
  if(b)b.classList.add('active');
  if(n==='clin')buildClinicalAnalytics();
}
