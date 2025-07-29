// 2048游戏
class Game2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.highScore = 0;
        this.lastWinTile = 0;
        this.gameOver = false;
        this.difficulty = 'normal';
        this.isRunning = false;
        this.boundKeyDown = null;
        this.boundTouchStart = null;
        this.boundTouchEnd = null;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy': this.size = 3; break;
            case 'normal': this.size = 4; break;
            case 'hard': this.size = 5; break;
        }
    }

    init() {
        this.boardElement = document.getElementById('game2048Board');
        if (!this.boardElement) return;
        this.loadHighScore();
        this.start(); // Start the game on initialization
    }

    start() {
        this.score = 0;
        this.lastWinTile = 0;
        this.gameOver = false;
        this.isRunning = true;
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        
        this.addRandomNumber();
        this.addRandomNumber();
        
        this.render();
        this.updateUI();
        this.bindEvents();
    }

    restart() {
        const overlay = this.boardElement.querySelector('.game-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.start();
    }

    bindEvents() {
        // Clear old events before binding new ones
        if (this.boundKeyDown) document.removeEventListener('keydown', this.boundKeyDown);
        if (this.boundTouchStart) this.boardElement.removeEventListener('touchstart', this.boundTouchStart);
        if (this.boundTouchEnd) this.boardElement.removeEventListener('touchend', this.boundTouchEnd);

        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);

        document.addEventListener('keydown', this.boundKeyDown);
        this.boardElement.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        this.boardElement.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }

    handleKeyDown(e) {
        if (!this.isRunning) return;
        const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!validKeys.includes(e.key)) return;
        e.preventDefault();
        
        let moved = false;
        switch (e.key) {
            case 'ArrowUp': moved = this.move('up'); break;
            case 'ArrowDown': moved = this.move('down'); break;
            case 'ArrowLeft': moved = this.move('left'); break;
            case 'ArrowRight': moved = this.move('right'); break;
        }
        
        if (moved) {
            this.addRandomNumber();
            this.render();
            this.updateUI();
            this.checkGameStatus();
        }
    }

    handleTouchStart(e) {
        if (!this.isRunning) return;
        e.preventDefault();
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
    }

    handleTouchEnd(e) {
        if (!this.isRunning || !this.startX || !this.startY) return;
        e.preventDefault();
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = this.startX - endX;
        const diffY = this.startY - endY;
        
        let moved = false;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 30) moved = this.move(diffX > 0 ? 'left' : 'right');
        } else {
            if (Math.abs(diffY) > 30) moved = this.move(diffY > 0 ? 'up' : 'down');
        }
        
        if (moved) {
            this.addRandomNumber();
            this.render();
            this.updateUI();
            this.checkGameStatus();
        }
        
        this.startX = this.startY = null;
    }

    addRandomNumber() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) emptyCells.push({ x: i, y: j });
            }
        }
        if (emptyCells.length > 0) {
            const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(direction) {
        const oldBoard = JSON.stringify(this.board);
        
        switch (direction) {
            case 'left': this.moveLeft(); break;
            case 'right': this.moveRight(); break;
            case 'up': this.moveUp(); break;
            case 'down': this.moveDown(); break;
        }
        
        return oldBoard !== JSON.stringify(this.board);
    }

    moveLeft() {
        for (let i = 0; i < this.size; i++) {
            let row = this.board[i].filter(val => val !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2; this.score += row[j]; row.splice(j + 1, 1);
                }
            }
            while (row.length < this.size) row.push(0);
            this.board[i] = row;
        }
    }

    moveRight() {
        for (let i = 0; i < this.size; i++) {
            let row = this.board[i].filter(val => val !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2; this.score += row[j]; row.splice(j - 1, 1); j--;
                }
            }
            while (row.length < this.size) row.unshift(0);
            this.board[i] = row;
        }
    }

    moveUp() {
        for (let j = 0; j < this.size; j++) {
            let col = [];
            for (let i = 0; i < this.size; i++) if (this.board[i][j] !== 0) col.push(this.board[i][j]);
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2; this.score += col[i]; col.splice(i + 1, 1);
                }
            }
            while (col.length < this.size) col.push(0);
            for (let i = 0; i < this.size; i++) this.board[i][j] = col[i];
        }
    }

    moveDown() {
        for (let j = 0; j < this.size; j++) {
            let col = [];
            for (let i = 0; i < this.size; i++) if (this.board[i][j] !== 0) col.push(this.board[i][j]);
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    col[i] *= 2; this.score += col[i]; col.splice(i - 1, 1); i--;
                }
            }
            while (col.length < this.size) col.unshift(0);
            for (let i = 0; i < this.size; i++) this.board[i][j] = col[i];
        }
    }

    checkGameStatus() {
        let maxTile = 0;
        this.board.forEach(row => row.forEach(cell => { if (cell > maxTile) maxTile = cell; }));

        if (maxTile >= 2048 && maxTile > this.lastWinTile && (maxTile & (maxTile - 1)) === 0) {
            this.lastWinTile = maxTile;
            this.showWinMessage(maxTile);
            return;
        }

        if (this.isGameOver()) {
            this.showGameOverMessage();
        }
    }

    isGameOver() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) return false;
                if (j < this.size - 1 && this.board[i][j] === this.board[i][j + 1]) return false;
                if (i < this.size - 1 && this.board[i][j] === this.board[i + 1][j]) return false;
            }
        }
        return true;
    }

    render() {
        if (!this.boardElement) return;
        this.boardElement.innerHTML = '';
        this.boardElement.className = 'game-2048-board';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'game-2048-cell';
                if (this.board[i][j] !== 0) {
                    cell.textContent = this.board[i][j];
                    cell.classList.add(`cell-${this.board[i][j]}`);
                }
                this.boardElement.appendChild(cell);
            }
        }
    }

    showWinMessage(tileValue) {
        this.isRunning = false;
        this.showOverlay(`
            <h2>🎉 恭喜！</h2>
            <p>你成功合成了 ${tileValue}！</p>
            <p>得分: ${this.score}</p>
            <button onclick="gameCollection.currentGame.instance.continueGame()">继续挑战</button>
            <button onclick="gameCollection.currentGame.instance.restart()">重新开始</button>
        `);
    }

    showGameOverMessage() {
        this.isRunning = false;
        this.gameOver = true;
        const isNewRecord = gameCollection.stats.updateHighScore('2048', this.score);
        this.loadHighScore();
        this.showOverlay(`
            <h2>游戏结束</h2>
            <p>得分: ${this.score}</p>
            <p>最高分: ${this.highScore}</p>
            ${isNewRecord ? '<p style="color: #ffd700;">🎉 新纪录！</p>' : ''}
            <button onclick="gameCollection.currentGame.instance.restart()">重新开始</button>
        `);
    }

    showOverlay(content) {
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.innerHTML = `<div class="overlay-content">${content}</div>`;
        this.boardElement.appendChild(overlay);
    }

    continueGame() {
        const overlay = this.boardElement.querySelector('.game-overlay');
        if (overlay) overlay.remove();
        this.isRunning = true;
    }

    updateUI() {
        const scoreElement = document.getElementById('game2048Score');
        const highScoreElement = document.getElementById('game2048HighScore');
        if (scoreElement) scoreElement.textContent = this.score;
        if (highScoreElement) highScoreElement.textContent = this.highScore;
    }

    loadHighScore() {
        const stats = gameCollection.stats.getGameStats('2048');
        this.highScore = stats.highScore;
    }

    pause() {
        this.isRunning = !this.isRunning;
    }

    stop() {
        this.isRunning = false;
        if (this.boundKeyDown) document.removeEventListener('keydown', this.boundKeyDown);
        if (this.boundTouchStart) this.boardElement.removeEventListener('touchstart', this.boundTouchStart);
        if (this.boundTouchEnd) this.boardElement.removeEventListener('touchend', this.boundTouchEnd);
    }
}