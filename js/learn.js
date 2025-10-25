import { getCapsuleIndex, getCapsule, getProgress, saveProgress, exportCapsule } from './storage.js';

// Global state variables for the current learning session.
let currentCapsule = null; // Stores the active capsule object being studied.
let currentFlashcardIndex = 0; // Tracks the index of the currently displayed flashcard.
let isFlipped = false; // Indicates if the current flashcard is showing its back side.
let currentQuizIndex = 0; // Tracks the index of the current quiz question.
let quizAnswers = []; // Stores boolean results (true for correct, false for incorrect) for each quiz question.

/**
 * Populates the 'Choose a capsule' dropdown with available capsules from storage.
 * Each option displays the capsule's title and subject.
 */
function populateCapsuleSelector() {
    const select = document.getElementById('learn-capsule-select');
    const index = getCapsuleIndex(); // Retrieves a list of capsule metadata (id, title, subject).
    
    select.innerHTML = '<option value="">Choose a capsule to study...</option>';
    
    index.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.title} (${item.subject || 'No subject'})`;
        select.appendChild(option);
    });
}

/**
 * Loads a specific capsule for the learning interface based on its ID.
 * Updates the UI with the capsule's metadata (title, level, subject, description)
 * and renders its notes, flashcards, and quiz sections.
 *
 * @param {string} capsuleId - The unique identifier of the capsule to load.
 */
function loadCapsuleForLearning(capsuleId) {
    currentCapsule = getCapsule(capsuleId); // Fetches the full capsule data from storage.
    
    if (!currentCapsule) {
        alert('Capsule not found');
        return;
    }

    // Displays the learning content and hides the empty state message.
    document.getElementById('learn-empty').style.display = 'none';
    document.getElementById('learn-content').style.display = 'block';
    
    document.getElementById('learn-capsule-title').textContent = currentCapsule.meta.title;
    
    // Generates HTML for capsule metadata badges (level, subject) and description.
    const metaHtml = `
        <div class="d-flex gap-3 flex-wrap">
            <span class="badge bg-${getLevelColor(currentCapsule.meta.level)}">${currentCapsule.meta.level}</span>
            ${currentCapsule.meta.subject ? `<span class="badge bg-secondary"><i class="bi bi-tag"></i> ${escapeHtml(currentCapsule.meta.subject)}</span>` : ''}
            ${currentCapsule.meta.description ? `<p class="mb-0 text-muted">${escapeHtml(currentCapsule.meta.description)}</p>` : ''}
        </div>
    `;
    document.getElementById('learn-capsule-meta').innerHTML = metaHtml;
    
    // Renders the different learning components of the capsule.
    renderNotes();
    renderFlashcards();
    renderQuiz();
}

/**
 * Maps a given learning level string to a corresponding Bootstrap color class.
 *
 * @param {string} level - The difficulty level (e.g., 'Beginner', 'Intermediate', 'Advanced').
 * @returns {string} The Bootstrap color class (e.g., 'success', 'warning', 'danger', 'secondary' as default).
 */
function getLevelColor(level) {
    return {
        'Beginner': 'success',
        'Intermediate': 'warning',
        'Advanced': 'danger'
    }[level] || 'secondary';
}

/**
 * Renders the notes section of the current capsule.
 * Handles display for empty notes and sets up a debounced search functionality.
 */
function renderNotes() {
    const notesList = document.getElementById('notes-list');
    const notesEmpty = document.getElementById('notes-empty');

    // Displays an empty state message if no notes are available.
    if (!currentCapsule.notes || currentCapsule.notes.length === 0) {
        notesList.style.display = 'none';
        notesEmpty.style.display = 'block';
        return;
    }
    
    notesList.style.display = 'block';
    notesEmpty.style.display = 'none';
    
    // Populates the notes list, ensuring HTML is escaped.
    notesList.innerHTML = currentCapsule.notes.map(note => 
        `<li>${escapeHtml(note)}</li>`
    ).join('');
    
    const searchInput = document.getElementById('notes-search');
    searchInput.value = ''; // Clears previous search input.
    
    // Attaches a debounced input event listener for real-time filtering of notes.
    searchInput.oninput = debounce(() => {
        const query = searchInput.value.toLowerCase();
        const items = notesList.querySelectorAll('li');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    }, 300); // 300ms debounce time.
}

/**
 * Renders the flashcards section of the current capsule.
 * Initializes the flashcard view, handling empty states and resetting the flashcard state.
 */
function renderFlashcards() {
    const container = document.getElementById('flashcard-container');
    const emptyState = document.getElementById('flashcards-empty');
    
    // Displays an empty state message if no flashcards are available.
    if (!currentCapsule.flashcards || currentCapsule.flashcards.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    currentFlashcardIndex = 0; // Resets to the first flashcard.
    isFlipped = false; // Ensures the flashcard starts on the front side.
    updateFlashcard(); // Renders the initial flashcard.
}

/**
 * Updates the displayed flashcard content and UI controls.
 * Shows the front/back text, updates the card counter, and sets the 'known' status.
 */
function updateFlashcard() {
    if (!currentCapsule.flashcards || currentCapsule.flashcards.length === 0) return;

    const card = currentCapsule.flashcards[currentFlashcardIndex];
    const progress = getProgress(currentCapsule.id); // Retrieves user's learning progress for this capsule.

    document.getElementById('flashcard-front-text').textContent = card.front;
    document.getElementById('flashcard-back-text').textContent = card.back;
    document.getElementById('flashcard-counter').textContent = 
        `Card ${currentFlashcardIndex + 1} of ${currentCapsule.flashcards.length} | Known: ${progress.knownFlashcards.length}`;

    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped'); // Ensures card is not flipped when navigating.
    isFlipped = false;

    // Updates the 'Known'/'Unknown' buttons based on current flashcard's status in progress.
    const isKnown = progress.knownFlashcards.includes(currentFlashcardIndex);
    document.getElementById('btn-known-flashcard').classList.toggle('active', isKnown);
    document.getElementById('btn-unknown-flashcard').classList.toggle('active', !isKnown);
    
    // Disables navigation buttons at the start or end of the flashcard list.
    document.getElementById('btn-prev-flashcard').disabled = currentFlashcardIndex === 0;
    document.getElementById('btn-next-flashcard').disabled = 
        currentFlashcardIndex === currentCapsule.flashcards.length - 1;
}

/**
 * Toggles the 'flipped' state of the current flashcard, revealing its back side.
 */
function flipFlashcard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isFlipped = !isFlipped;
}

/**
 * Advances to the next flashcard in the sequence, if available.
 */
function nextFlashcard() {
    if (currentFlashcardIndex < currentCapsule.flashcards.length - 1) {
        currentFlashcardIndex++;
        updateFlashcard();
    }
}

/**
 * Moves to the previous flashcard in the sequence, if available.
 */
function prevFlashcard() {
    if (currentFlashcardIndex > 0) {
        currentFlashcardIndex--;
        updateFlashcard();
    }
}

/**
 * Marks the current flashcard as 'known' or 'unknown' in the user's progress.
 * Updates the stored progress and re-renders the flashcard UI.
 *
 * @param {boolean} known - True if the flashcard is known, false otherwise.
 */
function markFlashcard(known) {
    const progress = getProgress(currentCapsule.id);
    const index = currentFlashcardIndex;
    
    if (known) {
        // Adds the flashcard index to knownFlashcards if it's not already there.
        if (!progress.knownFlashcards.includes(index)) {
            progress.knownFlashcards.push(index);
        }
    } else {
        // Removes the flashcard index from knownFlashcards.
        progress.knownFlashcards = progress.knownFlashcards.filter(i => i !== index);
    }
    
    saveProgress(currentCapsule.id, progress); // Persists the updated progress.
    updateFlashcard(); // Reflects the change in the UI.
}

/**
 * Renders the quiz section, initializing state and displaying the first question.
 * Handles display for empty quiz states.
 */
function renderQuiz() {
    const container = document.getElementById('quiz-container-learn');
    const resultsDiv = document.getElementById('quiz-results');
    const emptyState = document.getElementById('quiz-empty');
    
    // Displays an empty state message if no quiz questions are available.
    if (!currentCapsule.quiz || currentCapsule.quiz.length === 0) {
        container.style.display = 'none';
        resultsDiv.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    resultsDiv.style.display = 'none';
    emptyState.style.display = 'none';

    currentQuizIndex = 0; // Resets quiz to the first question.
    quizAnswers = []; // Clears previous quiz answers.
    showQuizQuestion(); // Displays the first question.
}

/**
 * Displays the current quiz question and its choices.
 * If all questions are answered, it transitions to showing quiz results.
 */
function showQuizQuestion() {
    if (currentQuizIndex >= currentCapsule.quiz.length) {
        showQuizResults(); // All questions answered, show results.
        return;
    }
    
    const question = currentCapsule.quiz[currentQuizIndex];
    
    document.getElementById('quiz-question-number').textContent = 
        `Question ${currentQuizIndex + 1} of ${currentCapsule.quiz.length}`;
    document.getElementById('quiz-score').textContent = 
        `Score: ${quizAnswers.filter(a => a).length}/${currentQuizIndex}`; // Displays current score.
    document.getElementById('quiz-question-text').textContent = question.question;

    const choicesDiv = document.getElementById('quiz-choices');
    // Renders multiple-choice buttons, mapping index to letters (A, B, C...).
    choicesDiv.innerHTML = question.choices.map((choice, index) => `
        <button class="btn btn-outline-primary text-start quiz-choice" data-index="${index}">
            <strong>${String.fromCharCode(65 + index)}.</strong> ${escapeHtml(choice)}
        </button>
    `).join('');
    
    // Hides feedback and explanation sections for the new question.
    document.getElementById('quiz-feedback').style.display = 'none';
    document.getElementById('quiz-explanation').style.display = 'none';
    document.getElementById('btn-next-question').style.display = 'none';
    
    // Attaches event listeners to each choice button to handle user selection.
    choicesDiv.querySelectorAll('.quiz-choice').forEach(btn => {
        btn.addEventListener('click', () => handleQuizAnswer(parseInt(btn.dataset.index)));
    });
}

/**
 * Handles a user's selected answer for the current quiz question.
 * Provides visual feedback (correct/incorrect), displays explanations,
 * and manages transition to the next question or results.
 *
 * @param {number} selectedIndex - The 0-based index of the choice selected by the user.
 */
function handleQuizAnswer(selectedIndex) {
    const question = currentCapsule.quiz[currentQuizIndex];
    const isCorrect = selectedIndex === question.correctIndex;
    
    quizAnswers.push(isCorrect); // Records the correctness of the answer.
    
    const choicesDiv = document.getElementById('quiz-choices');
    const buttons = choicesDiv.querySelectorAll('.quiz-choice');
    
    // Updates styling of choice buttons to show correct/incorrect answers.
    buttons.forEach((btn, index) => {
        btn.disabled = true; // Prevents further interaction with choices.
        if (index === question.correctIndex) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-success'); // Marks the correct answer.
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-danger'); // Marks the user's incorrect choice.
        }
    });
    
    const feedbackDiv = document.getElementById('quiz-feedback');
    feedbackDiv.className = `alert mt-4 ${isCorrect ? 'alert-success' : 'alert-danger'}`;
    feedbackDiv.innerHTML = `
        <i class="bi bi-${isCorrect ? 'check-circle' : 'x-circle'}"></i>
        ${isCorrect ? 'Correct!' : 'Incorrect'}
    `;
    feedbackDiv.style.display = 'block';
    
    // Displays the explanation if available for the current question.
    if (question.explanation) {
        const explanationDiv = document.getElementById('quiz-explanation');
        explanationDiv.innerHTML = `<strong>Explanation:</strong> ${escapeHtml(question.explanation)}`;
        explanationDiv.style.display = 'block';
    }
    
    // Shows the "Next Question" button, or transitions to results if it's the last question.
    if (currentQuizIndex < currentCapsule.quiz.length - 1) {
        document.getElementById('btn-next-question').style.display = 'inline-block';
    } else {
        setTimeout(showQuizResults, 1500); // Short delay before showing final results.
    }
}

/**
 * Displays the final results of the quiz, including score and best score comparison.
 * Updates the user's best score for the capsule if a new record is achieved.
 */
function showQuizResults() {
    document.getElementById('quiz-container-learn').style.display = 'none';
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.style.display = 'block';
    
    const correctCount = quizAnswers.filter(a => a).length;
    const totalCount = quizAnswers.length;
    const percentage = Math.round((correctCount / totalCount) * 100);
    
    document.getElementById('quiz-final-score').textContent = `${percentage}%`;
    document.getElementById('quiz-result-message').textContent = 
        `You got ${correctCount} out of ${totalCount} questions correct!`;

    const progress = getProgress(currentCapsule.id);
    const isNewBest = percentage > progress.bestScore;
    
    // Updates best score if the current performance is better.
    if (isNewBest) {
        progress.bestScore = percentage;
        saveProgress(currentCapsule.id, progress); // Persists the new best score.
        document.getElementById('quiz-best-score').innerHTML = 
            `<p class="text-success"><i class="bi bi-trophy"></i> New best score!</p>`;
    } else {
        document.getElementById('quiz-best-score').innerHTML = 
            `<p class="text-muted">Best score: ${progress.bestScore}%</p>`;
    }
}

/**
 * Sets up all event listeners for interactive elements within the learning section.
 * This includes capsule selection, flashcard navigation, quiz interaction, and export functionality.
 */
function setupLearnListeners() {
    // Listener for capsule selection dropdown.
    document.getElementById('learn-capsule-select').addEventListener('change', (e) => {
        if (e.target.value) {
            loadCapsuleForLearning(e.target.value); // Load selected capsule.
        } else {
            // Reverts to empty state if no capsule is selected.
            document.getElementById('learn-content').style.display = 'none';
            document.getElementById('learn-empty').style.display = 'block';
        }
    });
    
    // Flashcard navigation and marking listeners.
    document.getElementById('btn-flip-flashcard').addEventListener('click', flipFlashcard);
    document.getElementById('btn-next-flashcard').addEventListener('click', nextFlashcard);
    document.getElementById('btn-prev-flashcard').addEventListener('click', prevFlashcard);
    document.getElementById('btn-known-flashcard').addEventListener('click', () => markFlashcard(true));
    document.getElementById('btn-unknown-flashcard').addEventListener('click', () => markFlashcard(false));
    
    // Quiz navigation and retake listeners.
    document.getElementById('btn-next-question').addEventListener('click', () => {
        currentQuizIndex++;
        showQuizQuestion();
    });
    
    document.getElementById('btn-retake-quiz').addEventListener('click', renderQuiz);
    
    // Listener for exporting the currently loaded capsule.
    document.getElementById('btn-export-current').addEventListener('click', () => {
        if (currentCapsule) {
            exportCapsule(currentCapsule);
        }
    });
}

/**
 * Returns a debounced version of the provided function.
 * The debounced function will only execute after a specified `wait` time
 * has passed since its last invocation. Useful for performance-critical
 * events like input handling or window resizing.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before executing `func`.
 * @returns {Function} The debounced function.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escapes HTML special characters in a string to prevent XSS attacks
 * and ensure safe display of user-generated content.
 *
 * @param {string} text - The input string to escape.
 * @returns {string} The HTML-escaped string.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Public API for other modules to interact with the learning functionality.
export { populateCapsuleSelector, loadCapsuleForLearning, setupLearnListeners };