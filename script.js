let db = JSON.parse(localStorage.getItem('sergioDB')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: []
};

const subjects = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique'];

// Cargar el Dashboard
function init() {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = '';
    subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.backgroundImage = `url('img/${sub}.png')`; // Espacio para tus imágenes
        card.innerHTML = `<div class="label">${sub}</div>`;
        card.onclick = () => openSubject(sub);
        grid.appendChild(card);
    });
}

function openAdmin() {
    const pass = prompt("Contraseña de Administrador:");
    if (pass === "Gaby1429") {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        alert("Incorrecto");
    }
}

function saveContent() {
    const materia = document.getElementById('materia-select').value;
    const folder = document.getElementById('folder-name').value;
    const code = document.getElementById('iframe-code').value;

    if(!folder || !code) return alert("Llena todos los campos");

    db[materia].push({ theme: folder, content: code });
    localStorage.setItem('sergioDB', JSON.stringify(db));
    alert("¡Contenido subido con éxito!");
}

function openSubject(sub) {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('subject-view').classList.remove('hidden');
    document.getElementById('current-subject-title').innerText = sub;
    
    const container = document.getElementById('folders-container');
    container.innerHTML = '';

    db[sub].forEach((item, index) => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerText = item.theme;
        folder.onclick = () => launchActivity(item.content);
        container.appendChild(folder);
    });
}

function launchActivity(iframeHtml) {
    // Reemplaza el contenido por el Iframe y añade el botón "J'ai fini"
    const view = document.getElementById('subject-view');
    view.innerHTML = `
        <button class="back-btn" onclick="location.reload()">⬅ Retour</button>
        <div class="activity-frame">${iframeHtml}</div>
        <button class="finish-btn" onclick="showFinishModal()">J'ai fini !</button>
    `;
}

function showFinishModal() {
    document.getElementById('finish-modal').classList.remove('hidden');
}

// Inicializar
init();
