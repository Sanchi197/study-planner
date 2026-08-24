class CoffeeStudyPlanner {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.completedCount = 0;
        this.coffeeBreaks = 0;
        this.streak = 3; // will be calculated based on activity
        this.coffeeQuotes = [
            "one task at a time, one sip at a time",
            "coffee first, studies later... just kidding, studies WITH coffee",
            "every task completed deserves a coffee break",
            "brew focus, brew success",
            "espresso yourself through studying",
            "good ideas start with coffee",
            "caffeine + concentration = perfection",
            "study grind, coffee grind"
        ];
        
        this.coffeeTips = [
            "finish 3 tasks = coffee break!",
            "try the pomodoro method with coffee intervals",
            "matcha tea also counts as coffee here",
            "cold brew for late night studies",
            "add cinnamon to your coffee for focus",
            "coffee smells improve memory (really!)"
        ];
        
        this.init();
    }
    
    init() {
        this.loadTasks();
        this.render();
        this.setupEventListeners();
        this.updateCoffeeMeter();
        this.updateRandomQuote();
        this.updateCoffeeTip();
        this.updateDeadlines();
        this.calculateStreak();
    }
    
    setupEventListeners() {
        // form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        // sort tasks
        document.getElementById('sortTasks').addEventListener('change', () => {
            this.render();
        });
        
        // listen for storage changes (for cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'coffeeTasks') {
                this.loadTasks();
                this.render();
            }
        });
    }
    
    addTask() {
        // get form values
        const taskName = document.getElementById('taskName').value;
        const taskSubject = document.getElementById('taskSubject').value;
        const taskPriority = document.getElementById('taskPriority').value;
        const taskDeadline = document.getElementById('taskDeadline').value;
        const taskCategory = document.getElementById('taskCategory').value;
        const taskHours = document.getElementById('taskHours').value || 1;
        
        // validate
        if (!taskName || !taskSubject || !taskDeadline) {
            this.showNotification('please fill all fields ☕', 'error');
            return;
        }
        
        // create task object
        const task = {
            id: Date.now(),
            name: taskName,
            subject: taskSubject,
            priority: taskPriority,
            deadline: taskDeadline,
            category: taskCategory,
            hours: parseFloat(taskHours),
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        // add to tasks array
        this.tasks.push(task);
        
        // save and render
        this.saveTasks();
        this.render();
        this.updateDeadlines();
        
        // show success message
        this.showNotification('☕ task brewed successfully!');
        
        // reset form
        document.getElementById('taskForm').reset();
        
        // check if we should show coffee break reminder
        this.checkCoffeeBreakReminder();
    }
    
    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            
            // update counts
            if (task.completed) {
                this.completedCount++;
                this.checkForCoffeeBreak();
            } else {
                this.completedCount--;
            }
            
            this.saveTasks();
            this.render();
            this.updateStats();
            this.updateCoffeeMeter();
            
            // show appropriate message
            if (task.completed) {
                this.showNotification(`✅ great job on "${task.name}"!`);
            }
        }
    }
    
    deleteTask(taskId) {
        if (confirm('sure you want to delete this task? ☕')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.render();
            this.updateStats();
            this.updateCoffeeMeter();
            this.updateDeadlines();
            this.showNotification('task deleted');
        }
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // populate form with task data
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskSubject').value = task.subject;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDeadline').value = task.deadline;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskHours').value = task.hours;
        
        // delete old task (will be replaced when new one is added)
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        
        // scroll to form
        document.querySelector('.order-card').scrollIntoView({ behavior: 'smooth' });
        
        this.showNotification('✏️ editing task...');
    }
    
    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        // apply filter
        switch(this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            default:
                // all tasks
                break;
        }
        
        // apply sorting
        const sortBy = document.getElementById('sortTasks').value;
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'deadline':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'priority':
                    const priorityWeight = { high: 1, medium: 2, low: 3 };
                    return priorityWeight[a.priority] - priorityWeight[b.priority];
                case 'subject':
                    return a.subject.localeCompare(b.subject);
                default:
                    return 0;
            }
        });
        
        return filtered;
    }
    
    render() {
        const container = document.getElementById('tasksContainer');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mug-hot"></i>
                    <h3>no tasks brewing</h3>
                    <p>add your first task above ☕</p>
                </div>
            `;
        } else {
            container.innerHTML = filteredTasks.map(task => `
                <div class="task-card" data-priority="${task.priority}" data-id="${task.id}">
                    <div class="task-header">
                        <h3 class="task-title">${this.escapeHtml(task.name)}</h3>
                        <span class="task-priority-badge priority-${task.priority}">
                            ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                            ${task.priority}
                        </span>
                    </div>
                    
                    <div class="task-subject">
                        <i class="fas fa-book"></i>
                        ${this.escapeHtml(task.subject)}
                    </div>
                    
                    <div class="task-deadline">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(task.deadline)}
                        ${this.getDeadlineStatus(task.deadline)}
                    </div>
                    
                    <div class="task-category">
                        ${this.getCategoryIcon(task.category)} ${task.category}
                    </div>
                    
                    <div class="task-meta">
                        <span><i class="fas fa-clock"></i> ${task.hours}h est.</span>
                    </div>
                    
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="task-btn complete-btn" onclick="planner.toggleComplete(${task.id})">
                                <i class="fas fa-check"></i> complete
                            </button>
                        ` : `
                            <button class="task-btn complete-btn" onclick="planner.toggleComplete(${task.id})">
                                <i class="fas fa-undo"></i> undo
                            </button>
                        `}
                        
                        <button class="task-btn edit-btn" onclick="planner.editTask(${task.id})">
                            <i class="fas fa-pen"></i> edit
                        </button>
                        
                        <button class="task-btn delete-btn" onclick="planner.deleteTask(${task.id})">
                            <i class="fas fa-trash"></i> delete
                        </button>
                    </div>
                    
                    ${task.completed ? `
                        <div class="completed-badge">
                            <i class="fas fa-check-circle"></i> done ${this.timeAgo(task.completedAt)}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
        
        // update stats after render
        this.updateStats();
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        // update sidebar stats
        document.getElementById('totalTasksStat').textContent = total;
        document.getElementById('completedTasksStat').textContent = completed;
        
        // update progress
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        document.getElementById('coffeeMeter').style.width = percentage + '%';
        document.getElementById('coffeePercent').textContent = percentage + '%';
        
        // update streak display
        document.getElementById('streakDisplay').textContent = this.streak;
    }
    
    updateCoffeeMeter() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        document.getElementById('coffeeMeter').style.width = percentage + '%';
        document.getElementById('coffeePercent').textContent = percentage + '%';
    }
    
    updateDeadlines() {
        const deadlinesContainer = document.getElementById('upcomingDeadlines');
        const now = new Date();
        const upcoming = this.tasks
            .filter(t => !t.completed)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 3);
        
        if (upcoming.length === 0) {
            deadlinesContainer.innerHTML = '<p class="no-deadlines">no upcoming deadlines ✨</p>';
            return;
        }
        
        deadlinesContainer.innerHTML = upcoming.map(task => {
            const daysUntil = this.daysUntil(task.deadline);
            const isUrgent = daysUntil <= 2;
            
            return `
                <div class="deadline-item ${isUrgent ? 'urgent' : ''}">
                    <div class="task-name">${this.escapeHtml(task.name)}</div>
                    <div class="task-date">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(task.deadline)}
                        ${daysUntil === 0 ? '(today!)' : 
                          daysUntil === 1 ? '(tomorrow!)' : 
                          `(${daysUntil} days)`}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.coffeeQuotes.length);
        document.getElementById('motivationPhrase').textContent = this.coffeeQuotes[randomIndex];
    }
    
    updateCoffeeTip() {
        const randomIndex = Math.floor(Math.random() * this.coffeeTips.length);
        document.getElementById('coffeeTip').textContent = this.coffeeTips[randomIndex];
    }
    
    checkForCoffeeBreak() {
        const completedToday = this.tasks.filter(t => {
            if (!t.completedAt) return false;
            const completedDate = new Date(t.completedAt).toDateString();
            const today = new Date().toDateString();
            return completedDate === today;
        }).length;
        
        // every 3 completed tasks = coffee break
        if (completedToday > 0 && completedToday % 3 === 0) {
            this.coffeeBreaks++;
            this.showCoffeeBreakModal();
        }
    }
    
    checkCoffeeBreakReminder() {
        const pendingTasks = this.tasks.filter(t => !t.completed).length;
        if (pendingTasks > 5) {
            this.showNotification('☕ reminder: take coffee breaks while studying!');
        }
    }
    
    showCoffeeBreakModal() {
        const modal = document.getElementById('coffeeBreakModal');
        if (modal) {
            modal.classList.add('show');
            
            // auto-hide after 5 seconds
            setTimeout(() => {
                modal.classList.remove('show');
            }, 5000);
        }
    }
    
    calculateStreak() {
        // calculate streak based on task completion history
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        const completedToday = this.tasks.some(t => {
            if (!t.completedAt) return false;
            return new Date(t.completedAt).toDateString() === today;
        });
        
        const completedYesterday = this.tasks.some(t => {
            if (!t.completedAt) return false;
            return new Date(t.completedAt).toDateString() === yesterday;
        });
        
        if (completedToday) {
            if (completedYesterday) {
                // streak continues
                this.streak++;
            } else {
                // new streak
                this.streak = 1;
            }
        } else {
            // streak might be broken, but we keep it for now
            // actual streak logic would need more data
        }
        
        // cap streak at reasonable number
        this.streak = Math.min(this.streak, 365);
    }
    
    saveTasks() {
        localStorage.setItem('coffeeTasks', JSON.stringify(this.tasks));
        localStorage.setItem('coffeeStats', JSON.stringify({
            completedCount: this.completedCount,
            coffeeBreaks: this.coffeeBreaks,
            streak: this.streak
        }));
    }
    
    loadTasks() {
        const saved = localStorage.getItem('coffeeTasks');
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                this.tasks = [];
            }
        }
        
        const stats = localStorage.getItem('coffeeStats');
        if (stats) {
            try {
                const parsed = JSON.parse(stats);
                this.completedCount = parsed.completedCount || 0;
                this.coffeeBreaks = parsed.coffeeBreaks || 0;
                this.streak = parsed.streak || 0;
            } catch (e) {
                // ignore
            }
        }
    }
    
    showNotification(message, type = 'success') {
        // create notification element
        const notification = document.createElement('div');
        notification.className = `coffee-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // style it
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = type === 'success' ? 'linear-gradient(135deg, var(--caramel), var(--cinnamon))' : '#f44336';
        notification.style.color = 'white';
        notification.style.padding = '1rem 1.5rem';
        notification.style.borderRadius = '50px';
        notification.style.boxShadow = '0 5px 20px rgba(0,0,0,0.2)';
        notification.style.zIndex = '2000';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '0.5rem';
        notification.style.animation = 'slideIn 0.3s ease';
        notification.style.fontWeight = '500';
        
        document.body.appendChild(notification);
        
        // remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // helper methods
    formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    daysUntil(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const deadline = new Date(dateString);
        deadline.setHours(0, 0, 0, 0);
        
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    getDeadlineStatus(dateString) {
        const days = this.daysUntil(dateString);
        
        if (days < 0) {
            return '<span class="deadline-overdue">(overdue!)</span>';
        } else if (days === 0) {
            return '<span class="deadline-today">(today!)</span>';
        } else if (days === 1) {
            return '<span class="deadline-tomorrow">(tomorrow!)</span>';
        } else if (days <= 3) {
            return '<span class="deadline-soon">(soon!)</span>';
        }
        return '';
    }
    
    getCategoryIcon(category) {
        const icons = {
            exam: '📝',
            assignment: '📚',
            reading: '📖',
            project: '💻',
            default: '📌'
        };
        return icons[category] || icons.default;
    }
    
    timeAgo(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// initialize the planner
const planner = new CoffeeStudyPlanner();

// modal close function
function closeCoffeeModal() {
    document.getElementById('coffeeBreakModal').classList.remove('show');
}

// add animation styles if not already present
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .deadline-overdue {
        color: #f44336;
        font-size: 0.8rem;
        margin-left: 0.3rem;
    }
    
    .deadline-today {
        color: #ff9800;
        font-size: 0.8rem;
        margin-left: 0.3rem;
    }
    
    .deadline-tomorrow {
        color: #ffc107;
        font-size: 0.8rem;
        margin-left: 0.3rem;
    }
    
    .deadline-soon {
        color: #2196f3;
        font-size: 0.8rem;
        margin-left: 0.3rem;
    }
    
    .completed-badge {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px dashed var(--caramel);
        font-size: 0.8rem;
        color: #4caf50;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    
    .edit-btn {
        background: rgba(33, 150, 243, 0.1);
        color: #1976d2;
    }
    
    .edit-btn:hover {
        background: #1976d2;
        color: white;
    }
`;
document.head.appendChild(style);