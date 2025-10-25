import { getCapsule, saveCapsule } from './storage.js';

let currentCapsuleId = null;

/**
 * Initializes the authoring mode interface.
 * If a capsule ID is provided, it loads the existing capsule data for editing.
 * Otherwise, it prepares the form for creating a new capsule.
 *
 * @param {string|null} capsuleId - The ID of the capsule to edit, or null for a new capsule.
 */
function initAuthorMode(capsuleId = null) {
    currentCapsuleId = capsuleId;
    
    if (capsuleId) {
        const capsule = getCapsule(capsuleId);
        if (capsule) {
            loadCapsule(capsule);
            document.getElementById('author-title').textContent = 'Edit Capsule';
        }
    } else {
        clearForm();
        document.getElementById('author-title').textContent = 'New Capsule';
    }
}

/**
 * Clears all input fields and resets dynamic content sections (flashcards, quiz)
 * in the authoring form to their default empty states.
 */
function clearForm() {
    document.getElementById('capsule-title').value = '';
    document.getElementById('capsule-subject').value = '';
    document.getElementById('capsule-level').value = 'Beginner';
    document.getElementById('capsule-description').value = '';
    document.getElementById('capsule-notes').value = '';
    document.getElementById('flashcards-container').innerHTML = '<p class="text-muted">No flashcards yet. Click "Add Card" to create one.</p>';
    document.getElementById('quiz-container').innerHTML = '<p class="text-muted">No quiz questions yet. Click "Add Question" to create one.</p>';
}

/**
 * Populates the authoring form fields and dynamic content areas with data from a provided capsule object.
 *
 * @param {object} capsule - The capsule object to load into the form.
 * @param {object} capsule.meta - Metadata like title, subject, level, description.
 * @param {string[]} [capsule.notes] - Array of notes lines.
 * @param {object[]} [capsule.flashcards] - Array of flashcard objects ({front, back}).
 * @param {object[]} [capsule.quiz] - Array of quiz question objects.
 */
function loadCapsule(capsule) {
    document.getElementById('capsule-title').value = capsule.meta.title || '';
    document.getElementById('capsule-subject').value = capsule.meta.subject || '';
    document.getElementById('capsule-level').value = capsule.meta.level || 'Beginner';
    document.getElementById('capsule-description').value = capsule.meta.description || '';
    document.getElementById('capsule-notes').value = capsule.notes?.join('\n') || '';
    
    const flashcardsContainer = document.getElementById('flashcards-container');
    if (capsule.flashcards && capsule.flashcards.length > 0) {
        flashcardsContainer.innerHTML = '';
        capsule.flashcards.forEach((card, index) => {
            addFlashcardRow(card.front, card.back, index);
        });
    } else {
        // Ensure default empty state if no flashcards are present in the loaded capsule.
        flashcardsContainer.innerHTML = '<p class="text-muted">No flashcards yet. Click "Add Card" to create one.</p>';
    }
    
    const quizContainer = document.getElementById('quiz-container');
    if (capsule.quiz && capsule.quiz.length > 0) {
        quizContainer.innerHTML = '';
        capsule.quiz.forEach((q, index) => {
            addQuestionBlock(q, index);
        });
   } else {
        // Ensure default empty state if no quiz questions are present in the loaded capsule.
        quizContainer.innerHTML = '<p class="text-muted">No quiz questions yet. Click "Add Question" to create one.</p>';
   }
}

/**
 * Adds a new editable flashcard row to the '#flashcards-container'.
 * If placeholder text is present, it will be removed.
 *
 * @param {string} [front=''] - The initial text for the front of the flashcard.
 * @param {string} [back=''] - The initial text for the back of the flashcard.
 * @param {number|null} [index=null] - Optional index, primarily used when loading existing data.
 */
function addFlashcardRow(front = '', back = '', index = null) {
    const container = document.getElementById('flashcards-container');
    
    // Remove the "No flashcards yet" placeholder if it exists.
    if (container.querySelector('.text-muted')) {
        container.innerHTML = '';
    }
    
    const rowIndex = index !== null ? index : container.children.length;
    
    const row = document.createElement('div');
    row.className = 'flashcard-row mb-3';
    row.innerHTML = `
        <div class="row g-2">
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Front (Question)" 
                       value="${escapeHtml(front)}" data-type="front">
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Back (Answer)" 
                       value="${escapeHtml(back)}" data-type="back">
            </div>
            <div class="col-md-2">
                <button class="btn btn-outline-danger w-100" data-action="remove-flashcard">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(row);
    
    // Attach event listener for the remove button.
    row.querySelector('[data-action="remove-flashcard"]').addEventListener('click', () => {
        row.remove();
        // If all flashcards are removed, display the placeholder text again.
        if (container.children.length === 0) {
            container.innerHTML = '<p class="text-muted">No flashcards yet. Click "Add Card" to create one.</p>';
        }
    });
    }

/**
 * Adds a new editable quiz question block to the '#quiz-container'.
 * If placeholder text is present, it will be removed.
 *
 * @param {object|null} [question=null] - An optional question object to pre-fill the form:
 *   `{ question: string, choices: string[], correctIndex: number, explanation: string }`.
 * @param {number|null} [index=null] - Optional index, primarily used when loading existing data.
 */
function addQuestionBlock(question = null, index = null) {
    const container = document.getElementById('quiz-container');
    
    // Remove the "No quiz questions yet" placeholder if it exists.
    if (container.querySelector('.text-muted')) {
        container.innerHTML = '';
    }
    
    // Default structure for a new question if none is provided.
    const q = question || {
        question: '',
        choices: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
    };
    
    const block = document.createElement('div');
    block.className = 'question-block card mb-3';
    block.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>Question ${container.children.length + 1}</h6>
                <button class="btn btn-sm btn-outline-danger" data-action="remove-question">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
            <div class="mb-3">
                <label class="form-label">Question Text</label>
                <input type="text" class="form-control" placeholder="Enter question" 
                       value="${escapeHtml(q.question)}" data-type="question">
                       </div>
            <div class="mb-3">
                <label class="form-label">Choices</label>
                <div class="choices-container">
                    ${q.choices.map((choice, i) => `
                        <div class="input-group mb-2">
                            <span class="input-group-text">${String.fromCharCode(65 + i)}</span>
                            <input type="text" class="form-control" placeholder="Choice ${String.fromCharCode(65 + i)}" 
                                   value="${escapeHtml(choice)}" data-type="choice" data-index="${i}">
                            <div class="input-group-text">
                                <!-- Unique name attribute ensures radio buttons are grouped per question -->
                                <input class="form-check-input mt-0" type="radio" 
                                       name="correct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}" 
                                       data-type="correct" data-index="${i}" ${i === q.correctIndex ? 'checked' : ''}>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="mb-0">
                <label class="form-label">Explanation (Optional)</label>
                <textarea class="form-control" rows="2" placeholder="Explain the correct answer" 
                          data-type="explanation">${escapeHtml(q.explanation || '')}</textarea>
            </div>
        </div>
    `;
    
    container.appendChild(block);
    
    block.querySelector('[data-action="remove-question"]').addEventListener('click', () => {
        block.remove();
        // If all quiz questions are removed, display the placeholder text again.
        if (container.children.length === 0) {
            container.innerHTML = '<p class="text-muted">No quiz questions yet. Click "Add Question" to create one.</p>';
        } else {
            // Re-number the remaining questions after one is removed.
            updateQuestionNumbers();
        }
    });
}

/**
 * Updates the displayed sequential numbers for all quiz question blocks in the UI.
 * This is typically called after adding or removing a question.
 */
function updateQuestionNumbers() {
    const blocks = document.querySelectorAll('.question-block');
    blocks.forEach((block, index) => {
        block.querySelector('h6').textContent = `Question ${index + 1}`;
    });
}

/**
 * Collects all current data from the authoring form and structures it into a capsule object.
 *
 * @returns {object} An object containing the capsule data:
 *   `{ meta: { title: string, subject: string, level: string, description: string },
 *     notes: string[],
 *     flashcards: { front: string, back: string }[],
 *     quiz: { question: string, choices: string[], correctIndex: number, explanation: string }[]
 *   }`
 */
function collectFormData() {
    const title = document.getElementById('capsule-title').value.trim();
    const subject = document.getElementById('capsule-subject').value.trim();
    const level = document.getElementById('capsule-level').value;
    const description = document.getElementById('capsule-description').value.trim();
    const notesText = document.getElementById('capsule-notes').value;
    
    // Split notes by newline, trim each line, and filter out empty lines.
    const notes = notesText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    const flashcards = [];
    document.querySelectorAll('.flashcard-row').forEach(row => {
        const front = row.querySelector('[data-type="front"]').value.trim();
        const back = row.querySelector('[data-type="back"]').value.trim();
        // Only include flashcards that have both a front and a back value.
        if (front && back) {
            flashcards.push({ front, back });
        }
    });
    
    const quiz = [];
    document.querySelectorAll('.question-block').forEach(block => {
        const questionText = block.querySelector('[data-type="question"]').value.trim();
        const choices = Array.from(block.querySelectorAll('[data-type="choice"]'))
            .map(input => input.value.trim());
        const correctRadio = block.querySelector('[data-type="correct"]:checked');
        // Default to index 0 if no correct answer is selected, though UI should guide selection.
        const correctIndex = correctRadio ? parseInt(correctRadio.dataset.index) : 0;
        const explanation = block.querySelector('[data-type="explanation"]').value.trim();
        
        // Only include quiz questions that have a question text and at least one choice.
        if (questionText && choices.some(c => c)) {
            quiz.push({
                question: questionText,
                choices: choices,
                correctIndex: correctIndex,
                explanation: explanation
            });
        }
    });
    
    return {
        meta: { title, subject, level, description },
        notes,
        flashcards,
        quiz
    };
}

/**
 * Validates the collected capsule data to ensure it meets minimum requirements.
 *
 * @param {object} data - The capsule data object to validate.
 * @returns {{valid: boolean, error?: string}} An object indicating validity and an error message if invalid.
 */
function validateCapsule(data) {
    if (!data.meta.title) {
        return { valid: false, error: 'Title is required' };
    }
    
    // A capsule must have at least one of notes, flashcards, or quiz content.
    const hasContent = data.notes.length > 0 || 
                      data.flashcards.length > 0 || 
                      data.quiz.length > 0;

    if (!hasContent) {
        return { valid: false, error: 'Capsule must have at least one of: notes, flashcards, or quiz' };
    }
    
    return { valid: true };
}

/**
 * Collects data from the form, validates it, and then saves the capsule.
 * If `currentCapsuleId` is set, it updates an existing capsule; otherwise, it creates a new one.
 *
 * @returns {string|null} The ID of the saved capsule if successful, or null if validation fails.
 */
function saveCapsuleData() {
    const data = collectFormData();
    const validation = validateCapsule(data);
    
    if (!validation.valid) {
        alert(validation.error); // Uses native alert for simplicity, could be a more sophisticated UI notification.
        return null;
    }
    
    const capsule = {
        ...data,
        id: currentCapsuleId // Use existing ID for updates, or null for new capsules.
    };
    
    // Delegates actual storage to the './storage.js' module.
    const savedId = saveCapsule(capsule);
    return savedId;
}

/**
 * Sets up event listeners for authoring mode buttons, such as "Add Flashcard" and "Add Question".
 */
function setupAuthorListeners() {
    document.getElementById('btn-add-flashcard').addEventListener('click', () => {
        addFlashcardRow();
    });

    document.getElementById('btn-add-question').addEventListener('click', () => {
        addQuestionBlock();
    });
}

/**
 * Safely escapes HTML characters in a string to prevent Cross-Site Scripting (XSS) vulnerabilities.
 * This is crucial when inserting user-generated content into the DOM via `innerHTML`.
 *
 * @param {string} text - The string containing potentially unsafe HTML characters.
 * @returns {string} The HTML-escaped string.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { initAuthorMode, saveCapsuleData, setupAuthorListeners };