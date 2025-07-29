// 打砖块游戏
class BreakoutGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // 游戏设置
        this.canvasWidth = 480;
        this.canvasHeight = 320;
        
        // 挡板设置
        this.paddle = {
            width: 75,
            height: 10,
            x: 0,
            y: 0,
            speed: 7
        };
        
        // 球设置
        this.ball = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            radius: 8,
            speed: 4
        };
        
        // 砖块设置
        this.bricks = [];
        this.brickRows = 5;
        this.brickCols = 8;
        this.brickWidth = 55;
        this.brickHeight = 20;
        this.brickPadding = 3;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 15;
        
        // 游戏状态
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = 0;
        
        // 输入控制
        this.keys = {};
        this.mouseX = 0;
        this.boundKeyDown = null;
        this.boundKeyUp = null;
        this.boundMouseMove = null;
        this.boundMouseClick = null;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.ball.speed = 3;
                this.paddle.speed = 5;
                this.brickRows = 3;
                break;
            case 'normal':
                this.ball.speed = 4;
                this.paddle.speed = 7;
                this.brickRows = 5;
                break;
            case 'hard':
                this.ball.speed = 5;
                this.paddle.speed = 9;
                this.brickRows = 7;
                break;
        }
    }

    init() {
        this.canvas = document.getElementById('breakoutCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.loadHighScore();
        this.createLevels();
        this.bindEvents();
        this.reset();
        this.draw(); // Draw initial state
    }

    bindEvents() {
        this.boundKeyDown = (e) => {
            this.keys[e.key] = true;
            const relevantKeys = ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', ' ', 'j', 'J', 'p', 'P'];
            if (relevantKeys.includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === ' ' || e.key === 'j' || e.key === 'J') {
                if (!this.isRunning) this.start();
            }
             if (e.key === 'p' || e.key === 'P') {
                this.pause();
            }
        };
        this.boundKeyUp = (e) => { this.keys[e.key] = false; };
        this.boundMouseMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        };
        this.boundMouseClick = () => { if (!this.isRunning) this.start(); };

        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('click', this.boundMouseClick);
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        // 如果球没有移动，给它一个初始速度
        if (this.ball.dx === 0 && this.ball.dy === 0) {
            this.ball.dx = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
            this.ball.dy = -this.ball.speed;
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    pause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.isRunning) {
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
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.boundMouseMove);
            this.canvas.removeEventListener('click', this.boundMouseClick);
        }
    }

    restart() {
        this.stop();
        this.reset();
        this.start();
    }

    reset() {
        // 重置挡板位置
        this.paddle.x = (this.canvasWidth - this.paddle.width) / 2;
        this.paddle.y = this.canvasHeight - this.paddle.height - 10;
        
        // 重置球位置
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.paddle.y - this.ball.radius;
        this.ball.dx = 0;
        this.ball.dy = 0;
        
        // 重置游戏状态
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // 初始化砖块
        this.initBricks();
        
        this.updateUI();
        this.draw();
    }

    createLevels() {
        this.levels = [
            // Level 1: Standard Wall
            [
                "11111111", "11111111", "22222222", "33333333", "44444444", "55555555"
            ],
            // Level 2: Pyramid
            [
                "00011000", "00122100", "01333310", "14444441", "55555555"
            ],
            // Level 3: Checkerboard
            [
                "10101010", "02020202", "30303030", "04040404", "50505050"
            ],
             // Level 4: Fortress
            [
                "11111111", "10000001", "10222201", "10300301", "10444401", "11111111"
            ],
            // Level 5: Random Scatter
            [
                "01020304", "50102030", "04050102", "30405010", "02030405"
            ]
        ];
    }

    initBricks() {
        this.bricks = [];
        const colors = ['#feca57', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#f0f0f0'];
        const levelLayout = this.levels[this.level - 1];
        if (!levelLayout) return; // No more levels

        const currentBrickRows = levelLayout.length;
        
        for (let row = 0; row < currentBrickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const brickType = parseInt(levelLayout[row][col]);
                if (brickType > 0) {
                     this.bricks.push({
                        x: col * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
                        y: row * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
                        width: this.brickWidth,
                        height: this.brickHeight,
                        color: colors[brickType - 1],
                        visible: true,
                        points: brickType * 10
                    });
                }
            }
        }
    }

    update() {
        if (!this.isRunning || this.isPaused) return;
        
        // 更新挡板位置
        this.updatePaddle();
        
        // 更新球位置
        this.updateBall();
        
        // 检查碰撞
        this.checkCollisions();
        
        // 检查游戏状态
        this.checkGameStatus();
        
        // 绘制游戏
        this.draw();
        
        // 继续游戏循环
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    updatePaddle() {
        // 键盘控制
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.paddle.x += this.paddle.speed;
        }
        
        // 鼠标控制
        if (this.mouseX > 0) {
            this.paddle.x = this.mouseX - this.paddle.width / 2;
        }
        
        // 限制挡板在画布内
        if (this.paddle.x < 0) {
            this.paddle.x = 0;
        }
        if (this.paddle.x + this.paddle.width > this.canvasWidth) {
            this.paddle.x = this.canvasWidth - this.paddle.width;
        }
    }

    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
    }

    checkCollisions() {
        // 墙壁碰撞
        if (this.ball.x + this.ball.radius > this.canvasWidth || this.ball.x - this.ball.radius < 0) {
            this.ball.dx = -this.ball.dx;
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        
        // 底部碰撞（失去生命）
        if (this.ball.y + this.ball.radius > this.canvasHeight) {
            this.lives--;
            this.updateUI();
            
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBall();
            }
        }
        
        // 挡板碰撞
        if (this.ball.x > this.paddle.x && 
            this.ball.x < this.paddle.x + this.paddle.width &&
            this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height) {
            
            // 计算球相对于挡板中心的位置
            const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            this.ball.dx = hitPos * this.ball.speed;
            this.ball.dy = -Math.abs(this.ball.dy);
        }
        
        // 砖块碰撞
        for (let brick of this.bricks) {
            if (brick.visible && 
                this.ball.x > brick.x && 
                this.ball.x < brick.x + brick.width &&
                this.ball.y > brick.y && 
                this.ball.y < brick.y + brick.height) {
                
                this.ball.dy = -this.ball.dy;
                brick.visible = false;
                this.score += brick.points;
                this.updateUI();
                break;
            }
        }
    }

    checkGameStatus() {
        // 检查是否所有砖块都被消除
        const visibleBricks = this.bricks.filter(brick => brick.visible);
        if (visibleBricks.length === 0) {
            this.nextLevel();
        }
    }

    nextLevel() {
        if (this.level >= this.levels.length) {
            this.winGame();
            return;
        }
        this.level++;
        this.ball.speed += 0.5;
        this.initBricks();
        this.resetBall();
        this.updateUI();
    }

    winGame() {
        this.stop();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('恭喜通关!', this.canvasWidth / 2, this.canvasHeight / 2 - 20);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`最终得分: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);
    }

    resetBall() {
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.paddle.y - this.ball.radius;
        this.ball.dx = 0;
        this.ball.dy = 0;
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        this.draw(); // Draw the 'press space to start' message
    }

    gameOver() {
        this.stop();
        
        // 检查是否创造新纪录
        const isNewRecord = gameCollection.stats.updateHighScore('breakout', this.score);
        this.loadHighScore();
        
        // 显示游戏结束画面
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', this.canvasWidth / 2, this.canvasHeight / 2 - 60);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`得分: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 - 20);
        this.ctx.fillText(`关卡: ${this.level}`, this.canvasWidth / 2, this.canvasHeight / 2 + 10);
        this.ctx.fillText(`最高分: ${this.highScore}`, this.canvasWidth / 2, this.canvasHeight / 2 + 40);
        
        if (isNewRecord) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎉 新纪录！', this.canvasWidth / 2, this.canvasHeight / 2 + 70);
        }
        
        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('点击重新开始按钮继续游戏', this.canvasWidth / 2, this.canvasHeight / 2 + 110);
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 绘制砖块
        for (let brick of this.bricks) {
            if (brick.visible) {
                this.ctx.fillStyle = brick.color;
                this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                
                // 添加边框
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        }
        
        // 绘制挡板
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // 绘制球
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.closePath();
        
        // 如果暂停，显示暂停文字
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvasWidth / 2, this.canvasHeight / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('按空格继续', this.canvasWidth / 2, this.canvasHeight / 2 + 30);
        }
        
        // 如果游戏未开始，显示提示
        if (!this.isRunning && !this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击开始按钮或按空格开始游戏', this.canvasWidth / 2, this.canvasHeight / 2);
        }
    }

    updateUI() {
        const scoreElement = document.getElementById('breakoutScore');
        const livesElement = document.getElementById('breakoutLives');
        const levelElement = document.getElementById('breakoutLevel');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = this.lives;
        if (levelElement) levelElement.textContent = this.level;
    }

    loadHighScore() {
        const stats = gameCollection.stats.getGameStats('breakout');
        this.highScore = stats.highScore;
    }
}