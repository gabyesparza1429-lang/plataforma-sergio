const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique'];
let currentSub = '';

// Cargar Datos
let db = JSON.parse(localStorage.getItem('sergioData')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: []
};
let reminders = JSON.parse(localStorage.getItem('sergioReminders')) || [];

// NAVEGACIÓN (SISTEMA DE VISTAS ACTIVA)
function showView(viewId) {
    // 1. Ocultar todas las vistas y quitar la clase 'active'
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    // 2. Mostrar solo la vista deseada
    document.getElementById(viewId).classList.add('active');
}

function goToHome() {
    showView('view-home');
    renderHome();
}

function goToSubject() {
    showView('view-subject');
}

// RENDERIZAR INICIO
function renderHome() {
    const grid = document.getElementById('subjects-grid');
    if (!grid) return;
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
    const active = reminders.filter(r => r.date >= today);

    if (active.length === 0) {
        list.innerHTML = "<p style='color: gray;'>Pas de rappels pour aujourd'hui. 👍</p>";
    } else {
        active.forEach(r => {
            const item = document.createElement('div');
            item.className = 'reminder-item';
            item.innerHTML = `<strong>${r.date}:</strong> ${r.text}`;
            list.appendChild(item);
        });
    }
}

// MATERIAS
function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    
    const container = document.getElementById('folders-container');
    container.innerHTML = '';

    if (!db[m] || db[m].length === 0) {
        container.innerHTML = "<p>Aucune activité. Gaby doit en ajouter !</p>";
        return;
    }

    db[m].forEach(item => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerText = item.tema;
        folder.onclick = () => {
            showView('view-activity');
            document.getElementById('activity-place').innerHTML = item.code;
        };
        container.appendChild(folder);
    });
}

// ADMIN FUNCTIONS
function showLogin() { showView('view-login'); }

function checkAdminPassword() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === "Gaby1429") {
        showView('view-admin');
        document.getElementById('admin-pass-input').value = '';
    } else {
        alert("Mot de passe incorrect.");
    }
}

function saveData() {
    const mat = document.getElementById('adm-materia').value;
    const tema = document.getElementById('adm-tema').value;
    const code = document.getElementById('adm-code').value;

    if (!tema || !code) return alert("Remplis tout !");
    
    db[mat].push({ tema, code });
    localStorage.setItem('sergioData', JSON.stringify(db));
    alert("Sauvegardé !");
    goToHome();
}

function saveReminder() {
    const text = document.getElementById('rem-text').value;
    const date = document.getElementById('rem-date').value;
    if (!text || !date) return alert("Manque de données");

    reminders.push({ text, date });
    localStorage.setItem('sergioReminders', JSON.stringify(reminders));
    alert("Rappel ajouté !");
    goToHome();
}

// NOTAS
function openFinishModal() { document.getElementById('modal-score').classList.remove('hidden'); }

function saveFinalScore() {
    const note = document.getElementById('input-note').value;
    let reports = JSON.parse(localStorage.getItem('sergioReports')) || [];
    reports.push({ materia: currentSub, note, date: new Date().toLocaleString() });
    localStorage.setItem('sergioReports', JSON.stringify(reports));
    document.getElementById('modal-score').classList.add('hidden');
    goToHome();
}

// INICIALIZAR AL CARGAR
document.addEventListener('DOMContentLoaded', renderHome);
