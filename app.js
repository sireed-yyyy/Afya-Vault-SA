// Afya-Vault single-app client-side logic (Firebase Auth + Firestore)
// Note: This is a client scaffold. Apply Firestore security rules in production.
const auth = firebase.auth();
const db = firebase.firestore();

// UI helpers
const app = document.getElementById('app');
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
const authTitle = document.getElementById('authTitle');
const roleSelect = document.getElementById('roleSelect');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authMsg = document.getElementById('authMsg');
const authSubmit = document.getElementById('authSubmit');
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');

let currentUser = null;
let currentRole = 'patient';

// initial load
renderLanding();

// Event bindings
btnLogin.addEventListener('click', ()=>{ openAuth('login'); });
btnRegister.addEventListener('click', ()=>{ openAuth('register'); });
authSubmit.addEventListener('click', handleAuthSubmit);
auth.onAuthStateChanged(async user=>{
  currentUser = user;
  if(user){
    const doc = await db.collection('users').doc(user.uid).get();
    const profile = doc.exists ? doc.data() : null;
    currentRole = (profile && profile.role) || 'patient';
    renderDashboard();
  } else {
    renderLanding();
  }
});

function openAuth(mode){
  authTitle.innerText = mode==='login' ? 'Login' : 'Register';
  authMsg.innerText='';
  emailInput.value=''; passwordInput.value='';
  roleSelect.value = 'patient';
  authModal.show();
  authSubmit.dataset.mode = mode;
}

async function handleAuthSubmit(){
  const mode = authSubmit.dataset.mode;
  const email = emailInput.value.trim(); const password = passwordInput.value;
  const role = roleSelect.value;
  if(!email || !password){ authMsg.innerText='Email and password required'; return; }
  try{
    if(mode==='register'){
      const res = await auth.createUserWithEmailAndPassword(email,password);
      await db.collection('users').doc(res.user.uid).set({ email, role, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      await auth.signInWithEmailAndPassword(email,password);
    }
    authModal.hide();
  } catch(e){
    authMsg.innerText = e.message;
  }
}

// Render functions
function renderLanding(){
  app.innerHTML = `
  <div class="container container-small">
    <div class="header-hero mb-4">
      <div class="row align-items-center">
        <div class="col-md-7">
          <h1>Afya‑Vault</h1>
          <p class="small-muted">Secure web platform for managing patient health records. Doctors sign records to ensure integrity and continuity of care.</p>
          <div class="mt-3"><button class="btn btn-primary" onclick="openAuth('register')">Get Started</button></div>
        </div>
        <div class="col-md-5 text-end">
          <img src="/assets/doctor-hero.png" alt="doctor" style="max-width:220px" />
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-4">
        <div class="card p-3">
          <h6>Why Afya‑Vault</h6>
          <ul class="small-muted">
            <li>Secure encrypted records</li>
            <li>Doctor-signed entries</li>
            <li>Appointment reminders</li>
          </ul>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card p-3">
          <h6>Quick Actions</h6>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" onclick="openAuth('login')">Login</button>
            <button class="btn btn-primary" onclick="openAuth('register')">Register</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

// Main dashboard (patients and providers use same app; shows role-specific UI)
async function renderDashboard(){
  const uid = currentUser.uid;
  const profileDoc = await db.collection('users').doc(uid).get();
  const profile = profileDoc.exists ? profileDoc.data() : { role: 'patient' };
  currentRole = profile.role || 'patient';

  if(currentRole === 'provider'){
    renderProviderDashboard(uid);
  } else {
    renderPatientDashboard(uid);
  }
}

async function renderPatientDashboard(uid){
  app.innerHTML = `
  <div class="container container-small">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3>Patient Dashboard</h3>
      <div><button class="btn btn-outline-secondary" onclick="signOut()">Logout</button></div>
    </div>
    <div class="row">
      <div class="col-md-5">
        <div class="card p-3 mb-3">
          <h6>Your Profile</h6>
          <p class="small-muted">Email: ${currentUser.email}</p>
        </div>

        <div class="card p-3">
          <h6>Emergency Info</h6>
          <p class="small-muted">Blood group, allergies, contacts</p>
          <div id="emInfo"></div>
        </div>
      </div>
      <div class="col-md-7">
        <div class="card p-3 mb-3">
          <h6>Records</h6>
          <ul id="patientRecords" class="list-group"></ul>
        </div>
        <div class="card p-3">
          <h6>Appointments</h6>
          <ul id="patientAppts" class="list-unstyled small"></ul>
          <button class="btn btn-sm btn-primary" onclick="createAppointment()">Request Appointment</button>
        </div>
      </div>
    </div>
  </div>
  `;
  loadPatientRecords(uid);
  loadAppointments(uid);
}

async function renderProviderDashboard(uid){
  app.innerHTML = `
  <div class="container container-small">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3>Provider Dashboard</h3>
      <div><button class="btn btn-outline-secondary" onclick="signOut()">Logout</button></div>
    </div>

    <div class="row">
      <div class="col-md-4">
        <div class="card p-3 mb-3">
          <h6>Create / Find Patient</h6>
          <input id="searchPatientId" class="form-control mb-2" placeholder="Patient ID (or email)" />
          <button class="btn btn-primary w-100" onclick="findOrCreatePatient()">Find / Create</button>
        </div>
        <div class="card p-3">
          <h6>My Signed Records</h6>
          <ul id="mySigned" class="list-group"></ul>
        </div>
      </div>

      <div class="col-md-8">
        <div class="card p-3 mb-3">
          <h6>Selected Patient Records</h6>
          <div id="selectedPatientInfo" class="small-muted mb-2"></div>
          <ul id="selectedRecords" class="list-group"></ul>
          <textarea id="recordNote" class="form-control my-2" placeholder="Write clinical note"></textarea>
          <div class="d-flex gap-2"><button class="btn btn-success" onclick="addRecord()">Add Record</button><button class="btn btn-outline-secondary" onclick="reloadSelected()">Reload</button></div>
        </div>
      </div>
    </div>
  </div>
  `;
  loadMySigned(uid);
}

// data functions
async function loadPatientRecords(patientId){
  const list = document.getElementById('patientRecords');
  list.innerHTML = '<li class="list-group-item small-muted">Loading...</li>';
  const q = await db.collection('records').where('patientId','==',patientId).orderBy('createdAt','desc').get();
  list.innerHTML = '';
  if(q.empty) list.innerHTML = '<li class="list-group-item small-muted">No records found</li>';
  q.forEach(doc=>{
    const r = doc.data();
    const li = document.createElement('li'); li.className='list-group-item';
    li.innerHTML = `<div><strong>${r.type || 'Visit'}</strong> <small class="text-muted"> ${new Date(r.createdAt.toDate()).toLocaleString()}</small></div>
                    <div>${r.data.notes}</div>
                    <div class="mt-1">${r.signed ? '<span class="badge-signed">Signed</span> Signed by '+(r.signedByEmail||r.signedBy) : '<small class="small-muted">Unsigned</small>'}</div>`;
    list.appendChild(li);
  });
}

async function loadAppointments(patientId){
  const ul = document.getElementById('patientAppts');
  ul.innerHTML = '<li class="small-muted">Loading...</li>';
  const q = await db.collection('appointments').where('patientId','==',patientId).orderBy('date','desc').get();
  ul.innerHTML='';
  q.forEach(doc=>{
    const a = doc.data();
    const li = document.createElement('li'); li.innerText = `${a.date} — ${a.status||'scheduled'}`;
    ul.appendChild(li);
  });
}

async function createAppointment(){
  const patientId = currentUser.uid;
  const date = new Date().toISOString();
  await db.collection('appointments').add({ patientId, date, status:'requested', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  alert('Appointment requested');
  loadAppointments(patientId);
}

// provider flows
let selectedPatientId = null;
async function findOrCreatePatient(){
  const q = document.getElementById('searchPatientId').value.trim();
  if(!q) return alert('Enter patient id or email');
  const users = await db.collection('users').where('email','==',q).get();
  if(!users.empty){ const u = users.docs[0]; selectedPatientId = u.id; setSelectedPatient(u); return; }
  const patientRef = await db.collection('patients').add({ name:'Unnamed', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  selectedPatientId = patientRef.id;
  setSelectedPatient({ id: patientRef.id, data: { name:'Unnamed' } });
}

function setSelectedPatient(u){
  const info = document.getElementById('selectedPatientInfo');
  info.innerText = `Patient: ${u.data?.name || u.data?.email || u.id} (ID: ${u.id || u}`;
  reloadSelected();
}

async function reloadSelected(){
  if(!selectedPatientId) return;
  const list = document.getElementById('selectedRecords');
  list.innerHTML = '<li class="list-group-item small-muted">Loading...</li>';
  const q = await db.collection('records').where('patientId','==',selectedPatientId).orderBy('createdAt','desc').get();
  list.innerHTML = '';
  q.forEach(doc=>{
    const r = doc.data();
    const li = document.createElement('li'); li.className='list-group-item';
    li.innerHTML = `<div><strong>${r.type||'Visit'}</strong> <small class="text-muted">${new Date(r.createdAt.toDate()).toLocaleString()}</small></div>
                    <div>${r.data.notes}</div>
                    <div class="mt-1">${r.signed ? '<span class="badge-signed">Signed</span> Signed by '+(r.signedByEmail||r.signedBy) : '<small class="small-muted">Unsigned</small>'}</div>`;
    if(!r.signed){
      const signBtn = document.createElement('button'); signBtn.className='btn btn-sm btn-outline-success mt-2'; signBtn.innerText='Sign & Lock';
      signBtn.addEventListener('click', ()=> signRecord(doc.id));
      li.appendChild(signBtn);
    }
    list.appendChild(li);
  });
}

async function addRecord(){
  if(!selectedPatientId) return alert('Select patient first');
  const note = document.getElementById('recordNote').value.trim();
  if(!note) return alert('Write something');
  await db.collection('records').add({ patientId:selectedPatientId, providerId:currentUser.uid, type:'visit', data:{ notes: note }, signed:false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  document.getElementById('recordNote').value='';
  reloadSelected();
}

async function signRecord(recordDocId){
  const docRef = db.collection('records').doc(recordDocId);
  await docRef.update({ signed:true, signedBy: currentUser.uid, signedByEmail: currentUser.email, signedAt: firebase.firestore.FieldValue.serverTimestamp() });
  alert('Record signed and locked');
  reloadSelected();
}

async function loadMySigned(uid){
  const list = document.getElementById('mySigned');
  list.innerHTML = '<li class="list-group-item small-muted">Loading...</li>';
  const q = await db.collection('records').where('providerId','==',uid).where('signed','==',true).orderBy('signedAt','desc').get();
  list.innerHTML='';
  q.forEach(doc=>{
    const r = doc.data();
    const li = document.createElement('li'); li.className='list-group-item small';
    li.innerText = `${r.type} — ${r.data.notes?.slice(0,40)} — ${new Date(r.signedAt.toDate()).toLocaleString()}`;
    list.appendChild(li);
  });
}

async function signOut(){ await auth.signOut(); location.href = '/'; }

window.openAuth = openAuth;
window.createAppointment = createAppointment;
window.findOrCreatePatient = findOrCreatePatient;
window.addRecord = addRecord;
window.reloadSelected = reloadSelected;
window.signOut = signOut;
