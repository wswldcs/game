// 数独游戏 (v5 - 根除性重写)
class SudokuGame {
    constructor() {
        this.boardElement = null;
        this.difficulty = 'normal';
        this.isRunning = false;
        this.board = [];
        this.solution = [];
        this.timer = 0;
        this.timerInterval = null;
        this.refills = 0;
        this.maxRefills = 5;
        this.selectedCell = null;

        // Pre-bind event handlers to ensure 'this' context is correct
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleBoardClick = this.handleBoardClick.bind(this);
        this.boundHandlePaletteClick = this.handlePaletteClick.bind(this);
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        console.log(`[Sudoku] Difficulty set to: ${difficulty}`);
    }

    init() {
        // this.boardElement is now set in start()
        this.start(); // The game should start immediately on init
    }

    start() {
        console.log('[Sudoku] Starting new game...');
        this.boardElement = document.getElementById('sudokuBoard');
        this.stop(); // Ensure clean state

        this.isRunning = true;
        this.timer = 0;
        this.refills = 0;
        this.selectedCell = null;

        this.generatePuzzle();
        this.renderBoard();
        this.updateUI();
        this.bindEvents();
        this.startTimer();
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.unbindEvents();
    }

    restart() {
        this.start();
    }

    bindEvents() {
        document.addEventListener('keydown', this.boundHandleKeyDown);
        this.boardElement.addEventListener('click', this.boundHandleBoardClick);
        document.getElementById('sudokuPalette')?.addEventListener('click', this.boundHandlePaletteClick);
    }

    unbindEvents() {
        document.removeEventListener('keydown', this.boundHandleKeyDown);
        this.boardElement?.removeEventListener('click', this.boundHandleBoardClick);
        document.getElementById('sudokuPalette')?.removeEventListener('click', this.boundHandlePaletteClick);
    }

    handleBoardClick(e) {
        if (e.target.classList.contains('sudoku-cell') && !e.target.classList.contains('given')) {
            this.selectCell(e.target);
        }
    }

    handlePaletteClick(e) {
        if (e.target.classList.contains('palette-number')) {
            const num = parseInt(e.target.dataset.number, 10);
            this.fillCell(num);
        }
    }

    handleKeyDown(e) {
        if (!this.selectedCell) return;
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
            this.fillCell(num);
        }
    }

    selectCell(cell) {
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
        }
        this.selectedCell = cell;
        this.selectedCell.classList.add('selected');
    }

    fillCell(num) {
        if (!this.selectedCell) return;
        const row = parseInt(this.selectedCell.dataset.row, 10);
        const col = parseInt(this.selectedCell.dataset.col, 10);
        console.log(`[Sudoku] Filling cell (${row}, ${col}) with number ${num}`);
        const cellData = this.board[row][col];

        if (cellData.value !== 0 && cellData.value !== num) {
            if (this.refills >= this.maxRefills) {
                alert(`你已经用完了所有的 ${this.maxRefills} 次重填机会！`);
                return;
            }
            this.refills++;
        }
        
        cellData.value = num;
        this.renderBoard(); // Re-render to show the new number and any mistakes
        
        // Keep the cell selected after filling
        const newSelectedCell = this.boardElement.querySelector(`[data-row='${row}'][data-col='${col}']`);
        if(newSelectedCell) this.selectCell(newSelectedCell);
        
        this.updateUI();
        if (this.checkWin()) this.winGame();
    }
    
    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateUI();
        }, 1000);
    }

    generatePuzzle() {
        this.solution = this.generateSolution(this.createEmptyBoard());
        this.board = this.createPuzzle(this.solution);
    }

    createEmptyBoard() {
        return Array(9).fill(0).map(() => Array(9).fill(0));
    }

    generateSolution(board) {
        this.solve(board);
        return board;
    }

    createPuzzle(solution) {
        const puzzle = solution.map(row => [...row]);
        const difficulties = { easy: 35, normal: 45, hard: 55 };
        const holes = difficulties[this.difficulty] || 45;
        
        const cells = [];
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push({ r, c });
        this.shuffleArray(cells);
        
        for (let i = 0; i < holes; i++) {
            puzzle[cells[i].r][cells[i].c] = 0;
        }

        return puzzle.map(row => row.map(cell => ({
            value: cell,
            isGiven: cell !== 0
        })));
    }

    solve(board) {
        const find = this.findEmpty(board);
        if (!find) return true;
        const [row, col] = find;
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(nums);
        for (const num of nums) {
            if (this.isValid(board, row, col, num)) {
                board[row][col] = num;
                if (this.solve(board)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    findEmpty(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) return [r, c];
            }
        }
        return null;
    }

    isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[boxRow + r][boxCol + c] === num) return false;
            }
        }
        return true;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.board.forEach((row, r) => {
            row.forEach((cellData, c) => {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                if (cellData.isGiven) {
                    cell.textContent = cellData.value;
                    cell.classList.add('given');
                } else if (cellData.value !== 0) {
                    cell.textContent = cellData.value;
                    cell.classList.toggle('mistake', this.solution[r][c] !== cellData.value);
                }
                if ((r + 1) % 3 === 0 && r < 8) cell.classList.add('border-bottom');
                if ((c + 1) % 3 === 0 && c < 8) cell.classList.add('border-right');
                this.boardElement.appendChild(cell);
            });
        });
    }

    checkWin() {
        return this.board.every((row, r) => row.every((cell, c) => cell.value === this.solution[r][c]));
    }

    winGame() {
        this.stop();
        alert('恭喜你，完成了数独！');
    }

    updateUI() {
        document.getElementById('sudokuTime').textContent = this.formatTime(this.timer);
        const { filled, total } = this.countFilledCells();
        document.getElementById('sudokuFilled').textContent = `${filled} / ${total}`;
        document.getElementById('sudokuRefills').textContent = `${this.refills} / ${this.maxRefills}`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    countFilledCells() {
        let filled = 0, total = 0;
        this.board.forEach(row => row.forEach(cell => {
            if (!cell.isGiven) {
                total++;
                if (cell.value !== 0) filled++;
            }
        }));
        return { filled, total };
    }
}