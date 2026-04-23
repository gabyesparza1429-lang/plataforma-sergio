const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique'];
let currentSub = '';

// Base de datos local
let db = JSON.parse(localStorage.getItem('sergioData')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: []
};

// Función para cambiar de pantalla (vistas)
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    if(viewId === 'view-home') renderHome();
}

// Dibujar las tarjetas principales
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
}

// Abrir una materia y ver sus temas
function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    const container = document.getElementById('folders-container');
    container.innerHTML = '';

    if(db[m].length === 0) {
        container.innerHTML = "<p>Dites à Gaby de télécharger des activités !</p>";
        return;
    }

    db[m].forEach((item, index) => {
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

// Lógica de Gaby (Administrador)
function openAdmin() {
    const p = prompt("Mot de passe :");
    if(p === "Gaby1429") showView('view-admin');
}

function saveData() {
    const mat = document.getElementById('adm-materia').value;
    const tema = document.getElementById('adm-tema').value;
    const code = document.getElementById('adm-code').value;

    if(!tema || !code) return alert("Remplis tout !");

    db[mat].push({ tema: tema, code: code });
    localStorage.setItem('sergioData', JSON.stringify(db));
    alert("C'est fait !");
    
    document.getElementById('adm-tema').value = '';
    document.getElementById('adm-code').value = '';
    showView('view-home');
}

// Reporte de Sergio
function openFinishModal() {
    document.getElementById('modal-score').classList.remove('hidden');
}

function saveFinalScore() {
    const note = document.getElementById('input-note').value;
    let reports = JSON.parse(localStorage.getItem('sergioReports')) || [];
    reports.push({
        materia: currentSub,
        note: note,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('sergioReports', JSON.stringify(reports));
    
    document.getElementById('modal-score').classList.add('hidden');
    alert("Bravo Sergio !");
    showView('view-home');
}

// Iniciar al cargar
window.onload = renderHome;
