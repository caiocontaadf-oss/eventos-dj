// scripts/app.js
// Protótipo JS: salva usuários, eventos e inscrições no localStorage

const STORAGE_KEYS = {
  users: 'ev_users_v1',
  events: 'ev_events_v1',
  enrolls: 'ev_enrolls_v1',
  currentUser: 'ev_current_user_v1'
};

// dados iniciais (se não houver)
function initData() {
  if(!localStorage.getItem(STORAGE_KEYS.users)) {
    const admin = [{ username: 'admin', password: 'admin', name: 'Admin', profile: 'organizador', institution: 'Universidade X' }];
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(admin));
  }
  if(!localStorage.getItem(STORAGE_KEYS.events)) {
    const sample = [
      { id: 1, title: 'Seminário de IA', event_type: 'seminario', start_date: '2025-11-10', end_date: '2025-11-10', location: 'Auditório A', capacity: 100, description: 'Introdução à IA' },
      { id: 2, title: 'Palestra: Ética', event_type: 'palestra', start_date: '2025-10-25', end_date: '2025-10-25', location: 'Sala 101', capacity: 80, description: 'Ética nas tecnologias' }
    ];
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(sample));
  }
  if(!localStorage.getItem(STORAGE_KEYS.enrolls)) {
    localStorage.setItem(STORAGE_KEYS.enrolls, JSON.stringify([]));
  }
}
initData();

// helpers
function getUsers(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]'); }
function saveUsers(u){ localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(u)); }
function getEvents(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.events) || '[]'); }
function saveEvents(e){ localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(e)); }
function getEnrolls(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.enrolls) || '[]'); }
function saveEnrolls(en){ localStorage.setItem(STORAGE_KEYS.enrolls, JSON.stringify(en)); }
function setCurrentUser(u){ localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(u)); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null'); }

// registro simples (sem hashing neste protótipo)
function registerUser(user) {
  const users = getUsers();
  if(users.find(x => x.username === user.username)) {
    throw new Error('Nome de usuário já existe.');
  }
  users.push(user);
  saveUsers(users);
}

// login simples
function loginUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if(user) {
    setCurrentUser(user);
    return true;
  }
  return false;
}

// eventos
function addEvent(event) {
  const events = getEvents();
  const newId = events.length ? Math.max(...events.map(e=>e.id)) + 1 : 1;
  event.id = newId;
  events.push(event);
  saveEvents(events);
}

// listagem e render
function renderEventList() {
  const row = document.getElementById('eventsRow');
  if(!row) return;
  const events = getEvents();
  row.innerHTML = '';
  events.forEach(ev => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card mb-3 p-3">
        <div class="card-body">
          <h5 class="event-card-title">${ev.title}</h5>
          <p class="small-muted">${ev.event_type} • ${ev.start_date} ${ev.location ? '• ' + ev.location : ''}</p>
          <p>${ev.description ? ev.description.substring(0,120) : ''}</p>
          <div class="d-flex gap-2">
            <a href="event-detail.html?id=${ev.id}" class="btn btn-outline-primary btn-sm">Ver</a>
            <button class="btn btn-primary btn-sm" onclick="enrollPrompt(${ev.id})">Inscrever</button>
          </div>
        </div>
      </div>`;
    row.appendChild(col);
  });
}

// detalhe
function renderEventDetail(id) {
  const card = document.getElementById('eventCard');
  const ev = getEvents().find(x => String(x.id) === String(id));
  if(!ev) {
    card.innerHTML = '<p class="text-danger">Evento não encontrado.</p>';
    return;
  }
  const enrolls = getEnrolls().filter(e => e.eventId === ev.id);
  card.innerHTML = `
    <h2>${ev.title}</h2>
    <p class="small-muted">${ev.event_type} • ${ev.start_date} ${ev.location ? '• ' + ev.location : ''}</p>
    <p>${ev.description || ''}</p>
    <p>Capacidade: ${ev.capacity} • Inscritos: ${enrolls.length}</p>
    <div class="d-flex gap-2">
      <button class="btn btn-primary" onclick="enrollPrompt(${ev.id})">Inscrever</button>
      <button class="btn btn-outline-secondary" onclick="generateCertificatePrompt(${ev.id})">Gerar Certificado (protótipo)</button>
    </div>
  `;
}

// inscrição
function enrollPrompt(eventId) {
  const user = getCurrentUser();
  if(!user) {
    if(confirm('Para se inscrever você precisa estar logado. Ir para Login?')) window.location.href = 'login.html';
    return;
  }
  const enrolls = getEnrolls();
  if(enrolls.find(e => e.eventId === eventId && e.username === user.username)) {
    alert('Você já está inscrito neste evento.');
    return;
  }
  enrolls.push({ username: user.username, eventId: eventId, registeredAt: new Date().toISOString() });
  saveEnrolls(enrolls);
  alert('Inscrição realizada (em protótipo).');
  if(document.getElementById('eventsRow')) renderEventList();
}

// certificado simples: gera um arquivo .txt (pode trocar por PDF com libs)
function generateCertificatePrompt(eventId) {
  const user = getCurrentUser();
  if(!user) {
    if(confirm('Para gerar certificado você precisa estar logado. Ir para Login?')) window.location.href = 'login.html';
    return;
  }
  const enrolls = getEnrolls();
  const ok = enrolls.find(e => e.eventId === eventId && e.username === user.username);
  if(!ok) {
    alert('Só é possível emitir certificado para usuários inscritos.');
    return;
  }
  // gerar conteúdo simples e baixar
  const ev = getEvents().find(x => x.id === eventId);
  const content = `Certificado\\n\\nEmitido para: ${user.name || user.username}\\nEvento: ${ev.title}\\nData: ${ev.start_date}\\nEmitido em: ${new Date().toLocaleDateString()}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificado_${ev.id}_${user.username}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// util para demonstrar a função renderEventList em index
if(typeof window !== 'undefined') window.renderEventList = renderEventList;
if(typeof window !== 'undefined') window.enrollPrompt = enrollPrompt;
if(typeof window !== 'undefined') window.generateCertificatePrompt = generateCertificatePrompt;
if(typeof window !== 'undefined') window.renderEventDetail = renderEventDetail;
if(typeof window !== 'undefined') window.loginUser = loginUser;
if(typeof window !== 'undefined') window.registerUser = registerUser;
if(typeof window !== 'undefined') window.addEvent = addEvent;