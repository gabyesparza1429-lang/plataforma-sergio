const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique'];
let currentSub = '', currentThemeIdx = null, currentStepIdx = 0, myChart = null;

let db = JSON.parse(localStorage.getItem('sergioV7')) || {
    histoire: [], francais: [], espagnol: [], anglais: [], allemand: [], physique: [], musique: []
};
let scores = JSON.parse(localStorage.getItem('sergioScoresV7')) || {};
let reminders = JSON.parse(localStorage.getItem('sergioRemindersV7')) || [];

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

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
        list.innerHTML += `<div style="background:#fff5e6; padding:12px; border-radius:10px; margin-bottom:10px; border-left:5px solid #e67e22;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

// --- GUARDADO MAESTRO ---
async function saveEverything() {
    const status = document.getElementById('save-status');
    status.innerText = "Traitement en cours... ⏳";
    
    const mat = document.getElementById('adm-materia').value;
    const name = document.getElementById('adm-tema-name').value;
    if(!name) { alert("Nom du thème obligatoire"); return; }

    let questions = [];
    const pdfFile = document.getElementById('adm-pdf').files[0];
    
    if (pdfFile) {
        questions = await extractQuestionsFromPDF(pdfFile);
    }

    // 1. Guardar Tema
    const newTheme = {
        name,
        ppt: document.getElementById('adm-ppt').value,
        iframe: document.getElementById('adm-iframe').value,
        url: document.getElementById('adm-url').value,
        video: document.getElementById('adm-video').value,
        questions: questions,
        progress: 0
    };
    db[mat].push(newTheme);
    localStorage.setItem('sergioV7', JSON.stringify(db));

    // 2. Guardar Recordatorio
    const remText = document.getElementById('rem-text').value;
    const remDate = document.getElementById('rem-date').value;
    if (remText && remDate) {
        reminders.push({ text: remText, date: remDate });
        localStorage.setItem('sergioRemindersV7', JSON.stringify(reminders));
    }

    status.innerText = "🚀 TOUT SAUVEGARDÉ !";
    setTimeout(goToHome, 1500);
}

async function extractQuestionsFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(s => s.str).join(" ");
    }
    // Generar 5 preguntas simples basadas en oraciones del PDF
    return fullText.split('.').filter(s => s.length > 40).slice(0, 5).map(q => {
        const words = q.trim().split(' ');
        const missing = words[Math.floor(words.length / 2)];
        return { 
            text: q.replace(missing, "_______"), 
            answer: missing.toLowerCase().replace(/[^a-z]/g, "") 
        };
    });
}

// --- LÓGICA DE SERGIO ---
function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    const container = document.getElementById('folders-container');
    container.innerHTML = '';
    (db[m] || []).forEach((t, i) => {
        const f = document.createElement('div');
        f.className = 'subject-card card-musique';
        f.style.height = "100px";
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
        { name: "Entraînement", data: "QUIZ", icon: "🧠" },
        { name: "EXAMEN FINAL", data: "EXAM", icon: "🎓" }
    ].filter(s => s.data && (s.data !== "QUIZ" || theme.questions.length > 0));

    steps.forEach((s, i) => {
        const locked = i > (theme.progress || 0);
        const b = document.createElement('div');
        b.className = `subject-card card-musique ${locked ? 'locked' : ''}`;
        b.style.height = "120px";
        b.innerHTML = `<span class="subject-label">${s.icon} ${s.name}</span>`;
        if(!locked) b.onclick = () => { currentStepIdx = i; launchStep(s); };
        container.appendChild(b);
    });
}

function launchStep(s) {
    showView('view-activity');
    const place = document.getElementById('activity-place');
    const quizBox = document.getElementById('quiz-container');
    const finishBtn = document.getElementById('finish-btn-step');

    quizBox.classList.add('hidden');
    finishBtn.classList.remove('hidden');

    if (s.data === "QUIZ") {
        const theme = db[currentSub][currentThemeIdx];
        const q = theme.questions[0]; // Simplificado al primer ejercicio
        place.innerHTML = "<h3>Utilise le texte du PDF pour compléter :</h3>";
        quizBox.classList.remove('hidden');
        finishBtn.classList.add('hidden');
        document.getElementById('quiz-question').innerText = q.text;
    } else if (s.data === "EXAM") {
        place.innerHTML = "<h2>EXAMEN FINAL</h2><p>Réponds à toutes les questions du PDF sans aide.</p>";
    } else {
        place.innerHTML = s.data.includes('<iframe') ? s.data : `<iframe src="${s.data}"></iframe>`;
    }
}

function checkQuizAnswer() {
    const theme = db[currentSub][currentThemeIdx];
    const userAns = document.getElementById('quiz-answer').value.toLowerCase().trim();
    if(userAns === theme.questions[0].answer) {
        alert("Excellent ! 🌟");
        theme.progress++;
        saveAll();
        openThemePath(currentThemeIdx);
    } else {
        alert("Réessaie encore !");
    }
}

// ... (Resto de funciones: checkAdminPassword, saveStepScore, renderChart se mantienen de la v6) ...

function saveAll() { localStorage.setItem('sergioV7', JSON.stringify(db)); }

function checkAdminPassword() {
    if(document.getElementById('admin-pass-input').value === "Gaby1429") {
        showView('view-admin');
        document.getElementById('admin-pass-input').value = '';
    } else { alert("Incorrect!"); }
}

function saveStepScore() {
    const n = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(n);
    db[currentSub][currentThemeIdx].progress++;
    localStorage.setItem('sergioScoresV7', JSON.stringify(scores));
    saveAll();
    document.getElementById('modal-score').classList.add('hidden');
    openThemePath(currentThemeIdx);
}

function renderChart(m) {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    const h = scores[m] || [0];
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: h.map((_,i)=>`Ex ${i+1}`), datasets: [{ label: '1-20', data: h, backgroundColor: '#E91E63' }] },
        options: { scales: { y: { min:0, max:20 } } }
    });
}

window.onload = renderHome;
