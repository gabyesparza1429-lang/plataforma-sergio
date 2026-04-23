// Base de datos de ejercicios
const exercises = [
    { q: "Combien font 7 x 8?", a: "56", options: ["48", "54", "56", "64"] },
    { q: "Calcule: 120 / 4", a: "30", options: ["25", "30", "35", "40"] },
    { q: "Si x + 5 = 12, alors x =", a: "7", options: ["5", "7", "8", "17"] }
];

let stats = JSON.parse(localStorage.getItem('sergioStats')) || {
    math: { done: 0, score: 0, time: 0 }
};

let currentIdx = 0;
let startTime = Date.now();

function init() {
    renderQuestion();
    updateReportUI();
    startTimer();
}

function startTimer() {
    setInterval(() => {
        stats.math.time++;
        document.getElementById('timer').innerText = formatTime(stats.math.time);
        save();
    }, 1000);
}

function renderQuestion() {
    const q = exercises[currentIdx];
    document.getElementById('question-text').innerText = q.q;
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt);
        grid.appendChild(btn);
    });
}

function checkAnswer(ans) {
    if(ans === exercises[currentIdx].a) {
        stats.math.score += 20 / exercises.length; // Escala francesa sobre 20
        alert("Excellent! 🌟");
    }
    
    stats.math.done++;
    currentIdx++;
    
    if(currentIdx < exercises.length) {
        renderQuestion();
    } else {
        document.getElementById('question-card').innerHTML = "<h2>Session Terminée!</h2>";
        document.getElementById('exam-btn').classList.remove('hidden');
    }
    updateReportUI();
    save();
}

function updateReportUI() {
    const r = stats.math;
    document.getElementById('report-display').innerHTML = `
        <p>Activités terminées: ${r.done}</p>
        <p>Note actuelle: ${Math.round(r.score)} / 20</p>
    `;
}

function formatTime(s) {
    const min = Math.floor(s / 60);
    const seg = s % 60;
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

function save() {
    localStorage.setItem('sergioStats', JSON.stringify(stats));
}

init();
