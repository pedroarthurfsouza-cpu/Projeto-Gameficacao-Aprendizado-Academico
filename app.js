const STORAGE_KEY = "trilha-abnt-progress-v1";

const defaultProgress = {
  completedLessons: [],
  streakDays: 3,
};

const lessonContent = {
  citacao: {
    title: "Citação direta e identificação de autoria.",
    question: "Qual frase atende rigorosamente à norma ABNT NBR 10520:2023 para menção de autoria no corpo do texto?",
    answers: [
      "A leitura regular ajuda o estudante a redigir melhor.",
      "Segundo Silva (2022), a leitura crítica fundamenta a escrita acadêmica.",
      "Todos sabem que a literatura científica deve ser consultada constantemente.",
    ],
    correctAnswer: 1,
    correctFeedback: "Correto! O sobrenome fora dos parênteses grafado em caixa-baixa (Silva, 2022) cumpre com rigor a NBR 10520:2023.",
    incorrectFeedback: "Incorreto. A norma exige que a autoria e o ano sejam identificados para permitir a localização exata da fonte.",
  },
  estrutura: {
    title: "Estrutura do trabalho acadêmico (NBR 14724).",
    question: "Qual elemento textual tem a finalidade de situar o leitor, expor o tema e apresentar os objetivos da pesquisa?",
    answers: [
      "A introdução.",
      "A lista de abreviaturas e siglas.",
      "A folha de aprovação.",
    ],
    correctAnswer: 0,
    correctFeedback: "Exato! A introdução é o primeiro elemento textual obrigatório e deve apresentar a contextualização e os objetivos.",
    incorrectFeedback: "Atenção: elementos pré-textuais preparam o documento, mas a introdução é onde o texto da pesquisa efetivamente tem início.",
  },
  referencias: {
    title: "Elaboração de referências (NBR 6023).",
    question: "Para referenciar um livro publicado, qual conjunto de dados é estritamente indispensável?",
    answers: [
      "A cor da encadernação e o sumário completo da obra.",
      "O nome da biblioteca onde o livro foi lido e a data do empréstimo.",
      "Autoria, título da obra (em destaque tipográfico), edição, local, editora e ano de publicação.",
    ],
    correctAnswer: 2,
    correctFeedback: "Perfeito! Esses elementos essenciais permitem a qualquer leitor localizar com exatidão o exemplar consultado.",
    incorrectFeedback: "Revise a NBR 6023: as referências bibliográficas devem conter os dados de publicação que possibilitem a localização da obra.",
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
    // Permanece na sessão atual se localStorage estiver bloqueado
  }
}

function updateProgressDisplay() {
  const completedLessons = progress.completedLessons.length;
  const hasCompletedDailyLesson = progress.completedLessons.includes("citacao");
  const startLessonButton = document.querySelector("#start-lesson-button");

  const lessonsCountEl = document.querySelector("#lessons-count");
  if (lessonsCountEl) lessonsCountEl.textContent = completedLessons;

  const streakCountEl = document.querySelector("#streak-count");
  if (streakCountEl) streakCountEl.textContent = progress.streakDays;

  const streakContainer = document.querySelector(".streak-counter");
  if (streakContainer) {
    streakContainer.setAttribute(
      "aria-label",
      `${progress.streakDays} dias seguidos de estudo`,
    );
  }

  if (startLessonButton) {
    const buttonLabel = document.createTextNode(
      hasCompletedDailyLesson ? "Revisar lição prática " : "Iniciar lição prática ",
    );
    const buttonArrow = document.createElement("span");
    buttonArrow.className = "button-arrow";
    buttonArrow.setAttribute("aria-hidden", "true");
    buttonArrow.textContent = hasCompletedDailyLesson ? "↺" : "→";
    startLessonButton.replaceChildren(buttonLabel, buttonArrow);
  }

  // Atualização dos cards de módulos com indicador de conclusão
  document.querySelectorAll(".track-card, .module-card, .path-card").forEach((card) => {
    const lessonId = card.dataset.openLesson;
    const isCompleted = progress.completedLessons.includes(lessonId);
    card.classList.toggle("is-completed", isCompleted);

    const icon = card.querySelector(".track-arrow, .module-status-icon, .path-arrow");
    if (icon) {
      icon.textContent = isCompleted ? "✓" : "→";
      icon.setAttribute("aria-label", isCompleted ? "Concluído" : "Abrir módulo");
    }
  });

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

    const marker = document.createElement("span");
    marker.className = "option-marker";
    marker.textContent = letter;

    const text = document.createElement("span");
    text.className = "option-text";
    text.textContent = lesson.answers[index];

    option.append(marker, text);
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

// Interatividade no App-Frame do Hero (Demonstração prática ao vivo)
const togglePreviewBtn = document.querySelector("#toggle-preview-fix");
let isFixedPreview = true;

if (togglePreviewBtn) {
  togglePreviewBtn.addEventListener("click", () => {
    isFixedPreview = !isFixedPreview;
    const oldCit = document.querySelector("#preview-old-citation");
    const newCit = document.querySelector("#preview-new-citation");
    if (oldCit && newCit) {
      if (isFixedPreview) {
        oldCit.style.display = "inline";
        newCit.style.color = "var(--accent-emerald)";
        newCit.textContent = "(Silva, 2022)";
        togglePreviewBtn.textContent = "Reverter para texto anterior";
      } else {
        oldCit.style.display = "none";
        newCit.style.color = "var(--accent-danger)";
        newCit.textContent = "(SILVA, 2022)";
        togglePreviewBtn.textContent = "Aplicar regra NBR 10520:2023";
      }
    }
  });
}

// Abertura de lições via clique e teclado
document.querySelectorAll("[data-open-lesson]").forEach((element) => {
  element.addEventListener("click", (e) => {
    e.stopPropagation();
    openLesson(element.dataset.openLesson);
  });
});

document.querySelectorAll(".track-card[data-open-lesson]").forEach((card) => {
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLesson(card.dataset.openLesson);
    }
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
  showAnnouncement(isNewLesson ? "Módulo concluído com sucesso." : "Módulo revisado com sucesso.");
});

document.querySelector("#close-dialog-button").addEventListener("click", () => {
  lessonDialog.close();
});

lessonDialog.addEventListener("click", (e) => {
  const rect = lessonDialog.getBoundingClientRect();
  const isInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );
  if (!isInDialog) {
    lessonDialog.close();
  }
});

updateProgressDisplay();
