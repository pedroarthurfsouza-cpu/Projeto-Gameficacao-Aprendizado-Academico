const progressKey = "trilha-abnt-progress-v1";
const defaultProgress = { points: 120, lessons: 4, badges: 2, streak: 3, weekly: 2 };
let progress = { ...defaultProgress };

try {
  const saved = JSON.parse(localStorage.getItem(progressKey) || "null");
  if (saved && typeof saved === "object") progress = { ...defaultProgress, ...saved };
} catch {
  // A interface continua funcionando se o navegador bloquear armazenamento local.
}

function updateProgress() {
  document.querySelector("#points-count").innerHTML = `${progress.points} <small>pts</small>`;
  document.querySelector("#lessons-count").innerHTML = `${progress.lessons} <small>lições</small>`;
  document.querySelector("#badges-count").innerHTML = `${progress.badges} <small>de 8</small>`;
  document.querySelector("#streak-count").textContent = progress.streak;
  document.querySelector("#weekly-count").textContent = `${progress.weekly}`;
  try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch { /* armazenamento opcional */ }
}

updateProgress();

const dialog = document.querySelector(".lesson-dialog");
const feedback = document.querySelector(".quiz-feedback");
const finishButton = document.querySelector(".finish-button");
let answeredCorrectly = false;
let currentLesson = "citacao";

const lessonTitles = {
  citacao: "Uma citação no lugar certo.",
  estrutura: "Seu trabalho por dentro.",
  referencias: "Referências que fazem sentido.",
};

document.querySelectorAll("[data-lesson]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLesson = button.dataset.lesson;
    document.querySelector("#dialog-title").textContent = lessonTitles[currentLesson] || lessonTitles.citacao;
    dialog.showModal();
    answeredCorrectly = false;
    finishButton.disabled = true;
    feedback.textContent = "";
    feedback.className = "quiz-feedback";
    document.querySelectorAll(".quiz-option").forEach((option) => option.classList.remove("selected", "correct", "incorrect"));
  });
});

document.querySelectorAll(".quiz-option").forEach((option) => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".quiz-option").forEach((item) => item.classList.remove("selected", "correct", "incorrect"));
    option.classList.add("selected");
    answeredCorrectly = option.dataset.correct === "true";
    option.classList.add(answeredCorrectly ? "correct" : "incorrect");
    feedback.textContent = answeredCorrectly
      ? "Isso! A autoria e o ano ajudam o leitor a localizar a fonte."
      : "Ainda não. Procure a alternativa que identifica quem escreveu a ideia e quando.";
    feedback.classList.toggle("error", !answeredCorrectly);
    finishButton.disabled = !answeredCorrectly;
  });
});

finishButton.addEventListener("click", () => {
  if (!answeredCorrectly) return;
  progress.points += 20;
  progress.lessons += 1;
  progress.weekly = Math.min(4, progress.weekly + 1);
  updateProgress();
  dialog.close();
  const toast = document.querySelector(".toast");
  toast.textContent = "Missão concluída! +20 pontos de estudo ✳";
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
});

document.querySelector(".help-button").addEventListener("click", () => {
  const toast = document.querySelector(".toast");
  toast.textContent = "Escolha uma trilha ou comece pela missão do dia.";
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
});

document.querySelector(".bottom-note button").addEventListener("click", (event) => {
  event.currentTarget.closest(".bottom-note").remove();
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});
