// 走迷宫游戏
class MazeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.difficulty = 'normal';
        this.maze = [];
        this.player = {};
        this.exit = {};
        this.cellSize = 20;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    init() {
        this.canvas = document.getElementById('mazeCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.bindEvents();
        this.start();
    }

    start() {
        this.isRunning = true;
        this.generateMaze();
        this.player = { x: 1, y: 1 };
        this.exit = { x: this.maze[0].length - 2, y: this.maze.length - 2 };
        this.draw();
    }

    stop() {
        this.isRunning = false;
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown);
            this.boundKeyDown = null;
        }
    }

    restart() {
        this.stop();
        this.start();
    }

    bindEvents() {
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown);
        }
        this.boundKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyDown, true);
    }

    handleKeyDown(e) {
        if (!this.isRunning) return;
        e.preventDefault();
        const { x, y } = this.player;
        let newX = x, newY = y;

        switch (e.key) {
            case 'ArrowUp': newY--; break;
            case 'ArrowDown': newY++; break;
            case 'ArrowLeft': newX--; break;
            case 'ArrowRight': newX++; break;
        }

        if (this.maze[newY] && this.maze[newY][newX] === 0) {
            this.player.x = newX;
            this.player.y = newY;
            this.draw();
            if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
                this.winGame();
            }
        }
    }

    generateMaze() {
        const difficulties = { easy: 15, normal: 25, hard: 35 };
        const size = difficulties[this.difficulty] || 25;
        this.maze = Array(size).fill(0).map(() => Array(size).fill(1));
        
        const carve = (x, y) => {
            this.maze[y][x] = 0;
            const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            directions.sort(() => Math.random() - 0.5);
            for (let [dx, dy] of directions) {
                const nx = x + dx * 2;
                const ny = y + dy * 2;
                if (ny >= 0 && ny < size && nx >= 0 && nx < size && this.maze[ny][nx] === 1) {
                    this.maze[y + dy][x + dx] = 0;
                    carve(nx, ny);
                }
            }
        };

        carve(1, 1);
        this.maze[size - 2][size - 2] = 0; // Ensure exit is open
    }

    draw() {
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }

        // Draw Player
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.player.x * this.cellSize, this.player.y * this.cellSize, this.cellSize, this.cellSize);

        // Draw Exit
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(this.exit.x * this.cellSize, this.exit.y * this.cellSize, this.cellSize, this.cellSize);
    }

    winGame() {
        this.isRunning = false;
        alert('恭喜你，成功走出迷宫！');
    }
}