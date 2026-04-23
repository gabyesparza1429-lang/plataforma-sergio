const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique'];
let currentSub = '';
let myChart = null;

let db = JSON.parse(localStorage.getItem('sergioData')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: []
};
let reminders = JSON.parse(localStorage.getItem('sergioReminders')) || [];
let questionBank = JSON.parse(localStorage.getItem('sergioQuestions')) || {};
let scores = JSON.parse(localStorage.getItem('sergioScores')) || {};

// NAVEGACIÓN
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function goToHome() { showView('view-home'); renderHome(); }
function goToSubject() { showView('view-subject'); }

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
    list.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const active = reminders.filter(r => r.date >= today);
    if (active.length === 0) list.innerHTML = "<p>Tout est à jour ! 👍</p>";
    else active.forEach(r => {
        const item = document.createElement('div');
        item.className = 'reminder-item';
        item.innerHTML = `🗓 ${r.date}: ${r.text}`;
        list.appendChild(item);
    });
}

// MATERIA Y GRÁFICA
function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    
    // Actividades
    const container = document.getElementById('folders-container');
    container.innerHTML = '';
    (db[m] || []).forEach(item => {
        const folder = document.createElement('div');
        folder.className = 'folder-icon';
        folder.innerText = item.tema;
        folder.onclick = () => {
            showView('view-activity');
            const place = document.getElementById('activity-place');
            if(item.code.includes('<iframe')) place.innerHTML = item.code;
            else place.innerHTML = `<iframe src="${item.code}"></iframe>`;
        };
        container.appendChild(folder);
    });

    // Mostrar botón examen si hay preguntas
    if(questionBank[m]) document.getElementById('btn-exam').classList.remove('hidden');
    else document.getElementById('btn-exam').classList.add('hidden');

    renderChart(m);
}

function renderChart(m) {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    const history = scores[m] || [0];
    const avg = history.reduce((a,b) => a + parseInt(b), 0) / history.length;
    const percent = (avg / 20) * 100;

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: history.map((_, i) => `Act. ${i+1}`),
            datasets: [{
                label: 'Note (1-20)',
                data: history,
                backgroundColor: '#3498db',
                borderRadius: 10
            }]
        },
        options: { scales: { y: { min: 0, max: 20 } } }
    });

    document.getElementById('achievement-info').innerHTML = `
        <p>Aprovechamiento: ${percent.toFixed(0)}%</p>
        <p style="color: #e67e22;">💡 Potencial para el examen: ${avg.toFixed(1)} / 20</p>
    `;
}

// ADMIN
function showLogin() { showView('view-login'); }
function checkAdminPassword() {
    if(document.getElementById('admin-pass-input').value === "Gaby1429") showView('view-admin');
    else alert("Faux!");
}

function saveData() {
    const mat = document.getElementById('adm-materia').value;
    const tema = document.getElementById('adm-tema').value;
    const code = document.getElementById('adm-code').value;
    db[mat].push({ tema, code });
    localStorage.setItem('sergioData', JSON.stringify(db));
    alert("Sauvegardé !");
    goToHome();
}

function saveReminder() {
    reminders.push({ text: document.getElementById('rem-text').value, date: document.getElementById('rem-date').value });
    localStorage.setItem('sergioReminders', JSON.stringify(reminders));
    goToHome();
}

// PDF A EXAMEN
async function processPDF() {
    const file = document.getElementById('pdf-upload').files[0];
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
        // Banco de preguntas simple: oraciones largas
        const questions = text.split('.').filter(s => s.length > 50).slice(0, 10);
        const mat = document.getElementById('adm-materia').value;
        questionBank[mat] = questions;
        localStorage.setItem('sergioQuestions', JSON.stringify(questionBank));
        alert("Banque de questions prête !");
    };
    reader.readAsArrayBuffer(file);
}

// NOTAS
function openFinishModal() { document.getElementById('modal-score').classList.remove('hidden'); }
function saveFinalScore() {
    const note = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(note);
    localStorage.setItem('sergioScores', JSON.stringify(scores));
    document.getElementById('modal-score').classList.add('hidden');
    goToHome();
}

window.onload = renderHome;
