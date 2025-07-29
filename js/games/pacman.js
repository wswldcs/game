// 吃豆人游戏
class PacmanGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.grid = [];
        this.tileSize = 20;
        this.pacman = {};
        this.ghosts = [];
        this.score = 0;
        this.lives = 3;
        this.isRunning = false;
        this.difficulty = 'normal';
        this.animationFrameId = null;
        this.boundKeyDown = null;
        this.pacman.mouthOpen = 0;
        this.pacman.mouthSpeed = 0.05;
        this.highScore = 0;
        this.level = [
            "####################",
            "#P........#........#",
            "#.####.###.###.####.#",
            "#o####.###.###.####o#",
            "#.####.###.###.####.#",
            "#..................#",
            "#.####.#.######.#.####.#",
            "#.####.#.######.#.####.#",
            "#......#...##...#......#",
            "######.### ## ###.######",
            "     #.#      #.#     ",
            "     #.# ###  #.#     ",
            "######.# #  # #.# ######",
            "      .  #  #  .      ",
            "######.# #  # #.# ######",
            "     #.# ###  #.#     ",
            "     #.#      #.#     ",
            "######.### ## ###.######",
            "#..................#",
            "#.####.###.###.####.#",
            "#o..##.......##..o#",
            "###.#..# ### #..#.###",
            "###.#..# ### #..#.###",
            "#...#..#     #..#...#",
            "#.#####.###.###.#####.#",
            "#..................#",
            "####################"
        ];
    }

    init() {
        this.canvas = document.getElementById('pacmanCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.level[0].length * this.tileSize;
        this.canvas.height = this.level.length * this.tileSize;
        
        this.setDifficulty(this.difficulty);
        this.loadHighScore();
        this.updateUI();
        this.bindEvents();
        // Don't start automatically
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.lives = 5;
                this.ghostSpeed = 0.04;
                break;
            case 'normal':
                this.lives = 3;
                this.ghostSpeed = 0.06;
                break;
            case 'hard':
                this.lives = 2;
                this.ghostSpeed = 0.08;
                break;
        }
    }

    parseLevel() {
        this.grid = this.level.map(row => row.split(''));
        this.dotsCount = this.grid.flat().filter(c => c === '.' || c === 'o').length;
    }

    resetPositions() {
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                if (this.level[r][c] === 'P') {
                    this.pacman = { x: c, y: r, dir: 'right', nextDir: 'right', mouthOpen: 0, mouthSpeed: 0.08 };
                }
            }
        }
        
        this.ghosts = [
            { x: 9, y: 15, dir: 'left', color: 'red', speed: this.ghostSpeed },
            { x: 10, y: 15, dir: 'right', color: 'pink', speed: this.ghostSpeed },
            { x: 9, y: 16, dir: 'left', color: 'cyan', speed: this.ghostSpeed },
            { x: 10, y: 16, dir: 'right', color: 'orange', speed: this.ghostSpeed }
        ];
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
        switch (e.key) {
            case 'ArrowUp': this.pacman.nextDir = 'up'; e.preventDefault(); break;
            case 'ArrowDown': this.pacman.nextDir = 'down'; e.preventDefault(); break;
            case 'ArrowLeft': this.pacman.nextDir = 'left'; e.preventDefault(); break;
            case 'ArrowRight': this.pacman.nextDir = 'right'; e.preventDefault(); break;
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
        this.movePacman();
        this.moveGhosts();
        this.checkCollisions();
    }

    movePacman() {
        this.pacman.mouthOpen += this.pacman.mouthSpeed;
        if (this.pacman.mouthOpen > Math.PI / 4 || this.pacman.mouthOpen < 0) {
            this.pacman.mouthSpeed *= -1;
        }
        
        let { x, y, dir, nextDir } = this.pacman;
        const speed = 0.1; // tiles per frame
        
        const currentTileX = Math.round(x);
        const currentTileY = Math.round(y);

        // Allow direction change only at tile centers
        if (Math.abs(x - currentTileX) < speed && Math.abs(y - currentTileY) < speed) {
            if (this.canMove(currentTileX, currentTileY, nextDir)) {
                this.pacman.dir = nextDir;
                this.pacman.x = currentTileX;
                this.pacman.y = currentTileY;
            }
        }
        
        dir = this.pacman.dir;
        let newX = x, newY = y;

        switch(dir) {
            case 'up': newY -= speed; break;
            case 'down': newY += speed; break;
            case 'left': newX -= speed; break;
            case 'right': newX += speed; break;
        }

        const nextTileX = Math.floor(newX + (dir === 'right' ? 1 : 0));
        const nextTileY = Math.floor(newY + (dir === 'down' ? 1 : 0));

        if (this.canMove(Math.round(x), Math.round(y), dir)) {
             this.pacman.x = newX;
             this.pacman.y = newY;
        }
        
        // Handle wrapping through tunnels
        if (this.pacman.x < -1) this.pacman.x = this.grid[0].length;
        if (this.pacman.x > this.grid[0].length) this.pacman.x = -1;
    }

    moveGhosts() {
        this.ghosts.forEach(ghost => {
            const speed = ghost.speed;
            const currentTileX = Math.round(ghost.x);
            const currentTileY = Math.round(ghost.y);
            
            if (Math.abs(ghost.x - currentTileX) < speed && Math.abs(ghost.y - currentTileY) < speed) {
                ghost.x = currentTileX;
                ghost.y = currentTileY;

                const possibleMoves = [];
                const directions = ['up', 'down', 'left', 'right'];
                const oppositeDir = { up: 'down', down: 'up', left: 'right', right: 'left' };

                for (const move of directions) {
                    if (move !== oppositeDir[ghost.dir] && this.canMove(currentTileX, currentTileY, move)) {
                        possibleMoves.push(move);
                    }
                }
                
                if (possibleMoves.length > 0) {
                    // Simple AI: try to move towards pacman, otherwise random
                    const dx = this.pacman.x - ghost.x;
                    const dy = this.pacman.y - ghost.y;
                    let preferredMove = null;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        preferredMove = dx > 0 ? 'right' : 'left';
                    } else {
                        preferredMove = dy > 0 ? 'down' : 'up';
                    }
                    if (possibleMoves.includes(preferredMove)) {
                         ghost.dir = preferredMove;
                    } else {
                         ghost.dir = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    }
                } else if (this.canMove(currentTileX, currentTileY, ghost.dir)) {
                    // Continue in same direction if possible
                } else {
                    // Must turn back
                    ghost.dir = oppositeDir[ghost.dir];
                }
            }
            
            switch(ghost.dir) {
                case 'up': ghost.y -= speed; break;
                case 'down': ghost.y += speed; break;
                case 'left': ghost.x -= speed; break;
                case 'right': ghost.x += speed; break;
            }
        });
    }

   canMove(x, y, dir) {
       let targetX = x, targetY = y;
       switch(dir) {
           case 'up': targetY--; break;
           case 'down': targetY++; break;
           case 'left': targetX--; break;
           case 'right': targetX++; break;
       }
       if (targetY < 0 || targetY >= this.grid.length || targetX < 0 || targetX >= this.grid[0].length) {
           return false; // Out of bounds
       }
       return this.grid[targetY][targetX] !== '#';
   }

   checkCollisions() {
       const x = Math.round(this.pacman.x);
       const y = Math.round(this.pacman.y);

       // Pac-Man and dots
       if (this.grid[y] && this.grid[y][x] === '.') {
           this.grid[y][x] = ' ';
           this.score += 10;
           this.dotsCount--;
           this.updateUI();
       } else if (this.grid[y] && this.grid[y][x] === 'o') {
           this.grid[y][x] = ' ';
           this.score += 50;
           this.dotsCount--;
           // Activate ghost frighten mode
           this.updateUI();
       }
       
       if (this.dotsCount === 0) {
           this.winGame();
           return;
       }

       // Pac-Man and ghosts
       this.ghosts.forEach(ghost => {
           const gx = Math.round(ghost.x);
           const gy = Math.round(ghost.y);
           if (x === gx && y === gy) {
               this.lives--;
               this.updateUI();
               if (this.lives > 0) {
                   this.resetPositions();
               } else {
                   this.gameOver();
               }
           }
       });
   }

    draw() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                const char = this.grid[r][c];
                if (char === '#') {
                    this.ctx.fillStyle = 'blue';
                    this.ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                } else if (char === '.') {
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(c * this.tileSize + 8, r * this.tileSize + 8, 4, 4);
                } else if (char === 'o') {
                    this.ctx.fillStyle = 'white';
                    this.ctx.beginPath();
                    this.ctx.arc(c * this.tileSize + 10, r * this.tileSize + 10, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Draw Pac-Man
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        const centerX = this.pacman.x * this.tileSize + this.tileSize / 2;
        const centerY = this.pacman.y * this.tileSize + this.tileSize / 2;
        const radius = this.tileSize / 2 - 2;
        
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        
        switch (this.pacman.dir) {
            case 'right':
                startAngle = this.pacman.mouthOpen;
                endAngle = Math.PI * 2 - this.pacman.mouthOpen;
                break;
            case 'left':
                startAngle = Math.PI + this.pacman.mouthOpen;
                endAngle = Math.PI - this.pacman.mouthOpen;
                break;
            case 'up':
                startAngle = -Math.PI / 2 + this.pacman.mouthOpen;
                endAngle = -Math.PI / 2 - this.pacman.mouthOpen;
                break;
            case 'down':
                startAngle = Math.PI / 2 + this.pacman.mouthOpen;
                endAngle = Math.PI / 2 - this.pacman.mouthOpen;
                break;
        }

        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.lineTo(centerX, centerY);
        this.ctx.fill();

        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.tileSize + this.tileSize / 2, ghost.y * this.tileSize + this.tileSize / 2, this.tileSize / 2 - 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    updateUI() {
        const scoreEl = document.getElementById('pacmanScore');
        const livesEl = document.getElementById('pacmanLives');
        const highScoreEl = document.getElementById('pacmanHighScore');
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = this.lives;
        if (highScoreEl) highScoreEl.textContent = this.highScore;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.score = 0;
        this.setDifficulty(this.difficulty); // Resets lives
        this.parseLevel();
        this.resetPositions();
        this.updateUI();
        this.render();
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
    
    winGame() {
        this.stop();
        this.score += this.lives * 1000; // Bonus for remaining lives
        this.saveHighScore();
        this.updateUI();
        this.showEndMessage('You Win!');
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
            this.highScore = gameCollection.stats.getHighScore('pacman');
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (gameCollection && gameCollection.stats) {
                gameCollection.stats.updateHighScore('pacman', this.highScore);
            }
        }
    }
}