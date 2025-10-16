
import { validateTask, validateImportData } from './validators.js';

(() => {
    const STORAGE_KEY = 'campusLifePlanner:tasks';
    const SETTINGS_KEY = 'campusLifePlanner:settings';

    const elements = {
        taskForm: document.getElementById('task-form'),
        formHeading: document.getElementById('form-heading'),
        taskId: document.getElementById('task-id'),
        title: document.getElementById('title'),
        dueDate: document.getElementById('dueDate'),
        duration: document.getElementById('duration'),
        tag: document.getElementById('tag'),
        priority: document.getElementById('priority'),
        notes: document.getElementById('notes'),
        notesCount: document.getElementById('notes-count'),
        cancelBtn: document.getElementById('cancel-btn'),
        
        // Table to display tasks
        recordsTableBody: document.querySelector('#records-table tbody'),
        loadingRow: document.getElementById('loading-row'),
        

        searchInput: document.getElementById('search'),
        sortSelect: document.getElementById('sort-by'),
        filterSelect: document.getElementById('filter-by'),
        caseSensitiveCheckbox: document.getElementById('case-sensitive'),
        
        // Dashboard Stats
        totalTasks: document.getElementById('total-tasks'),
        weeklyTasks: document.getElementById('weekly-tasks'),
        completedTasks: document.getElementById('completed-tasks'),
        topTag: document.getElementById('top-tag'),
        chartContainer: document.getElementById('chart-container'),
        
        taskCapInput: document.getElementById('task-cap'),
        setCapBtn: document.getElementById('set-cap-btn'),
        capMessage: document.getElementById('cap-message'),
        capProgressBar: document.getElementById('cap-progress-bar'),
        capDetails: document.getElementById('cap-details'),
        
        // Settings
        showCompletedCheckbox: document.getElementById('show-completed'),
        defaultDurationInput: document.getElementById('default-duration'),
        minutesInput: document.getElementById('minutes-input'),
        hoursInput: document.getElementById('hours-input'),
        
        // Data Management
        exportDataBtn: document.getElementById('export-data'),
        importDataBtn: document.getElementById('import-data'),
        importFileInput: document.getElementById('import-file'),
        clearAllDataBtn: document.getElementById('clear-all-data'),
         
        notificationArea: document.getElementById('notification-area'),
        notificationMessage: document.getElementById('notification-message'),
        notificationClose: document.getElementById('notification-close')
    };

    if (!elements.taskForm || !elements.recordsTableBody) {
        console.error('Critical elements not found. App cannot initialize.');
        return;
    }

    let tasks = [];
    let editTaskId = null;
    let settings = {
        showCompleted: true,
        defaultDuration: 60,
        taskCap: 20
    };

    //UTILITIES
    const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const showNotification = (message, type = 'success') => {
        if (!elements.notificationArea) return;
        
        elements.notificationArea.classList.remove('hidden', 'success', 'error', 'warning', 'info');
        elements.notificationArea.classList.add(type);
        elements.notificationMessage.textContent = message;
        
        setTimeout(() => elements.notificationArea.classList.add('hidden'), 4000);
    };

    //STORAGE
    const storage = {
        save: (key, data) => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {
                console.error(`Failed to save ${key}:`, e);
                showNotification('Unable to save data. Storage may be full.', 'error');
            }
        },
        
        load: (key, defaultValue = null) => {
            try {
                const stored = localStorage.getItem(key);
                return stored ? JSON.parse(stored) : defaultValue;
            } catch (e) {
                console.error(`Failed to load ${key}:`, e);
                return defaultValue;
            }
        }
    };


    const saveTasks = () => storage.save(STORAGE_KEY, tasks);
    const loadTasks = () => { tasks = storage.load(STORAGE_KEY, []); };
    const saveSettings = () => storage.save(SETTINGS_KEY, settings);
    const loadSettings = () => { settings = { ...settings, ...storage.load(SETTINGS_KEY, {}) }; };

    // FILTERING 
    const getFilteredAndSortedTasks = () => {
        let filtered = [...tasks];

        // Filter by completed status
        if (!settings.showCompleted) {
            filtered = filtered.filter(t => !t.completed);
        }

        // Filter by tag
        const selectedTag = elements.filterSelect?.value;
        if (selectedTag && selectedTag !== 'all') {
            filtered = filtered.filter(t => t.tag === selectedTag);
        }

        // Search with regex support
        const searchQuery = elements.searchInput?.value.trim();
        if (searchQuery) {
            const caseSensitive = elements.caseSensitiveCheckbox?.checked || false;
            const flags = caseSensitive ? 'g' : 'gi';
            
            try {
                const regex = new RegExp(searchQuery, flags);
                filtered = filtered.filter(t => 
                    regex.test(t.title) || regex.test(t.tag) || regex.test(t.notes || '')
                );
            } catch {
                const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
                filtered = filtered.filter(t => {
                    const title = caseSensitive ? t.title : t.title.toLowerCase();
                    const tag = caseSensitive ? t.tag : t.tag.toLowerCase();
                    const notes = caseSensitive ? (t.notes || '') : (t.notes || '').toLowerCase();
                    return title.includes(query) || tag.includes(query) || notes.includes(query);
                });
            }
        }

        // Sort
        const sortBy = elements.sortSelect?.value || 'dueDate';
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'title': return a.title.localeCompare(b.title);
                case 'duration': return a.duration - b.duration;
                case 'tag': return a.tag.localeCompare(b.tag);
                case 'dueDate':
                default: return new Date(a.dueDate) - new Date(b.dueDate);
            }
        });

        return filtered;
    };

    const highlightText = (text, query) => {
        if (!query) return text;
        try {
            const flags = elements.caseSensitiveCheckbox?.checked ? 'g' : 'gi';
            const regex = new RegExp(`(${query})`, flags);
            return text.replace(regex, '<mark>$1</mark>');
        } catch {
            return text;
        }
    };

    const renderTasks = () => {
        elements.loadingRow?.remove();

        const filtered = getFilteredAndSortedTasks();
        const searchQuery = elements.searchInput?.value.trim();
        const priorityIcons = { low: '', medium: '', high:`` };

        elements.recordsTableBody.innerHTML = '';

        if (filtered.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <p>${tasks.length === 0 ? 'No tasks found. Add your first task below!' : 'No tasks match your search criteria.'}</p>
                    </div>
                </td>
            `;
            elements.recordsTableBody.appendChild(emptyRow);
            return;
        }

        filtered.forEach(task => {
            const tr = document.createElement('tr');
            tr.className = 'task-row';
            
            if (task.completed) {
                tr.style.opacity = '0.6';
                tr.style.textDecoration = 'line-through';
            }

            const title = highlightText(task.title, searchQuery);
            const tag = highlightText(task.tag, searchQuery);

            tr.innerHTML = `
                <td>${title} ${priorityIcons[task.priority] || ''}</td>
                <td>${task.dueDate}</td>
                <td>${task.duration}</td>
                <td><span class="tag-badge">${tag}</span></td>
                <td class="actions-cell">
                    <button class="complete-btn btn-icon-small" data-id="${task.id}" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                        ${task.completed ? '' : ''}
                    </button>
                    <button class="edit-btn btn-icon-small" data-id="${task.id}" title="Edit"></button>
                    <button class="delete-btn btn-icon-small" data-id="${task.id}" title="Delete"></button>
                </td>
            `;
            elements.recordsTableBody.appendChild(tr);
        });

        attachTableEventListeners();
    };

    const attachTableEventListeners = () => {
        document.querySelectorAll('.complete-btn').forEach(btn => 
            btn.addEventListener('click', e => toggleComplete(e.target.dataset.id))
        );
        document.querySelectorAll('.edit-btn').forEach(btn => 
            btn.addEventListener('click', e => startEditTask(e.target.dataset.id))
        );
        document.querySelectorAll('.delete-btn').forEach(btn => 
            btn.addEventListener('click', e => deleteTask(e.target.dataset.id))
        );
    };

    //dashbord
    const updateDashboard = () => {
        if (elements.totalTasks) elements.totalTasks.textContent = tasks.length;
        if (elements.completedTasks) elements.completedTasks.textContent = tasks.filter(t => t.completed).length;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        const upcoming = tasks.filter(t => {
            const due = new Date(t.dueDate);
            return due >= now && due <= nextWeek && !t.completed;
        });

        if (elements.weeklyTasks) elements.weeklyTasks.textContent = upcoming.length;

        if (elements.topTag) {
            const tagCounts = {};
            tasks.forEach(t => tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1);
            const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
            elements.topTag.textContent = sortedTags.length > 0 ? sortedTags[0][0] : 'N/A';
        }

        generateChart();
        updateCapStatus();
    };

    const generateChart = () => {
        if (!elements.chartContainer) return;

        const tagCounts = {};
        tasks.forEach(t => tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1);

        let html = '<div class="chart"><h3>Tasks by Tag</h3>';
        
        if (Object.keys(tagCounts).length === 0) {
            html += '<p style="color:#666;font-style:italic;text-align:center;padding:2rem">No tasks to display</p>';
        } else {
            const maxCount = Math.max(...Object.values(tagCounts));
            for (const [tag, count] of Object.entries(tagCounts)) {
                const percentage = (count / maxCount) * 100;
                html += `
                    <div class="chart-bar">
                        <span class="chart-label">${tag}</span>
                        <div class="chart-bar-fill" style="width:${percentage}%">${count}</div>
                        <span class="chart-value">${count}</span>
                    </div>
                `;
            }
        }
        
        elements.chartContainer.innerHTML = html + '</div>';
    };

    const updateCapStatus = () => {
        if (!elements.capMessage || !elements.capProgressBar) return;

        const cap = settings.taskCap || 20;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        const weeklyTasks = tasks.filter(t => {
            const due = new Date(t.dueDate);
            return due >= now && due <= nextWeek && !t.completed;
        }).length;
        
        const percentage = (weeklyTasks / cap) * 100;
        elements.capProgressBar.style.width = `${Math.min(percentage, 100)}%`;
        
        if (percentage <= 75) {
            elements.capMessage.className = 'cap-message success';
            elements.capMessage.textContent = `You're on track! ${cap - weeklyTasks} tasks remaining.`;
            elements.capProgressBar.className = 'cap-progress-bar';
            elements.capMessage.setAttribute('aria-live', 'polite');
        } else if (percentage <= 100) {
            elements.capMessage.className = 'cap-message warning';
            elements.capMessage.textContent = `Getting close! ${cap - weeklyTasks} tasks remaining.`;
            elements.capProgressBar.className = 'cap-progress-bar warning';
            elements.capMessage.setAttribute('aria-live', 'polite');
        } else {
            elements.capMessage.className = 'cap-message danger';
            elements.capMessage.textContent = ` Over capacity by ${weeklyTasks - cap} tasks!`;
            elements.capProgressBar.className = 'cap-progress-bar danger';
            elements.capMessage.setAttribute('aria-live', 'assertive');
        }
        
        if (elements.capDetails) {
            elements.capDetails.textContent = `Current: ${weeklyTasks} | Cap: ${cap} | ${Math.round(percentage)}%`;
        }
    };

    // TAG MANAGEMENT
    const updateTagSuggestions = () => {
        const tagList = document.getElementById('tag-suggestions');
        if (!tagList) return;

        const uniqueTags = [...new Set(tasks.map(t => t.tag))];
        tagList.innerHTML = '';
        uniqueTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            tagList.appendChild(option);
        });
    };

    const updateFilterDropdown = () => {
        if (!elements.filterSelect) return;

        const uniqueTags = [...new Set(tasks.map(t => t.tag))].sort();
        elements.filterSelect.innerHTML = '<option value="all">All Tags</option>';
        uniqueTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            elements.filterSelect.appendChild(option);
        });
    };

    //TASK OPERATIONS
    const toggleComplete = id => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        
        saveTasks();
        renderTasks();
        updateDashboard();
        showNotification(task.completed ? 'Task marked complete! ' : 'Task marked incomplete.', 'success');
    };

    const startEditTask = id => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        editTaskId = id;
        elements.taskId.value = task.id;
        elements.title.value = task.title;
        elements.dueDate.value = task.dueDate;
        elements.duration.value = task.duration;
        elements.tag.value = task.tag;
        elements.priority.value = task.priority || 'medium';
        elements.notes.value = task.notes || '';
        
        if (elements.notesCount) elements.notesCount.textContent = (task.notes || '').length;
        if (elements.formHeading) elements.formHeading.textContent = ' Edit Task';
        
        document.getElementById('add-form').scrollIntoView({ behavior: 'smooth' });
        elements.title.focus();
    };

    const deleteTask = id => {
        if (!confirm('Delete this task? This cannot be undone.')) return;
        
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateDashboard();
        updateTagSuggestions();
        updateFilterDropdown();
        showNotification('Task deleted.', 'success');
    };

    const resetForm = () => {
        elements.taskForm.reset();
        elements.taskId.value = '';
        editTaskId = null;
        if (elements.formHeading) elements.formHeading.textContent = ' Add New Task';
        if (elements.notesCount) elements.notesCount.textContent = '0';
    };

    //Form Submission Handler
    elements.taskForm.addEventListener('submit', e => {
        e.preventDefault();

        const dueDate = elements.dueDate.value;
        const today = new Date().toISOString().split('T')[0];

        if (dueDate < today && !editTaskId) {
            if (!confirm('This task is due in the past. Add anyway?')) return;
        }

        const newTask = {
            id: editTaskId || generateId(),
            title: elements.title.value.trim(),
            dueDate,
            duration: parseInt(elements.duration.value),
            tag: elements.tag.value.trim(),
            priority: elements.priority.value,
            notes: elements.notes.value.trim(),
            completed: editTaskId ? tasks.find(t => t.id === editTaskId).completed : false,
            createdAt: editTaskId ? tasks.find(t => t.id === editTaskId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const validation = validateTask(newTask);
        if (!validation.isValid) {
            showNotification(validation.message, 'error');
            return;
        }

        if (editTaskId) {
            tasks = tasks.map(t => t.id === editTaskId ? newTask : t);
            showNotification('Task updated! ', 'success');
        } else {
            tasks.push(newTask);
            showNotification('Task created! ', 'success');
        }

        resetForm();
        saveTasks();
        renderTasks();
        updateDashboard();
        updateTagSuggestions();
        updateFilterDropdown();
    });

    elements.searchInput?.addEventListener('input', renderTasks);
    elements.sortSelect?.addEventListener('change', renderTasks);
    elements.filterSelect?.addEventListener('change', renderTasks);
    elements.caseSensitiveCheckbox?.addEventListener('change', renderTasks);
    elements.cancelBtn?.addEventListener('click', resetForm);

    // Settings form handlers
    if (elements.showCompletedCheckbox) {
        elements.showCompletedCheckbox.addEventListener('change', e => {
            settings.showCompleted = e.target.checked;
            saveSettings();
            renderTasks();
            updateDashboard();
        });
    }

    if (elements.defaultDurationInput) {
        elements.defaultDurationInput.addEventListener('change', e => {
            const value = parseInt(e.target.value) || 60;
            if (value < 1 || value > 1440) {
                showNotification('Duration must be 1-1440 minutes.', 'warning');
                return;
            }
            settings.defaultDuration = value;
            saveSettings();
        });
    }

    elements.setCapBtn?.addEventListener('click', () => {
        const newCap = parseInt(elements.taskCapInput.value) || 20;
        if (newCap < 1 || newCap > 100) {
            showNotification('Cap must be 1-100 tasks.', 'warning');
            return;
        }
        settings.taskCap = newCap;
        saveSettings();
        updateCapStatus();
        showNotification(`Cap set to ${newCap} tasks.`, 'success');
    });

    if (elements.minutesInput && elements.hoursInput) {
        elements.minutesInput.addEventListener('input', e => {
            const minutes = parseFloat(e.target.value) || 0;
            elements.hoursInput.value = minutes > 0 ? (minutes / 60).toFixed(2) : '';
        });
        
        elements.hoursInput.addEventListener('input', e => {
            const hours = parseFloat(e.target.value) || 0;
            elements.minutesInput.value = hours > 0 ? Math.round(hours * 60) : '';
        });
    }

    if (elements.notes && elements.notesCount) {
        elements.notes.addEventListener('input', e => {
            elements.notesCount.textContent = e.target.value.length;
            elements.notesCount.style.color = e.target.value.length > 450 ? 'var(--danger)' : '';
        });
    }

    // Data Management
    elements.exportDataBtn?.addEventListener('click', () => {
        const data = { tasks, settings, exportedAt: new Date().toISOString(), version: '1.0.0' };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus-planner-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification(`${tasks.length} tasks exported!`, 'success');
    });

    if (elements.importDataBtn && elements.importFileInput) {
        elements.importDataBtn.addEventListener('click', () => elements.importFileInput.click());
        
        elements.importFileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    const validation = validateImportData(data);
                    
                    if (!validation.isValid) {
                        showNotification(validation.message, 'error');
                        return;
                    }
                    
                    if (confirm(`Import ${data.tasks.length} tasks? Current data will be replaced.`)) {
                        tasks = data.tasks;
                        if (data.settings) settings = { ...settings, ...data.settings };
                        saveTasks();
                        saveSettings();
                        renderTasks();
                        updateDashboard();
                        updateTagSuggestions();
                        updateFilterDropdown();
                        showNotification(`${data.tasks.length} tasks imported! `, 'success');
                    }
                } catch {
                    showNotification('Error reading file.', 'error');
                }
                elements.importFileInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    elements.clearAllDataBtn?.addEventListener('click', () => {
        if (confirm('Delete ALL tasks? This cannot be undone!')) {
            if (confirm('FINAL WARNING: Permanently delete everything?')) {
                tasks = [];
                saveTasks();
                renderTasks();
                updateDashboard();
                updateTagSuggestions();
                updateFilterDropdown();
                showNotification('All data cleared.', 'success');
            }
        }
    });

    elements.notificationClose?.addEventListener('click', () => 
        elements.notificationArea?.classList.add('hidden')
    );

    // Keyboard Shortcuts
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            elements.searchInput?.focus();
            elements.searchInput?.select();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            resetForm();
            document.getElementById('add-form').scrollIntoView({ behavior: 'smooth' });
            elements.title?.focus();
        }

        if (e.key === 'Escape' && editTaskId) {
            resetForm();
            showNotification('Edit cancelled.', 'info');
        }
    });

    // Initialization 
    const init = () => {
        loadSettings();
        loadTasks();
        renderTasks();
        updateDashboard();
        updateTagSuggestions();
        updateFilterDropdown();
        
        // Apply settings to UI
        if (elements.showCompletedCheckbox) elements.showCompletedCheckbox.checked = settings.showCompleted;
        if (elements.defaultDurationInput) elements.defaultDurationInput.value = settings.defaultDuration;
        if (elements.taskCapInput) elements.taskCapInput.value = settings.taskCap || 20;

        console.log(` Campus Life Planner initialized! Loaded ${tasks.length} tasks.`);
    };

    init();
})();
