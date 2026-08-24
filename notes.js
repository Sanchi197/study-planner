class CoffeeNotes {
    constructor() {
        this.notes = [];
        this.currentCategory = 'all';
        this.currentNote = null;
        this.searchTerm = '';
        this.wordCount = 0;
        this.coffeeReminderThreshold = 500;
        
        this.categories = {
            lecture: { icon: '📝', color: '#2196f3' },
            summary: { icon: '📚', color: '#4caf50' },
            ideas: { icon: '💡', color: '#ff9800' },
            todo: { icon: '✅', color: '#f44336' }
        };
        
        this.init();
    }
    
    init() {
        console.log('📝 Notes initializing...');
        this.loadNotes();
        console.log('📂 Loaded notes:', this.notes.length);
        this.render();
        this.setupEventListeners();
        this.updateStats();
        this.generateTags();
    }
    
    setupEventListeners() {
        document.getElementById('newNoteBtn').addEventListener('click', () => {
            this.createNewNote();
        });
        
        document.querySelectorAll('.notebook-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.notebook-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentCategory = item.dataset.category;
                this.render();
            });
        });
        
        document.getElementById('searchNotes').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });
        
        document.getElementById('sortNotes').addEventListener('change', () => {
            this.render();
        });
        
        document.getElementById('saveNote').addEventListener('click', () => {
            this.saveNote();
        });
        
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.formatText(btn.dataset.command);
            });
        });
        
        document.getElementById('noteContent').addEventListener('input', () => {
            this.updateWordCount();
        });
    }
    
    createNewNote() {
        this.currentNote = {
            id: Date.now(),
            title: '',
            content: '',
            category: 'lecture',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: []
        };
        
        document.getElementById('notesView').classList.add('hidden');
        document.getElementById('noteEditor').classList.remove('hidden');
        
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').innerHTML = '';
        document.getElementById('noteCategory').value = 'lecture';
        
        this.updateWordCount();
    }
    
    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        this.currentNote = { ...note };
        
        document.getElementById('noteTitle').value = this.currentNote.title;
        document.getElementById('noteContent').innerHTML = this.currentNote.content;
        document.getElementById('noteCategory').value = this.currentNote.category;
        
        document.getElementById('notesView').classList.add('hidden');
        document.getElementById('noteEditor').classList.remove('hidden');
        
        this.updateWordCount();
    }
    
    saveNote() {
    console.log('💾 Saving note...');
    console.log('🔍 Current notes before save:', this.notes.length);
    
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').innerHTML;
    const category = document.getElementById('noteCategory').value;
    
    if (!title) {
        this.showNotification('please add a title ☕', 'error');
        return;
    }
    
    const now = new Date().toISOString();
    const tags = this.extractTags(content);
    
    // Check if we're editing an existing note
    if (this.currentNote && this.currentNote.id) {
        console.log('✏️ Attempting to update note ID:', this.currentNote.id);
        
        // Check if this ID exists in notes array
        const exists = this.notes.some(n => n.id === this.currentNote.id);
        console.log('🔍 Does note exist in array?', exists);
        
        if (exists) {
            // Update by mapping
            this.notes = this.notes.map(n => {
                if (n.id === this.currentNote.id) {
                    return {
                        ...n,
                        title: title,
                        content: content,
                        category: category,
                        updatedAt: now,
                        tags: tags
                    };
                }
                return n;
            });
            console.log('✅ Updated existing note using map');
        } else {
            // ID doesn't exist - treat as new note
            console.log('⚠️ Note ID not found, creating as new');
            const newNote = {
                id: Date.now(), // Generate NEW ID
                title: title,
                content: content,
                category: category,
                createdAt: now,
                updatedAt: now,
                tags: tags
            };
            this.notes.push(newNote);
            console.log('➕ Created as new note with ID:', newNote.id);
        }
    } else {
        // CREATE NEW NOTE
        console.log('➕ Creating brand new note');
        const newNote = {
            id: Date.now(),
            title: title,
            content: content,
            category: category,
            createdAt: now,
            updatedAt: now,
            tags: tags
        };
        this.notes.push(newNote);
        console.log('✅ New note added. ID:', newNote.id);
    }
    
    console.log('📊 Notes count after modification:', this.notes.length);
    
    // Save to localStorage
    console.log('💾 Saving to localStorage...');
    localStorage.setItem('coffeeNotes', JSON.stringify(this.notes));
    
    // Verify save
    const saved = localStorage.getItem('coffeeNotes');
    const parsed = JSON.parse(saved);
    console.log('✅ Verified saved notes count:', parsed.length);
    
    // Clear editor state
    this.currentNote = null;
    document.getElementById('notesView').classList.remove('hidden');
    document.getElementById('noteEditor').classList.add('hidden');
    
    // Force render
    this.render();
    
    this.showNotification('✍️ note saved!');
    
    if (this.wordCount >= this.coffeeReminderThreshold) {
        this.showCoffeeReminder();
    }
}
    cancelEdit() {
        this.currentNote = null;
        document.getElementById('notesView').classList.remove('hidden');
        document.getElementById('noteEditor').classList.add('hidden');
        this.render();
    }
    
    deleteNote(noteId) {
        if (confirm('delete this note? ☕')) {
            this.notes = this.notes.filter(n => n.id !== noteId);
            localStorage.setItem('coffeeNotes', JSON.stringify(this.notes));
            this.render();
            this.showNotification('note deleted');
        }
    }
    
    formatText(command) {
        document.execCommand(command, false, null);
        document.getElementById('noteContent').focus();
    }
    
    extractTags(content) {
        const tagRegex = /#(\w+)/g;
        const matches = content.match(tagRegex);
        return matches ? matches.map(t => t.substring(1)) : [];
    }
    
    updateWordCount() {
        const content = document.getElementById('noteContent').innerText || '';
        const words = content.trim().split(/\s+/).filter(w => w.length > 0);
        this.wordCount = words.length;
        const chars = content.length;
        
        document.getElementById('wordCount').textContent = `${this.wordCount} words`;
        document.getElementById('charCount').textContent = `${chars} characters`;
        
        const tip = document.getElementById('typingTip');
        if (this.wordCount > 300) {
            tip.textContent = 'you\'re on fire! 🔥';
        } else if (this.wordCount > 100) {
            tip.textContent = 'great progress! ☕';
        } else {
            tip.textContent = 'writing makes you thirsty...';
        }
    }
    
    getFilteredNotes() {
        return [...this.notes]; // Simplified for now
    }
    
    render() {
        console.log('🎨 Rendering notes...');
        const container = document.getElementById('notesView');
        const filtered = this.getFilteredNotes();
        console.log('📊 Notes to render:', filtered.length);
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-notes">
                    <i class="fas fa-feather"></i>
                    <h3>no notes yet</h3>
                    <p>brew your first note ☕</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="notes-grid">
                    ${filtered.map(note => this.renderNoteCard(note)).join('')}
                </div>
            `;
        }
        
        this.updateStats();
        this.updateRecentNotes();
        this.generateTags();
    }
    
    renderNoteCard(note) {
        const preview = note.content.replace(/<[^>]*>/g, '').substring(0, 100);
        const date = new Date(note.updatedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        return `
            <div class="note-card" data-category="${note.category}" onclick="notes.editNote(${note.id})">
                <span class="note-category">
                    ${this.categories[note.category]?.icon || '📌'} ${note.category}
                </span>
                <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                <p class="note-preview">${this.escapeHtml(preview)}${preview.length === 100 ? '...' : ''}</p>
                <div class="note-footer">
                    <span class="note-date">
                        <i class="fas fa-clock"></i> ${date}
                    </span>
                    <div class="note-tags">
                        ${note.tags.slice(0, 2).map(t => 
                            `<span class="note-tag">#${t}</span>`
                        ).join('')}
                        ${note.tags.length > 2 ? `<span class="note-tag">+${note.tags.length-2}</span>` : ''}
                    </div>
                </div>
                <button class="delete-note-btn" onclick="event.stopPropagation(); notes.deleteNote(${note.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    updateStats() {
        const counts = {
            all: this.notes.length,
            lecture: this.notes.filter(n => n.category === 'lecture').length,
            summary: this.notes.filter(n => n.category === 'summary').length,
            ideas: this.notes.filter(n => n.category === 'ideas').length,
            todo: this.notes.filter(n => n.category === 'todo').length
        };
        
        document.getElementById('allCount').textContent = counts.all;
        document.getElementById('lectureCount').textContent = counts.lecture;
        document.getElementById('summaryCount').textContent = counts.summary;
        document.getElementById('ideasCount').textContent = counts.ideas;
        document.getElementById('todoCount').textContent = counts.todo;
    }
    
    updateRecentNotes() {
        const recent = this.notes
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 3);
        
        const container = document.getElementById('recentNotes');
        
        if (recent.length === 0) {
            container.innerHTML = '<div class="recent-note-item">no recent notes</div>';
            return;
        }
        
        container.innerHTML = recent.map(note => {
            const date = new Date(note.updatedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="recent-note-item" onclick="notes.editNote(${note.id})">
                    <div class="recent-note-title">${this.escapeHtml(note.title)}</div>
                    <div class="recent-note-meta">
                        <span>${this.categories[note.category]?.icon || '📌'}</span>
                        <span>${date}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    generateTags() {
        const allTags = new Set();
        this.notes.forEach(note => {
            note.tags.forEach(tag => allTags.add(tag));
        });
        
        const container = document.getElementById('tagCloud');
        
        if (allTags.size === 0) {
            container.innerHTML = '<span class="tag-item">no tags yet</span>';
            return;
        }
        
        container.innerHTML = Array.from(allTags).slice(0, 10).map(tag => `
            <span class="tag-item" onclick="notes.searchTag('${tag}')">
                #${tag}
            </span>
        `).join('');
    }
    
    searchTag(tag) {
        document.getElementById('searchNotes').value = tag;
        this.searchTerm = tag;
        this.render();
    }
    
    showCoffeeReminder() {
        const modal = document.getElementById('coffeeNoteModal');
        modal.classList.add('show');
        
        setTimeout(() => {
            modal.classList.remove('show');
        }, 5000);
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = type === 'success' ? 
            'linear-gradient(135deg, var(--caramel), var(--cinnamon))' : '#f44336';
        notification.style.color = 'white';
        notification.style.padding = '1rem 1.5rem';
        notification.style.borderRadius = '50px';
        notification.style.zIndex = '2000';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '0.5rem';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // REMOVED saveNotes() - we're saving directly now
    
    loadNotes() {
        const saved = localStorage.getItem('coffeeNotes');
        console.log('📂 Raw localStorage:', saved);
        if (saved) {
            try {
                this.notes = JSON.parse(saved);
                console.log('✅ Parsed notes:', this.notes.length);
            } catch (e) {
                console.log('❌ Error parsing:', e);
                this.notes = [];
            }
        } else {
            console.log('📂 No saved notes found');
            this.notes = [];
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// initialize
console.log('🔥 Starting notes app...');
const notes = new CoffeeNotes();

// modal functions
function closeNoteModal() {
    document.getElementById('coffeeNoteModal').classList.remove('show');
}

function takeCoffeeBreak() {
    window.location.href = 'pomodoro.html?break=true';
}