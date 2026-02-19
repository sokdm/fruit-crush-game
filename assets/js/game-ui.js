/**
 * FRUIT CRUSH SAGA - Part 2: UI & Features
 * Add this to the end of game-core.js or include separately
 */

// Extend the prototype with UI methods
FruitCrush.prototype.usePowerUp = function(type) {
    if (this.player.powerUps[type] <= 0 || this.isProcessing || this.isPaused) {
        this.showToast(`No ${type} available!`);
        return;
    }

    if (type === 'shuffle') {
        this.shuffle();
    } else if (type === 'hint') {
        this.showHint();
    } else {
        this.activePowerUp = type;
        this.showToast(`Select a fruit to use ${type}`);
    }
    this.updatePowerUpButtons();
};

FruitCrush.prototype.usePowerUpOnCell = function(cell) {
    if (!this.activePowerUp) return;

    if (this.activePowerUp === 'hammer') {
        cell.dataset.fruit = '';
        cell.textContent = '';
        this.playSound(200, 0.5, 'sawtooth');
        this.applyGravity();
        this.fillEmpty();
    } else if (this.activePowerUp === 'bomb') {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
                    this.grid[r][c].dataset.fruit = '';
                    this.grid[r][c].textContent = '';
                }
            }
        }
        this.playSound(200, 0.8, 'sawtooth');
        this.vibrate([100, 50, 100]);
        this.applyGravity();
        this.fillEmpty();
    }

    this.player.powerUps[this.activePowerUp]--;
    this.activePowerUp = null;
    this.updatePowerUpButtons();
    this.processMatches();
};

FruitCrush.prototype.shuffle = function() {
    this.player.powerUps.shuffle--;
    this.playSound(600, 0.2);
    for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
            const fruit = this.getRandomFruit();
            this.grid[row][col].dataset.fruit = fruit;
            this.grid[row][col].textContent = fruit;
            this.grid[row][col].classList.add('new');
            setTimeout(() => this.grid[row][col].classList.remove('new'), 500);
        }
    }
    this.processMatches();
    this.updatePowerUpButtons();
};

FruitCrush.prototype.showHint = function() {
    this.player.powerUps.hint--;
    for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
            const dirs = [[0,1], [1,0]];
            for (let [dr, dc] of dirs) {
                const nr = row + dr, nc = col + dc;
                if (nr < this.gridSize && nc < this.gridSize) {
                    const cell1 = this.grid[row][col];
                    const cell2 = this.grid[nr][nc];
                    const temp = cell1.dataset.fruit;
                    cell1.dataset.fruit = cell2.dataset.fruit;
                    cell2.dataset.fruit = temp;
                    const matches = this.findMatches();
                    cell2.dataset.fruit = cell1.dataset.fruit;
                    cell1.dataset.fruit = temp;
                    if (matches.length > 0) {
                        cell1.style.background = 'rgba(255,215,0,0.8)';
                        cell2.style.background = 'rgba(255,215,0,0.8)';
                        setTimeout(() => {
                            cell1.style.background = '';
                            cell2.style.background = '';
                        }, 1500);
                        this.updatePowerUpButtons();
                        return;
                    }
                }
            }
        }
    }
    this.showToast('No moves available!');
    this.updatePowerUpButtons();
};

FruitCrush.prototype.updatePowerUpButtons = function() {
    const ids = ['hammer', 'shuffle', 'bomb', 'hint'];
    const counts = ['hammerCount', 'shuffleCount', 'bombCount', 'hintCount'];
    ids.forEach((type, i) => {
        const btn = document.getElementById(type);
        const count = document.getElementById(counts[i]);
        if (btn && count) {
            count.textContent = this.player.powerUps[type];
            btn.disabled = this.player.powerUps[type] <= 0;
        }
    });
};

FruitCrush.prototype.pauseGame = function() {
    if (this.isPaused) return;
    this.isPaused = true;
    const modal = document.getElementById('pauseModal');
    if (modal) modal.classList.add('show');
};

FruitCrush.prototype.resumeGame = function() {
    this.isPaused = false;
    const modal = document.getElementById('pauseModal');
    if (modal) modal.classList.remove('show');
};

FruitCrush.prototype.levelComplete = function() {
    this.playSound(800, 0.5);
    this.vibrate([100, 50, 100, 50, 200]);
    
    const stars = this.score >= this.targetScore * 2 ? 3 : this.score >= this.targetScore * 1.5 ? 2 : 1;
    this.player.totalStars += stars;
    this.player.gamesPlayed++;
    this.player.coins += 50 + (stars * 25);
    
    const modal = document.getElementById('levelCompleteModal');
    if (modal) {
        document.getElementById('levelScore').textContent = this.score;
        document.getElementById('bestScore').textContent = Math.max(this.score, this.player.bestScore || 0);
        document.getElementById('levelStars').textContent = '⭐'.repeat(stars);
        document.getElementById('coinsEarned').textContent = 50 + (stars * 25);
        modal.classList.add('show');
    }
    
    this.player.bestScore = Math.max(this.score, this.player.bestScore || 0);
    this.savePlayerData();
    this.updateProfileStats();
};

FruitCrush.prototype.gameOver = function() {
    this.playSound(400, 0.6, 'sawtooth');
    this.player.gamesPlayed++;
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('targetDisplay').textContent = this.targetScore;
        modal.classList.add('show');
    }
    this.savePlayerData();
    this.updateProfileStats();
};

FruitCrush.prototype.nextLevel = function() {
    this.level++;
    const modal = document.getElementById('levelCompleteModal');
    if (modal) modal.classList.remove('show');
    this.startGame();
};

FruitCrush.prototype.restartLevel = function() {
    document.getElementById('levelCompleteModal')?.classList.remove('show');
    document.getElementById('gameOverModal')?.classList.remove('show');
    this.startGame();
};

FruitCrush.prototype.buyMoves = function() {
    if (this.player.coins >= 100) {
        this.player.coins -= 100;
        this.moves += 5;
        document.getElementById('gameOverModal')?.classList.remove('show');
        this.updateGameStats();
        this.updateProfileStats();
        this.savePlayerData();
        this.showToast('+5 moves added!');
    } else {
        this.showToast('Not enough coins!');
    }
};

FruitCrush.prototype.updateGameStats = function() {
    const ids = {
        currentLevel: this.level,
        gameScore: this.score.toLocaleString(),
        gameMoves: this.moves,
        targetScore: this.targetScore.toLocaleString()
    };
    for (let [id, val] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    if (bar && text) {
        const pct = Math.min((this.score / this.targetScore) * 100, 100);
        bar.style.width = pct + '%';
        text.textContent = Math.floor(pct) + '%';
    }
};

FruitCrush.prototype.updateProfileStats = function() {
    const ids = ['profileLevel', 'totalScore', 'gamesPlayed', 'totalStars', 'coins', 'shopCoins'];
    const vals = [this.level, this.player.totalScore.toLocaleString(), this.player.gamesPlayed, this.player.totalStars, this.player.coins, this.player.coins];
    ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.textContent = vals[i];
    });
};

FruitCrush.prototype.achievements = [
    { id: 'first_match', name: 'First Crush', desc: 'Make your first match', icon: '🎯', unlocked: false, progress: 0, target: 1 },
    { id: 'combo_master', name: 'Combo Master', desc: 'Get a 5x combo', icon: '🔥', unlocked: false, progress: 0, target: 5 },
    { id: 'score_1000', name: 'High Scorer', desc: 'Score 1000 points', icon: '🏆', unlocked: false, progress: 0, target: 1000 },
    { id: 'level_5', name: 'Level 5', desc: 'Reach level 5', icon: '⭐', unlocked: false, progress: 1, target: 5 },
    { id: 'coin_collector', name: 'Coin Collector', desc: 'Collect 500 coins', icon: '💰', unlocked: false, progress: 100, target: 500 },
    { id: 'fruit_master', name: 'Fruit Master', desc: 'Play 50 games', icon: '👑', unlocked: false, progress: 0, target: 50 }
];

FruitCrush.prototype.renderAchievements = function() {
    const container = document.getElementById('achievementList');
    if (!container) return;
    container.innerHTML = '';
    this.achievements.forEach(ach => {
        const pct = Math.min((ach.progress / ach.target) * 100, 100);
        const div = document.createElement('div');
        div.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${pct}%"></div>
                </div>
            </div>
            <div style="font-size: 1.5em;">${ach.unlocked ? '✅' : '🔒'}</div>
        `;
        container.appendChild(div);
    });
};

FruitCrush.prototype.showShop = function() {
    document.getElementById('shopModal')?.classList.add('show');
};

FruitCrush.prototype.closeShop = function() {
    document.getElementById('shopModal')?.classList.remove('show');
};

FruitCrush.prototype.buyItem = function(item, price) {
    if (this.player.coins >= price) {
        this.player.coins -= price;
        if (item === 'hammer') this.player.powerUps.hammer++;
        else if (item === 'shuffle') this.player.powerUps.shuffle++;
        else if (item === 'bomb') this.player.powerUps.bomb++;
        else if (item === 'hints') this.player.powerUps.hint += 3;
        else if (item === 'moves') this.moves += 5;
        this.updateProfileStats();
        this.updatePowerUpButtons();
        this.showToast(`Purchased ${item}!`);
        this.savePlayerData();
    } else {
        this.showToast('Not enough coins!');
    }
};

FruitCrush.prototype.buyCoins = function() {
    this.showToast('In-app purchase coming soon!');
};

FruitCrush.prototype.goPremium = function() {
    this.player.isPremium = true;
    this.showToast('🎉 Welcome to Premium!');
    this.savePlayerData();
};

FruitCrush.prototype.showSettings = function() {
    document.getElementById('settingsPanel')?.classList.add('show');
};

FruitCrush.prototype.closeSettings = function() {
    document.getElementById('settingsPanel')?.classList.remove('show');
};

FruitCrush.prototype.toggleSound = function() {
    this.settings.sound = !this.settings.sound;
    document.getElementById('soundToggle')?.classList.toggle('active');
};

FruitCrush.prototype.toggleMusic = function() {
    this.settings.music = !this.settings.music;
    document.getElementById('musicToggle')?.classList.toggle('active');
};

FruitCrush.prototype.toggleVibration = function() {
    this.settings.vibration = !this.settings.vibration;
    document.getElementById('vibrationToggle')?.classList.toggle('active');
};

FruitCrush.prototype.savePlayerData = function() {
    const data = {
        player: this.player,
        level: this.level,
        achievements: this.achievements,
        settings: this.settings
    };
    localStorage.setItem('fruitCrushData', JSON.stringify(data));
};

FruitCrush.prototype.loadPlayerData = function() {
    const saved = localStorage.getItem('fruitCrushData');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this.player, data.player || {});
        this.level = data.level || 1;
        if (data.achievements) this.achievements = data.achievements;
        if (data.settings) Object.assign(this.settings, data.settings);
    }
};

FruitCrush.prototype.showToast = function(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

// Initialize
const game = new FruitCrush();

