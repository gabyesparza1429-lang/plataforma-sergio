const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique'];
let currentSub = '';
let currentThemeIdx = null;
let currentStepIdx = 0;
let myChart = null;

// Versión 5 de la base de datos (Para forzar que se vea música)
let db = JSON.parse(localStorage.getItem('sergioV5')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: [], musique: []
};
let scores = JSON.parse(localStorage.getItem('sergioScoresV5')) || {};
let reminders = JSON.parse(localStorage.getItem('sergioRemindersV5')) || [];

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function goToHome() { showView('view-home'); renderHome(); }
function goToSubject() { showView('view-subject'); }
function goBackToPath() { showView('view-theme-path'); }

// INICIO
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
        list.innerHTML += `<div style="background:#fff5e6; padding:12px; border-radius:10px; margin-bottom:10px; font-weight:bold;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

// ADMIN LOGIN
function showLogin() { showView('view-login'); }

function checkAdminPassword() {
    if (document.getElementById('admin-pass-input').value === "Gaby1429") {
        showView('view-admin');
        document.getElementById('admin-pass-input').value = '';
    } else {
        alert("Mot de passe incorrect");
    }
}

// MATERIAS
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

// CAMINO DE PASOS (DESBLOQUEO)
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
        { name: "Ressource Web", data: theme.url, icon: "🌐" },
        { name: "Vidéo", data: theme.video, icon: "📺" },
        { name: "Examen", data: "EXAM", icon: "🎓" }
    ].filter(s => s.data);

    steps.forEach((step, idx) => {
        const isLocked = idx > (theme.progress || 0);
        const btn = document.createElement('div');
        btn.className = `subject-card card-musique ${isLocked ? 'locked' : ''}`;
        btn.style.height = "130px";
        btn.innerHTML = `<span class="subject-label">${step.icon} ${step.name}</span>`;
        if(!isLocked) btn.onclick = () => { currentStepIdx = idx; launchStep(step); };
        container.appendChild(btn);
    });
}

function launchStep(step) {
    showView('view-activity');
    const place = document.getElementById('activity-place');
    if (step.data === "EXAM") {
        place.innerHTML = "<h2>Examen de la matière</h2><p>Basé sur vos exercices.</p>";
    } else {
        place.innerHTML = step.data.includes('<iframe') ? step.data : `<iframe src="${step.data}"></iframe>`;
    }
}

function completeStep() {
    const theme = db[currentSub][currentThemeIdx];
    if (currentStepIdx === theme.progress) {
        if(currentStepIdx === 1) { // El paso de actividad pide nota
            document.getElementById('modal-score').classList.remove('hidden');
        } else {
            theme.progress++;
            saveAndGo();
        }
    } else {
        goBackToPath();
    }
}

function saveStepScore() {
    const n = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(n);
    db[currentSub][currentThemeIdx].progress++;
    localStorage.setItem('sergioScoresV5', JSON.stringify(scores));
    saveAndGo();
    document.getElementById('modal-score').classList.add('hidden');
}

function saveAndGo() {
    localStorage.setItem('sergioV5', JSON.stringify(db));
    openThemePath(currentThemeIdx);
}

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
    localStorage.setItem('sergioV5', JSON.stringify(db));
    alert("Thème ajouté avec succès !");
    goToHome();
}

function saveReminder() {
    reminders.push({ text: document.getElementById('rem-text').value, date: document.getElementById('rem-date').value });
    localStorage.setItem('sergioRemindersV5', JSON.stringify(reminders));
    goToHome();
}

// GRÁFICA DE APROVECHAMIENTO
function renderChart(m) {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    const hist = scores[m] || [0];
    const avg = hist.reduce((a,b) => a + parseInt(b), 0) / hist.length;
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hist.map((_,i)=>`Ex. ${i+1}`),
            datasets: [{ label: 'Note 1-20', data: hist, backgroundColor: '#E91E63', borderRadius: 10 }]
        },
        options: { scales: { y: { min:0, max:20 } } }
    });
    document.getElementById('achievement-info').innerHTML = `Aprovechamiento: ${(avg/20*100).toFixed(0)}% | Predicción: ${avg.toFixed(1)} / 20`;
}

window.onload = renderHome;
