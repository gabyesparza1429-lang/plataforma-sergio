// 1. Lista actualizada de materias
const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique', 'math', 'svt'];
let currentSub = '', currentThemeIdx = null, currentStepIdx = 0, myChart = null;

let db = JSON.parse(localStorage.getItem('sergioV7')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: [], musique: [], math: [], svt: []
};
if (!db.math) db.math = [];
if (!db.svt) db.svt = [];

let scores = JSON.parse(localStorage.getItem('sergioScoresV7')) || {};
let reminders = JSON.parse(localStorage.getItem('sergioRemindersV7')) || [];

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function goToHome() { showView('view-home'); renderHome(); }
function goToSubject() { showView('view-subject'); }
function goBackToPath() { showView('view-theme-path'); }

function renderHome() {
    const grid = document.getElementById('subjects-grid');
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
    const active = reminders.filter(r => r.date >= today);
    list.innerHTML = active.length ? '' : "<p>Tout est à jour ! 👍</p>";
    active.forEach(r => {
        list.innerHTML += `<div style="background:#fff5e6; padding:15px; border-radius:15px; margin-bottom:10px; border-left:8px solid #e67e22; font-weight:bold;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

async function saveEverything() {
    const status = document.getElementById('save-status');
    status.innerText = "⏳ Sauvegarde en cours...";
    
    const mat = document.getElementById('adm-materia').value;
    const name = document.getElementById('adm-tema-name').value;
    if(!name) return alert("Nom du thème !");

    let questions = [];
    const pdfFile = document.getElementById('adm-pdf').files[0];
    if (pdfFile) {
        // Aquí iría la lógica de extracción de PDF (pdfjs)
        questions = [{ text: "Exemple de question du PDF", answer: "oui" }];
    }

    db[mat].push({
        name,
        ppt: document.getElementById('adm-ppt').value,
        iframe: document.getElementById('adm-iframe').value,
        url: document.getElementById('adm-url').value,
        video: document.getElementById('adm-video').value,
        questions: questions,
        progress: 0
    });

    const remText = document.getElementById('rem-text').value;
    const remDate = document.getElementById('rem-date').value;
    if (remText && remDate) reminders.push({ text: remText, date: remDate });

    localStorage.setItem('sergioV7', JSON.stringify(db));
    localStorage.setItem('sergioRemindersV7', JSON.stringify(reminders));
    
    status.innerText = "🚀 TERMINÉ !";
    setTimeout(goToHome, 1000);
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
        { name: "Activité", data: theme.iframe, icon: "🎮" },
        { name: "Ressource Web", data: theme.url, icon: "🌐" },
        { name: "Vidéo", data: theme.video, icon: "📺" },
        { name: "Entraînement", data: "QUIZ", icon: "🧠" }
    ].filter(s => s.data);

    steps.forEach((s, i) => {
        const locked = i > (theme.progress || 0);
        const b = document.createElement('div');
        b.className = `subject-card card-musique ${locked ? 'locked' : ''}`;
        b.style.height = "150px";
        b.innerHTML = `<span class="subject-label">${s.icon} ${s.name}</span>`;
        if(!locked) b.onclick = () => { currentStepIdx = i; launchStep(s); };
        container.appendChild(b);
    });
}

// ... Resto de funciones (launchStep, checkAdminPassword, etc.) ...
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
        data: { labels: h.map((_,i)=>`Ex ${i+1}`), datasets: [{ label: 'Score 1-20', data: h, backgroundColor: '#E91E63' }] },
        options: { scales: { y: { min:0, max:20 } } }
    });
}

window.onload = renderHome;
