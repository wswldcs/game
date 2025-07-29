// 连连看游戏
class MatchGame {
    constructor() {
        this.board = null;
        this.grid = [];
        this.rows = 10;
        this.cols = 16;
        this.tileTypes = 20;
        this.tileEmojis = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝", "🍅", "🍆", "🥑", "🥦", "🌽", "🥕", "🌶️", "🍄", "🥜", "🌰", "🍞", "🥐", "🥨", "🧀", "🥚", "🥓", "🥩", "🍗", "🍖", "🍔"];
        this.firstTile = null;
        this.secondTile = null;
        this.score = 0;
        this.timer = 60;
        this.intervalId = null;
        this.difficulty = 'normal';
        this.isRunning = false;
        this.boundClickHandler = null;
    }

    init() {
        this.board = document.getElementById('matchBoard');
        if (!this.board) {
            console.error('matchBoard element not found');
            return;
        }
        this.setDifficulty(this.difficulty); // Set initial size
        this.bindEvents();
        this.updateUI();
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.rows = 8;
                this.cols = 12;
                this.tileTypes = 15;
                this.initialTime = 90;
                break;
            case 'normal':
                this.rows = 10;
                this.cols = 16;
                this.tileTypes = 20;
                this.initialTime = 60;
                break;
            case 'hard':
                this.rows = 12;
                this.cols = 20;
                this.tileTypes = 30;
                this.initialTime = 45;
                break;
        }
        this.timer = this.initialTime;
        if(this.board) {
            this.board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        }
    }

    generateGrid() {
        this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        const pairs = (this.rows * this.cols) / 2;
        let tiles = [];
        for (let i = 0; i < pairs; i++) {
            const type = this.tileEmojis[i % this.tileTypes];
            tiles.push(type, type);
        }

        // Fisher-Yates shuffle
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = tiles.pop();
            }
        }
    }

    drawBoard() {
        if (!this.board) return;
        this.board.innerHTML = '';
        this.board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = document.createElement('div');
                tile.className = 'match-tile';
                if (this.grid[r][c] !== 0) {
                    tile.dataset.type = this.grid[r][c];
                    tile.textContent = this.grid[r][c];
                } else {
                    tile.classList.add('empty');
                }
                tile.dataset.row = r;
                tile.dataset.col = c;
                this.board.appendChild(tile);
            }
        }
    }

    bindEvents() {
        if (this.boundClickHandler) {
            this.board.removeEventListener('click', this.boundClickHandler);
        }
        this.boundClickHandler = this.handleTileClick.bind(this);
        this.board.addEventListener('click', this.boundClickHandler);
    }

    handleTileClick(e) {
        if (!this.isRunning || !e.target.classList.contains('match-tile') || e.target.classList.contains('empty')) return;
        
        const tileElement = e.target;
        if (this.firstTile === tileElement) return;

        tileElement.classList.add('selected');

        if (!this.firstTile) {
            this.firstTile = tileElement;
        } else {
            this.secondTile = tileElement;
            this.checkMatch();
        }
    }

    checkMatch() {
        const type1 = this.firstTile.dataset.type;
        const type2 = this.secondTile.dataset.type;

        if (type1 === type2 && this.isValidPath(this.firstTile, this.secondTile)) {
            this.removeTiles();
            this.score += 10;
            this.updateUI();
            this.checkWin();
        } else {
            setTimeout(() => {
                this.firstTile.classList.remove('selected');
                this.secondTile.classList.remove('selected');
                this.clearSelection();
            }, 300);
        }
    }
    
    removeTiles() {
        const r1 = parseInt(this.firstTile.dataset.row);
        const c1 = parseInt(this.firstTile.dataset.col);
        const r2 = parseInt(this.secondTile.dataset.row);
        const c2 = parseInt(this.secondTile.dataset.col);

        this.grid[r1][c1] = 0;
        this.grid[r2][c2] = 0;
        
        this.firstTile.classList.add('empty');
        this.secondTile.classList.add('empty');
        this.firstTile.textContent = '';
        this.secondTile.textContent = '';

        this.clearSelection();
    }
    
    clearSelection() {
        this.firstTile = null;
        this.secondTile = null;
    }

    isValidPath(tile1, tile2) {
        const p1 = { r: parseInt(tile1.dataset.row), c: parseInt(tile1.dataset.col) };
        const p2 = { r: parseInt(tile2.dataset.row), c: parseInt(tile2.dataset.col) };

        const tempGrid = this.grid.map(row => [...row]);
        // Temporarily treat the start and end points as empty to allow path finding
        tempGrid[p1.r][p1.c] = 0;
        tempGrid[p2.r][p2.c] = 0;

        const queue = [{ ...p1, turns: -1, dir: null }];
        const visited = new Set([`${p1.r},${p1.c}`]);

        while (queue.length > 0) {
            const { r, c, turns, dir } = queue.shift();

            if (turns > 2) continue;

            // Explore in 4 directions
            const directions = [{ dr: -1, dc: 0, d: 'v' }, { dr: 1, dc: 0, d: 'v' }, { dr: 0, dc: -1, d: 'h' }, { dr: 0, dc: 1, d: 'h' }];
            for (const { dr, dc, d } of directions) {
                let nr = r + dr;
                let nc = c + dc;

                // Keep moving in the same direction
                while (nr >= -1 && nr <= this.rows && nc >= -1 && nc <= this.cols) {
                    const newTurns = (dir !== null && dir !== d) ? turns + 1 : turns;
                    if (newTurns > 2) break;

                    // If we reach the destination
                    if (nr === p2.r && nc === p2.c) {
                        return true;
                    }

                    // If we hit an obstacle (a non-empty tile)
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && tempGrid[nr][nc] !== 0) {
                        break;
                    }
                    
                    const key = `${nr},${nc}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push({ r: nr, c: nc, turns: newTurns, dir: d });
                    }

                    nr += dr;
                    nc += dc;
                }
            }
        }
        return false;
    }

    checkWin() {
        if (this.grid.flat().every(tile => tile === 0)) {
            this.isRunning = false;
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.showGameOverMessage(true);
        }
    }
    
    showGameOverMessage(isWin) {
        const message = isWin ? `恭喜！你完成了连连看！得分: ${this.score}` : '时间到！游戏结束。';
        const overlay = document.createElement('div');
        overlay.className = 'match-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.textAlign = 'center';
        overlay.style.zIndex = '10';
        overlay.style.fontSize = '1.5em';
        overlay.textContent = message;

        this.board.style.position = 'relative';
        this.board.appendChild(overlay);
    }

    start() {
       if (this.isRunning) return;
       this.stop(); // Ensure everything is clean before starting
       
       this.setDifficulty(this.difficulty);
       this.score = 0;
       this.timer = this.initialTime;
       this.isRunning = true;
       
       this.generateGrid();
       this.drawBoard();
       this.updateUI();

       this.intervalId = setInterval(() => {
           if (!this.isRunning) return; // Respect the pause state
           this.timer--;
           this.updateUI();
           if (this.timer <= 0) {
               this.isRunning = false;
               clearInterval(this.intervalId);
               this.intervalId = null;
               this.showGameOverMessage(false);
           }
       }, 1000);
    }

    pause() {
       this.isRunning = !this.isRunning;
       this.updateUI();
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.board) {
            const overlay = this.board.querySelector('.match-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
        // Don't remove the click handler here, it's managed in init/restart
    }

    restart() {
       this.stop();
       this.start();
    }
    
    updateUI() {
        document.getElementById('matchScore').textContent = this.score;
        document.getElementById('matchTime').textContent = this.timer;
    }
}