// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCz-9cwOHbz_Ez-1DYwHQQQmwBjnclr-VI",
  authDomain: "echo-registry.firebaseapp.com",
  projectId: "echo-registry",
  storageBucket: "echo-registry.firebasestorage.app",
  messagingSenderId: "1045650491833",
  appId: "1:1045650491833:web:e9346488d46c0e7f9ece68"
});

// Global variables for Firebase services
var db = firebase.firestore();
var auth = firebase.auth();

// Show login page initially
document.getElementById('pageLogin').style.display = 'block';

// Listen for authentication state changes
auth.onAuthStateChanged(function(user) {
  if (user) {
    document.getElementById('pageLogin').style.display = 'none';
    document.getElementById('pageApp').style.display = 'block';
    // loadData() will be defined in app.js
    loadData();
  } else {
    document.getElementById('pageLogin').style.display = 'block';
    document.getElementById('pageApp').style.display = 'none';
  }
});

function doLogin() {
  var email = document.getElementById('lemail').value.trim();
  var pass = document.getElementById('lpass').value;
  var btn = document.getElementById('lbtn'), err = document.getElementById('lerr');
  
  if (!email || !pass) { 
    err.textContent = 'Enter email and password'; 
    err.style.display = 'block'; 
    return; 
  }
  
  btn.disabled = true; 
  btn.textContent = 'Signing in...'; 
  err.style.display = 'none';
  
  auth.signInWithEmailAndPassword(email, pass).catch(function() {
    err.textContent = 'Invalid email or password'; 
    err.style.display = 'block';
    btn.disabled = false; 
    btn.textContent = 'Sign In';
  });
}

function doLogout() { 
  if (confirm('Sign out?')) auth.signOut(); 
}
