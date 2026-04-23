const subjects = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique'];

// Cargar base de datos local
let db = JSON.parse(localStorage.getItem('sergioDB')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: []
};

// --- INICIALIZACIÓN ---
function init() {
    const grid = document.getElementById('subjects-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = `subject-card card-${sub}`; 
        card.innerHTML = `<span class="subject-label">${sub}</span>`;
        card.onclick = () => openSubject(sub);
        grid.appendChild(card);
    });
}

// --- NAVEGACIÓN ---
function openAdmin() {
    const pass = prompt("Mot de passe Administrateur :");
    if (pass === "Gaby1429") {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    }
}

function showHome() {
    location.reload(); // Forma más limpia de resetear las vistas
}

// --- GESTIÓN DE CONTENIDO (GABY) ---
function saveContent() {
    const materia = document.getElementById('materia-select').value;
    const folder = document.getElementById('folder-name').value;
    const code = document.getElementById('iframe-code').value;

    if(!folder || !code) return alert("Remplis tous los campos");

    db[materia].push({ theme: folder, content: code });
    localStorage.setItem('sergioDB', JSON.stringify(db));
    alert("Activité enregistrée !");
    document.getElementById('folder-name').value = '';
    document.getElementById('iframe-code').value = '';
}

// --- VISTA DE SERGIO ---
function openSubject(sub) {
    document.getElementById('home-screen').classList.add('hidden');
    const view = document.getElementById('subject-view');
    view.classList.remove('hidden');
    document.getElementById('current-subject-title').innerText = sub.toUpperCase();
    
    const container = document.getElementById('folders-container');
    container.innerHTML = '';

    if(db[sub].length === 0) {
        container.innerHTML = "<p>Aucune activité pour le moment.</p>";
    }

    db[sub].forEach((item) => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerText = item.theme;
        folder.onclick = () => launchActivity(item.content, sub);
        container.appendChild(folder);
    });
}

function launchActivity(iframeHtml, sub) {
    const container = document.getElementById('subject-view');
    container.innerHTML = `
        <button class="back-btn" onclick="showHome()">⬅ Retour</button>
        <div style="margin-top:20px; border-radius:20px; overflow:hidden; background:white; padding:10px;">
            ${iframeHtml}
        </div>
        <button class="finish-btn" onclick="showModal()" 
            style="width:100%; margin-top:20px; padding:20px; background:#2ecc71; color:white; border:none; border-radius:15px; font-size:1.5rem; font-weight:bold; cursor:pointer;">
            J'AI FINI ! 🌟
        </button>
    `;
}

// --- NOTAS Y REPORTES ---
function showModal() {
    document.getElementById('finish-modal').classList.remove('hidden');
}

function submitScore() {
    const note = document.getElementById('final-note').value;
    const materia = document.getElementById('current-subject-title').innerText;
    
    let report = JSON.parse(localStorage.getItem('sergioReports')) || [];
    report.push({
        materia: materia,
        note: note,
        date: new Date().toLocaleString()
    });
    
    localStorage.setItem('sergioReports', JSON.stringify(report));
    alert("Note enregistrée ! Bien joué Sergio.");
    showHome();
}

// --- PROCESADOR DE PDF ---
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

async function processPDF() {
    const fileInput = document.getElementById('pdf-upload');
    if (fileInput.files.length === 0) return alert("Choisis un PDF");
    
    document.getElementById('pdf-status').innerText = "Analyse en cours... ⏳";
    
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(" ");
        }
        alert("Texte extrait avec succès ! Tu peux maintenant créer l'examen.");
        document.getElementById('pdf-status').innerText = "PDF prêt ✅";
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

window.onload = init;
