// 贪吃蛇游戏
class SnakeGame {
    constructor(difficulty = 'normal') {
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        this.difficulty = difficulty;
        
        // 游戏设置
        this.gridSize = 20;
        this.tileCount = this.difficulty === 'hard' ? 25 : (this.difficulty === 'easy' ? 15 : 20);
        
        // 游戏状态
        this.snake = [{ x: 10, y: 10 }];
        this.foods = [];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = 0;
        this.speed = 150;
        this.speedModifier = 1;
        this.speedEffectTimer = null;
        this.boundKeyDown = null;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.tileCount = this.difficulty === 'hard' ? 25 : (this.difficulty === 'easy' ? 15 : 20);
        
        if (this.canvas) {
            this.canvas.width = this.gridSize * this.tileCount;
            this.canvas.height = this.gridSize * this.tileCount;
        }
    }

    init() {
        this.canvas = document.getElementById('snakeCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        this.setDifficulty(this.difficulty);
        this.canvas.width = this.gridSize * this.tileCount;
        this.canvas.height = this.gridSize * this.tileCount;
        
        this.loadHighScore();
        this.bindEvents();
        this.reset();
        this.draw();
    }

    bindEvents() {
        this.boundKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyDown, true);
    }

    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused) return;
        
        const keyMap = {
            'ArrowUp': { dx: 0, dy: -1, opposite: 'down' },
            'w': { dx: 0, dy: -1, opposite: 'down' },
            'W': { dx: 0, dy: -1, opposite: 'down' },
            'ArrowDown': { dx: 0, dy: 1, opposite: 'up' },
            's': { dx: 0, dy: 1, opposite: 'up' },
            'S': { dx: 0, dy: 1, opposite: 'up' },
            'ArrowLeft': { dx: -1, dy: 0, opposite: 'right' },
            'a': { dx: -1, dy: 0, opposite: 'right' },
            'A': { dx: -1, dy: 0, opposite: 'right' },
            'ArrowRight': { dx: 1, dy: 0, opposite: 'left' },
            'd': { dx: 1, dy: 0, opposite: 'left' },
            'D': { dx: 1, dy: 0, opposite: 'left' },
        };

        const move = keyMap[e.key];
        if (move) {
            e.preventDefault();
            const currentDir = this.getDirection();
            if (currentDir !== move.opposite) {
                this.dx = move.dx;
                this.dy = move.dy;
            }
        }
    }
    
    getDirection() {
        if (this.dx === 1) return 'right';
        if (this.dx === -1) return 'left';
        if (this.dy === 1) return 'down';
        if (this.dy === -1) return 'up';
        return null;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        // 根据难度设置游戏速度
        const baseSpeeds = { easy: 200, normal: 150, hard: 100 };
        this.speed = baseSpeeds[this.difficulty] || 150;
        
        this.rescheduleLoop();
    }

    rescheduleLoop() {
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                this.update();
                this.draw();
            }
        }, this.speed / this.speedModifier);
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.speedEffectTimer) {
            clearTimeout(this.speedEffectTimer);
            this.speedEffectTimer = null;
        }
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown, true);
        }
    }

    restart() {
        this.stop();
        this.reset();
        this.start();
    }

    reset() {
        this.snake = [{ x: Math.floor(this.tileCount / 2), y: Math.floor(this.tileCount / 2) }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.foods = [];
        this.speedModifier = 1;
        this.generateFood();
        this.updateUI();
    }

    update() {
        if (this.dx === 0 && this.dy === 0) return;
        
        // 移动蛇头
        let head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Wall collision (wrap around)
        if (head.x < 0) head.x = this.tileCount - 1;
        if (head.x >= this.tileCount) head.x = 0;
        if (head.y < 0) head.y = this.tileCount - 1;
        if (head.y >= this.tileCount) head.y = 0;
        
        // Check self-collision
        if (this.checkSelfCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check for food collision
        const eatenFoodIndex = this.foods.findIndex(f => f.x === head.x && f.y === head.y);
        if (eatenFoodIndex > -1) {
            const food = this.foods[eatenFoodIndex];
            this.score += food.points;
            this.applyFoodEffect(food);
            this.foods.splice(eatenFoodIndex, 1);
            if (this.foods.length === 0) { // Generate new food if all are eaten
                this.generateFood();
            }
        } else {
            this.snake.pop();
        }
        this.updateUI();
    }

    applyFoodEffect(food) {
        switch(food.type) {
            case 'triple':
                // The head already counted as one growth, add two more
                for(let i=0; i<2; i++) {
                    this.snake.push({...this.snake[this.snake.length-1]});
                }
                break;
            case 'speed-up':
                this.speedModifier = 2;
                this.rescheduleLoop();
                if(this.speedEffectTimer) clearTimeout(this.speedEffectTimer);
                this.speedEffectTimer = setTimeout(() => {
                    this.speedModifier = 1;
                    this.rescheduleLoop();
                }, 5000);
                break;
            case 'slow-down':
                this.speedModifier = 0.5;
                this.rescheduleLoop();
                if(this.speedEffectTimer) clearTimeout(this.speedEffectTimer);
                this.speedEffectTimer = setTimeout(() => {
                    this.speedModifier = 1;
                    this.rescheduleLoop();
                }, 5000);
                break;
            // Default case (normal food) does nothing extra
        }
    }

    checkSelfCollision(head) {
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        return false;
    }

    generateFood() {
        const foodTypes = [
            { type: 'normal', color: '#f00', points: 10 },
            { type: 'triple', color: '#00f', points: 30 },
            { type: 'speed-up', color: '#ff0', points: 20 },
            { type: 'slow-down', color: '#f0f', points: 20 },
        ];
        
        let newFood;
        do {
            const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            newFood = {
                ...type,
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        this.foods.push(newFood);
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制蛇
        this.ctx.fillStyle = '#0f0';
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            // 蛇头颜色稍微不同
            if (i === 0) {
                this.ctx.fillStyle = '#0a0';
            } else {
                this.ctx.fillStyle = '#0f0';
            }
            this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        }
        
        // 绘制食物
        this.foods.forEach(food => {
            this.ctx.fillStyle = food.color;
            this.ctx.fillRect(food.x * this.gridSize, food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });
        
        // 如果暂停，显示暂停文字
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('按空格继续', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }

    gameOver() {
        this.stop();
        
        // 检查是否创造新纪录
        const isNewRecord = gameCollection.stats.updateHighScore('snake', this.score);
        this.loadHighScore();
        
        // 显示游戏结束画面
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`最高分: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        if (isNewRecord) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎉 新纪录！', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
        
        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('点击重新开始按钮继续游戏', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    updateUI() {
        const scoreElement = document.getElementById('snakeScore');
        const lengthElement = document.getElementById('snakeLength');
        const highScoreElement = document.getElementById('snakeHighScore');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (lengthElement) lengthElement.textContent = this.snake.length;
        if (highScoreElement) highScoreElement.textContent = this.highScore;
    }

    loadHighScore() {
        const stats = gameCollection.stats.getGameStats('snake');
        this.highScore = stats.highScore;
        this.updateUI();
    }
}