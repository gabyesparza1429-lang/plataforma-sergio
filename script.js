const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique'];
let currentSub = '';
let currentThemeIdx = null;
let currentStepIdx = 0;
let myChart = null;

// Base de datos - Versión 4 (Para forzar actualización)
let db = JSON.parse(localStorage.getItem('sergioDataV4')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: [], musique: []
};
let scores = JSON.parse(localStorage.getItem('sergioScoresV4')) || {};
let reminders = JSON.parse(localStorage.getItem('sergioRemindersV4')) || [];

// NAVEGACIÓN
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active');
}

function goToHome() { showView('view-home'); renderHome(); }
function goToSubject() { showView('view-subject'); }
function goBackToPath() { showView('view-theme-path'); }

// INICIO
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
    const active = reminders.filter(r => r.date >= today);
    list.innerHTML = active.length ? '' : "<p>Aucun rappel.</p>";
    active.forEach(r => {
        list.innerHTML += `<div style="background:#fff5e6; padding:10px; border-radius:10px; margin-bottom:5px;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

// LOGIN ADMIN
function showLogin() { showView('view-login'); }

function checkAdminPassword() {
    const input = document.getElementById('admin-pass-input').value;
    if(input === "Gaby1429") {
        showView('view-admin');
        document.getElementById('admin-pass-input').value = '';
    } else {
        alert("Incorrect!");
    }
}

// MATERIAS Y PROGRESO
function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    const container = document.getElementById('folders-container');
    container.innerHTML = '';
    
    (db[m] || []).forEach((theme, idx) => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerHTML = `📂 ${theme.name}`;
        folder.onclick = () => openThemePath(idx);
        container.appendChild(folder);
    });
    renderChart(m);
}

function openThemePath(themeIdx) {
    currentThemeIdx = themeIdx;
    const theme = db[currentSub][themeIdx];
    showView('view-theme-path');
    document.getElementById('path-theme-title').innerText = theme.name;
    const container = document.getElementById('path-buttons-container');
    container.innerHTML = '';

    const steps = [
        { name: "Présentation", data: theme.ppt, icon: "📽️" },
        { name: "Activité", data: theme.iframe, icon: "🎮" },
        { name: "Web", data: theme.url, icon: "🌐" },
        { name: "Vidéo", data: theme.video, icon: "📺" },
        { name: "Examen", data: "EXAM", icon: "🎓" }
    ].filter(s => s.data);

    steps.forEach((step, idx) => {
        const isLocked = idx > (theme.progress || 0);
        const btn = document.createElement('div');
        btn.className = `subject-card card-musique ${isLocked ? 'locked' : ''}`;
        btn.style.height = "120px";
        btn.innerHTML = `<span class="subject-label">${step.icon} ${step.name}</span>`;
        if(!isLocked) btn.onclick = () => { currentStepIdx = idx; launchStep(step); };
        container.appendChild(btn);
    });
}

function launchStep(step) {
    showView('view-activity');
    const place = document.getElementById('activity-place');
    if (step.data === "EXAM") {
        place.innerHTML = "<h2>Examen Final</h2><p>Basé sur le PDF...</p>";
    } else {
        place.innerHTML = step.data.includes('<iframe') ? step.data : `<iframe src="${step.data}"></iframe>`;
    }
}

function completeStep() {
    const theme = db[currentSub][currentThemeIdx];
    if (currentStepIdx === theme.progress) {
        if(currentStepIdx === 1) document.getElementById('modal-score').classList.remove('hidden');
        else { theme.progress++; saveDB(); openThemePath(currentThemeIdx); }
    } else { goBackToPath(); }
}

function saveStepScore() {
    const n = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(n);
    db[currentSub][currentThemeIdx].progress++;
    localStorage.setItem('sergioScoresV4', JSON.stringify(scores));
    saveDB();
    document.getElementById('modal-score').classList.add('hidden');
    openThemePath(currentThemeIdx);
}

function saveDB() { localStorage.setItem('sergioDataV4', JSON.stringify(db)); }

// ADMIN ACCIONES
function saveNewTheme() {
    const mat = document.getElementById('adm-materia').value;
    db[mat].push({
        name: document.getElementById('adm-tema-name').value,
        ppt: document.getElementById('adm-ppt').value,
        iframe: document.getElementById('adm-iframe').value,
        url: document.getElementById('adm-url').value,
        video: document.getElementById('adm-video').value,
        progress: 0
    });
    saveDB();
    alert("Thème ajouté !");
    goToHome();
}

function saveReminder() {
    reminders.push({ text: document.getElementById('rem-text').value, date: document.getElementById('rem-date').value });
    localStorage.setItem('sergioRemindersV4', JSON.stringify(reminders));
    goToHome();
}

// GRÁFICA
function renderChart(m) {
    const ctx = document.getElementById('progressionChart');
    if(!ctx) return;
    const hist = scores[m] || [0];
    const avg = hist.reduce((a,b) => a + parseInt(b), 0) / hist.length;
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hist.map((_,i)=>`Note ${i+1}`),
            datasets: [{ label: 'Score 1-20', data: hist, backgroundColor: '#E91E63' }]
        },
        options: { scales: { y: { min:0, max:20 } } }
    });
    document.getElementById('achievement-info').innerHTML = `Aprovechamiento: ${(avg/20*100).toFixed(0)}% | Predicción: ${avg.toFixed(1)}/20`;
}

window.onload = renderHome;
