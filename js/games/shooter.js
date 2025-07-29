// 打飞机大战游戏
class ShooterGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.gameLoop = null;
        
        // 游戏设置
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // 游戏状态
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = 0;
        this.difficulty = 'normal';
        
        // 游戏对象
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        
        // 游戏计时器
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.lastTime = 0;
        
        // 难度设置
        this.difficultySettings = {
            easy: {
                enemySpeed: 1,
                enemySpawnRate: 120,
                bulletSpeed: 8,
                enemyHealth: 1
            },
            normal: {
                enemySpeed: 2,
                enemySpawnRate: 90,
                bulletSpeed: 10,
                enemyHealth: 2
            },
            hard: {
                enemySpeed: 3,
                enemySpawnRate: 60,
                bulletSpeed: 12,
                enemyHealth: 3
            }
        };
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('shooterCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.loadHighScore();
        this.bindEvents();
        this.initPlayer();
        this.render(); // 启动渲染循环
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.initPlayer();
    }

    bindEvents() {
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            const relevantKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'A', 'd', 'D', 'w', 'W', 's', 'S', ' '];
            if (relevantKeys.includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === ' ') {
                if (this.isRunning) {
                    this.shoot();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // 鼠标控制
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isRunning) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.player.x = mouseX - this.player.width / 2;
            this.player.y = mouseY - this.player.height / 2;
            
            // 限制玩家在画布内
            this.player.x = Math.max(0, Math.min(this.canvasWidth - this.player.width, this.player.x));
            this.player.y = Math.max(0, Math.min(this.canvasHeight - this.player.height, this.player.y));
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.isRunning) {
                this.shoot();
            }
        });
    }

    initPlayer() {
        this.player = {
            x: this.canvasWidth / 2 - 25,
            y: this.canvasHeight - 80,
            width: 50,
            height: 60,
            speed: 5,
            health: 100,
            maxHealth: 100
        };
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        this.initPlayer();
        this.updateUI();
    }

    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }

    pause() {
        this.isRunning = !this.isRunning;
    }

    restart() {
        this.stop();
        this.start();
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        this.handleInput(deltaTime);
        this.updateBullets(deltaTime);
        this.updateEnemies(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.spawnEnemies(deltaTime);
        this.spawnPowerUps(deltaTime);
        this.updateUI();
    }

    render() {
        const now = performance.now();
        const deltaTime = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.render());
    }

    handleInput() {
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.player.y += this.player.speed;
        }
        
        // 限制玩家在画布内
        this.player.x = Math.max(0, Math.min(this.canvasWidth - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvasHeight - this.player.height, this.player.y));
    }

    shoot() {
        const settings = this.difficultySettings[this.difficulty];
        
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: settings.bulletSpeed,
            damage: 1
        });
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            
            if (bullet.y < -bullet.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnEnemies() {
        const settings = this.difficultySettings[this.difficulty];
        this.enemySpawnTimer++;
        
        if (this.enemySpawnTimer >= settings.enemySpawnRate) {
            this.enemySpawnTimer = 0;
            
            const enemy = {
                x: Math.random() * (this.canvasWidth - 40),
                y: -40,
                width: 40,
                height: 40,
                speed: settings.enemySpeed + Math.random(),
                health: settings.enemyHealth,
                maxHealth: settings.enemyHealth,
                type: Math.random() < 0.8 ? 'normal' : 'fast'
            };
            
            if (enemy.type === 'fast') {
                enemy.speed *= 1.5;
                enemy.width = 30;
                enemy.height = 30;
            }
            
            this.enemies.push(enemy);
        }
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed;
            
            if (enemy.y > this.canvasHeight) {
                this.enemies.splice(i, 1);
                this.lives--;
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    spawnPowerUps() {
        this.powerUpSpawnTimer++;
        
        if (this.powerUpSpawnTimer >= 600) {
            this.powerUpSpawnTimer = 0;
            
            this.powerUps.push({
                x: Math.random() * (this.canvasWidth - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 2,
                type: Math.random() < 0.5 ? 'health' : 'score'
            });
        }
    }

    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;
            
            if (powerUp.y > this.canvasHeight) {
                this.powerUps.splice(i, 1);
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // 子弹与敌机碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(i, 1);
                    enemy.health -= bullet.damage;
                    
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += enemy.type === 'fast' ? 20 : 10;
                        
                        if (this.score > 0 && this.score % 500 === 0) {
                            this.level++;
                        }
                    }
                    break;
                }
            }
        }
        
        // 玩家与敌机碰撞
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(i, 1);
                this.player.health -= 20;
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                if (this.player.health <= 0) {
                    this.lives--;
                    this.player.health = this.player.maxHealth;
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
        
        // 玩家与道具碰撞
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            if (this.isColliding(this.player, powerUp)) {
                this.powerUps.splice(i, 1);
                
                if (powerUp.type === 'health') {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                } else if (powerUp.type === 'score') {
                    this.score += 50;
                }
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`
            });
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 绘制星空背景
        this.drawStars();
        
        // 绘制玩家
        if (this.player) {
           this.drawPlayerSprite();
        }
        
        // 绘制子弹
        this.drawBullets();
        
        // 绘制敌机
        this.drawEnemies();
        
        // 绘制道具
        this.drawPowerUps();
        
        // 绘制粒子效果
        this.drawParticles();
    }

    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvasWidth;
            const y = (i * 73 + Date.now() * 0.01) % this.canvasHeight;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    drawPlayerSprite() {
        // 绘制玩家飞机
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 绘制玩家血条
        const healthBarWidth = this.player.width;
        const healthBarHeight = 4;
        const healthPercent = this.player.health / this.player.maxHealth;
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.player.x, this.player.y - 8, healthBarWidth, healthBarHeight);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.player.x, this.player.y - 8, healthBarWidth * healthPercent, healthBarHeight);
    }

    drawBullets() {
        this.ctx.fillStyle = '#ffffff';
        for (const bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    drawEnemies() {
        for (const enemy of this.enemies) {
            this.ctx.fillStyle = enemy.type === 'fast' ? '#ff0000' : '#0000ff';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }

    drawPowerUps() {
        for (const powerUp of this.powerUps) {
            this.ctx.fillStyle = powerUp.type === 'health' ? '#00ff00' : '#ffff00';
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }
    }

    drawParticles() {
        for (const particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 2, 2);
        }
    }

    updateUI() {
       const scoreEl = document.getElementById('shooterScore');
       const livesEl = document.getElementById('shooterLives');
       const levelEl = document.getElementById('shooterLevel');
       const highScoreEl = document.getElementById('shooterHighScore');

       if(scoreEl) scoreEl.textContent = this.score;
       if(livesEl) livesEl.textContent = this.lives;
       if(levelEl) levelEl.textContent = this.level;
       if(highScoreEl) highScoreEl.textContent = this.highScore;
   }

    gameOver() {
        this.stop();
        this.saveHighScore();
        
        // 显示游戏结束画面
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', this.canvasWidth / 2, this.canvasHeight / 2 - 60);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`得分: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 - 20);
        this.ctx.fillText(`最高分: ${this.highScore}`, this.canvasWidth / 2, this.canvasHeight / 2 + 10);
        
        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('点击重新开始按钮继续游戏', this.canvasWidth / 2, this.canvasHeight / 2 + 80);
    }

    loadHighScore() {
        const stats = gameCollection.stats.getGameStats('shooter');
        this.highScore = stats.highScore;
        this.updateUI();
    }

    saveHighScore() {
        gameCollection.stats.updateHighScore('shooter', this.score);
        this.loadHighScore();
    }
}
