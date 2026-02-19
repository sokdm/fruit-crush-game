/**
 * ADVANCED SWIPE & TOUCH SYSTEM
 * Smooth gestures like native Candy Crush
 */

class SwipeController {
    constructor(game) {
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.minSwipeDistance = 30;
        this.maxSwipeTime = 300;
        this.isSwiping = false;
        
        this.init();
    }

    init() {
        const grid = document.getElementById('grid');
        if (!grid) return;

        // Touch events
        grid.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        grid.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        grid.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Mouse events (for desktop testing)
        grid.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    handleTouchStart(e) {
        if (this.game.isProcessing || this.game.isPaused) return;
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isSwiping = true;
        
        const cell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.cell');
        if (cell) {
            this.startCell = cell;
            this.showSwipeHint(cell);
        }
    }

    handleTouchMove(e) {
        if (!this.isSwiping) return;
        e.preventDefault(); // Prevent scrolling
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        // Visual feedback during swipe
        if (this.startCell && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
            this.updateSwipeVisual(deltaX, deltaY);
        }
    }

    handleTouchEnd(e) {
        if (!this.isSwiping) return;
        this.isSwiping = false;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const deltaTime = Date.now() - this.touchStartTime;
        
        // Check if valid swipe
        if (deltaTime > this.maxSwipeTime) {
            this.clearSwipeVisual();
            return;
        }
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < this.minSwipeDistance) {
            // Tap instead of swipe
            if (this.startCell) {
                this.game.handleClick({ target: this.startCell });
            }
            this.clearSwipeVisual();
            return;
        }
        
        // Determine direction
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        this.executeSwipe(direction);
        this.clearSwipeVisual();
    }

    executeSwipe(direction) {
        if (!this.startCell) return;
        
        const row = parseInt(this.startCell.dataset.row);
        const col = parseInt(this.startCell.dataset.col);
        let targetCell = null;
        
        switch(direction) {
            case 'left': 
                if (col > 0) targetCell = this.game.grid[row][col - 1];
                break;
            case 'right':
                if (col < 7) targetCell = this.game.grid[row][col + 1];
                break;
            case 'up':
                if (row > 0) targetCell = this.game.grid[row - 1][col];
                break;
            case 'down':
                if (row < 7) targetCell = this.game.grid[row + 1][col];
                break;
        }
        
        if (targetCell) {
            // Animate the swipe
            this.animateSwipe(this.startCell, targetCell, direction);
            
            // Execute swap after animation starts
            setTimeout(() => {
                this.game.selectedCell = this.startCell;
                this.startCell.classList.add('selected');
                this.game.swapCells(this.startCell, targetCell);
            }, 100);
        }
    }

    animateSwipe(cell1, cell2, direction) {
        const duration = 200;
        const distance = 70; // pixel distance to move
        
        const transform1 = this.getTransform(direction, distance);
        const transform2 = this.getTransform(this.oppositeDirection(direction), distance);
        
        cell1.style.transition = `transform ${duration}ms ease`;
        cell2.style.transition = `transform ${duration}ms ease`;
        
        cell1.style.transform = transform1;
        cell2.style.transform = transform2;
        
        setTimeout(() => {
            cell1.style.transform = '';
            cell2.style.transform = '';
            cell1.style.transition = '';
            cell2.style.transition = '';
        }, duration);
    }

    getTransform(direction, distance) {
        switch(direction) {
            case 'left': return `translateX(-${distance}px)`;
            case 'right': return `translateX(${distance}px)`;
            case 'up': return `translateY(-${distance}px)`;
            case 'down': return `translateY(${distance}px)`;
        }
        return '';
    }

    oppositeDirection(dir) {
        const opposites = { left: 'right', right: 'left', up: 'down', down: 'up' };
        return opposites[dir];
    }

    showSwipeHint(cell) {
        // Add subtle scale effect to show touch registered
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 100);
    }

    updateSwipeVisual(deltaX, deltaY) {
        if (!this.startCell) return;
        
        // Calculate rotation based on swipe direction
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 50);
        
        this.startCell.style.transform = `translate(${deltaX * 0.3}px, ${deltaY * 0.3}px) rotate(${angle * 0.1}deg)`;
    }

    clearSwipeVisual() {
        if (this.startCell) {
            this.startCell.style.transform = '';
        }
    }

    // Mouse support for desktop
    handleMouseDown(e) {
        if (e.button !== 0) return; // Only left click
        this.mouseDown = true;
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.startCell = e.target.closest('.cell');
    }

    handleMouseMove(e) {
        if (!this.mouseDown) return;
        // Similar to touch move
    }

    handleMouseUp(e) {
        if (!this.mouseDown) return;
        this.mouseDown = false;
        
        const deltaX = e.clientX - this.touchStartX;
        const deltaY = e.clientY - this.touchStartY;
        
        // Process as swipe if moved enough
        if (Math.abs(deltaX) > this.minSwipeDistance || Math.abs(deltaY) > this.minSwipeDistance) {
            let direction;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }
            this.executeSwipe(direction);
        }
    }
}

window.SwipeController = SwipeController;

