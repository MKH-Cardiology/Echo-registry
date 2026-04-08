// DATA CORE
function loadData() {
  document.getElementById('dbdot').className = 'db-dot';
  document.getElementById('dblabel').textContent = 'loading...';
  db.collection('echo_studies').get().then(function(snap) {
    studies = [];
    snap.forEach(function(d) {
      var data = d.data();
      data._docId = d.id;
      studies.push(data);
    });
    studies.sort(function(a, b) { return b.date - a.date; });
    document.getElementById('dbdot').className = 'db-dot on';
    document.getElementById('dblabel').textContent = studies.length + ' studies';
    buildReg(); buildDash();
  });
}

// REGISTRY & TABLE
function buildReg() { filtered = studies.slice(); renderTable(); }
function renderTable() {
  var s = (curPage - 1) * PAGE, e = s + PAGE, pg = filtered.slice(s, e);
  document.getElementById('thead-row').innerHTML = '<tr><th>Patient ID</th><th>Date</th><th>Type</th><th style="text-align:right">Action</th></tr>';
  document.getElementById('tbody').innerHTML = pg.map(function(s) {
    var adm = isSessionAdmin ? '<button class="btn-icon" style="color:red" onclick="deleteStudy(\''+s._docId+'\')"><i class="fa fa-trash"></i></button>' : '';
    return '<tr><td style="font-weight:700;color:var(--accent)" onclick="openPtModal(\''+s.pid+'\')">'+s.pid+'</td><td>'+s.date+'</td><td>'+s.type+'</td><td style="text-align:right"><button class="btn-icon" onclick="openViewModal(\''+s._docId+'\')"><i class="fa fa-eye"></i></button><button class="btn-icon" onclick="openEditModal(\''+s._docId+'\')"><i class="fa fa-pen"></i></button>'+adm+'</td></tr>';
  }).join('');
}

// DIASTOLIC ALGORITHM (ASE 2025)
function calcDiastolic() {
  var ee = parseFloat(document.getElementById('edit-ee').value);
  var lavi = parseFloat(document.getElementById('edit-lavi').value);
  var tr = parseFloat(document.getElementById('edit-tr').value);
  var esep = parseFloat(document.getElementById('edit-esep').value);
  var elat = parseFloat(document.getElementById('edit-elat').value);
  var age = parseInt(document.getElementById('edit-age').value) || 40;
  
  var score = 0, count = 0;
  if(!isNaN(ee)) { count++; if(ee > 14) score++; }
  if(!isNaN(lavi)) { count++; if(lavi > 34) score++; }
  if(!isNaN(tr)) { count++; if(tr > 2.8) score++; }
  
  var grade = "";
  if(count >= 2) {
    if(score === 0) grade = "Normal";
    else if(score >= 2) grade = "Grade II";
    else grade = "Indeterminate";
  }
  
  if(!ddOverridden) {
    document.getElementById('edit-diastolic').value = grade;
    document.getElementById('dd-algo-label').textContent = grade ? "(Auto)" : "";
  }
  autoFillDiagnosis();
}

// OCR & SCANNING
function runOCR(event) {
  var file = event.target.files[0];
  if (!file) return;
  var b = document.getElementById('ocr-badge');
  b.style.display = 'block'; b.style.background = '#eff6ff'; b.innerHTML = 'Analyzing...';
  Tesseract.recognize(file, 'eng').then(function(res) {
    var t = res.data.text;
    var ef = t.match(/EF\s*[:\s]*(\d+)/i);
    var pid = t.match(/ID\s*[:\s]*(\d{12})/i);
    if(ef) document.getElementById('edit-ef').value = ef[1];
    if(pid) { document.getElementById('edit-pid').value = pid[1]; onCivilIdInput(document.getElementById('edit-pid')); }
    b.innerHTML = '✓ Scan complete'; b.style.background = '#dcfce7';
  });
}

// HELPERS
function showTab(n, b) {
  document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tbtn').forEach(function(x) { x.classList.remove('active'); });
  document.getElementById('tab-' + n).classList.add('active');
  if (b) b.classList.add('active');
  if (n === 'clin') buildClinicalAnalytics();
}

function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(function() { t.style.display = 'none'; }, 3000); }
