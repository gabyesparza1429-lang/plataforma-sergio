// 1. Base de datos y configuración inicial
const subjects = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique'];

let db = JSON.parse(localStorage.getItem('sergioDB')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: []
};

// 2. Función para inicializar la página (Dibuja los botones de Roblox)
function init() {
    const grid = document.getElementById('subjects-grid');
    if (!grid) return; // Seguridad por si el elemento no existe aún
    
    grid.innerHTML = ''; // Limpiar antes de dibujar
    
    subjects.forEach(sub => {
        const card = document.createElement('div');
        // Importante: usamos las clases que definimos en el CSS
        card.className = `subject-card card-${sub}`; 
        
        card.innerHTML = `<span class="subject-label">${sub}</span>`;
        
        card.onclick = () => openSubject(sub);
        grid.appendChild(card);
    });
}

// 3. Control de Vistas
function openAdmin() {
    const pass = prompt("Contraseña de Administrador:");
    if (pass === "Gaby1429") {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        alert("Acceso denegado.");
    }
}

function showHome() {
    // Recarga la página para volver al estado inicial limpio
    location.reload();
}

// 4. Lógica de Administrador (Guardar contenido)
function saveContent() {
    const materia = document.getElementById('materia-select').value;
    const folder = document.getElementById('folder-name').value;
    const code = document.getElementById('iframe-code').value;

    if(!folder || !code) return alert("Por favor, llena todos los campos.");

    db[materia].push({ theme: folder, content: code });
    localStorage.setItem('sergioDB', JSON.stringify(db));
    alert("¡Actividad guardada correctamente!");
    document.getElementById('folder-name').value = '';
    document.getElementById('iframe-code').value = '';
}

// 5. Lógica de Sergio (Ver materias y actividades)
function openSubject(sub) {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('subject-view').classList.remove('hidden');
    document.getElementById('current-subject-title').innerText = sub.toUpperCase();
    
    const container = document.getElementById('folders-container');
    container.innerHTML = '';

    if (db[sub].length === 0) {
        container.innerHTML = '<p>No hay actividades aún. Dile a Gaby que suba una. 😊</p>';
        return;
    }

    db[sub].forEach((item) => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerText = item.theme;
        folder.onclick = () => launchActivity(item.content);
        container.appendChild(folder);
    });
}

function launchActivity(iframeHtml) {
    const view = document.getElementById('subject-view');
    // Creamos el contenedor de la actividad
    view.innerHTML = `
        <button class="back-btn" onclick="showHome()">⬅ Retour</button>
        <div class="activity-container">${iframeHtml}</div>
        <button class="finish-btn" onclick="showFinishModal()">J'ai fini ! 🌟</button>
    `;
}

// 6. Reporte y Notas
function showFinishModal() {
    // Creamos el modal dinámicamente si no existe
    let modal = document.getElementById('finish-modal');
    modal.classList.remove('hidden');
}

function submitScore() {
    const note = document.getElementById('final-note').value;
    if (note === "" || note < 0 || note > 20) return alert("Escribe una nota entre 0 y 20");

    const reportEntry = {
        materia: document.getElementById('current-subject-title').innerText,
        date: new Date().toLocaleString(),
        score: note
    };

    let history = JSON.parse(localStorage.getItem('sergioHistory')) || [];
    history.push(reportEntry);
    localStorage.setItem('sergioHistory', JSON.stringify(history));

    alert("Bien joué Sergio ! Ta note a été enregistrée.");
    showHome();
}

// --- ESTO ES LO MÁS IMPORTANTE ---
// Asegura que la página cargue todo antes de ejecutar el código
document.addEventListener('DOMContentLoaded', init);
