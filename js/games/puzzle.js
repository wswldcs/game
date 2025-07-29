// 数字拼图游戏
class PuzzleGame {
    constructor() {
        this.board = null;
        this.moves = 0;
        this.size = 4; // 默认4x4
        this.tileSize = 100;
        this.tiles = [];
        this.emptyTile = {};
        this.isSolved = false;
        this.isRunning = false;
        this.difficulty = 'normal';
        this.boundClickHandler = null;
    }

    init() {
        this.board = document.getElementById('puzzleBoard');
        if (!this.board) return;
        
        this.setBoardSize();
        this.createTiles();
        this.draw(); // Draw initial state
        this.updateUI();
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isSolved = false;
        this.shuffle();
        this.draw(); // This was the missing piece
        this.bindEvents();
    }
    
    pause() {
        // This game is turn-based, so pause doesn't need to stop a game loop.
        // We can just set the running state.
        this.isRunning = false;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.size = 3;
                break;
            case 'normal':
                this.size = 4;
                break;
            case 'hard':
                this.size = 5;
                break;
        }
        // Re-initialize with new size, but don't start
        this.init();
    }
    
    setBoardSize() {
        const boardSize = 400;
        const gap = 10;
        this.tileSize = (boardSize - (this.size - 1) * gap) / this.size;
        this.board.style.width = `${boardSize}px`;
        this.board.style.height = `${boardSize}px`;
        this.board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.board.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        this.board.style.gap = `${gap}px`;
    }

    createTiles() {
        this.tiles = [];
        this.board.innerHTML = '';
        for (let i = 0; i < this.size * this.size; i++) {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            // Let CSS handle the size via grid
            tile.style.lineHeight = `${this.tileSize}px`;
            tile.style.fontSize = `${this.tileSize / 2.5}px`;
            
            if (i < this.size * this.size - 1) {
                tile.textContent = i + 1;
                this.tiles.push(i + 1);
            } else {
                tile.textContent = '';
                tile.classList.add('empty');
                this.tiles.push(null); // 空白块
                this.emptyTile = { row: this.size - 1, col: this.size - 1 };
            }
            this.board.appendChild(tile);
        }
    }

    shuffle() {
        // Fisher-Yates shuffle
        let currentIndex = this.tiles.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [this.tiles[currentIndex], this.tiles[randomIndex]] = [this.tiles[randomIndex], this.tiles[currentIndex]];
        }

        // 确保有解
        if (!this.isSolvable()) {
            this.shuffle();
            return;
        }

        // 找到空白块的位置
        const emptyIndex = this.tiles.indexOf(null);
        this.emptyTile = {
            row: Math.floor(emptyIndex / this.size),
            col: emptyIndex % this.size
        };

        this.moves = 0;
        this.isSolved = false;
        this.updateUI();
    }

    isSolvable() {
        let inversions = 0;
        const arr = this.tiles.filter(t => t !== null);
        for (let i = 0; i < arr.length - 1; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }

        if (this.size % 2 === 1) { // 奇数网格
            return inversions % 2 === 0;
        } else { // 偶数网格
            const emptyRow = Math.floor(this.tiles.indexOf(null) / this.size);
            return (inversions + emptyRow) % 2 === 1;
        }
    }

    draw() {
        const tilesElements = this.board.children;
        for (let i = 0; i < this.tiles.length; i++) {
            const tileElement = tilesElements[i];
            const value = this.tiles[i];
            tileElement.textContent = value;
            if (value === null) {
                tileElement.classList.add('empty');
            } else {
                tileElement.classList.remove('empty');
            }
        }
    }

    bindEvents() {
        if (this.boundClickHandler) {
            this.board.removeEventListener('click', this.boundClickHandler);
        }
        this.boundClickHandler = this.handleBoardClick.bind(this);
        this.board.addEventListener('click', this.boundClickHandler);
    }

    handleBoardClick(e) {
        if (!this.isRunning || this.isSolved || !e.target.classList.contains('puzzle-tile')) return;

        const clickedIndex = Array.from(this.board.children).indexOf(e.target);
        const clickedRow = Math.floor(clickedIndex / this.size);
        const clickedCol = clickedIndex % this.size;

        if (this.canMove(clickedRow, clickedCol)) {
            this.moveTile(clickedRow, clickedCol);
        }
    }

    canMove(row, col) {
        const dx = Math.abs(row - this.emptyTile.row);
        const dy = Math.abs(col - this.emptyTile.col);
        return dx + dy === 1;
    }

    moveTile(row, col) {
        const clickedIndex = row * this.size + col;
        const emptyIndex = this.emptyTile.row * this.size + this.emptyTile.col;

        [this.tiles[clickedIndex], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[clickedIndex]];
        
        this.emptyTile.row = row;
        this.emptyTile.col = col;
        this.moves++;
        
        this.draw();
        this.updateUI();
        this.checkWin();
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) {
                return;
            }
        }
        this.isSolved = true;
        this.isRunning = false;
        this.showWinMessage();
    }
    
    showWinMessage() {
        const overlay = document.createElement('div');
        overlay.className = 'puzzle-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.textAlign = 'center';
        overlay.style.zIndex = '10';

        const title = document.createElement('h2');
        title.textContent = '恭喜！';
        title.style.margin = '0';
        title.style.fontSize = '2em';

        const moves = document.createElement('p');
        moves.textContent = `你用 ${this.moves} 步完成了拼图！`;
        moves.style.margin = '10px 0 0';
        moves.style.fontSize = '1.2em';

        overlay.appendChild(title);
        overlay.appendChild(moves);
        
        this.board.style.position = 'relative';
        this.board.appendChild(overlay);
    }
    
    updateUI() {
        const movesElement = document.getElementById('puzzleMoves');
        if (movesElement) movesElement.textContent = this.moves;
    }

    restart() {
        this.stop();
        this.init();
        this.start();
    }

    stop() {
        this.isRunning = false;
        this.isSolved = false;
        if (this.board && this.boundClickHandler) {
            this.board.removeEventListener('click', this.boundClickHandler);
            this.boundClickHandler = null;
        }
        const overlay = this.board.querySelector('.puzzle-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}