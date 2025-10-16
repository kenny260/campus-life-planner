
 //Sanitize input to prevent unsafe characters or HTML injection

export function sanitizeInput(str, maxLength = 500) {
    if (!str || typeof str !== 'string') return "";
    return str
        .trim()
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .substring(0, maxLength);
}

/*Validate a single task object*/
export function validateTask(task) {
    if (!task.title || typeof task.title !== 'string' || task.title.trim() === "")
        return { isValid: false, message: "Task title cannot be empty." };
    
    const titleRegex = /^\S(?:.*\S)?$/;
    if (!titleRegex.test(task.title))
        return { isValid: false, message: "Title cannot have leading or trailing spaces." };
    
    if (task.title.length > 100)
        return { isValid: false, message: "Title cannot exceed 100 characters." };

    //Tag
    if (!task.tag || typeof task.tag !== 'string' || task.tag.trim() === "")
        return { isValid: false, message: "Please enter a tag." };
    
    const tagRegex = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
    if (!tagRegex.test(task.tag))
        return { isValid: false, message: "Tag can only contain letters, spaces, and hyphens (e.g., 'Study-Group')." };
    
    if (task.tag.length > 50)
        return { isValid: false, message: "Tag cannot exceed 50 characters." };

    //  Due Date 
    if (!task.dueDate || typeof task.dueDate !== 'string')
        return { isValid: false, message: "Please select a valid due date." };
    
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(task.dueDate))
        return { isValid: false, message: "Date must be in YYYY-MM-DD format with valid month/day." };

    if (isNaN(Date.parse(task.dueDate)))
        return { isValid: false, message: "Invalid date value." };
    
    const currentYear = new Date().getFullYear();
    const minDate = `${currentYear - 2}-01-01`;
    const maxDate = `${currentYear + 5}-12-31`;
    if (task.dueDate < minDate || task.dueDate > maxDate)
        return { isValid: false, message: `Date must be between ${minDate} and ${maxDate}.` };

    // Duration 
    if (task.duration === undefined || task.duration === null)
        return { isValid: false, message: "Duration is required." };

    if (!Number.isInteger(task.duration) || task.duration <= 0 || task.duration > 1440)
        return { isValid: false, message: "Duration must be a whole number between 1 and 1440 minutes." };

    //Duplicate words check
    const duplicateWordsRegex = /\b(\w+)\s+\1\b/i;
    if (duplicateWordsRegex.test(task.title))
        return { isValid: false, message: "Title contains duplicate consecutive words (e.g., 'the the')." };
    
    if (task.notes && duplicateWordsRegex.test(task.notes))
        return { isValid: false, message: "Notes contain duplicate consecutive words." };

    //Completed
    if (task.completed !== undefined && typeof task.completed !== 'boolean')
        return { isValid: false, message: "Completed status must be true or false." };

    //ID
    if (task.id !== undefined && (typeof task.id !== 'string' || task.id.trim() === ''))
        return { isValid: false, message: "Task ID must be a non-empty string." };

    // Timestamps
    if (task.createdAt && !isValidISO8601(task.createdAt))
        return { isValid: false, message: "Invalid createdAt timestamp." };
    if (task.updatedAt && !isValidISO8601(task.updatedAt))
        return { isValid: false, message: "Invalid updatedAt timestamp." };

    return { isValid: true, message: "Valid task." };
}

// Validate imported JSON data
export function validateImportData(data) {
    if (!data || typeof data !== "object")
        return { isValid: false, message: "Invalid file format: must be a JSON object." };

    if (!Array.isArray(data.tasks))
        return { isValid: false, message: "'tasks' must be an array." };

    if (data.tasks.length === 0)
        return { isValid: false, message: "Import file contains no tasks." };

    const ids = new Set();
    for (let i = 0; i < data.tasks.length; i++) {
        const task = data.tasks[i];

        if (task.id && ids.has(task.id))
            return { isValid: false, message: `Duplicate task ID found: ${task.id}` };
        if (task.id) ids.add(task.id);

        const validation = validateTask(task);
        if (!validation.isValid)
            return { isValid: false, message: `Task #${i + 1} ("${task.title}"): ${validation.message}` };
    }

    if (data.settings) {
        if (typeof data.settings !== 'object' || data.settings === null)
            return { isValid: false, message: "Settings must be an object." };

        if (data.settings.showCompleted !== undefined && typeof data.settings.showCompleted !== 'boolean')
            return { isValid: false, message: "Settings.showCompleted must be boolean." };

        if (data.settings.defaultDuration !== undefined) {
            if (typeof data.settings.defaultDuration !== 'number' || 
                data.settings.defaultDuration < 1 || 
                data.settings.defaultDuration > 1440)
                return { isValid: false, message: "Settings.defaultDuration must be between 1–1440." };
        }
    }

    return {
        isValid: true,
        message: `Import data is valid (${data.tasks.length} task${data.tasks.length !== 1 ? 's' : ''}).`
    };
}

//Check if string is valid ISO 8601 timestamp
function isValidISO8601(str) {
    if (typeof str !== 'string') return false;
    return !isNaN(Date.parse(str));
}

//Validate search query safely for regex use
export function validateSearchQuery(query) {
    if (!query || typeof query !== 'string')
        return { isValid: true, message: "", regex: null };

    if (query.length > 200)
        return { isValid: false, message: "Search query too long (max 200 characters).", regex: null };

    try {
        const regex = new RegExp(query, 'i');
        return { isValid: true, message: "Valid regex pattern.", regex };
    } catch {
        return { isValid: false, message: "Invalid regex pattern. Using simple text search instead.", regex: null };
    }
}

//Common regex patterns
export const REGEX_PATTERNS = {
    tagPrefix: /^@(\w+):/,
    timeToken: /\b([01]\d|2[0-3]):[0-5]\d\b/,
    duplicateWords: /\b(\w+)\s+\1\b/i,
    highPriority: /\b(?=.*urgent|important|critical)\w+/i,
    shortTask: /\b([1-2]?\d)\s*min/i,
    acronym: /\b[A-Z]{2,}\b/
};

//regex documentation
export function getRegexExamples() {
    return [
        {
            pattern: '/^\\S(?:.*\\S)?$/',
            purpose: 'No leading/trailing spaces',
            example: 'Valid: "Task", Invalid: " Task "'
        },
        {
            pattern: '/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/',
            purpose: 'Tag format (letters, spaces, hyphens)',
            example: 'Valid: "Study-Group", Invalid: "123Tag"'
        },
        {
            pattern: '/^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/',
            purpose: 'Date format YYYY-MM-DD',
            example: 'Valid: "2025-10-15"'
        },
        {
            pattern: '/^(0|[1-9]\\d*)$/',
            purpose: 'Positive integer (duration)',
            example: 'Valid: "60", Invalid: "60.5"'
        },
        {
            pattern: '/\\b(\\w+)\\s+\\1\\b/i',
            purpose: 'Duplicate consecutive words',
            example: 'Matches: "the the task"'
        },
        {
            pattern: '/^@(\\w+):/',
            purpose: 'Tag prefix search',
            example: 'Matches: "@Study:Read chapter"'
        },
        {
            pattern: '/\\b([01]\\d|2[0-3]):[0-5]\\d\\b/',
            purpose: 'Time format HH:MM',
            example: 'Matches: "meeting at 14:30"'
        }
    ];
}
