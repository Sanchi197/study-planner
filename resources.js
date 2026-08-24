// ===== RESOURCES PAGE - UPLOAD ONCE, VIEW DIRECTLY =====
class CoffeeLibrary {
    constructor() {
        this.resources = [];
        this.currentFilter = 'all';
        this.currentSubject = 'all';
        this.searchTerm = '';
        this.sortBy = 'newest';
        
        this.init();
    }
    
    init() {
        this.loadResources();
        this.render();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('addResourceBtn').addEventListener('click', () => {
            this.openModal();
        });
        
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter = item.dataset.filter;
                this.render();
            });
        });
        
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });
        
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.render();
        });
        
        document.getElementById('resourceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveResource();
        });
        
        document.getElementById('type').addEventListener('change', (e) => {
            const section = document.getElementById('flashcardSection');
            if (e.target.value === 'flashcard') {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        
        document.getElementById('addPairBtn').addEventListener('click', () => {
            this.addFlashcardPair();
        });

        // URL paste handling
        const urlInput = document.getElementById('url');
        urlInput.removeAttribute('readonly');
        urlInput.removeAttribute('disabled');
        
        urlInput.addEventListener('paste', (e) => {
            console.log('URL pasted:', e.clipboardData.getData('text'));
        });
        
        urlInput.addEventListener('contextmenu', (e) => {
            return true;
        });
        
        // File upload handling
        document.getElementById('fileUploadBtn').addEventListener('click', () => {
            document.getElementById('fileUpload').click();
        });
        
        document.getElementById('fileUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('fileName').textContent = file.name;
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                if (!document.getElementById('title').value) {
                    document.getElementById('title').value = fileNameWithoutExt;
                }
            }
        });
    }
    
    openModal(resource = null) {
        document.getElementById('resourceModal').classList.add('show');
        
        if (resource) {
            document.getElementById('title').value = resource.title;
            document.getElementById('subject').value = resource.subject;
            document.getElementById('type').value = resource.type;
            document.getElementById('url').value = resource.url || '';
            document.getElementById('tags').value = resource.tags.join(', ');
            
            if (resource.type === 'flashcard' && resource.cards) {
                document.getElementById('flashcardSection').classList.remove('hidden');
                this.renderFlashcardPairs(resource.cards);
            }
        } else {
            document.getElementById('resourceForm').reset();
            document.getElementById('flashcardSection').classList.add('hidden');
            document.getElementById('flashcardPairs').innerHTML = `
                <div class="flashcard-pair">
                    <input type="text" class="term" placeholder="term">
                    <input type="text" class="definition" placeholder="definition">
                    <button type="button" class="remove-pair" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }
    }
    
    closeModal() {
        document.getElementById('resourceModal').classList.remove('show');
    }
    
    // ===== SAVE RESOURCE - FIXED TO STORE FILE URL PROPERLY =====
    saveResource() {
        const title = document.getElementById('title').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const type = document.getElementById('type').value;
        const url = document.getElementById('url').value.trim();
        const tagsInput = document.getElementById('tags').value;
        const fileInput = document.getElementById('fileUpload');
        const file = fileInput.files[0];
        
        if (!title || !subject) {
            alert('please fill in title and subject');
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
        
        const resource = {
            id: Date.now(),
            title: title,
            subject: subject,
            type: type,
            url: url,
            tags: tags,
            createdAt: new Date().toISOString()
        };
        
        // IMPORTANT: If file is uploaded, create viewable URL
        if (file) {
            // Create a blob URL that can be OPENED directly
            const fileURL = URL.createObjectURL(file);
            
            resource.fileData = {
                name: file.name,
                size: file.size,
                type: file.type,
                fileURL: fileURL,  // ← This is the key!
                isBlob: true
            };
            
            this.showNotification(`📎 File attached: ${file.name}`);
        }
        
        // Handle flashcards
        if (type === 'flashcard') {
            const cards = [];
            document.querySelectorAll('.flashcard-pair').forEach(pair => {
                const term = pair.querySelector('.term').value.trim();
                const def = pair.querySelector('.definition').value.trim();
                if (term && def) {
                    cards.push({ term, definition: def });
                }
            });
            
            if (cards.length === 0) {
                alert('add at least one flashcard');
                return;
            }
            
            resource.cards = cards;
        }
        
        this.resources.push(resource);
        this.saveResources();
        this.closeModal();
        this.render();
        
        // Reset file input
        fileInput.value = '';
        document.getElementById('fileName').textContent = 'no file chosen';
    }
    
    deleteResource(id) {
        if (confirm('remove this resource?')) {
            const resource = this.resources.find(r => r.id === id);
            
            // Clean up blob URL to prevent memory leaks
            if (resource && resource.fileData && resource.fileData.fileURL) {
                URL.revokeObjectURL(resource.fileData.fileURL);
            }
            
            this.resources = this.resources.filter(r => r.id !== id);
            this.saveResources();
            this.render();
            this.showNotification('resource removed');
        }
    }
    
    // ===== OPEN DOCUMENT - ACTUALLY OPENS THE FILE (NO DOWNLOAD) =====
    openDocument(id) {
        const resource = this.resources.find(r => r.id === id);
        if (!resource) return;
        
        // Case 1: Uploaded file with blob URL
        if (resource.fileData && resource.fileData.fileURL) {
            const url = resource.fileData.fileURL;
            
            // Open in new tab - PDFs will show, images will show, videos will play
            window.open(url, '_blank');
            
            this.showNotification(`📂 Opening: ${resource.fileData.name}`);
            return;
        }
        
        // Case 2: Regular web URL
        if (resource.url) {
            window.open(resource.url, '_blank');
            return;
        }
        
        this.showNotification('No file available');
    }
    
    studyFlashcards(resource) {
        this.currentFlashcards = resource;
        this.currentCardIndex = 0;
        
        document.getElementById('flashcardTitle').textContent = resource.title;
        this.updateFlashcardDisplay();
        document.getElementById('flashcardModal').classList.add('show');
    }
    
    updateFlashcardDisplay() {
        if (!this.currentFlashcards) return;
        
        const card = this.currentFlashcards.cards[this.currentCardIndex];
        document.getElementById('flashcardFront').textContent = card.term;
        document.getElementById('flashcardBack').textContent = card.definition;
        document.getElementById('flashcardCounter').textContent = 
            `${this.currentCardIndex + 1} / ${this.currentFlashcards.cards.length}`;
        
        document.getElementById('flashcard').classList.remove('flipped');
    }
    
    addFlashcardPair() {
        const container = document.getElementById('flashcardPairs');
        const pair = document.createElement('div');
        pair.className = 'flashcard-pair';
        pair.innerHTML = `
            <input type="text" class="term" placeholder="term">
            <input type="text" class="definition" placeholder="definition">
            <button type="button" class="remove-pair" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(pair);
    }
    
    renderFlashcardPairs(cards) {
        const container = document.getElementById('flashcardPairs');
        container.innerHTML = cards.map(card => `
            <div class="flashcard-pair">
                <input type="text" class="term" value="${this.escapeHtml(card.term)}" placeholder="term">
                <input type="text" class="definition" value="${this.escapeHtml(card.definition)}" placeholder="definition">
                <button type="button" class="remove-pair" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    getFilteredResources() {
        let filtered = [...this.resources];
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(r => r.type === this.currentFilter);
        }
        
        if (this.currentSubject !== 'all') {
            filtered = filtered.filter(r => r.subject === this.currentSubject);
        }
        
        if (this.searchTerm) {
            filtered = filtered.filter(r => 
                r.title.toLowerCase().includes(this.searchTerm) ||
                r.subject.toLowerCase().includes(this.searchTerm) ||
                r.tags.some(t => t.toLowerCase().includes(this.searchTerm))
            );
        }
        
        filtered.sort((a, b) => {
            switch(this.sortBy) {
                case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'title': return a.title.localeCompare(b.title);
                default: return 0;
            }
        });
        
        return filtered;
    }
    
    render() {
        const container = document.getElementById('resourcesGrid');
        const filtered = this.getFilteredResources();
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>your library is empty</h3>
                    <p>click "add resource" to get started ☕</p>
                </div>
            `;
        } else {
            container.innerHTML = filtered.map(r => this.renderCard(r)).join('');
        }
        
        this.updateStats();
        this.renderSubjects();
    }
    
    renderCard(r) {
        const icons = { pdf: '📄', link: '🔗', video: '🎥', flashcard: '🎴' };
        const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const shortTitle = r.title.length > 30 ? r.title.substring(0, 27) + '...' : r.title;
        
        return `
            <div class="resource-card ${r.type} ${r.fileData ? 'has-file' : ''}">
                <div class="resource-icon">${icons[r.type] || '📄'}</div>
                <h3 class="resource-title" title="${this.escapeHtml(r.title)}">${this.escapeHtml(shortTitle)}</h3>
                <div class="resource-subject"><i class="fas fa-bookmark"></i> ${this.escapeHtml(r.subject)}</div>
                <div class="resource-meta"><i class="far fa-clock"></i> ${date}</div>
                
                ${r.tags.length > 0 ? `
                    <div class="resource-tags">
                        ${r.tags.map(t => `<span class="resource-tag">#${t}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="resource-actions">
                    ${(r.url || r.fileData) ? `
                        <button class="resource-btn open-btn" onclick="library.openDocument(${r.id})">
                            <i class="fas fa-eye"></i> view
                        </button>
                    ` : `
                        <button class="resource-btn open-btn" disabled style="opacity:0.5">
                            <i class="fas fa-eye-slash"></i> no file
                        </button>
                    `}
                    
                    <button class="resource-btn delete-btn" onclick="library.deleteResource(${r.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    updateStats() {
        const counts = {
            all: this.resources.length,
            pdf: this.resources.filter(r => r.type === 'pdf').length,
            link: this.resources.filter(r => r.type === 'link').length,
            video: this.resources.filter(r => r.type === 'video').length,
            flashcard: this.resources.filter(r => r.type === 'flashcard').length
        };
        
        document.getElementById('totalCount').textContent = counts.all;
        document.getElementById('pdfCount').textContent = counts.pdf;
        document.getElementById('linkCount').textContent = counts.link;
        document.getElementById('videoCount').textContent = counts.video;
        document.getElementById('flashcardCount').textContent = counts.flashcard;
    }
    
    renderSubjects() {
        const subjects = [...new Set(this.resources.map(r => r.subject))];
        const container = document.getElementById('subjectsList');
        
        container.innerHTML = `
            <span class="subject-tag ${this.currentSubject === 'all' ? 'active' : ''}" 
                  onclick="library.filterBySubject('all')">all</span>
            ${subjects.map(s => `
                <span class="subject-tag ${this.currentSubject === s ? 'active' : ''}" 
                      onclick="library.filterBySubject('${s}')">${s}</span>
            `).join('')}
        `;
    }
    
    filterBySubject(subject) {
        this.currentSubject = subject;
        this.render();
    }
    
    showNotification(msg) {
        const notif = document.createElement('div');
        notif.textContent = msg;
        notif.style.position = 'fixed';
        notif.style.bottom = '20px';
        notif.style.right = '20px';
        notif.style.background = 'linear-gradient(135deg, var(--caramel), var(--cinnamon))';
        notif.style.color = 'white';
        notif.style.padding = '1rem 1.5rem';
        notif.style.borderRadius = '50px';
        notif.style.zIndex = '2000';
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }
    
    saveResources() {
        localStorage.setItem('coffeeResources', JSON.stringify(this.resources));
    }
    
    loadResources() {
        const saved = localStorage.getItem('coffeeResources');
        if (saved) {
            try {
                this.resources = JSON.parse(saved);
            } catch (e) {
                this.resources = [];
            }
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===== INITIALIZE =====
const library = new CoffeeLibrary();

// ===== GLOBAL FUNCTIONS =====
function closeModal() { library.closeModal(); }
function closeFlashcardModal() { document.getElementById('flashcardModal').classList.remove('show'); }

// flashcard navigation
document.getElementById('prevCard')?.addEventListener('click', () => {
    if (library.currentCardIndex > 0) {
        library.currentCardIndex--;
        library.updateFlashcardDisplay();
    }
});

document.getElementById('nextCard')?.addEventListener('click', () => {
    if (library.currentFlashcards && library.currentCardIndex < library.currentFlashcards.cards.length - 1) {
        library.currentCardIndex++;
        library.updateFlashcardDisplay();
    }
});

document.getElementById('flipCard')?.addEventListener('click', () => {
    document.getElementById('flashcard').classList.toggle('flipped');
});