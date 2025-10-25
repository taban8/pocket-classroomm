import { renderLibrary } from './library.js';
import { initAuthorMode,saveCapsuleData,setupAuthorListeners } from './author.js';
import { populateCapsuleSelector,loadCapsuleForLearning,setupLearnListeners } from './learn.js';
import { importCapsule,getTheme,saveTheme } from './storage.js';

/**
 * Stores the name of the currently active view in the single-page application.
 * Used for managing UI state and keyboard shortcuts.
 */
let currentView = 'library';

/**
 * Switches the active view in the single-page application.
 *
 *
 * @param {string} viewName The name of the view to activate (e.g., 'library', 'author', 'learn').
 *                          This should correspond to the ID suffix of the view section (e.g., 'library-view')
 *                          and navigation link (e.g., 'nav-library').
 */
function showView(viewName) {
    // Deactivate all current view sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Deactivate all current navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Activate the target view section
    const viewSection = document.getElementById(`${viewName}-view`);
    if (viewSection) {
        viewSection.classList.add('active');
    }
    
    // Activate the corresponding navigation link
    const navLink = document.getElementById(`nav-${viewName}`);
    if (navLink) {
        navLink.classList.add('active');
    }
    currentView = viewName;
    
    // Trigger view-specific initialization or rendering
    if (viewName === 'library') {
        // Render the library view, passing callback functions for editing and learning capsules.
        renderLibrary(editCapsule, learnCapsule);
    } else if (viewName === 'learn') {
        // Populate the dropdown selector with available capsules for the 'learn' view.
        populateCapsuleSelector();
    }
}

/**
 * Initiates the authoring mode for a specific capsule or creates a new one.
 *
 * @param {string | null} capsuleId The ID of the capsule to edit. If `null`, a new capsule will be created.
 */
function editCapsule(capsuleId) {
    initAuthorMode(capsuleId);
    showView('author');
}

/**
 * Switches to the 'learn' view and loads a specific capsule for learning.
 *
 * @param {string} capsuleId The ID of the capsule to be loaded into the learn interface.
 */
function learnCapsule(capsuleId) {
    showView('learn');
    // Pre-select the capsule in the learn view's dropdown.
    document.getElementById('learn-capsule-select').value = capsuleId;
    loadCapsuleForLearning(capsuleId);
}

/**
 * Sets up event listeners for all navigation links that have a `data-view` attribute.
 * Clicking these links will trigger a view switch.
 */
function setupNavigation() {
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            showView(view);
        });
    });
}

/**
 * Sets up event listeners for interactive elements within the library view.
 * This includes buttons for creating new capsules and importing capsules.
 */
function setupLibraryButtons() {
    // Listener for the "New Capsule" button, initiating author mode for a fresh capsule.
    document.getElementById('btn-new-capsule').addEventListener('click', () => {
        editCapsule(null);
    });
    // Listener for the "Import" button, programmatically clicking a hidden file input.
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
    
    // Listener for the file input's change event, handling the actual capsule import.
    document.getElementById('import-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return; // No file selected
        
        try {
            await importCapsule(file);
            alert('Capsule imported successfully!');
            showView('library'); // Return to library view after successful import
        } catch (error) {
            alert('Import failed: ' + error.message);
        }
        
        // Reset the input value to allow importing the same file again if needed.
        e.target.value = '';
    });
}

/**
 * Sets up event listeners for interactive elements within the authoring view.
 * This includes buttons for saving and canceling capsule edits.
 */
function setupAuthorButtons() {
    // Listener for the "Save Capsule" button.
    document.getElementById('btn-save-capsule').addEventListener('click', () => {
        const savedId = saveCapsuleData(); // Attempt to save current capsule data
        if (savedId) {
            alert('Capsule saved successfully!');
            showView('library'); // Return to library view after save
        }
    });
    
    // Listener for the "Cancel" button, prompting the user before discarding changes.
    document.getElementById('btn-cancel-author').addEventListener('click', () => {
        if (confirm('Discard changes and return to library?')) {
            showView('library');
        }
    });
}

/**
 * Initializes the theme toggle functionality.
 * Retrieves the saved theme, applies it, and sets up a click listener to switch themes.
 */
function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const currentTheme = getTheme(); // Retrieve theme preference from storage
    applyTheme(currentTheme); // Apply the retrieved theme
    
    toggleBtn.addEventListener('click', () => {
        // Determine the new theme based on the current one
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        saveTheme(newTheme); // Save the new theme preference
        applyTheme(newTheme); // Apply the new theme visually
    });
}

/**
 * Applies a specified theme to the document body and updates the theme toggle icon.
 *
 * @param {'light' | 'dark'} theme The theme to apply.
 */
function applyTheme(theme) {
    document.body.dataset.theme = theme; // Set a data attribute on the body for CSS theming
    const icon = document.querySelector('#theme-toggle i');
    
    // Update the icon to reflect the current theme
    if (theme === 'light') {
        icon.className = 'bi bi-sun';
    } else {
        icon.className = 'bi bi-moon-stars';
    }
}
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');

    const favicon = document.getElementById('favicon');
    if (document.body.classList.contains('dark-theme')) {
      if (favicon) favicon.href = 'favicon-dark.png';
      themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
      if (favicon) favicon.href = 'favicon-light.png';
      themeToggle.innerHTML = '<i class="bi bi-moon-stars"></i>';
    }
  });
}
/**
 * Sets up global keyboard shortcuts, primarily for the 'learn' view.
 *
 * Shortcuts include:
 * - Spacebar: Flips flashcards when on the flashcards tab.
 * - '[': Navigates to the previous tab in the learn view (Notes, Flashcards, Quiz).
 * - ']': Navigates to the next tab in the learn view.
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only apply shortcuts if in the 'learn' view and content is visible
        if (currentView !== 'learn') return;
        
        const learnContent = document.getElementById('learn-content');
        if (learnContent.style.display === 'none') return; // Skip if learn content is hidden
        
        const activeTab = document.querySelector('.nav-link.active[data-bs-toggle="tab"]');
        const currentTabId = activeTab?.id; // Get the ID of the currently active learn tab
        
        // Shortcut for flipping flashcards (Spacebar)
        if (e.key === ' ' && currentTabId === 'flashcards-tab') {
            e.preventDefault(); // Prevent default spacebar action (e.g., scrolling)
            const flashcardContainer = document.getElementById('flashcard-container');
            if (flashcardContainer.style.display !== 'none') {
                document.getElementById('btn-flip-flashcard').click();
            }
        }
        
        // Shortcut for navigating to the previous learn tab ('[')
        if (e.key === '[') {
            e.preventDefault();
            const tabs = ['notes-tab', 'flashcards-tab', 'quiz-tab'];
            const currentIndex = tabs.indexOf(currentTabId);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1; // Wrap around to end
            document.getElementById(tabs[prevIndex]).click(); // Programmatically click the previous tab
        }
        
        // Shortcut for navigating to the next learn tab (']')
        if (e.key === ']') {
            e.preventDefault();
            const tabs = ['notes-tab', 'flashcards-tab', 'quiz-tab'];
            const currentIndex = tabs.indexOf(currentTabId);
            const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0; // Wrap around to beginning
            document.getElementById(tabs[nextIndex]).click(); // Programmatically click the next tab
        }
    });
}

/**
 * Initializes the entire application by setting up event listeners,
 * UI components, and displaying the initial view.
 * This function serves as the primary entry point for application startup logic.
 */
function init() {
    setupNavigation();       // Initialize navigation links
    setupLibraryButtons();   // Initialize buttons specific to the library view
    setupAuthorButtons();    // Initialize buttons specific to the authoring view
    setupAuthorListeners();  // Set up event listeners for authoring components (e.g., input changes)
    setupLearnListeners();   // Set up event listeners for learning components (e.g., dropdown changes)
    setupThemeToggle();      // Initialize theme switching functionality
    setupKeyboardShortcuts(); // Set up global keyboard shortcuts
    showView('library');     // Display the library view as the initial screen
}

// Ensures that the 'init' function is called only after the DOM is fully loaded.
// This prevents errors from trying to access elements that aren't yet available.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}