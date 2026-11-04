const STORAGE_KEY = "trilha-abnt-progress-v1";

const defaultProgress = {
  completedLessons: [],
  streakDays: 3,
};

const lessonContent = {
  citacao: {
    title: "Uma citação no lugar certo.",
    question: "Qual frase mostra de onde veio a ideia?",
    answers: [
      "A leitura ajuda a aprender mais.",
      "Segundo Silva (2022), a leitura apoia a aprendizagem.",
      "Todos sabem que a leitura é importante.",
    ],
    correctAnswer: 1,
    correctFeedback: "Isso! O nome e o ano ajudam o leitor a localizar a fonte.",
    incorrectFeedback: "Procure a frase que identifica a autoria e o ano da ideia.",
  },
  estrutura: {
    title: "Seu trabalho por dentro.",
    question: "Qual parte apresenta o tema e os objetivos do trabalho?",
    answers: [
      "A introdução.",
      "A lista de referências.",
      "A folha de aprovação.",
    ],
    correctAnswer: 0,
    correctFeedback: "Isso! A introdução apresenta o assunto e os objetivos.",
    incorrectFeedback: "Pense na parte que prepara o leitor para o assunto.",
  },
  referencias: {
    title: "Referências que fazem sentido.",
    question: "O que ajuda a identificar um livro nas referências?",
    answers: [
      "A cor da capa e o número de páginas.",
      "O nome do leitor e a data da leitura.",
      "A autoria, o título e os dados de publicação.",
    ],
    correctAnswer: 2,
    correctFeedback: "Muito bem! Esses dados ajudam a localizar a obra consultada.",
    incorrectFeedback: "Escolha os dados que permitem a outra pessoa localizar o livro.",
  },
};

function loadProgress() {
  try {
    const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (!savedProgress || typeof savedProgress !== "object") {
      return { ...defaultProgress };
    }

    return {
      ...defaultProgress,
      ...savedProgress,
      completedLessons: Array.isArray(savedProgress.completedLessons)
        ? savedProgress.completedLessons
        : [],
      streakDays: Number(savedProgress.streakDays ?? savedProgress.streak ?? 3),
    };
  } catch {
    return { ...defaultProgress };
  }
}

const progress = loadProgress();
const lessonDialog = document.querySelector("#lesson-dialog");
const lessonTitle = document.querySelector("#dialog-title");
const questionLegend = document.querySelector("#quiz-question");
const answerOptions = document.querySelectorAll(".answer-option");
const answerFeedback = document.querySelector("#answer-feedback");
const finishLessonButton = document.querySelector("#finish-lesson-button");
const announcement = document.querySelector("#announcement");

let activeLessonId = "citacao";
let selectedAnswerIndex = null;
let announcementTimeout;

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // O progresso continua disponível durante a sessão se o armazenamento estiver bloqueado.
  }
}

function updateProgressDisplay() {
  const completedLessons = progress.completedLessons.length;
  const hasCompletedDailyLesson = progress.completedLessons.includes("citacao");
  const progressFill = document.querySelector("#daily-progress-fill");
  const progressLabel = document.querySelector("#daily-progress-label");
  const startLessonButton = document.querySelector("#start-lesson-button");

  document.querySelector("#lessons-count").textContent = completedLessons;
  document.querySelector("#streak-count").textContent = progress.streakDays;
  document.querySelector(".streak-counter").setAttribute(
    "aria-label",
    `${progress.streakDays} dias seguidos de estudo`,
  );
  progressFill.style.width = hasCompletedDailyLesson ? "100%" : "0%";
  progressLabel.textContent = hasCompletedDailyLesson ? "1 de 1" : "0 de 1";

  const buttonLabel = document.createTextNode(
    hasCompletedDailyLesson ? "Revisar lição " : "Começar lição ",
  );
  const buttonArrow = document.createElement("span");
  buttonArrow.setAttribute("aria-hidden", "true");
  buttonArrow.textContent = hasCompletedDailyLesson ? "↻" : "→";
  startLessonButton.replaceChildren(buttonLabel, buttonArrow);

  saveProgress();
}

function resetAnswerState() {
  selectedAnswerIndex = null;
  finishLessonButton.disabled = true;
  answerFeedback.textContent = "";
  answerFeedback.classList.remove("is-error");

  answerOptions.forEach((option) => {
    option.classList.remove("is-correct", "is-incorrect");
  });
}

function openLesson(lessonId) {
  const lesson = lessonContent[lessonId];

  if (!lesson) return;

  activeLessonId = lessonId;
  lessonTitle.textContent = lesson.title;
  questionLegend.textContent = lesson.question;
  resetAnswerState();

  answerOptions.forEach((option, index) => {
    const letter = String.fromCharCode(65 + index);
    option.dataset.correct = String(index === lesson.correctAnswer);
    option.replaceChildren();

    const answerLetter = document.createElement("span");
    answerLetter.className = "answer-letter";
    answerLetter.textContent = letter;

    option.append(answerLetter, document.createTextNode(lesson.answers[index]));
  });

  lessonDialog.showModal();
}

function showAnnouncement(message) {
  window.clearTimeout(announcementTimeout);
  announcement.textContent = message;
  announcement.classList.add("is-visible");

  announcementTimeout = window.setTimeout(() => {
    announcement.classList.remove("is-visible");
  }, 3200);
}

document.querySelectorAll("[data-open-lesson]").forEach((button) => {
  button.addEventListener("click", () => {
    openLesson(button.dataset.openLesson);
  });
});

answerOptions.forEach((option, index) => {
  option.addEventListener("click", () => {
    const lesson = lessonContent[activeLessonId];
    const isCorrect = index === lesson.correctAnswer;

    selectedAnswerIndex = index;
    answerOptions.forEach((answer) => {
      answer.classList.remove("is-correct", "is-incorrect");
    });

    option.classList.add(isCorrect ? "is-correct" : "is-incorrect");
    answerFeedback.textContent = isCorrect
      ? lesson.correctFeedback
      : lesson.incorrectFeedback;
    answerFeedback.classList.toggle("is-error", !isCorrect);
    finishLessonButton.disabled = !isCorrect;
  });
});

finishLessonButton.addEventListener("click", () => {
  const lesson = lessonContent[activeLessonId];
  const isAnswerCorrect = selectedAnswerIndex === lesson.correctAnswer;

  if (!isAnswerCorrect) return;

  const isNewLesson = !progress.completedLessons.includes(activeLessonId);

  if (isNewLesson) {
    progress.completedLessons.push(activeLessonId);
    updateProgressDisplay();
  }

  lessonDialog.close();
  showAnnouncement(isNewLesson ? "Lição concluída! Mandou bem! ✦" : "Lição revisada. Continue assim! ✦");
});

document.querySelector("#close-dialog-button").addEventListener("click", () => {
  lessonDialog.close();
});

updateProgressDisplay();
