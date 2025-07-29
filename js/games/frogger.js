// 青蛙过河游戏
class FroggerGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.grid = 50;
        this.frog = {};
        this.cars = [];
        this.logs = [];
        this.score = 0;
        this.lives = 3;
        this.highScore = 0;
        this.isRunning = false;
        this.difficulty = 'normal';
        this.animationFrameId = null;
        this.boundKeyDown = null;
    }

    init() {
        this.canvas = document.getElementById('froggerCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 650;
        this.canvas.height = 750;
        
        this.setDifficulty(this.difficulty);
        this.loadHighScore();
        this.resetFrog();
        this.createObstacles();
        this.bindEvents();
        this.updateUI();
        // Don't start automatically
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.lives = 5;
                this.speedMultiplier = 0.8;
                break;
            case 'normal':
                this.lives = 3;
                this.speedMultiplier = 1;
                break;
            case 'hard':
                this.lives = 2;
                this.speedMultiplier = 1.5;
                break;
        }
    }
    
    resetFrog() {
        this.frog = {
            x: this.canvas.width / 2 - this.grid / 2,
            y: this.canvas.height - this.grid,
            width: this.grid,
            height: this.grid
        };
    }
    
    createObstacles() {
        // Cars
        this.cars = [];
        this.logs = [];
        // Cars
        for (let i = 0; i < 3; i++) {
            this.cars.push({ x: i * 200, y: this.canvas.height - this.grid * 2, width: this.grid, speed: (2 + Math.random() * 2) * this.speedMultiplier });
            this.cars.push({ x: i * 250, y: this.canvas.height - this.grid * 3, width: this.grid * 2, speed: (-2 - Math.random()) * this.speedMultiplier });
            this.cars.push({ x: i * 150, y: this.canvas.height - this.grid * 4, width: this.grid, speed: (1.5 + Math.random()) * this.speedMultiplier });
        }
        // Logs
        for (let i = 0; i < 2; i++) {
            this.logs.push({ x: i * 300, y: this.canvas.height - this.grid * 6, width: this.grid * 4, speed: (1 + Math.random()) * this.speedMultiplier });
            this.logs.push({ x: i * 400, y: this.canvas.height - this.grid * 7, width: this.grid * 3, speed: (-1.5 - Math.random()) * this.speedMultiplier });
            this.logs.push({ x: i * 250, y: this.canvas.height - this.grid * 8, width: this.grid * 5, speed: (1 + Math.random() * 0.5) * this.speedMultiplier });
        }
    }

    bindEvents() {
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown, true);
        }
        this.boundKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyDown, true);
    }

    handleKeyDown(e) {
        if (!this.isRunning) return;
        e.preventDefault();
        switch (e.key) {
            case 'ArrowUp': this.frog.y -= this.grid; break;
            case 'ArrowDown': if (this.frog.y < this.canvas.height - this.grid) this.frog.y += this.grid; break;
            case 'ArrowLeft': if (this.frog.x > 0) this.frog.x -= this.grid; break;
            case 'ArrowRight': if (this.frog.x < this.canvas.width - this.grid) this.frog.x += this.grid; break;
        }
    }

    render() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.render());
    }

    update() {
       if (!this.isRunning) return;
        // Move cars
        this.cars.forEach(car => {
            car.x += car.speed;
            if (car.speed > 0 && car.x > this.canvas.width) car.x = -car.width;
            else if (car.speed < 0 && car.x < -car.width) car.x = this.canvas.width;
        });
        
        // Move logs
        this.logs.forEach(log => {
            log.x += log.speed;
            if (log.speed > 0 && log.x > this.canvas.width) log.x = -log.width;
            else if (log.speed < 0 && log.x < -log.width) log.x = this.canvas.width;
        });
        
        this.checkCollisions();
        
        // Check for win
        if (this.frog.y < this.grid) {
            this.score += 100;
            this.updateUI();
            this.resetFrog();
        }
    }

    checkCollisions() {
        let onLog = false;
        // On the river
        if (this.frog.y < this.canvas.height - this.grid * 5 && this.frog.y > this.grid) {
            this.logs.forEach(log => {
                if (this.isColliding(this.frog, log)) {
                    this.frog.x += log.speed;
                    onLog = true;
                }
            });
            if (!onLog) {
                this.handleDeath();
            }
        }
        
        // With cars
        this.cars.forEach(car => {
            if (this.isColliding(this.frog, car)) {
                this.handleDeath();
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    handleDeath() {
        this.lives--;
        if (this.lives > 0) {
            this.resetFrog();
        } else {
            this.gameOver();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw water and road
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        this.ctx.fillStyle = 'gray';
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

        // Draw logs
        this.ctx.fillStyle = 'brown';
        this.logs.forEach(log => this.ctx.fillRect(log.x, log.y, log.width, this.grid));
        
        // Draw cars
        this.ctx.fillStyle = 'red';
        this.cars.forEach(car => this.ctx.fillRect(car.x, car.y, car.width, this.grid));
        
        // Draw frog
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(this.frog.x, this.frog.y, this.frog.width, this.frog.height);
        
        this.updateUI();
    }
    
    updateUI() {
        const scoreEl = document.getElementById('froggerScore');
        const livesEl = document.getElementById('froggerLives');
        const highScoreEl = document.getElementById('froggerHighScore');
        if(scoreEl) scoreEl.textContent = this.score;
        if(livesEl) livesEl.textContent = this.lives;
        if(highScoreEl) highScoreEl.textContent = this.highScore;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.score = 0;
        this.setDifficulty(this.difficulty); // Resets lives
        this.resetFrog();
        this.createObstacles();
        this.updateUI();
        this.render();
    }

    pause() {
       this.isRunning = !this.isRunning;
       if (this.isRunning) {
           this.render();
       }
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown, true);
            this.boundKeyDown = null;
        }
    }

    restart() {
       this.stop();
       this.start();
    }
    
    gameOver() {
        this.stop();
        this.saveHighScore();
        this.showEndMessage('Game Over!');
    }

    showEndMessage(message) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '40px "Press Start 2P", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.font = '20px "Press Start 2P", sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    loadHighScore() {
        if (gameCollection && gameCollection.stats) {
            this.highScore = gameCollection.stats.getHighScore('frogger');
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (gameCollection && gameCollection.stats) {
                gameCollection.stats.updateHighScore('frogger', this.highScore);
            }
        }
    }
}