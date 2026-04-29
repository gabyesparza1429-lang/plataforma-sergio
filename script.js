// --- 1. CONFIGURACIÓN FIREBASE (Tus llaves personales) ---
const firebaseConfig = {
  apiKey: "AIzaSyA_KoTX8rvDrsU7qEEfturgiPhkseQN4i4",
  authDomain: "sergiolearning-21620.firebaseapp.com",
  databaseURL: "https://sergiolearning-21620-default-rtdb.firebaseio.com",
  projectId: "sergiolearning-21620",
  storageBucket: "sergiolearning-21620.appspot.com",
  messagingSenderId: "363094807638",
  appId: "1:363094807638:web:5ea9b50c18593998297f7"
};

// Inicializar la nube
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const materias = ['histoire', 'francais', 'espagnol', 'anglais', 'allemand', 'physique', 'musique', 'math', 'svt'];
let currentSub = '', currentThemeIdx = null, currentStepIdx = 0;

// Estas variables se llenan desde la nube
let db = {};
let scores = {};
let reminders = [];
let archivedReminders = [];

// --- 2. ESCUCHAR LA NUBE Y MIGRAR DATOS LOCALES ---
database.ref('/').on('value', (snapshot) => {
    const cloudData = snapshot.val();
    
    // CASO A: Ya hay datos en la nube, los usamos
    if (cloudData) {
        db = cloudData.db || {};
        scores = cloudData.scores || {};
        reminders = cloudData.reminders || [];
        archivedReminders = cloudData.archivedReminders || [];
        materias.forEach(m => { if(!db[m]) db[m] = []; });

        // Auto-archivar recordatorios vencidos
        autoArchiveReminders();

        const adminVisible = document.getElementById('view-admin').classList.contains('active');
        const homeVisible = document.getElementById('view-home').classList.contains('active');
        if (adminVisible) renderAdminManagement();
        else if (homeVisible) renderHome();
    } 
    // CASO B: La nube está vacía (Primera vez), migramos tu trabajo previo
    else {
        console.log("Nube vacía. Buscando trabajo previo en esta computadora...");
        const localData = JSON.parse(localStorage.getItem('sergioV7')); 
        const localScores = JSON.parse(localStorage.getItem('sergioScoresV7'));
        const localReminders = JSON.parse(localStorage.getItem('sergioRemindersV7'));

        if (localData) {
            alert("MIGRACIÓN: Subiendo tu trabajo previo a la nube...");
            database.ref('/').set({
                db: localData,
                scores: localScores || {},
                reminders: localReminders || []
            });
        } else {
            // Si es una compu nueva sin nada
            materias.forEach(m => { if(!db[m]) db[m] = []; });
            renderHome();
        }
    }
});

// --- 3. FUNCIONES DE NAVEGACIÓN ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function fixGoogleDriveUrl(url) {
    if (!url) return "";
    if (url.includes('drive.google.com') && (url.includes('/view') || url.includes('/edit'))) {
        return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
    }
    return url;
}

function goToHome() { showView('view-home'); renderHome(); }
function goToSubject() { showView('view-subject'); }
function goBackToPath() { showView('view-theme-path'); }

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
    const active = (reminders || []).filter(r => r.date >= today);
    list.innerHTML = active.length ? '' : "<p>Tout est à jour ! 👍</p>";
    active.forEach(r => {
        list.innerHTML += `<div style="background:#fff5e6; padding:15px; border-radius:15px; margin-bottom:10px; border-left:8px solid #e67e22; font-weight:bold;">🗓 ${r.date}: ${r.text}</div>`;
    });
}

// --- 4. GESTIÓN ADMIN (GUARDAR Y BORRAR) ---
function saveTheme() {
    const status = document.getElementById('save-status');
    const mat = document.getElementById('adm-materia').value;
    const name = document.getElementById('adm-tema-name').value;
    if(!name) return alert("Nom du thème !");

    status.innerText = "⏳ Synchronisation...";
    if(!db[mat]) db[mat] = [];
    db[mat].push({
        name,
        ppt: document.getElementById('adm-ppt').value,
        iframe: document.getElementById('adm-iframe').value,
        url: document.getElementById('adm-url').value,
        video: document.getElementById('adm-video').value,
        pdf: document.getElementById('adm-pdf').value,
        answers: document.getElementById('adm-answers').value,
        progress: 0
    });

    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(() => {
        status.innerText = "🚀 THÈME ENREGISTRÉ !";
        document.getElementById('adm-tema-name').value = '';
        document.getElementById('adm-ppt').value = '';
        document.getElementById('adm-iframe').value = '';
        document.getElementById('adm-url').value = '';
        document.getElementById('adm-video').value = '';
        renderAdminManagement();
        setTimeout(() => { status.innerText = ""; }, 2000);
    });
}

function saveReminder() {
    const status = document.getElementById('save-status');
    const rText = document.getElementById('rem-text').value;
    const rDate = document.getElementById('rem-date').value;
    if (!rText || !rDate) return alert("Texte et date requis !");

    status.innerText = "⏳ Synchronisation...";
    reminders.push({ text: rText, date: rDate });

    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(() => {
        status.innerText = "🚀 RAPPEL ENREGISTRÉ !";
        document.getElementById('rem-text').value = '';
        document.getElementById('rem-date').value = '';
        renderAdminManagement();
        setTimeout(() => { status.innerText = ""; }, 2000);
    });
}

function renderAdminManagement() {
    const container = document.getElementById('admin-mgmt-container');
    if(!container) return;
    container.innerHTML = "";

    // 1. Mostrar Rappels
    let remHTML = '<div class="mgmt-section"><h4>📌 Rappels Actuels</h4>';
    if(reminders.length === 0) remHTML += "<p>Aucun rappel.</p>";
    reminders.forEach((r, i) => {
        remHTML += `
            <div class="mgmt-item">
                <span>[${r.date}] ${r.text}</span>
                <div>
                    <button class="btn-nav" style="padding:5px 10px; font-size:0.8rem;" onclick="openEditReminder(${i})">📝</button>
                    <button class="btn-delete" onclick="deleteReminder(${i})">Supprimer</button>
                </div>
            </div>`;
    });
    remHTML += '</div>';
    container.innerHTML += remHTML;

    // 2. Mostrar Temas por Materia
    let themesHTML = '<div class="mgmt-section"><h4>📚 Thèmes par Matière</h4>';
    let hasThemes = false;
    materias.forEach(m => {
        if(db[m] && db[m].length > 0) {
            hasThemes = true;
            themesHTML += `<div style="margin-top:10px; font-weight:bold; color:#2d3748;">${m.toUpperCase()}</div>`;
            db[m].forEach((t, i) => {
                themesHTML += `
                    <div class="mgmt-item">
                        <span>${t.name}</span>
                        <div>
                            <button class="btn-nav" style="padding:5px 10px; font-size:0.8rem;" onclick="openEditTheme('${m}', ${i})">📝</button>
                            <button class="btn-delete" onclick="deleteTheme('${m}', ${i})">Supprimer</button>
                        </div>
                    </div>`;
            });
        }
    });
    if(!hasThemes) themesHTML += "<p>Aucun thème.</p>";
    themesHTML += '</div>';
    container.innerHTML += themesHTML;

    // 3. Mostrar Archivos (Recordatorios vencidos)
    let archivesHTML = '<div class="mgmt-section"><h4>📜 Archives (Recordatorios Vencidos)</h4>';
    if(archivedReminders.length === 0) archivesHTML += "<p>Aucune archive.</p>";
    archivedReminders.forEach((r, i) => {
        archivesHTML += `
            <div class="mgmt-item">
                <span style="color:#718096;">[${r.date}] ${r.text}</span>
                <button class="btn-delete" onclick="deleteArchive(${i})">Supprimer</button>
            </div>`;
    });
    archivesHTML += '</div>';
    container.innerHTML += archivesHTML;
}

function deleteReminder(idx) {
    if(!confirm("Supprimer ce rappel ?")) return;
    reminders.splice(idx, 1);
    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(renderAdminManagement);
}

function deleteTheme(mat, idx) {
    if(!confirm("Supprimer ce thème ?")) return;
    db[mat].splice(idx, 1);
    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(renderAdminManagement);
}

function deleteArchive(idx) {
    if(!confirm("Supprimer définitivement ?")) return;
    archivedReminders.splice(idx, 1);
    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(renderAdminManagement);
}

// --- 5. EDICIÓN ---
let editingType = null, editingKey = null, editingIdx = null;

function openEditReminder(idx) {
    editingType = 'reminder';
    editingIdx = idx;
    const r = reminders[idx];
    document.getElementById('edit-modal-title').innerText = "Modifier Rappel";
    const form = document.getElementById('edit-form');
    form.innerHTML = `
        <input type="text" id="edit-rem-text">
        <input type="date" id="edit-rem-date">
    `;
    document.getElementById('edit-rem-text').value = r.text;
    document.getElementById('edit-rem-date').value = r.date;
    document.getElementById('modal-edit').classList.remove('hidden');
}

function openEditTheme(mat, idx) {
    editingType = 'theme';
    editingKey = mat;
    editingIdx = idx;
    const t = db[mat][idx];
    document.getElementById('edit-modal-title').innerText = "Modifier Thème";
    const form = document.getElementById('edit-form');
    form.innerHTML = `
        <input type="text" id="edit-tema-name">
        <textarea id="edit-ppt" placeholder="PowerPoint"></textarea>
        <textarea id="edit-iframe" placeholder="Iframe"></textarea>
        <input type="text" id="edit-url" placeholder="URL">
        <input type="text" id="edit-video" placeholder="Video">
        <p>📝 PDF Autocorrectif :</p>
        <input type="text" id="edit-pdf" placeholder="URL du PDF">
        <input type="text" id="edit-answers" placeholder="Réponses (A, B, C)">
    `;
    document.getElementById('edit-tema-name').value = t.name;
    document.getElementById('edit-ppt').value = t.ppt || "";
    document.getElementById('edit-iframe').value = t.iframe || "";
    document.getElementById('edit-url').value = t.url || "";
    document.getElementById('edit-video').value = t.video || "";
    document.getElementById('edit-pdf').value = t.pdf || "";
    document.getElementById('edit-answers').value = t.answers || "";
    document.getElementById('modal-edit').classList.remove('hidden');
}

function saveEdit() {
    if (editingType === 'reminder') {
        reminders[editingIdx].text = document.getElementById('edit-rem-text').value;
        reminders[editingIdx].date = document.getElementById('edit-rem-date').value;
    } else {
        const t = db[editingKey][editingIdx];
        t.name = document.getElementById('edit-tema-name').value;
        t.ppt = document.getElementById('edit-ppt').value;
        t.iframe = document.getElementById('edit-iframe').value;
        t.url = document.getElementById('edit-url').value;
        t.video = document.getElementById('edit-video').value;
        t.pdf = document.getElementById('edit-pdf').value;
        t.answers = document.getElementById('edit-answers').value;
    }
    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(() => {
        closeEditModal();
        renderAdminManagement();
    });
}

function closeEditModal() { document.getElementById('modal-edit').classList.add('hidden'); }

function openSubject(m) {
    currentSub = m;
    showView('view-subject');
    document.getElementById('current-subject-title').innerText = m.toUpperCase();
    const container = document.getElementById('folders-container');
    container.innerHTML = '';
    (db[m] || []).forEach((t, i) => {
        // Calcular progreso
        const steps = [t.ppt, t.iframe, t.url, t.video, t.pdf, "EXAM"].filter(s => s);
        const totalSteps = steps.length;
        const currentProgress = t.progress || 0;
        const percent = Math.min(Math.round((currentProgress / totalSteps) * 100), 100);

        const f = document.createElement('div');
        f.className = 'subject-card card-musique';
        f.style.height = "160px";
        f.style.flexDirection = "column";
        f.style.justifyContent = "center";
        f.style.alignItems = "center";
        f.style.gap = "10px";
        f.style.paddingBottom = "0";

        f.innerHTML = `
            <span class="subject-label" style="font-size:1rem; padding:5px 15px;">📂 ${t.name}</span>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percent}%"></div>
                <span class="progress-text">${percent}%</span>
            </div>
        `;
        f.onclick = () => openThemePath(i);
        container.appendChild(f);
    });
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
        { name: "Actividad", data: theme.iframe, icon: "🎮" },
        { name: "Web", data: theme.url, icon: "🌐" },
        { name: "Vidéo", data: theme.video, icon: "📺" },
        { name: "Quiz PDF", data: theme.pdf, icon: "📝", type: "pdf-quiz" },
        { name: "Examen", data: "EXAM", icon: "🎓" }
    ].filter(s => s.data);

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
    const activityPlace = document.getElementById('activity-place');
    const quizPlace = document.getElementById('quiz-place');
    const finishBtn = document.getElementById('btn-finish-activity');

    const finalUrl = fixGoogleDriveUrl(s.data);
    activityPlace.innerHTML = finalUrl.includes('<iframe') ? finalUrl : `<iframe src="${finalUrl}"></iframe>`;

    if (s.type === "pdf-quiz") {
        quizPlace.classList.remove('hidden');
        finishBtn.classList.add('hidden');
        renderInteractiveQuiz();
    } else {
        quizPlace.classList.add('hidden');
        finishBtn.classList.remove('hidden');
    }
}

function renderInteractiveQuiz() {
    const theme = db[currentSub][currentThemeIdx];
    const quizQuestions = document.getElementById('quiz-questions');
    quizQuestions.innerHTML = "";

    // Reset answers
    for (const prop in userAnswers) { delete userAnswers[prop]; }

    const answers = theme.answers.split(',').map(a => a.trim().toUpperCase());
    answers.forEach((_, i) => {
        const row = document.createElement('div');
        row.className = "quiz-question-row";
        row.innerHTML = `<p>Question ${i + 1} :</p>
            <div class="quiz-options" id="q-row-${i}">
                <div class="quiz-opt" onclick="selectQuizOpt(${i}, 'A')">A</div>
                <div class="quiz-opt" onclick="selectQuizOpt(${i}, 'B')">B</div>
                <div class="quiz-opt" onclick="selectQuizOpt(${i}, 'C')">C</div>
                <div class="quiz-opt" onclick="selectQuizOpt(${i}, 'D')">D</div>
            </div>`;
        quizQuestions.appendChild(row);
    });
}

const userAnswers = {};
function selectQuizOpt(qIdx, val) {
    userAnswers[qIdx] = val;
    document.querySelectorAll(`#q-row-${qIdx} .quiz-opt`).forEach(opt => {
        opt.classList.remove('selected');
        if (opt.innerText === val) opt.classList.add('selected');
    });
}

function gradeQuiz() {
    const theme = db[currentSub][currentThemeIdx];
    const correctAnswers = theme.answers.split(',').map(a => a.trim().toUpperCase());
    let correctCount = 0;

    correctAnswers.forEach((ans, i) => {
        if (userAnswers[i] === ans) correctCount++;
    });

    const score = Math.round((correctCount / correctAnswers.length) * 20);
    alert(`Bravo Sergio ! Tu as eu ${correctCount} / ${correctAnswers.length} correct. Note : ${score}/20`);

    // Guardar nota y avanzar
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(score);
    theme.progress = (theme.progress || 0) + 1;
    database.ref('/').set({ db, scores, reminders, archivedReminders }).then(() => {
        openThemePath(currentThemeIdx);
    });
}

function completeStep() {
    const theme = db[currentSub][currentThemeIdx];
    if(currentStepIdx === 1) document.getElementById('modal-score').classList.remove('hidden');
    else { theme.progress = (theme.progress || 0) + 1; database.ref('/').set({ db, scores, reminders, archivedReminders }); }
}

function saveStepScore() {
    const n = document.getElementById('input-note').value;
    if(!scores[currentSub]) scores[currentSub] = [];
    scores[currentSub].push(n);
    db[currentSub][currentThemeIdx].progress++;
    database.ref('/').set({ db, scores, reminders, archivedReminders });
    document.getElementById('modal-score').classList.add('hidden');
    openThemePath(currentThemeIdx);
}

function showLogin() {
    showView('view-login');
}
function checkAdminPassword() {
    if(document.getElementById('admin-pass-input').value === "Gaby1429") {
        showView('view-admin');
        renderAdminManagement();
    }
    else alert("Faux!");
}


function autoArchiveReminders() {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    const active = [];
    reminders.forEach(r => {
        if (r.date < today) {
            archivedReminders.push(r);
            changed = true;
        } else {
            active.push(r);
        }
    });

    if (changed) {
        reminders = active;
        database.ref('/').set({ db, scores, reminders, archivedReminders });
    }
}

window.onload = renderHome;
