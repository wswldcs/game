// 套马游戏
class LassoGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.player = {};
        this.horses = [];
        this.lasso = {};
        this.score = 0;
        this.timer = 60;
        this.highScore = 0;
        this.isRunning = false;
        this.difficulty = 'normal';
        this.animationFrameId = null;
        this.timerInterval = null;
        this.boundKeyDown = null;
    }

    init() {
        this.canvas = document.getElementById('lassoCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = { x: 50, y: this.canvas.height / 2, width: 50, height: 50 };
        this.lasso = { isThrown: false };
        this.setDifficulty(this.difficulty);
        this.loadHighScore();
        this.createHorses();
        this.bindEvents();
        this.updateUI();
        // Don't start automatically
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.initialTime = 90;
                this.horseCount = 4;
                this.speedMultiplier = 0.8;
                break;
            case 'normal':
                this.initialTime = 60;
                this.horseCount = 5;
                this.speedMultiplier = 1;
                break;
            case 'hard':
                this.initialTime = 45;
                this.horseCount = 7;
                this.speedMultiplier = 1.3;
                break;
        }
    }
    
    createHorses() {
        this.horses = [];
        for (let i = 0; i < this.horseCount; i++) {
            this.horses.push({
                x: this.canvas.width + Math.random() * 500,
                y: Math.random() * (this.canvas.height - 50),
                width: 60,
                height: 40,
                speed: (2 + Math.random() * 2) * this.speedMultiplier
            });
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
        const relevantKeys = ['ArrowUp', 'ArrowDown', ' '];
        if (relevantKeys.includes(e.key)) {
            e.preventDefault();
        }

        switch (e.key) {
            case 'ArrowUp': this.player.y = Math.max(0, this.player.y - 10); break;
            case 'ArrowDown': this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + 10); break;
            case ' ': this.throwLasso(); break;
        }
    }
    
    throwLasso() {
        if (!this.lasso.isThrown) {
            this.lasso = {
                x: this.player.x + this.player.width,
                y: this.player.y + this.player.height / 2,
                width: 10,
                height: 10,
                speed: 10,
                isThrown: true
            };
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
        // Move horses
        this.horses.forEach(horse => {
            horse.x -= horse.speed;
            if (horse.x < -horse.width) {
                horse.x = this.canvas.width + Math.random() * 200;
                horse.y = Math.random() * (this.canvas.height - 50);
            }
        });
        
        // Move lasso
        if (this.lasso.isThrown) {
            this.lasso.x += this.lasso.speed;
            if (this.lasso.x > this.canvas.width) {
                this.lasso.isThrown = false;
            }
        }
        
        this.checkCollisions();
    }

    checkCollisions() {
        if (!this.lasso.isThrown) return;
        
        this.horses.forEach((horse, index) => {
            if (this.isColliding(this.lasso, horse)) {
                this.score += 100;
                this.lasso.isThrown = false;
                this.horses.splice(index, 1);
                // Add a new horse
                this.horses.push({
                    x: this.canvas.width + Math.random() * 200,
                    y: Math.random() * (this.canvas.height - 50),
                    width: 60,
                    height: 40,
                    speed: (2 + Math.random() * 2) * this.speedMultiplier
                });
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#87CEEB'; // Sky blue background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw player (cowboy)
        this.ctx.fillStyle = 'brown';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw horses
        this.ctx.fillStyle = 'saddlebrown';
        this.horses.forEach(horse => {
            this.ctx.fillRect(horse.x, horse.y, horse.width, horse.height);
        });
        
        // Draw lasso
        if (this.lasso.isThrown) {
            this.ctx.fillStyle = 'black';
            this.ctx.beginPath();
            this.ctx.arc(this.lasso.x, this.lasso.y, this.lasso.width, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.updateUI();
    }
    
    updateUI() {
        const scoreEl = document.getElementById('lassoScore');
        const timeEl = document.getElementById('lassoTime');
        const highScoreEl = document.getElementById('lassoHighScore');
        if(scoreEl) scoreEl.textContent = this.score;
        if(timeEl) timeEl.textContent = this.timer;
        if(highScoreEl) highScoreEl.textContent = this.highScore;
    }

    start() {
        if (this.isRunning) return;
        this.stop(); // Clear previous state
        
        this.isRunning = true;
        this.setDifficulty(this.difficulty);
        this.timer = this.initialTime;
        this.score = 0;
        
        this.createHorses();
        this.updateUI();
        this.render();

        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;
            this.timer--;
            this.updateUI();
            if (this.timer <= 0) {
                this.gameOver();
            }
        }, 1000);
    }
    
    pause() {
       this.isRunning = !this.isRunning;
       if (this.isRunning) {
           this.render(); // Resume rendering
       }
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
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
        this.showEndMessage(`时间到！你的得分是: ${this.score}`);
    }

    showEndMessage(message) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '40px "Press Start 2P", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.font = '20px "Press Start 2P", sans-serif';
        this.ctx.fillText(`最高分: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    }

    loadHighScore() {
        if (gameCollection && gameCollection.stats) {
            this.highScore = gameCollection.stats.getHighScore('lasso');
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (gameCollection && gameCollection.stats) {
                gameCollection.stats.updateHighScore('lasso', this.highScore);
            }
        }
    }
}