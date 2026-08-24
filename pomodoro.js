class CoffeeTimer {
    constructor() {
        this.timer = null;
        this.minutes = 25;
        this.seconds = 0;
        this.isRunning = false;
        this.currentMode = 'pomodoro';
        this.sessionCount = 0;
        this.coffeeBreaks = 0;
        this.currentAudio = null;
        this.currentSound = 'cafe';
        this.volume = 50;
        
        this.quotes = [
            { text: "coffee is the best study partner", author: "cafe wisdom" },
            { text: "focus brews success", author: "study barista" },
            { text: "one sip at a time, one task at a time", author: "coffee philosopher" },
            { text: "espresso yourself through studying", author: "cafe corner" },
            { text: "good ideas start with coffee", author: "anonymous" }
        ];
        
        this.init();
    }
    
    init() {
        console.log('🔍 Timer initializing...');
        this.loadSettings();
        this.setupEventListeners();
        this.updateDisplay();
        this.loadTasksFromPlanner();
        this.updateQuote();
        this.setupSounds();
        
        // Force coffee cups to update on load
        setTimeout(() => {
            console.log('🔍 Initial coffee cups update');
            this.updateCoffeeCups();
        }, 100);
    }
    
    setupEventListeners() {
        // mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                this.resetTimer();
            });
        });
        
        // timer controls
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());
        
        // sound buttons
        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSound = btn.dataset.sound;
                this.playSound();
            });
        });
        
        // volume control - FIXED to actually change volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.volume = e.target.value;
            this.updateVolume();
        });
    }
    
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.timer = setInterval(() => {
            if (this.seconds === 0) {
                if (this.minutes === 0) {
                    this.completeSession();
                    return;
                }
                this.minutes--;
                this.seconds = 59;
            } else {
                this.seconds--;
            }
            
            this.updateDisplay();
            this.updateCoffeeLiquid();
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
    }
    
    resetTimer() {
        this.pauseTimer();
        
        switch(this.currentMode) {
            case 'pomodoro':
                this.minutes = 25;
                break;
            case 'shortBreak':
                this.minutes = 5;
                break;
            case 'longBreak':
                this.minutes = 15;
                break;
        }
        this.seconds = 0;
        this.updateDisplay();
        this.updateCoffeeLiquid();
    }
    
 completeSession() {
    this.pauseTimer();
    console.log('🔍 Session completed! Current mode:', this.currentMode);
    console.log('🔍 Session count before:', this.sessionCount);
    
    if (this.currentMode === 'pomodoro') {
        this.sessionCount++;
        document.getElementById('sessionCount').textContent = this.sessionCount;
        console.log('🔍 Session count after:', this.sessionCount);
        
        // ☕ ADD COFFEE BREAK AFTER EVERY SESSION
        console.log('🔍 ☕ COFFEE BREAK EARNED!');
        this.addCoffeeBreak();
        
        // show celebration
        this.showCelebration();
        
        // automatically suggest a break
        setTimeout(() => {
            if (confirm('Time for a coffee break?')) {
                document.querySelector('[data-mode="shortBreak"]').click();
                this.startTimer();
            }
        }, 1000);
    }
    
    // play completion sound
    this.playCompletionSound();
    this.saveSettings();
}
    
    updateCoffeeCups() {
        console.log('🔍 Updating coffee cups. Total breaks:', this.coffeeBreaks);
        const cups = document.querySelectorAll('.coffee-cups i');
        console.log('🔍 Found', cups.length, 'cups');
        
        if (cups.length === 0) {
            console.log('🔍 ERROR: No coffee cups found in DOM!');
            return;
        }
        
        cups.forEach((cup, index) => {
            if (index < this.coffeeBreaks) {
                cup.className = 'fas fa-mug-hot filled';
                cup.style.color = '#C68B5E';
                cup.style.opacity = '1';
                console.log(`🔍 Cup ${index + 1}: FILLED`);
            } else {
                cup.className = 'fas fa-mug-hot empty';
                cup.style.opacity = '0.3';
                console.log(`🔍 Cup ${index + 1}: empty`);
            }
        });
    }
    
    updateCoffeeLiquid() {
        const liquid = document.getElementById('coffeeLiquid');
        if (this.currentMode === 'pomodoro') {
            const totalSeconds = 25 * 60;
            const remainingSeconds = (this.minutes * 60) + this.seconds;
            const percentage = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
            liquid.style.height = percentage + '%';
        }
    }
    
    updateDisplay() {
        document.getElementById('minutes').textContent = this.minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = this.seconds.toString().padStart(2, '0');
    }
    
    showCelebration() {
        const modal = document.getElementById('coffeeCelebration');
        modal.classList.add('show');
        
        setTimeout(() => {
            modal.classList.remove('show');
        }, 4000);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'timer-notification';
        notification.innerHTML = `
            <i class="fas fa-mug-hot"></i>
            <span>${message}</span>
        `;
        
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = 'linear-gradient(135deg, #C68B5E, #D2691E)';
        notification.style.color = 'white';
        notification.style.padding = '1rem 1.5rem';
        notification.style.borderRadius = '50px';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 5px 20px rgba(0,0,0,0.2)';
        notification.style.animation = 'slideIn 0.3s ease';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    loadTasksFromPlanner() {
        // load tasks from localStorage (shared with planner)
        const tasks = JSON.parse(localStorage.getItem('coffeeTasks')) || [];
        const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
        
        const taskList = document.getElementById('miniTaskList');
        if (pendingTasks.length > 0) {
            taskList.innerHTML = pendingTasks.map(task => `
                <div class="mini-task-item">
                    <div class="task-name">${task.name}</div>
                    <div class="task-meta">
                        <span>${task.subject}</span>
                        <span>•</span>
                        <span class="priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
            `).join('');
            
            // update brewing suggestion
            const topTask = pendingTasks[0];
            document.getElementById('brewingSuggestion').innerHTML = `
                <p class="suggestion-text">focus on: ${topTask.name}</p>
                <span class="suggestion-tag">${topTask.subject}</span>
            `;
        } else {
            taskList.innerHTML = '<div class="mini-task-item">no tasks yet. add some in planner!</div>';
            document.getElementById('brewingSuggestion').innerHTML = `
                <p class="suggestion-text">time to focus</p>
                <span class="suggestion-tag">add tasks in planner</span>
            `;
        }
    }
    
    updateQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        const quote = this.quotes[randomIndex];
        document.getElementById('cafeQuote').textContent = `"${quote.text}"`;
        document.querySelector('.quote-author').textContent = `- ${quote.author}`;
    }
    
    setupSounds() {
        // simple beep sound for completion (browser-friendly)
        this.completionSound = new Audio();
        this.completionSound.src = 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAAA8';
    }
    
    playCompletionSound() {
        // simple beep
        try {
            const audio = new AudioContext();
            const oscillator = audio.createOscillator();
            const gainNode = audio.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audio.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audio.currentTime + 0.3);
        } catch (e) {
            console.log('Beep error:', e);
        }
    }
    
    playSound() {
        // Stop current sound if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        if (this.currentSound === 'none') {
            console.log('Sounds stopped');
            return;
        }
        
        console.log(`Playing ${this.currentSound} sound at volume ${this.volume}`);
        
        const soundFiles = {
            cafe: 'sounds/km007-cafe-ambience-9263.mp3',
            rain: 'sounds/dragon-studio-gentle-rain-07-437321.mp3',
            lofi: 'sounds/freesound_community-lofi-guitar-105361.mp3',
            fire: 'sounds/king_of_the_christmas-fireplace-loop-original-noise-178209 - Copy.mp3'
        };
        
        try {
            this.currentAudio = new Audio(soundFiles[this.currentSound]);
            this.currentAudio.loop = true;
            this.currentAudio.volume = this.volume / 100; // Use current volume
            this.currentAudio.play().catch(e => console.log('Audio play error:', e));
        } catch (e) {
            console.log('Audio creation error:', e);
        }
    }
    
    updateVolume() {
        console.log(`Volume updated to ${this.volume}`);
        
        // Update volume of currently playing sound - FIXED!
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume / 100;
            console.log(`Volume set to ${this.volume / 100}`);
        }
    }
    
    loadSettings() {
        // load saved settings
        this.sessionCount = parseInt(localStorage.getItem('pomodoroSessions')) || 0;
        this.coffeeBreaks = parseInt(localStorage.getItem('coffeeBreaks')) || 0;
        
        console.log('🔍 Loaded settings - Sessions:', this.sessionCount, 'Coffee breaks:', this.coffeeBreaks);
        
        document.getElementById('sessionCount').textContent = this.sessionCount;
        this.updateCoffeeCups();
    }
    
    saveSettings() {
        localStorage.setItem('pomodoroSessions', this.sessionCount);
        localStorage.setItem('coffeeBreaks', this.coffeeBreaks);
        console.log('🔍 Saved settings - Sessions:', this.sessionCount, 'Coffee breaks:', this.coffeeBreaks);
    }
}

// initialize timer
const coffeeTimer = new CoffeeTimer();

// helper functions for modal
function startBreak() {
    document.querySelector('[data-mode="shortBreak"]').click();
    coffeeTimer.startTimer();
    closeCelebration();
}

function closeCelebration() {
    document.getElementById('coffeeCelebration').classList.remove('show');
}

// TEST FUNCTION - type testCoffeeBreak() in console to manually add a coffee break
window.testCoffeeBreak = function() {
    console.log('🔍 Manual test: adding coffee break');
    coffeeTimer.addCoffeeBreak();
    coffeeTimer.saveSettings();
}

// Add animation styles if not present
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);