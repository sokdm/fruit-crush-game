/**
 * ADVANCED ANIMATION SYSTEM
 * Professional effects like Candy Crush
 */

class AnimationManager {
    constructor() {
        this.particlePool = [];
        this.maxParticles = 50;
        this.initParticlePool();
    }

    initParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.display = 'none';
            document.body.appendChild(p);
            this.particlePool.push({ element: p, inUse: false });
        }
    }

    getParticle() {
        const available = this.particlePool.find(p => !p.inUse);
        if (available) {
            available.inUse = true;
            return available.element;
        }
        return null;
    }

    releaseParticle(element) {
        const poolItem = this.particlePool.find(p => p.element === element);
        if (poolItem) {
            poolItem.inUse = false;
            element.style.display = 'none';
        }
    }

    // Cascading match animation
    async cascadeMatches(matches, callback) {
        const groups = this.groupMatches(matches);
        
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            
            // Stagger animation within group
            group.forEach((cell, index) => {
                setTimeout(() => {
                    this.popAnimation(cell);
                }, index * 50);
            });
            
            await this.sleep(200);
        }
        
        if (callback) callback();
    }

    groupMatches(matches) {
        // Group adjacent matches for cascading effect
        const groups = [];
        const visited = new Set();
        
        matches.forEach(cell => {
            if (visited.has(cell)) return;
            
            const group = [cell];
            visited.add(cell);
            
            // Find adjacent matches
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            [[-1,0], [1,0], [0,-1], [0,1]].forEach(([dr, dc]) => {
                const nr = row + dr, nc = col + dc;
                const neighbor = matches.find(m => 
                    parseInt(m.dataset.row) === nr && 
                    parseInt(m.dataset.col) === nc
                );
                if (neighbor && !visited.has(neighbor)) {
                    group.push(neighbor);
                    visited.add(neighbor);
                }
            });
            
            groups.push(group);
        });
        
        return groups;
    }

    popAnimation(cell) {
        cell.style.transform = 'scale(1.2)';
        cell.style.opacity = '0.8';
        
        // Create burst effect
        const rect = cell.getBoundingClientRect();
        this.createBurst(rect.left + rect.width/2, rect.top + rect.height/2, cell.textContent);
        
        setTimeout(() => {
            cell.style.transform = 'scale(0)';
            cell.style.opacity = '0';
        }, 100);
    }

    createBurst(x, y, emoji) {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94'];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const p = this.getParticle();
            if (!p) continue;
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 60 + Math.random() * 40;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            p.textContent = emoji;
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.color = color;
            p.style.display = 'block';
            p.style.fontSize = (20 + Math.random() * 15) + 'px';
            
            // Physics-based animation
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 30; // Initial upward burst
            const rotation = Math.random() * 720 - 360;
            
            p.animate([
                { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0.5) rotate(${rotation}deg)`, opacity: 0.8, offset: 0.5 },
                { transform: `translate(${tx * 1.5}px, ${ty + 100}px) scale(0) rotate(${rotation * 2}deg)`, opacity: 0 }
            ], {
                duration: 800 + Math.random() * 400,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => this.releaseParticle(p);
        }
    }

    // Special candy creation animation
    specialCandyAnimation(cell, type) {
        cell.style.animation = 'none';
        cell.offsetHeight; // Trigger reflow
        
        const animations = {
            striped: 'stripeCreate 0.6s ease',
            wrapped: 'wrapCreate 0.6s ease',
            bomb: 'bombCreate 0.8s ease'
        };
        
        cell.style.animation = animations[type] || '';
        
        // Add glow effect
        const glow = document.createElement('div');
        glow.className = 'special-glow';
        cell.appendChild(glow);
        
        setTimeout(() => glow.remove(), 1000);
    }

    // Level up celebration
    levelUpAnimation() {
        const container = document.createElement('div');
        container.className = 'level-up-overlay';
        container.innerHTML = `
            <div class="level-up-text">LEVEL UP!</div>
            <div class="level-up-stars">⭐⭐⭐</div>
        `;
        document.body.appendChild(container);
        
        // Confetti effect
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'][Math.floor(Math.random() * 4)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                container.appendChild(confetti);
            }, i * 20);
        }
        
        setTimeout(() => container.remove(), 4000);
    }

    // Combo text with style
    showComboText(cell, combo) {
        const texts = {
            2: 'Sweet!',
            3: 'Tasty!',
            4: 'Delicious!',
            5: 'Divine!',
            6: 'Sugar Crush!',
            7: 'Fruit Explosion!'
        };
        
        const text = texts[combo] || `Combo x${combo}!`;
        const rect = cell.getBoundingClientRect();
        
        const el = document.createElement('div');
        el.className = 'combo-text-advanced';
        el.textContent = text;
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.color = this.getComboColor(combo);
        
        document.body.appendChild(el);
        
        el.animate([
            { transform: 'translate(-50%, 0) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -50px) scale(1.2)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -100px) scale(1)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        }).onfinish = () => el.remove();
    }

    getComboColor(combo) {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a8e6cf', '#ff8b94', '#c7ceea'];
        return colors[Math.min(combo - 2, colors.length - 1)];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes stripeCreate {
        0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
        50% { transform: scale(1.3) rotate(180deg); filter: brightness(2); }
        100% { transform: scale(1) rotate(360deg); filter: brightness(1); }
    }
    
    @keyframes wrapCreate {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,107,0.7); }
        50% { transform: scale(1.2); box-shadow: 0 0 30px 10px rgba(255,107,107,0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,107,0); }
    }
    
    @keyframes bombCreate {
        0% { transform: scale(1); filter: hue-rotate(0deg); }
        25% { transform: scale(1.4); filter: hue-rotate(90deg); }
        50% { transform: scale(0.8); filter: hue-rotate(180deg); }
        75% { transform: scale(1.2); filter: hue-rotate(270deg); }
        100% { transform: scale(1); filter: hue-rotate(360deg); }
    }
    
    .level-up-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        pointer-events: none;
    }
    
    .level-up-text {
        font-family: 'Fredoka One', cursive;
        font-size: 4em;
        color: #ffd700;
        text-shadow: 0 0 30px rgba(255,215,0,0.8);
        animation: levelUpPulse 1s ease infinite;
    }
    
    @keyframes levelUpPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        top: -10px;
        animation: confettiFall linear forwards;
    }
    
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    .combo-text-advanced {
        position: fixed;
        font-family: 'Fredoka One', cursive;
        font-size: 2.5em;
        pointer-events: none;
        z-index: 1000;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        font-weight: bold;
    }
    
    .special-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 150%;
        height: 150%;
        background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%);
        pointer-events: none;
        animation: glowPulse 1s ease-out;
    }
    
    @keyframes glowPulse {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
`;
document.head.appendChild(style);

window.AnimationManager = AnimationManager;

