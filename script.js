// --- 1. CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyA_KoTX8rvDrsU7qEEfturgiPhkseQN4i4",
  authDomain: "sergiolearning-21620.firebaseapp.com",
  databaseURL: "https://sergiolearning-21620-default-rtdb.firebaseio.com",
  projectId: "sergiolearning-21620",
  storageBucket: "sergiolearning-21620.appspot.com",
  messagingSenderId: "363094807638",
  appId: "1:363094807638:web:5ea9b50c18593998297f7"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique', 'math', 'svt'];
let currentSub = '', currentThemeIdx = null, currentStepIdx = 0, myChart = null;
let db = {};
let scores = {};
let reminders = [];

database.ref('/').on('value', (snapshot) => {
    const cloudData = snapshot.val();
    if(cloudData) {
        db = cloudData.db || {};
        scores = cloudData.scores || {};
        reminders = cloudData.reminders || [];
        renderReminders();
    }
});

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
}

function openSubject(m) {
    currentSub = m;
    showView('view-themes');
    document.getElementById('theme-title').innerText = m.toUpperCase();
    renderThemes();
    renderChart(m);
}

function renderThemes() {
    const container = document.getElementById('themes-container');
    container.innerHTML = '';
    const themes = db[currentSub] || [];
    themes.forEach((t, index) => {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.onclick = () => openThemePath(index);
        card.innerHTML = `
            <div class="theme-icon">📂</div>
            <div class="theme-info">
                <h3>${t.name}</h3>
                <div class="progress-bar"><div class="progress-fill" style="width:${(t.progress/4)*100}%"></div></div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderReminders() {
    const container = document.getElementById('reminders-list');
    if(!container) return;
    container.innerHTML = '';
    reminders.forEach(r => {
        const div = document.createElement('div');
        div.className = 'reminder-item';
        div.innerHTML = `<strong>${r.date}</strong>: ${r.text}`;
        container.appendChild(div);
    });
}

function openThemePath(idx) {
    currentThemeIdx = idx;
    const t = db[currentSub][idx];
    showView('view-path');
    document.getElementById('path-title').innerText = t.name;
    const steps = [
        { name: 'Leçon PPT', icon: '📄', data: t.ppt },
        { name: 'Wordwall', icon: '🎮', data: t.iframe },
        { name: 'Fiche', icon: '🔗', data: t.url },
        { name: 'Vidéo', icon: '📺', data: t.video }
    ];
    const container = document.getElementById('path-container');
    container.innerHTML = '';
    steps.forEach((s, i) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `path-step ${i < t.progress ? 'completed' : (i === t.progress ? 'current' : 'locked')}`;
        stepDiv.onclick = () => { if(i <= t.progress) { currentStepIdx = i; launchStep(s); } };
        stepDiv.innerHTML = `<div class="step-icon">${s.icon}</div><p>${s.name}</p>`;
        container.appendChild(stepDiv);
    });
}

// --- 4. GUARDAR TODO (CORREGIDO: TEMA OPCIONAL) ---
function saveEverything() {
    const status = document.getElementById('save-status');
    status.innerText = "⏳ Synchronisation...";
    const mat = document.getElementById('adm-materia').value;
    const name = document.getElementById('adm-tema-name').value;
    const rText = document.getElementById('rem-text').value;
    const rDate = document.getElementById('rem-date').value;
    let hayCambios = false;

    if (name.trim() !== "") {
        if (!db[mat]) db[mat] = [];
        db[mat].push({
            name: name,
            ppt: document.getElementById('adm-ppt').value,
            iframe: document.getElementById('adm-iframe').value,
            url: document.getElementById('adm-url').value,
            video: document.getElementById('adm-video').value,
            progress: 0
        });
        hayCambios = true;
    }

    if (rText && rDate) {
        if (!reminders) reminders = [];
        reminders.push({ text: rText, date: rDate });
        hayCambios = true;
    }

    if (!hayCambios) {
        status.innerText = "❌ Rien à sauvegarder.";
        return;
    }

    database.ref('/').set({ db, scores, reminders }).then(() => {
        status.innerText = "🚀 DONNÉES MISES À JOUR !";
        document.getElementById('adm-tema-name').value = '';
        document.getElementById('adm-ppt').value = '';
        document.getElementById('adm-iframe').value = '';
        document.getElementById('adm-url').value = '';
        document.getElementById('adm-video').value = '';
        document.getElementById('rem-text').value = '';
        document.getElementById('rem-date').value = '';
        setTimeout(() => { 
            status.innerText = ""; 
            renderAdminThemes(); 
        }, 2000);
    });
}

// --- GESTIÓN DE TEMAS (AGREGAR/ELIMINAR) ---
function renderAdminThemes() {
    const container = document.getElementById('admin-themes-list');
    if (!container) return;
    const mat = document.getElementById('adm-materia').value;
    container.innerHTML = `<h4 style="margin-top:0; color:#2c3e50;">Temas en ${mat.toUpperCase()}:</h4>`;
    if (db[mat] && db[mat].length > 0) {
        db[mat].forEach((t, i) => {
            const item = document.createElement('div');
            item.style = "display:flex; justify-content:space-between; align-items:center; background:white; padding:8px 12px; border-radius:10px; margin-bottom:8px; border:1px solid #ddd; font-size:0.9rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
            item.innerHTML = `
                <span>📂 ${t.name}</span>
                <button onclick="deleteTheme('${mat}', ${i})" style="background:#ff4757; color:white; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-weight:bold;">Borrar</button>
            `;
            container.appendChild(item);
        });
    } else {
        container.innerHTML += "<p style='font-size:0.8rem; color:gray'>No hay temas creados.</p>";
    }
}

function deleteTheme(mat, index) {
    if (confirm("¿Seguro que quieres borrar este tema?")) {
        db[mat].splice(index, 1);
        database.ref('/').set({ db, scores, reminders }).then(() => {
            renderAdminThemes();
        });
    }
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
    if(document.getElementById('admin-pass-input').value === "Gaby1429") {
        showView('view-admin');
        renderAdminThemes();
    }
    else alert("Faux!");
}

function renderChart(m) {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    const h = scores[m] || [0];
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: h.map((_,i)=>`Ex ${i+1}`), datasets: [{ label: 'Note (1-20)', data: h, backgroundColor: '#00A2FF', borderRadius: 10 }] },
        options: { responsive: true, scales: { y: { min: 0, max: 20 } } }
    });
}
