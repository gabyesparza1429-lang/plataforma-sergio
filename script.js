const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique'];
let currentSub = '';
let currentThemeIdx = null;
let currentStepIdx = 0;
let myChart = null;

// Cargar Datos
let db = JSON.parse(localStorage.getItem('sergioDataV3')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: [], musique: []
};
let scores = JSON.parse(localStorage.getItem('sergioScores')) || {};
let reminders = JSON.parse(localStorage.getItem('sergioReminders')) || [];

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
    list.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    reminders.filter(r => r.date >= today).forEach(r => {
        list.innerHTML += `<div style="background:#fff5e6; margin-bottom:5px; padding:10px; border-radius:10px;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    const container = document.getElementById('folders-container');
    container.innerHTML = '';
    (db[m] || []).forEach((theme, idx) => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerHTML = `<h3>📂 ${theme.name}</h3>`;
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
        { name: "1. Présentation", data: theme.ppt, icon: "📽️" },
        { name: "2. Activité", data: theme.iframe, icon: "🎮" },
        { name: "3. Ressource Web", data: theme.url, icon: "🌐" },
        { name: "4. Vidéo", data: theme.video, icon: "📺" },
        { name: "5. Examen", data: "EXAM", icon: "🎓" }
    ].filter(s => s.data);

    steps.forEach((step, idx) => {
        const btn = document.createElement('div');
        const isLocked = idx > (theme.progress || 0);
        btn.className = `subject-card ${isLocked ? 'locked' : 'card-musique'}`;
        btn.style.height = "150px";
        btn.innerHTML = `<span class="subject-label">${step.icon} ${step.name}</span>`;
        if(!isLocked) {
            btn.onclick = () => { currentStepIdx = idx; launchStep(step); };
        }
        container.appendChild(btn);
    });
}

function launchStep(step) {
    showView('view-activity');
    const place = document.getElementById('activity-place');
    if (step.data === "EXAM") {
        place.innerHTML = "<h2>Examen Final</h2><p>Prépare-toi pour les questions...</p>";
    } else {
        place.innerHTML = step.data.includes('<iframe') ? step.data : `<iframe src="${step.data}"></iframe>`;
    }
}

function completeStep() {
    const theme = db[currentSub][currentThemeIdx];
    if (currentStepIdx === theme.progress) {
        if(currentStepIdx === 1) document.getElementById('modal-score').classList.remove('hidden');
        else { theme.progress++; saveAndReload(); }
    } else { goBackToPath(); }
}

function saveStepScore() {
    const note = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(note);
    db[currentSub][currentThemeIdx].progress++;
    localStorage.setItem('sergioScores', JSON.stringify(scores));
    saveAndReload();
    document.getElementById('modal-score').classList.add('hidden');
}

function saveAndReload() {
    localStorage.setItem('sergioDataV3', JSON.stringify(db));
    openThemePath(currentThemeIdx);
}

function checkAdminPassword() {
    if(document.getElementById('admin-pass-input').value === "Gaby1429") showView('view-admin');
    else alert("Incorrect");
}

function saveNewTheme() {
    const mat = document.getElementById('adm-materia').value;
    const newTheme = {
        name: document.getElementById('adm-tema-name').value,
        ppt: document.getElementById('adm-ppt').value,
        iframe: document.getElementById('adm-iframe').value,
        url: document.getElementById('adm-url').value,
        video: document.getElementById('adm-video').value,
        progress: 0
    };
    db[mat].push(newTheme);
    localStorage.setItem('sergioDataV3', JSON.stringify(db));
    alert("Thème ajouté !");
    goToHome();
}

function saveReminder() {
    reminders.push({ text: document.getElementById('rem-text').value, date: document.getElementById('rem-date').value });
    localStorage.setItem('sergioReminders', JSON.stringify(reminders));
    goToHome();
}

function renderChart(m) {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    const hist = scores[m] || [0];
    const avg = hist.reduce((a,b) => a + parseInt(b), 0) / hist.length;
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hist.map((_,i)=>`Note ${i+1}`),
            datasets: [{ label: 'Score 1-20', data: hist, backgroundColor: '#e91e63' }]
        },
        options: { scales: { y: { min:0, max:20 } } }
    });
    document.getElementById('achievement-info').innerHTML = `Aprovechamiento: ${(avg/20*100).toFixed(0)}% <br> Predicción examen: ${avg.toFixed(1)}/20`;
}

window.onload = renderHome;
