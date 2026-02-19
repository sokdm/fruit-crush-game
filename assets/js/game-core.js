/**
 * FRUIT CRUSH SAGA - Part 1: Core Game
 */

class FruitCrush {
    constructor() {
        this.gridSize = 8;
        this.fruits = ['🍎', '🍊', '🍇', '🍓', '🥝', '🍋', '🍑', '🍒'];
        
        this.grid = [];
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.targetScore = 1000;
        this.selectedCell = null;
        this.isProcessing = false;
        this.combo = 0;
        this.isPaused = false;
        this.activePowerUp = null;
        
        this.player = {
            name: 'Fruit Master',
            totalScore: 0,
            gamesPlayed: 0,
            totalStars: 0,
            coins: 100,
            isPremium: false,
            bestScore: 0,
            powerUps: { hammer: 3, shuffle: 3, bomb: 2, hint: 5 }
        };
        
        this.settings = { sound: true, music: true, vibration: true };
        this.audioContext = null;
        
        this.init();
    }

    init() {
        this.initAudio();
        this.createFloatingFruits();
        this.loadPlayerData();
        
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) loading.classList.add('hide');
        }, 1500);
        
        setInterval(() => this.savePlayerData(), 30000);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pauseGame();
        });
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playSound(freq, duration, type = 'sine') {
        if (!this.settings.sound || !this.audioContext) return;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = freq;
            osc.type = type;
            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
        } catch (e) {}
    }

    createFloatingFruits() {
        const container = document.getElementById('floatingFruits');
        if (!container) return;
        for (let i = 0; i < 10; i++) {
            const fruit = document.createElement('div');
            fruit.className = 'floating-fruit';
            fruit.textContent = this.fruits[Math.floor(Math.random() * this.fruits.length)];
            fruit.style.left = Math.random() * 100 + '%';
            fruit.style.animationDelay = Math.random() * 6 + 's';
            fruit.style.animationDuration = (Math.random() * 4 + 4) + 's';
            container.appendChild(fruit);
        }
    }

    vibrate(pattern) {
        if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenName + 'Screen');
        if (screen) screen.classList.add('active');
        
        if (screenName === 'profile') {
            this.renderAchievements();
            this.updateProfileStats();
        } else if (screenName === 'game') {
            this.startGame();
        }
    }

    startGame() {
        this.score = 0;
        this.moves = 30;
        this.targetScore = 1000 + (this.level - 1) * 500;
        this.combo = 0;
        this.isPaused = false;
        this.selectedCell = null;
        this.isProcessing = false;
        this.activePowerUp = null;
        
        this.updateGameStats();
        this.createGrid();
        this.updatePowerUpButtons();
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        if (!gridElement) return;
        gridElement.innerHTML = '';
        this.grid = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const fruit = this.getRandomFruit();
                this.setCellFruit(cell, fruit);
                
                cell.addEventListener('click', (e) => this.handleClick(e));
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleClick(e);
                });
                
                gridElement.appendChild(cell);
                this.grid[row][col] = cell;
            }
        }

        while (this.findMatches().length > 0) {
            this.removeMatches(false);
            this.fillEmpty();
        }
    }

    getRandomFruit() {
        return this.fruits[Math.floor(Math.random() * this.fruits.length)];
    }

    setCellFruit(cell, fruit) {
        cell.dataset.fruit = fruit;
        cell.textContent = fruit;
        cell.className = 'cell';
    }

    handleClick(e) {
        if (this.isProcessing || this.isPaused || this.moves <= 0) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        if (this.activePowerUp) {
            this.usePowerUpOnCell(cell);
            return;
        }

        if (!this.selectedCell) {
            this.selectedCell = cell;
            cell.classList.add('selected');
            this.playSound(800, 0.1);
            this.vibrate(50);
        } else {
            const prevRow = parseInt(this.selectedCell.dataset.row);
            const prevCol = parseInt(this.selectedCell.dataset.col);
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            const isAdjacent = (Math.abs(row - prevRow) === 1 && col === prevCol) ||
                               (Math.abs(col - prevCol) === 1 && row === prevRow);

            if (isAdjacent) {
                this.swapCells(this.selectedCell, cell);
            } else {
                this.selectedCell.classList.remove('selected');
                if (cell !== this.selectedCell) {
                    this.selectedCell = cell;
                    cell.classList.add('selected');
                    this.playSound(800, 0.1);
                } else {
                    this.selectedCell = null;
                }
            }
        }
    }

    async swapCells(cell1, cell2) {
        this.isProcessing = true;
        this.playSound(600, 0.15, 'triangle');
        
        const temp = cell1.dataset.fruit;
        cell1.dataset.fruit = cell2.dataset.fruit;
        cell1.textContent = cell2.dataset.fruit;
        cell2.dataset.fruit = temp;
        cell2.textContent = temp;

        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.moves--;
            this.updateGameStats();
            await this.processMatches();
            
            if (this.score >= this.targetScore) {
                setTimeout(() => this.levelComplete(), 500);
            } else if (this.moves <= 0) {
                setTimeout(() => this.gameOver(), 500);
            }
        } else {
            setTimeout(() => {
                const temp = cell1.dataset.fruit;
                cell1.dataset.fruit = cell2.dataset.fruit;
                cell1.textContent = cell2.dataset.fruit;
                cell2.dataset.fruit = temp;
                cell2.textContent = temp;
                this.isProcessing = false;
            }, 300);
        }

        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
            this.selectedCell = null;
        }
    }

    findMatches() {
        const matches = new Set();

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const fruit = this.grid[row][col].dataset.fruit;
                if (!fruit) continue;
                if (fruit === this.grid[row][col+1].dataset.fruit && 
                    fruit === this.grid[row][col+2].dataset.fruit) {
                    matches.add(this.grid[row][col]);
                    matches.add(this.grid[row][col+1]);
                    matches.add(this.grid[row][col+2]);
                }
            }
        }

        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize - 2; row++) {
                const fruit = this.grid[row][col].dataset.fruit;
                if (!fruit) continue;
                if (fruit === this.grid[row+1][col].dataset.fruit && 
                    fruit === this.grid[row+2][col].dataset.fruit) {
                    matches.add(this.grid[row][col]);
                    matches.add(this.grid[row+1][col]);
                    matches.add(this.grid[row+2][col]);
                }
            }
        }

        return Array.from(matches);
    }

    async processMatches() {
        let hasMatches = true;
        this.combo = 0;

        while (hasMatches) {
            const matches = this.findMatches();
            if (matches.length === 0) {
                hasMatches = false;
                break;
            }

            this.combo++;
            if (this.combo > 1) {
                this.showComboText(matches[0], `Combo x${this.combo}!`);
                this.playSound(1200, 0.3, 'square');
            } else {
                this.playSound(matches.length > 4 ? 1500 : 1000, 0.2);
            }

            const points = matches.length * 10 + (this.combo - 1) * 25;
            this.score += points;
            this.player.totalScore += points;

            matches.forEach(cell => {
                cell.classList.add('matched');
                const rect = cell.getBoundingClientRect();
                this.createParticles(rect.left + rect.width/2, rect.top + rect.height/2, cell.dataset.fruit);
            });

            this.vibrate(matches.length > 4 ? [50, 50, 50] : 30);
            this.updateGameStats();

            await this.sleep(400);

            matches.forEach(cell => {
                cell.dataset.fruit = '';
                cell.textContent = '';
                cell.classList.remove('matched');
            });

            await this.applyGravity();
            this.fillEmpty();
            await this.sleep(300);
        }

        this.isProcessing = false;
    }

    async applyGravity() {
        for (let col = 0; col < this.gridSize; col++) {
            let emptySlots = 0;
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.grid[row][col].dataset.fruit === '') {
                    emptySlots++;
                } else if (emptySlots > 0) {
                    const targetRow = row + emptySlots;
                    this.grid[targetRow][col].dataset.fruit = this.grid[row][col].dataset.fruit;
                    this.grid[targetRow][col].textContent = this.grid[row][col].dataset.fruit;
                    this.grid[targetRow][col].classList.add('falling');
                    this.grid[row][col].dataset.fruit = '';
                    this.grid[row][col].textContent = '';
                }
            }
        }
        await this.sleep(300);
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].classList.remove('falling');
            }
        }
    }

    fillEmpty() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].dataset.fruit === '') {
                    const fruit = this.getRandomFruit();
                    this.grid[row][col].dataset.fruit = fruit;
                    this.grid[row][col].textContent = fruit;
                    this.grid[row][col].classList.add('new');
                    setTimeout(() => this.grid[row][col].classList.remove('new'), 500);
                }
            }
        }
    }

    removeMatches(animate) {
        const matches = this.findMatches();
        matches.forEach(cell => {
            if (animate) {
                cell.classList.add('matched');
                setTimeout(() => {
                    cell.dataset.fruit = '';
                    cell.textContent = '';
                    cell.classList.remove('matched');
                }, 400);
            } else {
                cell.dataset.fruit = '';
                cell.textContent = '';
            }
        });
    }

    createParticles(x, y, emoji) {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.textContent = emoji;
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            const angle = (Math.PI * 2 * i) / 6;
            const velocity = 30 + Math.random() * 30;
            p.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
            p.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
            container.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
    }

    showComboText(cell, text) {
        const rect = cell.getBoundingClientRect();
        const container = document.querySelector('.grid-container');
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        
        const div = document.createElement('div');
        div.className = 'combo-text';
        div.textContent = text;
        div.style.left = (rect.left - containerRect.left + rect.width/2 - 50) + 'px';
        div.style.top = (rect.top - containerRect.top) + 'px';
        container.appendChild(div);
        setTimeout(() => div.remove(), 1500);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

