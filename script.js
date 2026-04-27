// --- 1. CONFIGURACIÓN FIREBASE (Tus llaves personales) ---
const firebaseConfig = {
  apiKey: "AIzaSyA_KoTX8rvDrsU7qEEfturgiPhkseQN4i4",
  authDomain: "sergiolearning-21620.firebaseapp.com",
  databaseURL: "https://sergiolearning-21620-default-rtdb.firebaseio.com",
  projectId: "sergiolearning-21620",
  storageBucket: "sergiolearning-21620.appspot.com",
  messagingSenderId: "363094807638",
  appId: "1:363094807638:web:5ea9b50c18593998297f7"
};

// Inicializar la nube
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique', 'math', 'svt'];
let currentSub = '', currentThemeIdx = null, currentStepIdx = 0, myChart = null;

// Estas variables se llenan desde la nube
let db = {};
let scores = {};
let reminders = [];

// --- 2. ESCUCHAR LA NUBE Y MIGRAR DATOS LOCALES ---
database.ref('/').on('value', (snapshot) => {
    const cloudData = snapshot.val();
    
    // CASO A: Ya hay datos en la nube, los usamos
    if (cloudData) {
        db = cloudData.db || {};
        scores = cloudData.scores || {};
        reminders = cloudData.reminders || [];
        materias.forEach(m => { if(!db[m]) db[m] = []; });
        renderHome();
    } 
    // CASO B: La nube está vacía (Primera vez), migramos tu trabajo previo
    else {
        console.log("Nube vacía. Buscando trabajo previo en esta computadora...");
        const localData = JSON.parse(localStorage.getItem('sergioV7')); 
        const localScores = JSON.parse(localStorage.getItem('sergioScoresV7'));
        const localReminders = JSON.parse(localStorage.getItem('sergioRemindersV7'));

        if (localData) {
            alert("MIGRACIÓN: Subiendo tu trabajo previo a la nube...");
            database.ref('/').set({
                db: localData,
                scores: localScores || {},
                reminders: localReminders || []
            });
        } else {
            // Si es una compu nueva sin nada
            materias.forEach(m => { if(!db[m]) db[m] = []; });
            renderHome();
        }
    }
});

// --- 3. FUNCIONES DE NAVEGACIÓN ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function goToHome() { showView('view-home'); renderHome(); }
function goToSubject() { showView('view-subject'); }
function goBackToPath() { showView('view-theme-path'); }

function renderHome() {
    const grid = document.getElementById('subjects-grid');
    if(!grid) return;
    grid.innerHTML = '';
    materias.forEach(m => {
        const card = document.createElement('div');
        card.className = `subject-card card-${m}`;
        card.innerHTML = `<span class="subject-label">${m}</span>`;
        card.onclick = () => openSubject(m);
        grid.appendChild(card);
    });
    renderReminders();
}

function renderReminders() {
    const list = document.getElementById('reminders-list');
    const today = new Date().toISOString().split('T')[0];
    const active = (reminders || []).filter(r => r.date >= today);
    list.innerHTML = active.length ? '' : "<p>Tout est à jour ! 👍</p>";
    active.forEach(r => {
        list.innerHTML += `<div style="background:#fff5e6; padding:15px; border-radius:15px; margin-bottom:10px; border-left:8px solid #e67e22; font-weight:bold;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

// --- 4. GUARDAR TODO EN LA NUBE ---
function saveEverything() {
    const status = document.getElementById('save-status');
    status.innerText = "⏳ Synchronisation...";
    
    const mat = document.getElementById('adm-materia').value;
    const name = document.getElementById('adm-tema-name').value;
    if(!name) return alert("Nom du thème !");

    if(!db[mat]) db[mat] = [];
    db[mat].push({
        name,
        ppt: document.getElementById('adm-ppt').value,
        iframe: document.getElementById('adm-iframe').value,
        url: document.getElementById('adm-url').value,
        video: document.getElementById('adm-video').value,
        progress: 0
    });

    const rText = document.getElementById('rem-text').value;
    const rDate = document.getElementById('rem-date').value;
    if (rText && rDate) reminders.push({ text: rText, date: rDate });

    // ENVIAR A LA NUBE
    database.ref('/').set({ db, scores, reminders }).then(() => {
        status.innerText = "🚀 SESIÓN GUARDADA EN LA NUBE";
        // Limpiar formulario
        document.getElementById('adm-tema-name').value = '';
        document.getElementById('adm-ppt').value = '';
        document.getElementById('adm-iframe').value = '';
        document.getElementById('adm-url').value = '';
        document.getElementById('adm-video').value = '';
        document.getElementById('rem-text').value = '';
        document.getElementById('rem-date').value = '';
        setTimeout(goToHome, 1500);
    });
}

function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    const container = document.getElementById('folders-container');
    container.innerHTML = '';
    (db[m] || []).forEach((t, i) => {
        const f = document.createElement('div');
        f.className = 'subject-card card-musique';
        f.style.height = "120px";
        f.innerHTML = `<span class="subject-label">📂 ${t.name}</span>`;
        f.onclick = () => openThemePath(i);
        container.appendChild(f);
    });
    renderChart(m);
}

function openThemePath(idx) {
    currentThemeIdx = idx;
    const theme = db[currentSub][idx];
    showView('view-theme-path');
    document.getElementById('path-theme-title').innerText = theme.name;
    const container = document.getElementById('path-buttons-container');
    container.innerHTML = '';
    const steps = [
        { name: "Présentation", data: theme.ppt, icon: "📽️" },
        { name: "Actividad", data: theme.iframe, icon: "🎮" },
        { name: "Web", data: theme.url, icon: "🌐" },
        { name: "Vidéo", data: theme.video, icon: "📺" },
        { name: "Examen", data: "EXAM", icon: "🎓" }
    ].filter(s => s.data);

    steps.forEach((s, i) => {
        const locked = i > (theme.progress || 0);
        const b = document.createElement('div');
        b.className = `subject-card card-musique ${locked ? 'locked' : ''}`;
        b.style.height = "120px";
        b.innerHTML = `<span class="subject-label">${s.icon} ${s.name}</span>`;
        if(!locked) b.onclick = () => { currentStepIdx = i; launchStep(s); };
        container.appendChild(b);
    });
}

function launchStep(s) {
    showView('view-activity');
    document.getElementById('activity-place').innerHTML = s.data.includes('<iframe') ? s.data : `<iframe src="${s.data}"></iframe>`;
}

function completeStep() {
    const theme = db[currentSub][currentThemeIdx];
    if(currentStepIdx === 1) document.getElementById('modal-score').classList.remove('hidden');
    else { theme.progress = (theme.progress || 0) + 1; database.ref('/').set({ db, scores, reminders }); }
}

function saveStepScore() {
    const n = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(n);
    db[currentSub][currentThemeIdx].progress++;
    database.ref('/').set({ db, scores, reminders });
    document.getElementById('modal-score').classList.add('hidden');
    openThemePath(currentThemeIdx);
}

function showLogin() { showView('view-login'); }
function checkAdminPassword() {
    if(document.getElementById('admin-pass-input').value === "Gaby1429") showView('view-admin');
    else alert("Faux!");
}

function renderChart(m) {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    const h = scores[m] || [0];
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: h.map((_,i)=>`Ex ${i+1}`), datasets: [{ label: '1-20', data: h, backgroundColor: '#E91E63' }] },
        options: { scales: { y: { min:0, max:20 } } }
    });
}

window.onload = renderHome;
