/**
 * @fileoverview Manages data persistence and core operations for "Pocket Classroom" capsules and user settings.
 * Utilizes localStorage for client-side data storage.
 */

/**
 * Defines the current schema version for capsules. This is used for data migration and validation.
 */
const SCHEMA_VERSION = 'pocket-classroom/v1';

/**
 * Enumerates keys used for storing different types of data in localStorage.
 * This centralizes key management and prevents typos.
 */
const STORAGE_KEYS = {
    INDEX: 'pc_capsules_index',         // Key for the array of capsule metadata (index)
    CAPSULE_PREFIX: 'pc_capsule_',      // Prefix for individual capsule data, followed by capsule ID
    PROGRESS_PREFIX: 'pc_progress_',    // Prefix for capsule progress data, followed by capsule ID
    THEME: 'pc_theme'                   // Key for storing the user's selected theme
};

/**
 * Generates a unique, short string ID.
 * Combines the current timestamp (in base 36) with a random number (in base 36)
 * to minimize collision probability.
 * @returns {string} A unique ID string.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Retrieves the main index of all capsules stored in localStorage.
 * The index contains metadata (id, title, subject, level, updatedAt) for each capsule.
 * @returns {Array<Object>} An array of capsule index entries, or an empty array if not found or on error.
 */
function getCapsuleIndex() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.INDEX);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error reading capsule index:', e);
        return [];
    }
}

/**
 * Saves the provided capsule index to localStorage.
 * @param {Array<Object>} index The array of capsule index entries to save.
 * @returns {boolean} True if the index was saved successfully, false otherwise.
 */
function saveCapsuleIndex(index) {
    try {
        localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(index));
        return true;
    } catch (e) {
        console.error('Error saving capsule index:', e);
        return false;
    }
   }

/**
 * Retrieves a full capsule object by its ID from localStorage.
 * @param {string} id The unique identifier of the capsule.
 * @returns {Object|null} The full capsule object if found, otherwise null.
 */
function getCapsule(id) {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CAPSULE_PREFIX + id);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error reading capsule:', e);
        return null;
    }
}

/**
 * Saves a capsule object to localStorage and updates the global capsule index.
 * If the capsule does not have an ID, a new one is generated.
 * The capsule's `updatedAt` timestamp and `schema` version are also set/updated.
 *
 * @param {Object} capsule The capsule object to save. Must contain `meta.title`, `meta.subject`, `meta.level`.
 * @returns {string|null} The ID of the saved capsule if successful, otherwise null.
 */
function saveCapsule(capsule) {
    try {
        // Assign a new ID if the capsule doesn't have one (e.g., new capsule or import)
        if (!capsule.id) {
            capsule.id = generateId();
        }
        // Update timestamp and schema version
        capsule.updatedAt = new Date().toISOString();
        capsule.schema = SCHEMA_VERSION;
        
        // Save the full capsule data under its unique key
        localStorage.setItem(STORAGE_KEYS.CAPSULE_PREFIX + capsule.id, JSON.stringify(capsule));
        
        // Update the main capsule index
        const index = getCapsuleIndex();
        const existingIndex = index.findIndex(item => item.id === capsule.id);
        
        // Create an index entry with essential metadata
        const indexEntry = {
            id: capsule.id,
            title: capsule.meta.title,
            subject: capsule.meta.subject,
            level: capsule.meta.level,
            updatedAt: capsule.updatedAt
        };
        
        // If capsule exists in index, update its entry; otherwise, add a new entry
        if (existingIndex >= 0) {
            index[existingIndex] = indexEntry;
        } else {
            index.push(indexEntry);
        }
        
        saveCapsuleIndex(index);
        return capsule.id;
    } catch (e) {
        console.error('Error saving capsule:', e);
        return null;
    }
}

/**
 * Deletes a capsule and its associated progress data from localStorage,
 * and removes its entry from the capsule index.
 * @param {string} id The ID of the capsule to delete.
 * @returns {boolean} True if deletion was successful, false otherwise.
 */
function deleteCapsule(id) {
    try {
        localStorage.removeItem(STORAGE_KEYS.CAPSULE_PREFIX + id);
        localStorage.removeItem(STORAGE_KEYS.PROGRESS_PREFIX + id); // Also delete associated progress
       
        // Update the capsule index by removing the deleted capsule's entry
        const index = getCapsuleIndex();
        const newIndex = index.filter(item => item.id !== id);
        saveCapsuleIndex(newIndex);
        return true;
    } catch (e) {
        console.error('Error deleting capsule:', e);
        return false;
    }
}

/**
 * Retrieves the learning progress for a specific capsule from localStorage.
 * @param {string} capsuleId The ID of the capsule to get progress for.
 * @returns {Object} The progress object (e.g., { bestScore: 0, knownFlashcards: [] }),
 *                   or a default empty progress object if not found or on error.
 */
function getProgress(capsuleId) {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + capsuleId);
        return data ? JSON.parse(data) : { bestScore: 0, knownFlashcards: [] };
    } catch (e) {
        console.error('Error reading progress:', e);
        return { bestScore: 0, knownFlashcards: [] };
    }
} 

/**
 * Saves the learning progress for a specific capsule to localStorage.
 * @param {string} capsuleId The ID of the capsule to save progress for.
 * @param {Object} progress The progress object to save.
 * @returns {boolean} True if progress was saved successfully, false otherwise.
 */
function saveProgress(capsuleId, progress) {
    try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS_PREFIX + capsuleId, JSON.stringify(progress));
        return true;
    } catch (e) {
        console.error('Error saving progress:', e);
        return false;
    }
}

/**
 * Exports a given capsule object as a JSON file, triggering a download in the browser.
 * This function handles client-side file generation and download initiation.
 * @param {Object} capsule The capsule object to export.
 */
function exportCapsule(capsule) {
    // Convert the capsule object to a pretty-printed JSON string
    const dataStr = JSON.stringify(capsule, null, 2);
    // Create a Blob object from the JSON string with application/json MIME type
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    // Create a URL for the Blob
    const url = URL.createObjectURL(dataBlob);
    
    // Generate a sanitized filename slug from the capsule title
    const slug = capsule.meta.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
    
    // Create a hidden anchor element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}.json`; // Set the download filename
    link.click(); // Programmatically click the link to start download
    
    // Release the object URL, as it's no longer needed after download is initiated
    URL.revokeObjectURL(url);
}

/**
 * Validates the structure and content of a capsule object.
 * Ensures the capsule adheres to the expected schema and has essential data.
 * @param {Object} data The capsule data object to validate.
 * @returns {{valid: boolean, error?: string}} An object indicating validity and an error message if invalid.
 */
function validateCapsule(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid JSON data' };
    }
    
    // Check if the schema version matches the expected version
    if (data.schema !== SCHEMA_VERSION) {
        return { valid: false, error: `Unsupported schema version. Expected ${SCHEMA_VERSION}` };
    }
    
    // Ensure the capsule has a title
    if (!data.meta || !data.meta.title || data.meta.title.trim() === '') {
        return { valid: false, error: 'Capsule must have a title' };
    }

    // Ensure the capsule contains at least one type of content
    const hasContent = (data.notes && data.notes.length > 0) ||
                      (data.flashcards && data.flashcards.length > 0) ||
                      (data.quiz && data.quiz.length > 0);
    
    if (!hasContent) {
        return { valid: false, error: 'Capsule must have at least one of: notes, flashcards, or quiz' };
    }
    
    return { valid: true };
}

/**
 * Imports a capsule from a given File object (e.g., from a file input).
 * Reads the file, parses it as JSON, validates its structure, and then saves it.
 * This function returns a Promise to handle asynchronous file reading.
 * @param {File} file The File object to import.
 * @returns {Promise<string>} A Promise that resolves with the ID of the newly imported capsule,
 *                            or rejects with an Error if validation or saving fails.
 */
function importCapsule(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // Callback when the file has been successfully read
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result); // Parse the file content as JSON
                const validation = validateCapsule(data); // Validate the parsed data
                
               if (!validation.valid) {
                    reject(new Error(validation.error)); // Reject if validation fails
                    return;
                }
                
                // Remove existing ID to ensure a new one is generated for imported capsules,
                // preventing overwrites if an ID collision occurs.
                delete data.id; 
                const newId = saveCapsule(data); // Save the validated capsule
                
                if (newId) {
                    resolve(newId); // Resolve with the ID of the new capsule
                } else {
                    reject(new Error('Failed to save imported capsule')); // Reject if saving fails
                }
            } catch (error) {
                reject(new Error('Invalid JSON file: ' + error.message)); // Catch JSON parsing errors
            }
        };
        
        // Callback if an error occurs during file reading
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file); // Read the file content as text
    });
}

/**
 * Retrieves the currently saved theme preference from localStorage.
 * @returns {string} The theme name ('dark', 'light', etc.) or 'dark' as a default.
 */
function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
} 

/**
 * Saves the user's theme preference to localStorage.
 * @param {string} theme The theme name to save (e.g., 'dark', 'light').
 */
function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Public API for interacting with capsule data and settings
export {
    generateId,
    getCapsuleIndex,
    getCapsule,
    saveCapsule,
    deleteCapsule,
    getProgress,
    saveProgress,
    exportCapsule,
    importCapsule,
    validateCapsule,
    getTheme,
    saveTheme,
    SCHEMA_VERSION
};