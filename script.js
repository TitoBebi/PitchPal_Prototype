
// Find every button or link that has a data-page attribute.
const pageButtons = document.querySelectorAll("[data-page]");

// Find all the screens on our website.
const pages = document.querySelectorAll(".page");

// Find the navigation buttons at the top.
const navLinks = document.querySelectorAll(".nav-link");

// Run this function whenever a navigation button is clicked.
function showPage(pageName) {
  // Hide every screen first.
  pages.forEach(function(page) {
    page.classList.remove("active");
  });

  // Find the screen we want to open.
  const selectedPage = document.getElementById(pageName);

  // Show it if it exists.
  if (selectedPage) {
    selectedPage.classList.add("active");
  } else {
    return;
  }

  // Remove the active style from every navigation button.
  navLinks.forEach(function(link) {
    link.classList.remove("active");
  });

  // Highlight the navigation button matching the selected screen.
  navLinks.forEach(function(link) {
    if (link.dataset.page === pageName) {
      link.classList.add("active");
    }
  });

  // Return to the top of the page after navigation.
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Give every navigation link and page button a click action.
pageButtons.forEach(function(button) {
  button.addEventListener("click", function(event) {
    event.preventDefault();

    const destination = button.dataset.page;
    showPage(destination);
  });
});

// ===== PITCHPAL NOTE RECOGNITION QUIZ =====

// Find the elements we need to control.
const playNoteButton = document.getElementById("play-note-btn");
const nextQuestionButton = document.getElementById("next-question-btn");
const answerButtons = document.querySelectorAll(".answer-btn");

const questionCount = document.getElementById("question-count");
const scoreDisplay = document.getElementById("score-display");
const progressFill = document.getElementById("progress-fill");
const feedbackMessage = document.getElementById("feedback-message");

const quizPanel = document.getElementById("quiz-panel");
const resultsPanel = document.getElementById("results-panel");
const finalScore = document.getElementById("final-score");
const finalMessage = document.getElementById("final-message");
const restartQuizButton = document.getElementById("restart-quiz-btn");

// The seven natural notes and their frequencies in octave 4.
const noteFrequencies = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.00,
  A: 440.00,
  B: 493.88
};

// Quiz settings and current progress.
const totalQuestions = 10;

let currentQuestion = 1;
let score = 0;
let correctNote = "";
let previousNote = "";
let hasAnswered = false;

// We'll create the audio system when the user plays a note.
let audioContext = null;


// Choose a random note for the current question.
function chooseRandomNote() {
  const notes = Object.keys(noteFrequencies);
  let newNote;

  // Avoid choosing the same note twice in a row.
  do {
    newNote = notes[Math.floor(Math.random() * notes.length)];
  } while (notes.length > 1 && newNote === previousNote);

  previousNote = newNote;
  return newNote;
}


// Play a piano-like synthesized note.
async function playQuizNote(note) {
  // Create the audio system the first time it is needed.
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      feedbackMessage.textContent =
        "Your browser does not support audio playback.";
      return;
    }

    audioContext = new AudioContextClass();
  }

  // Some browsers require audio to be resumed after user interaction.
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const frequency = noteFrequencies[note];
  const now = audioContext.currentTime;

  // Use a few harmonics to make the tone richer than a plain beep.
  const harmonics = [
    { multiplier: 1, volume: 0.55 },
    { multiplier: 2, volume: 0.18 },
    { multiplier: 3, volume: 0.07 }
  ];

  harmonics.forEach(function (harmonic) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency * harmonic.multiplier;

    // Start quietly, reach full volume quickly, then fade away.
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(
      harmonic.volume,
      now + 0.025
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 1.2
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 1.25);
  });
}


// Play the note for the current question.
playNoteButton.addEventListener("click", function () {
  playQuizNote(correctNote);
});


// Check the answer the user selected.
function checkAnswer(selectedNote, button) {
  // Do not allow multiple answers for the same question.
  if (hasAnswered) {
    return;
  }

  hasAnswered = true;

  const isCorrect = selectedNote === correctNote;

  if (isCorrect) {
    score++;

    feedbackMessage.textContent =
      "Correct! You identified the note " + correctNote + ".";

    feedbackMessage.className =
      "feedback-message is-correct";

    button.classList.add("correct");
  } else {
    feedbackMessage.textContent =
      "Not quite! The note was " + correctNote +
      ". Keep listening and try again next time.";

    feedbackMessage.className =
      "feedback-message is-incorrect";

    button.classList.add("incorrect");

    // Also show the correct answer.
    answerButtons.forEach(function (answerButton) {
      if (answerButton.dataset.note === correctNote) {
        answerButton.classList.add("correct");
      }
    });
  }

  // Lock all answers until the next question.
  answerButtons.forEach(function (answerButton) {
    answerButton.disabled = true;
  });

  // Update the score and progress.
  scoreDisplay.textContent = "Score: " + score;
  progressFill.style.width =
    (currentQuestion / totalQuestions) * 100 + "%";

  // Change the button text on the final question.
  if (currentQuestion === totalQuestions) {
    nextQuestionButton.textContent = "See results →";
  }

  nextQuestionButton.disabled = false;
}


// Connect each note button to the answer-checking function.
answerButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    checkAnswer(button.dataset.note, button);
  });
});


// Prepare the next question.
function nextQuestion() {
  if (!hasAnswered) {
    return;
  }

  // If all questions have been answered, show the results.
  if (currentQuestion === totalQuestions) {
    showResults();
    return;
  }

  currentQuestion++;
  hasAnswered = false;
  correctNote = chooseRandomNote();

  // Update the question counter.
  questionCount.textContent =
    currentQuestion + " / " + totalQuestions;

  // Reset the answer buttons.
  answerButtons.forEach(function (button) {
    button.disabled = false;
    button.classList.remove("correct", "incorrect");
  });

  // Reset the feedback and next button.
  feedbackMessage.textContent =
    "Listen to the note, then choose your answer.";

  feedbackMessage.className = "feedback-message";

  nextQuestionButton.disabled = true;
  nextQuestionButton.textContent = "Next question →";
}


// Show the final score screen.
function showResults() {
  quizPanel.hidden = true;
  resultsPanel.hidden = false;

  finalScore.textContent =
    "You scored " + score + " out of " + totalQuestions + ".";

  if (score === totalQuestions) {
    finalMessage.textContent =
      "Perfect score! Excellent listening.";
  } else if (score >= 7) {
    finalMessage.textContent =
      "Great job! Keep practicing to strengthen your pitch recognition.";
  } else {
    finalMessage.textContent =
      "Good start! Replay the notes and practice again to improve.";
  }
}


// Start a fresh quiz.
function restartQuiz() {
  currentQuestion = 1;
  score = 0;
  previousNote = "";
  hasAnswered = false;
  correctNote = chooseRandomNote();

  scoreDisplay.textContent = "Score: 0";
  questionCount.textContent = "1 / " + totalQuestions;
  progressFill.style.width = "0%";

  feedbackMessage.textContent =
    "Listen to the note, then choose your answer.";

  feedbackMessage.className = "feedback-message";

  answerButtons.forEach(function (button) {
    button.disabled = false;
    button.classList.remove("correct", "incorrect");
  });

  nextQuestionButton.disabled = true;
  nextQuestionButton.textContent = "Next question →";

  resultsPanel.hidden = true;
  quizPanel.hidden = false;
}


// Connect the next and restart buttons.
nextQuestionButton.addEventListener("click", nextQuestion);
restartQuizButton.addEventListener("click", restartQuiz);


// Prepare the first question.
correctNote = chooseRandomNote();

// ==============================
// PITCHPAL PIANO ROOM
// PLAYABLE PIANO KEYS
// ==============================

const pianoKeys = document.querySelectorAll(".piano-key");
const currentNoteDisplay = document.getElementById("current-note");

// Reuse the audio system if the Training Room already created one.
if (!window.pitchPalAudio) {
  window.pitchPalAudio = new (window.AudioContext || window.webkitAudioContext)();
}

const pianoAudio = window.pitchPalAudio;

// Convert note names into musical frequencies.
function getPianoFrequency(noteName) {
  const noteFrequencies = {
    "C": 0,
    "C#": 1,
    "D": 2,
    "D#": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "G": 7,
    "G#": 8,
    "A": 9,
    "A#": 10,
    "B": 11
  };

  const octaveMatch = noteName.match(/[0-9]+/);

  const octave = octaveMatch
    ? Number(octaveMatch[0])
    : 4;

  const note = noteName.replace(/[0-9]/g, "");
  const semitone = noteFrequencies[note];

  if (semitone === undefined) {
    console.error("Unknown note name:", noteName);
    return 261.63;
  }

  const midiNumber = (octave + 1) * 12 + semitone;

  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

// Play a piano-like electronic tone.
function playPianoNote(noteName) {
  if (pianoAudio.state === "suspended") {
    pianoAudio.resume();
  }

  const frequency = getPianoFrequency(noteName);
  const now = pianoAudio.currentTime;

  const oscillator = pianoAudio.createOscillator();
  const gain = pianoAudio.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  oscillator.connect(gain);
  gain.connect(pianoAudio.destination);

  oscillator.start(now);
  oscillator.stop(now + 1.25);
}

// Make each piano key clickable.
pianoKeys.forEach(function(key) {
  key.addEventListener("click", function() {
    const noteName = key.dataset.note;

    playPianoNote(noteName);

    currentNoteDisplay.textContent = noteName;

    // Briefly highlight the key.
    key.classList.add("active");

    setTimeout(function() {
      key.classList.remove("active");
    }, 180);
  });
});