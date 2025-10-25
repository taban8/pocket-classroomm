import { getCapsuleIndex, getCapsule, deleteCapsule, getProgress, exportCapsule } from './storage.js';

/**
 * Converts an ISO 8601 date string into a human-readable "time ago" format.
 * Returns "just now", "Xm ago", "Xh ago", "Xd ago", or the localized date string
 * if it's older than 7 days.
 * @param {string} isoString - The ISO 8601 formatted date string (e.g., "2023-10-27T10:00:00Z").
 * @returns {string} A human-readable string representing the time elapsed since the given date.
 */
function timeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

/**
 * Renders the library view of learning capsules.
 * Fetches capsule metadata, sorts it, and generates HTML for each capsule card.
 * Handles display for an empty library state and attaches event listeners for capsule actions.
 * @param {function(string | null): void} onEdit - Callback function invoked when the 'Edit' button is clicked or a new capsule is to be created.
 *                                          Receives the capsule ID (string) for existing capsules or null for a new one.
 * @param {function(string): void} onLearn - Callback function invoked when the 'Learn' button is clicked.
 *                                         Receives the capsule ID (string) to start a learning session.
 */
function renderLibrary(onEdit, onLearn) {
    const grid = document.getElementById('capsules-grid');
    // Retrieves a lightweight index of all capsules, containing basic metadata like ID, title, and last update.
    const index = getCapsuleIndex();
    
    // Displays an empty state message if no capsules exist.
    if (index.length === 0) {
        grid.innerHTML = `
            <div class="col-12 empty-state">
                <div class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.3;"></i>
                    <h3 class="mt-3 text-muted">No capsules yet</h3>
                    <p class="text-muted">Create your first learning capsule to get started!</p>
                    <button class="btn btn-primary btn-lg mt-2" id="btn-new-capsule-empty">
                        <i class="bi bi-plus-circle"></i> Create First Capsule
                    </button>
                </div>
     </div>
        `;
        
        // Attaches an event listener to the "Create First Capsule" button in the empty state.
        document.getElementById('btn-new-capsule-empty')?.addEventListener('click', () => {
            onEdit(null); // Calls onEdit with null to indicate creation of a new capsule.
        });
        return;
    }
    
    // Sorts capsules by their 'updatedAt' timestamp in descending order (most recently updated first).
    const sortedIndex = [...index].sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    // Generates the HTML for each capsule card and inserts it into the grid.
    grid.innerHTML = sortedIndex.map(item => {
        // Fetches the full capsule content for detailed information.
        const capsule = getCapsule(item.id);
        // Fetches learning progress specific to this capsule.
        const progress = getProgress(item.id);
        
        // Counts the number of content items within the capsule.
        const notesCount = capsule?.notes?.length || 0;
        const flashcardsCount = capsule?.flashcards?.length || 0;
        const quizCount = capsule?.quiz?.length || 0;
        // Counts flashcards marked as 'known' in the user's progress.
        const knownCount = progress.knownFlashcards.length;
        
        // Retrieves the best quiz score for the capsule, defaulting to 0.
        const bestScorePercent = progress.bestScore || 0;
        // Calculates the percentage of known flashcards, handles division by zero.
        const knownPercent = flashcardsCount > 0 
            ? Math.round((knownCount / flashcardsCount) * 100) 
            : 0;
        
        // Maps capsule difficulty levels to Bootstrap color classes for badges.
        const levelClass = {
            'Beginner': 'success',
            'Intermediate': 'warning',        
    'Advanced': 'danger'
        }[item.level] || 'secondary';
        
        // Returns the HTML string for a single capsule card.
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card capsule-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${escapeHtml(item.title)}</h5>
                            <span class="badge bg-${levelClass}">${item.level}</span>
                        </div>
                        ${item.subject ? `<p class="text-muted mb-2"><i class="bi bi-tag"></i> ${escapeHtml(item.subject)}</p>` : ''}
                        <p class="text-muted small mb-3">
                            <i class="bi bi-clock"></i> ${timeAgo(item.updatedAt)}
                        </p>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">Quiz Best Score</small>
                                <small class="text-muted">${bestScorePercent}%</small>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-primary" role="progressbar" 
                                     style="width: ${bestScorePercent}%"></div>
                            </div>
                        </div>
                        
                        ${flashcardsCount > 0 ? `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="text-muted">Known Flashcards</small>
                                <small class="text-muted">${knownCount}/${flashcardsCount}</small>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: ${knownPercent}%"></div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="content-badges mb-3">
                            ${notesCount > 0 ? `<span class="badge bg-info"><i class="bi bi-file-text"></i> ${notesCount} notes</span>` : ''}
                            ${flashcardsCount > 0 ? `<span class="badge bg-info"><i class="bi bi-card-list"></i> ${flashcardsCount} cards</span>` : ''}
                            ${quizCount > 0 ? `<span class="badge bg-info"><i class="bi bi-question-circle"></i> ${quizCount} questions</span>` : ''}
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-sm btn-primary" data-action="learn" data-id="${item.id}">
                                <i class="bi bi-lightbulb"></i> Learn
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${item.id}">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" data-action="export" data-id="${item.id}">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${item.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    
    // Attaches a single event listener to the grid to handle clicks on all action buttons using event delegation.
    grid.addEventListener('click', (e) => {
        // Finds the closest button element with a 'data-action' attribute.
        const button = e.target.closest('[data-action]');
        if (!button) return; // If no action button was clicked, exit.
        
        const action = button.dataset.action; // Retrieves the action type (e.g., 'learn', 'edit').
        const id = button.dataset.id;         // Retrieves the ID of the capsule associated with the button.
        
        switch (action) {
            case 'learn':
                onLearn(id); // Invokes the learn callback with the capsule ID.
                break;
            case 'edit':
                onEdit(id); // Invokes the edit callback with the capsule ID.
                break;
            case 'export':
                const capsule = getCapsule(id); // Fetches the full capsule data for export.
                if (capsule) {
                    exportCapsule(capsule); // Exports the capsule data (e.g., as a JSON file download).
                }
                break;
            case 'delete':
                // Prompts the user for confirmation before deleting a capsule.
                if (confirm('Are you sure you want to delete this capsule? This cannot be undone.')) {
                    deleteCapsule(id);         // Deletes the capsule from storage.
                    renderLibrary(onEdit, onLearn); // Re-renders the library to reflect the deletion.
                }
                break;
        }
    });
}

/**
 * Escapes HTML special characters in a string to prevent XSS vulnerabilities
 * when injecting user-generated content into the DOM.
 * @param {string} text - The raw string potentially containing HTML characters.
 * @returns {string} The HTML-escaped string.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { renderLibrary };