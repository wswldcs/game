// 代码行者 (CodeWalker) - 一款创意编程解谜游戏
class CodeWalkerGame {
    constructor() {
        this.boardElement = null;
        this.difficulty = 'normal';
        this.isRunning = false;
        this.playerPos = { x: 0, y: 0 };
        this.bugs = [];
        this.exitPos = { x: 0, y: 0 };
        this.map = [];
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    init() {
        this.boardElement = document.getElementById('codewalkerBoard');
        this.start();
    }

    start() {
        this.isRunning = true;
        this.generateMap();
        this.render();
        document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    stop() {
        this.isRunning = false;
        document.removeEventListener('keydown', this.boundHandleKeyDown);
    }

    restart() {
        this.start();
    }

    generateMap() {
        const maps = {
            easy: [
                "<body>",
                "  <div>",
                "    <p>Find the bug!</p>",
                "    <img sr c='icon.png'>", // Bug 1
                "  </dvi>", // Bug 2
                "</body>"
            ],
            normal: [
                "<style>",
                "  .title {",
                "    font-size: 24px;",
                "    colour: blue;", // Bug 1
                "  }",
                "  .container {",
                "    pading: 10px;", // Bug 2
                "  }",
                "</style>"
            ],
            hard: [
                "function greet() {",
                "  for (let i = 0; i < 5; i-- ) {", // Bug 1
                "    console.log('Hello!');",
                "  }",
                "  returnture;", // Bug 2
                "}"
            ]
        };
        this.map = maps[this.difficulty] || maps.easy;
        // Simplified bug/player/exit placement for this example
        this.playerPos = { x: 2, y: 0 };
        this.exitPos = { x: 0, y: this.map.length - 1 };
        this.bugs = [{ x: 13, y: 3, fixed: false }, { x: 3, y: 4, fixed: false }];
    }

    render() {
        let html = '';
        for (let y = 0; y < this.map.length; y++) {
            let lineHtml = this.map[y];
            if (y === this.playerPos.y) {
                lineHtml = lineHtml.substring(0, this.playerPos.x) +
                           `<span class="player">${lineHtml[this.playerPos.x]}</span>` +
                           lineHtml.substring(this.playerPos.x + 1);
            }
            // Simplified rendering for this example
            html += lineHtml + '\n';
        }
        this.boardElement.innerHTML = html;
    }

    handleKeyDown(e) {
        if (!this.isRunning) return;

        const keyMap = {
            'arrowup': { x: 0, y: -1 }, 'arrowdown': { x: 0, y: 1 },
            'arrowleft': { x: -1, y: 0 }, 'arrowright': { x: 1, y: 0 }
        };
        const move = keyMap[e.key.toLowerCase()];

        if (move) {
            e.preventDefault();
            const newPos = { x: this.playerPos.x + move.x, y: this.playerPos.y + move.y };

            if (this.isValidMove(newPos)) {
                this.playerPos = newPos;
                this.render();
                this.checkCollisions();
            }
        }
    }

    isValidMove(pos) {
        return pos.y >= 0 && pos.y < this.map.length &&
               pos.x >= 0 && pos.x < this.map[pos.y].length &&
               this.map[pos.y][pos.x] !== ' '; // Cannot walk on empty space
    }

    checkCollisions() {
        // Check for bug fixing
        this.bugs.forEach(bug => {
            if (this.playerPos.x === bug.x && this.playerPos.y === bug.y && !bug.fixed) {
                bug.fixed = true;
                alert('Bug Fixed!');
                if (this.bugs.every(b => b.fixed)) {
                    alert('All bugs fixed! Find the exit!');
                }
            }
        });

        // Check for exit
        if (this.playerPos.x === this.exitPos.x && this.playerPos.y === this.exitPos.y) {
            if (this.bugs.every(b => b.fixed)) {
                alert('You Win!');
                this.stop();
            }
        }
    }
}