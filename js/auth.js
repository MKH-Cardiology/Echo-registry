firebase.initializeApp({
  apiKey: "AIzaSyCz-9cwOHbz_Ez-1DYwHQQQmwBjnclr-VI",
  authDomain: "echo-registry.firebaseapp.com",
  projectId: "echo-registry",
  storageBucket: "echo-registry.firebasestorage.app",
  messagingSenderId: "1045650491833",
  appId: "1:1045650491833:web:e9346488d46c0e7f9ece68"
});

var db = firebase.firestore();
var auth = firebase.auth();

document.getElementById('pageLogin').style.display = 'block';

auth.onAuthStateChanged(function(user){
  if(user){
    document.getElementById('pageLogin').style.display='none';
    document.getElementById('pageApp').style.display='block';
    loadData();
  }else{
    document.getElementById('pageLogin').style.display='block';
    document.getElementById('pageApp').style.display='none';
  }
});

function doLogin(){
  var email=document.getElementById('lemail').value.trim();
  var pass=document.getElementById('lpass').value;
  var btn=document.getElementById('lbtn'),err=document.getElementById('lerr');
  if(!email||!pass){err.textContent='Enter email and password';err.style.display='block';return;}
  btn.disabled=true;btn.textContent='Signing in...';err.style.display='none';
  auth.signInWithEmailAndPassword(email,pass).catch(function(){
    err.textContent='Invalid email or password';err.style.display='block';
    btn.disabled=false;btn.textContent='Sign In';
  });
}

function doLogout(){
  if(confirm('Sign out?'))auth.signOut();
}

function loadData(){
  document.getElementById('dbdot').className='db-dot';
  document.getElementById('dblabel').textContent='loading...';
  db.collection('echo_studies').get().then(function(snap){
    studies=[];
    snap.forEach(function(d){
      var data=d.data();
      data._docId=d.id;
      data.diagnosis=data.diagnosis||data.indication||'';
      data.physician=normalizePhysicianName(data.physician);
      studies.push(data);
    });
    studies.sort(function(a,b){return parseDateToInt(b.date)-parseDateToInt(a.date);});
    document.getElementById('dbdot').className='db-dot on';
    document.getElementById('dblabel').textContent=studies.length.toLocaleString()+' studies';
    document.getElementById('dbtotal').textContent=studies.length.toLocaleString();
    if(studies.length>0){buildDash();buildReg();}else{showEmpty();}
  }).catch(function(e){
    document.getElementById('dblabel').textContent='connection error';
    console.error(e);
  });
}

function showEmpty(){
  ['k-total','k-pts','k-tte','k-tee'].forEach(function(id){document.getElementById(id).textContent='0';});
  document.getElementById('tbody').innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">No studies yet — use Import tab</td></tr>';
}
