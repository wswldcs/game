// 扫雷游戏
class MinesweeperGame {
    constructor(difficulty = 'normal') {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.gameStarted = false;
        
        // 游戏设置
        this.canvasWidth = 480;
        this.canvasHeight = 480;
        this.cellSize = 30;
        
        // 难度设置
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            normal: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 20, cols: 24, mines: 99 }
        };
        
        this.currentDifficulty = difficulty;
        this.rows = 9;
        this.cols = 9;
        this.totalMines = 10;
        
        // 游戏状态
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameWon = false;
        this.gameOver = false;
        this.firstClick = true;
        this.minesLeft = 0;
        this.timeElapsed = 0;
        this.startTime = 0;
        this.timer = null;
        this.highScore = 0;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('minesweeperCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // 根据难度设置游戏参数
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        
        // 调整画布大小
        this.canvasWidth = this.cols * this.cellSize;
        this.canvasHeight = this.rows * this.cellSize;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.loadHighScore();
        this.bindEvents();
        this.reset();
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver || this.gameWon) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                this.revealCell(x, y);
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameOver || this.gameWon) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                this.toggleFlag(x, y);
            }
        });
    }

    start() {
        this.isRunning = true;
        this.gameStarted = false;
        this.reset();
    }

    pause() {
        // 扫雷游戏不支持暂停，因为它是基于时间的
        // 但提供空方法以保持接口一致性
        return;
    }

    pause() {
        if (this.isRunning && this.gameStarted) {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
                this.isRunning = false;
            } else {
                this.startTimer();
                this.isRunning = true;
            }
        }
    }

    stop() {
        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    restart() {
        this.stop();
        this.start();
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        const config = this.difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        
        // 调整画布大小
        this.canvasWidth = this.cols * this.cellSize;
        this.canvasHeight = this.rows * this.cellSize;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.restart();
    }

    reset() {
        // 初始化游戏板
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        
        this.gameWon = false;
        this.gameOver = false;
        this.firstClick = true;
        this.minesLeft = this.totalMines;
        this.timeElapsed = 0;
        this.startTime = 0;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.updateUI();
        this.draw();
    }

    generateMines(excludeX, excludeY) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.totalMines) {
            const x = Math.floor(Math.random() * this.cols);
            const y = Math.floor(Math.random() * this.rows);
            
            // 不在第一次点击的位置和周围放置地雷
            if (Math.abs(x - excludeX) <= 1 && Math.abs(y - excludeY) <= 1) {
                continue;
            }
            
            if (this.board[y][x] !== -1) {
                this.board[y][x] = -1; // -1 表示地雷
                minesPlaced++;
            }
        }
        
        // 计算每个格子周围的地雷数量
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x] !== -1) {
                    this.board[y][x] = this.countAdjacentMines(x, y);
                }
            }
        }
    }

    countAdjacentMines(x, y) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                    if (this.board[ny][nx] === -1) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }

    revealCell(x, y) {
        if (this.revealed[y][x] || this.flagged[y][x]) return;
        
        // 第一次点击时生成地雷
        if (this.firstClick) {
            this.generateMines(x, y);
            this.firstClick = false;
            this.gameStarted = true;
            this.startTime = Date.now();
            this.startTimer();
        }
        
        this.revealed[y][x] = true;
        
        // 如果点击的是地雷
        if (this.board[y][x] === -1) {
            this.gameOver = true;
            this.revealAllMines();
            this.stopTimer();
            this.draw();
            setTimeout(() => this.showGameOverMessage(), 100);
            return;
        }
        
        // 如果是空格子，自动揭开周围的格子
        if (this.board[y][x] === 0) {
            this.revealAdjacentCells(x, y);
        }
        
        // 检查是否获胜
        this.checkWin();
        this.draw();
    }

    revealAdjacentCells(x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                    if (!this.revealed[ny][nx] && !this.flagged[ny][nx]) {
                        this.revealCell(nx, ny);
                    }
                }
            }
        }
    }

    toggleFlag(x, y) {
        if (this.revealed[y][x]) return;
        
        this.flagged[y][x] = !this.flagged[y][x];
        this.minesLeft += this.flagged[y][x] ? -1 : 1;
        
        this.updateUI();
        this.draw();
    }

    revealAllMines() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x] === -1) {
                    this.revealed[y][x] = true;
                }
            }
        }
    }

    checkWin() {
        let revealedCount = 0;
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.revealed[y][x] && this.board[y][x] !== -1) {
                    revealedCount++;
                }
            }
        }
        
        if (revealedCount === this.rows * this.cols - this.totalMines) {
            this.gameWon = true;
            this.stopTimer();
            
            // 检查是否创造新纪录
            const isNewRecord = gameCollection.stats.updateHighScore('minesweeper', this.timeElapsed);
            this.loadHighScore();
            
            setTimeout(() => this.showWinMessage(isNewRecord), 100);
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateUI();
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 绘制格子
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.drawCell(x, y);
            }
        }
        
        // 绘制网格线
        this.drawGrid();
    }

    drawCell(x, y) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        if (this.revealed[y][x]) {
            // 已揭开的格子
            this.ctx.fillStyle = this.board[y][x] === -1 ? '#ff0000' : '#e0e0e0';
            this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
            
            if (this.board[y][x] === -1) {
                // 绘制地雷
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(cellX + this.cellSize / 2, cellY + this.cellSize / 2, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (this.board[y][x] > 0) {
                // 绘制数字
                this.ctx.fillStyle = this.getNumberColor(this.board[y][x]);
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    this.board[y][x].toString(),
                    cellX + this.cellSize / 2,
                    cellY + this.cellSize / 2 + 5
                );
            }
        } else {
            // 未揭开的格子
            this.ctx.fillStyle = '#c0c0c0';
            this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
            
            // 绘制3D效果
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(cellX, cellY, this.cellSize - 1, 1);
            this.ctx.fillRect(cellX, cellY, 1, this.cellSize - 1);
            this.ctx.fillStyle = '#808080';
            this.ctx.fillRect(cellX + this.cellSize - 1, cellY, 1, this.cellSize);
            this.ctx.fillRect(cellX, cellY + this.cellSize - 1, this.cellSize, 1);
        }
        
        // 绘制旗帜
        if (this.flagged[y][x]) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🚩', cellX + this.cellSize / 2, cellY + this.cellSize / 2 + 6);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#808080';
        this.ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvasHeight);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvasWidth, y * this.cellSize);
            this.ctx.stroke();
        }
    }

    getNumberColor(number) {
        const colors = {
            1: '#0000ff',
            2: '#008000',
            3: '#ff0000',
            4: '#000080',
            5: '#800000',
            6: '#008080',
            7: '#000000',
            8: '#808080'
        };
        return colors[number] || '#000000';
    }

    showWinMessage(isNewRecord) {
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2>🎉 恭喜获胜！</h2>
                <p>用时: ${this.timeElapsed}秒</p>
                <p>难度: ${this.getDifficultyName()}</p>
                <p>最佳时间: ${this.highScore}秒</p>
                ${isNewRecord ? '<p style="color: #ffd700;">🎉 新纪录！</p>' : ''}
                <button onclick="gameCollection.minesweeperGame.restartAndCloseOverlay()">重新开始</button>
            </div>
        `;
        
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(overlay);
    }

    showGameOverMessage() {
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2>💥 游戏结束</h2>
                <p>踩到地雷了！</p>
                <p>用时: ${this.timeElapsed}秒</p>
                <p>难度: ${this.getDifficultyName()}</p>
                <button onclick="gameCollection.minesweeperGame.restartAndCloseOverlay()">重新开始</button>
            </div>
        `;
        
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(overlay);
    }

    restartAndCloseOverlay() {
        // 移除覆盖层
        const overlays = document.querySelectorAll('.game-overlay');
        overlays.forEach(overlay => overlay.remove());
        
        // 重新开始游戏
        this.restart();
    }

    getDifficultyName() {
        const names = {
            easy: '初级',
            normal: '中级',
            hard: '高级'
        };
        return names[this.currentDifficulty] || '自定义';
    }

    pause() {
        // 扫雷游戏的暂停功能主要是停止计时器
        if (this.timer && this.gameStarted && !this.gameOver && !this.gameWon) {
            clearInterval(this.timer);
            this.timer = null;
            this.isRunning = false;
        } else if (!this.timer && this.gameStarted && !this.gameOver && !this.gameWon) {
            this.startTimer();
            this.isRunning = true;
        }
    }

    updateUI() {
        const minesElement = document.getElementById('minesweeperMines');
        const timeElement = document.getElementById('minesweeperTime');
        const difficultyElement = document.getElementById('minesweeperDifficulty');
        const highScoreElement = document.getElementById('minesweeperHighScore');
        
        if (minesElement) minesElement.textContent = this.minesLeft;
        if (timeElement) timeElement.textContent = this.timeElapsed;
        if (difficultyElement) difficultyElement.textContent = this.getDifficultyName();
        if (highScoreElement) highScoreElement.textContent = this.highScore;
    }

    loadHighScore() {
        const stats = gameCollection.stats.getGameStats('minesweeper');
        this.highScore = stats.highScore || 999;
        this.updateUI();
    }
}