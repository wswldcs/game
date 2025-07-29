// 俄罗斯方块游戏
class TetrisGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // 游戏设置
        this.canvasWidth = 320;
        this.canvasHeight = 640;
        this.blockSize = 32;
        this.boardWidth = 10;
        this.boardHeight = 20;
        
        // 游戏状态
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.highScore = 0;
        this.dropTime = 0;
        this.dropInterval = 1000; // 毫秒
        
        // 方块定义
        this.pieces = [
            // I 方块
            {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f0f0'
            },
            // O 方块
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#f0f000'
            },
            // T 方块
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0'
            },
            // S 方块
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00f000'
            },
            // Z 方块
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#f00000'
            },
            // J 方块
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000f0'
            },
            // L 方块
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#f0a000'
            }
        ];
        
        this.init();
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.dropInterval = 1500; // 更慢的下落速度
                break;
            case 'normal':
                this.dropInterval = 1000; // 正常速度
                break;
            case 'hard':
                this.dropInterval = 500; // 更快的下落速度
                break;
        }
    }

    init() {
        this.canvas = document.getElementById('tetrisCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.loadHighScore();
        this.bindEvents();
        this.reset();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;

            if (e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.pause();
                return;
            }

            if (this.isPaused || !this.currentPiece) return;
            
            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.dropTime = Date.now();
        
        if (!this.currentPiece) {
            this.spawnPiece();
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    pause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.isRunning) {
            this.dropTime = Date.now();
            this.gameLoop = requestAnimationFrame(() => this.update());
        }
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    restart() {
        this.stop();
        this.reset();
        this.start();
    }

    reset() {
        // 初始化游戏板
        this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.updateUI();
        this.draw();
    }

    spawnPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.getRandomPiece();
        }
        
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        
        // 设置初始位置
        this.currentPiece.x = Math.floor((this.boardWidth - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;
        
        // 检查游戏结束
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }

    getRandomPiece() {
        const template = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        return {
            shape: template.shape.map(row => [...row]),
            color: template.color,
            x: 0,
            y: 0
        };
    }

    update() {
        if (!this.isRunning || this.isPaused) return;
        
        const now = Date.now();
        
        // 自动下落
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }
        
        this.draw();
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        } else if (dy > 0) {
            // 方块无法下落，固定到游戏板
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
        }
        
        return false;
    }

    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        // 检查旋转后是否有碰撞
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            // 尝试向左或向右移动来适应旋转
            if (!this.checkCollision(this.currentPiece, -1, 0)) {
                this.currentPiece.x -= 1;
            } else if (!this.checkCollision(this.currentPiece, 1, 0)) {
                this.currentPiece.x += 1;
            } else {
                // 无法旋转，恢复原状
                this.currentPiece.shape = originalShape;
            }
        }
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }

    hardDrop() {
        if (!this.currentPiece) return;
        
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            this.score += 2; // 硬降奖励分数
        }
        
        this.placePiece();
        this.clearLines();
        this.spawnPiece();
        this.updateUI();
    }

    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    // 检查边界
                    if (boardX < 0 || boardX >= this.boardWidth || 
                        boardY >= this.boardHeight) {
                        return true;
                    }
                    
                    // 检查与已放置方块的碰撞
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    placePiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0 && boardY < this.boardHeight && 
                        boardX >= 0 && boardX < this.boardWidth) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                // 清除这一行
                this.board.splice(y, 1);
                this.board.unshift(Array(this.boardWidth).fill(0));
                linesCleared++;
                y++; // 重新检查同一行
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // 计算分数
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[linesCleared] * this.level;
            
            // 升级
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
            
            this.updateUI();
        }
    }

    gameOver() {
        this.stop();
        
        // 检查是否创造新纪录
        const isNewRecord = gameCollection.stats.updateHighScore('tetris', this.score);
        this.loadHighScore();
        
        // 显示游戏结束画面
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', this.canvasWidth / 2, this.canvasHeight / 2 - 80);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`得分: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 - 40);
        this.ctx.fillText(`行数: ${this.lines}`, this.canvasWidth / 2, this.canvasHeight / 2 - 10);
        this.ctx.fillText(`等级: ${this.level}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);
        this.ctx.fillText(`最高分: ${this.highScore}`, this.canvasWidth / 2, this.canvasHeight / 2 + 50);
        
        if (isNewRecord) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎉 新纪录！', this.canvasWidth / 2, this.canvasHeight / 2 + 80);
        }
        
        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('点击重新开始按钮继续游戏', this.canvasWidth / 2, this.canvasHeight / 2 + 120);
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 绘制游戏板
        this.drawBoard();
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
        
        // 绘制网格
        this.drawGrid();
        
        // 如果暂停，显示暂停文字
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvasWidth / 2, this.canvasHeight / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('按P继续', this.canvasWidth / 2, this.canvasHeight / 2 + 30);
        }
        
        // 如果游戏未开始，显示提示
        if (!this.isRunning && !this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击开始按钮开始游戏', this.canvasWidth / 2, this.canvasHeight / 2 - 20);
            this.ctx.font = '14px Arial';
            this.ctx.fillText('方向键移动，上键旋转，空格硬降', this.canvasWidth / 2, this.canvasHeight / 2 + 10);
        }
    }

    drawBoard() {
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
    }

    drawPiece(piece) {
        this.ctx.fillStyle = piece.color;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.ctx.fillRect(
                        (piece.x + x) * this.blockSize,
                        (piece.y + y) * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = 0; x <= this.boardWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvasHeight);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= this.boardHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvasWidth, y * this.blockSize);
            this.ctx.stroke();
        }
    }

    updateUI() {
        const scoreElement = document.getElementById('tetrisScore');
        const linesElement = document.getElementById('tetrisLines');
        const levelElement = document.getElementById('tetrisLevel');
        const highScoreElement = document.getElementById('tetrisHighScore');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (linesElement) linesElement.textContent = this.lines;
        if (levelElement) levelElement.textContent = this.level;
        if (highScoreElement) highScoreElement.textContent = this.highScore;
    }

    loadHighScore() {
        const stats = gameCollection.stats.getGameStats('tetris');
        this.highScore = stats.highScore;
        this.updateUI();
    }
}