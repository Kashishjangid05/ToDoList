// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userNameDisplay = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const confirmModal = document.getElementById('confirm-modal');
const categoryModal = document.getElementById('category-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
const cancelCategoryBtn = document.getElementById('cancel-category-btn');
const confirmActionBtn = document.getElementById('confirm-action-btn');
const taskForm = document.getElementById('task-form');
const categoryForm = document.getElementById('category-form');
const tasksList = document.getElementById('tasks-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const filterLinks = document.querySelectorAll('[data-filter]');
const categoryLinks = document.querySelectorAll('[data-category]');
const taskTemplate = document.getElementById('task-template');

// App State
const state = {
    user: null,
    tasks: [],
    categories: [
        { id: 'work', name: 'Work', icon: 'fas fa-briefcase' },
        { id: 'personal', name: 'Personal', icon: 'fas fa-user' },
        { id: 'urgent', name: 'Urgent', icon: 'fas fa-exclamation-circle' }
    ],
    currentFilter: 'all',
    currentCategory: null,
    currentSort: 'priority',
    searchQuery: '',
    editingTask: null,
    deletingTask: null,
    darkMode: false
};

// Pastel color palette for task backgrounds
const PASTEL_PALETTE = ['#696FC7', '#A7AAE1', '#F5D3C4', '#F2AEBB'];

function pickRandomPastel() {
    return PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
}

function getContrastColor(hex) {
    // Convert hex to RGB and compute relative luminance to choose black/white text
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0,2), 16) / 255;
    const g = parseInt(h.substring(2,4), 16) / 255;
    const b = parseInt(h.substring(4,6), 16) / 255;

    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.6 ? '#212529' : '#ffffff';
}

// Simple toast helper for showing small messages
function showToast(message, options = {}) {
    const { duration = 3000, type = 'success', actionText, action } = options;
    const toast = document.createElement('div');
    toast.className = `tm-toast tm-toast-${type}`;

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    let timeoutId = null;

    if (actionText && typeof action === 'function') {
        const btn = document.createElement('button');
        btn.className = 'tm-toast-btn';
        btn.textContent = actionText;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // prevent the auto-dismiss behavior and run action
            if (timeoutId) clearTimeout(timeoutId);
            try { action(); } catch (err) { console.error('Toast action error:', err); }
            // hide toast with transition
            toast.classList.remove('tm-toast-show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        });
        toast.appendChild(btn);
    }

    document.body.appendChild(toast);

    // Force reflow to enable animation
    // eslint-disable-next-line no-unused-expressions
    toast.offsetHeight;

    toast.classList.add('tm-toast-show');

    timeoutId = setTimeout(() => {
        toast.classList.remove('tm-toast-show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    }, duration);
}

// Global runtime error handlers to surface issues in UI and console
window.addEventListener('error', (e) => {
    try {
        console.error('Runtime error:', e.error || e.message, e);
        showToast(`Error: ${e.message || (e.error && e.error.message) || 'Unknown'}`, { duration: 8000, type: 'error' });
    } catch (err) {
        console.error('Error in error handler:', err);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    try {
        console.error('Unhandled promise rejection:', e.reason);
        const msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
        showToast(`Unhandled: ${msg}`, { duration: 8000, type: 'error' });
    } catch (err) {
        console.error('Error in rejection handler:', err);
    }
});

// API Endpoints (to be replaced with actual backend endpoints)
const API = {
    // Authentication
    register: async (userData) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    id: Date.now().toString(),
                    name: userData.name,
                    email: userData.email
                };
                localStorage.setItem('user', JSON.stringify(user));
                resolve(user);
            }, 500);
        });
    },
    login: async (credentials) => {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // For demo purposes, accept any credentials
                const user = {
                    id: Date.now().toString(),
                    name: credentials.email.split('@')[0],
                    email: credentials.email
                };
                localStorage.setItem('user', JSON.stringify(user));
                resolve(user);
            }, 500);
        });
    },
    logout: async () => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem('user');
                resolve(true);
            }, 200);
        });
    },

    // Tasks
    getTasks: async (userId) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                resolve(tasks.filter(task => task.userId === userId));
            }, 300);
        });
    },
    createTask: async (taskData) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const newTask = {
                    id: Date.now().toString(),
                    ...taskData,
                    createdAt: new Date().toISOString(),
                    completed: false
                };
                tasks.push(newTask);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                resolve(newTask);
            }, 300);
        });
    },
    updateTask: async (taskId, taskData) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const taskIndex = tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    resolve(tasks[taskIndex]);
                }
            }, 300);
        });
    },
    deleteTask: async (taskId) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const updatedTasks = tasks.filter(task => task.id !== taskId);
                localStorage.setItem('tasks', JSON.stringify(updatedTasks));
                resolve(true);
            }, 300);
        });
    },

    // Categories
    getCategories: async (userId) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const categories = JSON.parse(localStorage.getItem('categories') || '[]');
                resolve([...state.categories, ...categories.filter(cat => cat.userId === userId)]);
            }, 300);
        });
    },
    createCategory: async (categoryData) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const categories = JSON.parse(localStorage.getItem('categories') || '[]');
                const newCategory = {
                    id: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                    ...categoryData
                };
                categories.push(newCategory);
                localStorage.setItem('categories', JSON.stringify(categories));
                resolve(newCategory);
            }, 300);
        });
    }
};

// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        state.darkMode = true;
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    state.darkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', state.darkMode);
    
    if (state.darkMode) {
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

// Authentication
function initAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        showApp();
        loadUserData();
    }
}

function showAuth() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function showApp() {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userNameDisplay.textContent = state.user.name;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const user = await API.login({ email, password });
        state.user = user;
        showApp();
        loadUserData();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        const user = await API.register({ name, email, password });
        state.user = user;
        showApp();
        loadUserData();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function handleLogout() {
    try {
        await API.logout();
        state.user = null;
        state.tasks = [];
        showAuth();
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Task Management
async function loadUserData() {
    try {
        // Load tasks
        state.tasks = await API.getTasks(state.user.id);
        renderTasks();
        
        // Load categories
        state.categories = await API.getCategories(state.user.id);
        renderCategories();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function renderTasks() {
    tasksList.innerHTML = '';
    
    // Filter tasks
    let filteredTasks = state.tasks;
    
    if (state.currentFilter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (state.currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    if (state.currentCategory) {
        filteredTasks = filteredTasks.filter(task => task.category === state.currentCategory);
    }
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(query) || 
            (task.description && task.description.toLowerCase().includes(query))
        );
    }
    
    // Sort tasks
    filteredTasks.sort((a, b) => {
        if (state.currentSort === 'priority') {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        } else if (state.currentSort === 'dueDate') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (state.currentSort === 'creationTime') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });
    
    // Render tasks
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
    
    if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-tasks-message';
        emptyMessage.textContent = 'No tasks found';
        tasksList.appendChild(emptyMessage);
    }

    // After rendering, check for overdue tasks and mark them / notify the user
    checkOverdueTasks();
}

// Track which overdue tasks we've already notified about to avoid repeated toasts
let overdueNotified = new Set();

function checkOverdueTasks() {
    try {
        const now = new Date();
        const overdue = state.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now);
        const overdueIds = new Set(overdue.map(t => t.id));

        // Newly overdue tasks (not yet notified)
        const newly = overdue.filter(t => !overdueNotified.has(t.id));

        // Clean notified set to only keep currently overdue ids
        overdueNotified = new Set(Array.from(overdueNotified).filter(id => overdueIds.has(id)));

        if (newly.length > 0) {
            newly.forEach(t => overdueNotified.add(t.id));
            const titles = newly.map(t => t.title || 'Untitled').slice(0, 5);
            const msg = newly.length === 1 ? `You have 1 overdue task: ${titles[0]}` : `You have ${newly.length} overdue tasks: ${titles.join(', ')}${newly.length > 5 ? '...' : ''}`;
            showToast(msg, {
                duration: 8000,
                type: 'warning',
                actionText: 'View',
                action: () => {
                    // Scroll to tasks list
                    const rect = tasksList.getBoundingClientRect();
                    window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'smooth' });
                }
            });
        }
    } catch (err) {
        console.error('Error checking overdue tasks:', err);
    }
}

function createTaskElement(task) {
    const taskClone = document.importNode(taskTemplate.content, true);
    const taskItem = taskClone.querySelector('.task-item');
    
    taskItem.dataset.id = task.id;
    if (task.completed) {
        taskItem.classList.add('completed');
    }
    
    const checkbox = taskClone.querySelector('.task-complete-checkbox');
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id, checkbox.checked));
    
    taskClone.querySelector('.task-title').textContent = task.title;
    
    const priorityElement = taskClone.querySelector('.task-priority');
    priorityElement.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    priorityElement.classList.add(task.priority);
    
    const descriptionElement = taskClone.querySelector('.task-description');
    descriptionElement.textContent = task.description || '';
    
    const categoryElement = taskClone.querySelector('.task-category');
    const category = state.categories.find(cat => cat.id === task.category);
    if (category) {
        categoryElement.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
    }
    
    const dueDateElement = taskClone.querySelector('.task-due-date');
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        dueDateElement.innerHTML = `<i class="fas fa-calendar"></i> ${date.toLocaleDateString()}`;
    }
    
    const editBtn = taskClone.querySelector('.task-edit-btn');
    editBtn.addEventListener('click', () => openEditTaskModal(task));
    
    const deleteBtn = taskClone.querySelector('.task-delete-btn');
    deleteBtn.addEventListener('click', () => openDeleteConfirmation(task));
    
    // Apply background color if task has one (set when created)
    if (task.color) {
        taskItem.style.backgroundColor = task.color;
        const contrast = getContrastColor(task.color);
        // Apply contrast color to title/description/meta so text remains readable
        const titleEl = taskClone.querySelector('.task-title');
        const descEl = taskClone.querySelector('.task-description');
        const metaEls = taskClone.querySelectorAll('.task-meta, .task-category, .task-due-date');
        titleEl.style.color = contrast;
        descEl.style.color = contrast;
        metaEls.forEach(el => el.style.color = contrast);
    }

    // Mark overdue tasks visually and add a badge
    try {
        if (!task.completed && task.dueDate) {
            const due = new Date(task.dueDate);
            const now = new Date();
            if (due < now) {
                taskItem.classList.add('overdue');
                const meta = taskClone.querySelector('.task-meta');
                const badge = document.createElement('span');
                badge.className = 'task-overdue-badge';
                badge.textContent = 'Overdue';
                meta.appendChild(badge);
                // ensure badge uses contrast if color set
                if (task.color) {
                    const contrast = getContrastColor(task.color);
                    badge.style.color = contrast;
                    badge.style.borderColor = contrast + '33';
                }
            }
        }
    } catch (err) {
        console.error('Error marking overdue task:', err);
    }

    return taskItem;
}

async function toggleTaskComplete(taskId, completed) {
    try {
        // find previous state so we can detect transition to completed
        const taskIndex = state.tasks.findIndex(task => task.id === taskId);
        const prevCompleted = taskIndex !== -1 ? state.tasks[taskIndex].completed : false;
        const taskSnapshot = taskIndex !== -1 ? { ...state.tasks[taskIndex] } : null;

        await API.updateTask(taskId, { completed });

        // Update local state (mark completed)
        if (taskIndex !== -1) {
            state.tasks[taskIndex].completed = completed;
        }

        renderTasks();

        // If task was just marked completed by the user, remove it from the desktop view
        // and show a toast with an Undo button to restore it
        if (!prevCompleted && completed && taskSnapshot) {
            // remove the task from the visible list
            const removeIndex = state.tasks.findIndex(t => t.id === taskId);
            // Use splice result as the removed task reference
            const removed = removeIndex !== -1 ? state.tasks.splice(removeIndex, 1)[0] : taskSnapshot;
            renderTasks();

            // Undo handler
            const undo = async () => {
                try {
                    await API.updateTask(taskId, { completed: false });
                    // restore the task to the front of list
                    state.tasks.unshift(removed);
                    renderTasks();
                    showToast('Task restored', { duration: 2000, type: 'success' });
                } catch (err) {
                    console.error('Error restoring task:', err);
                    showToast('Failed to restore task', { duration: 2500, type: 'error' });
                }
            };

            showToast(`Yayy!! You have completed "${removed.title}"`, { duration: 5000, type: 'success', actionText: 'Undo', action: undo });
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

function openAddTaskModal() {
    document.getElementById('modal-title').textContent = 'Add New Task';
    document.getElementById('task-id').value = '';
    taskForm.reset();
    state.editingTask = null;
    
    // Set default values
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-due-date').valueAsDate = new Date(Date.now() + 86400000); // Tomorrow
    
    // Update category options
    updateCategoryOptions();
    
    taskModal.classList.add('active');
}

function openEditTaskModal(task) {
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-category').value = task.category;
    
    if (task.dueDate) {
        document.getElementById('task-due-date').value = task.dueDate.split('T')[0];
    }
    
    state.editingTask = task;
    
    // Update category options
    updateCategoryOptions();
    
    taskModal.classList.add('active');
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('task-category');
    categorySelect.innerHTML = '';
    
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

function closeTaskModal() {
    taskModal.classList.remove('active');
}

async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const dueDate = document.getElementById('task-due-date').value;
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;
    
    const taskData = {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        category,
        userId: state.user.id
    };
    
    try {
        if (taskId) {
            // Update existing task
            const updatedTask = await API.updateTask(taskId, taskData);
            const taskIndex = state.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                state.tasks[taskIndex] = updatedTask;
            }
        } else {
            // Create new task
            // assign a random pastel color for the task background
            taskData.color = pickRandomPastel();
            const newTask = await API.createTask(taskData);
            state.tasks.push(newTask);
        }
        
        closeTaskModal();
        renderTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Please try again.');
    }
}

function openDeleteConfirmation(task) {
    state.deletingTask = task;
    document.getElementById('confirm-message').textContent = `Are you sure you want to delete "${task.title}"?`;
    confirmModal.classList.add('active');
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
    state.deletingTask = null;
}

async function handleDeleteTask() {
    if (!state.deletingTask) return;
    
    try {
        await API.deleteTask(state.deletingTask.id);
        state.tasks = state.tasks.filter(task => task.id !== state.deletingTask.id);
        closeConfirmModal();
        renderTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
    }
}

// Category Management
function renderCategories() {
    const categoryList = document.getElementById('category-list');
    // Keep only the "Add Category" item
    categoryList.innerHTML = '';
    
    state.categories.forEach(category => {
        if (category.id !== 'add') {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-category="${category.id}"><i class="${category.icon}"></i> ${category.name}</a>`;
            li.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                filterByCategory(category.id);
            });
            categoryList.appendChild(li);
        }
    });
    
    // Add the "Add Category" item
    const addCategoryLi = document.createElement('li');
    addCategoryLi.innerHTML = '<a href="#" data-category="add"><i class="fas fa-plus"></i> Add Category</a>';
    addCategoryLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        openCategoryModal();
    });
    categoryList.appendChild(addCategoryLi);
    
    // Update category options in task form
    updateCategoryOptions();
}

function openCategoryModal() {
    categoryForm.reset();
    categoryModal.classList.add('active');
}

function closeCategoryModal() {
    categoryModal.classList.remove('active');
}

async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value;
    const icon = document.getElementById('category-icon').value;
    
    try {
        const newCategory = await API.createCategory({
            name,
            icon,
            userId: state.user.id
        });
        
        state.categories.push(newCategory);
        closeCategoryModal();
        renderCategories();
    } catch (error) {
        console.error('Error creating category:', error);
        alert('Failed to create category. Please try again.');
    }
}

// Filtering and Sorting
function filterByStatus(status) {
    state.currentFilter = status;
    state.currentCategory = null;
    
    // Update active class
    filterLinks.forEach(link => {
        if (link.dataset.filter === status) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
    
    renderTasks();
}

function filterByCategory(categoryId) {
    state.currentCategory = categoryId;
    
    // Update active class
    categoryLinks.forEach(link => {
        if (link.dataset.category === categoryId) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
    
    renderTasks();
}

function handleSearch() {
    state.searchQuery = searchInput.value.trim();
    renderTasks();
}

function handleSort() {
    state.currentSort = sortSelect.value;
    renderTasks();
}

// Event Listeners
function initEventListeners() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => {
                if (form.id === `${tabId}-form`) {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });
        });
    });
    
    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Task management
    addTaskBtn.addEventListener('click', openAddTaskModal);
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    
    // Category management
    categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    
    // Confirmation modal
    cancelConfirmBtn.addEventListener('click', closeConfirmModal);
    confirmActionBtn.addEventListener('click', handleDeleteTask);
    
    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskModal.classList.remove('active');
            confirmModal.classList.remove('active');
            categoryModal.classList.remove('active');
        });
    });
    
    // Filtering and sorting
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterByStatus(link.dataset.filter);
        });
    });
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.dataset.category === 'add') {
                openCategoryModal();
            } else {
                filterByCategory(link.dataset.category);
            }
        });
    });
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    sortSelect.addEventListener('change', handleSort);
}

// Initialize App
function initApp() {
    initTheme();
    initAuth();
    initEventListeners();
    // Periodically check overdue tasks (every minute)
    setInterval(checkOverdueTasks, 60 * 1000);
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);