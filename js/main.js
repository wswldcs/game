// 游戏合集主逻辑
class GameCollection {
    constructor() {
        this.currentGame = null;
        this.currentDifficulty = 'normal';
        this.stats = new GameStats();
        this.gameInstances = {}; // Centralized game instance storage
        this.init();
    }

    init() {
        this.stats.updateDisplay();
        this.stats.recordVisit();
        this.bindEvents();
        console.log('游戏合集已初始化');
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('gameModal');
            if (modal.style.display !== 'block') return;

            const keyMap = {
                'escape': () => this.closeGame(),
                'j': () => document.getElementById('startBtn')?.click(),
                'p': () => document.getElementById('pauseBtn')?.click(),
                'l': () => document.getElementById('restartBtn')?.click(),
                'm': () => document.getElementById('nextLevelBtn')?.click(),
                'n': () => document.getElementById('prevLevelBtn')?.click(),
            };

            const action = keyMap[e.key.toLowerCase()];
            if (action) {
                e.preventDefault();
                action();
            }
        });

        document.getElementById('gameModal').addEventListener('click', (e) => {
            if (e.target.id === 'gameModal') {
                this.closeGame();
            }
        });
    }

    playGameWithDifficulty(gameType) {
        const difficultySelect = document.querySelector(`select[data-game="${gameType}"]`);
        this.currentDifficulty = difficultySelect ? difficultySelect.value : 'normal';
        this.playGame(gameType);
    }

    playGame(gameType) {
        this.stats.recordGamePlay(gameType);

        const modal = document.getElementById('gameModal');
        const gameTitle = document.getElementById('gameTitle');
        const gameContainer = document.getElementById('gameContainer');
        const difficultyIndicator = document.getElementById('difficultyIndicator');

        const gameTitles = {
            'snake': '🐍 贪吃蛇', '2048': '🔢 2048', 'breakout': '🧱 打砖块',
            'tetris': '🟦 俄罗斯方块', 'minesweeper': '💣 扫雷', 'shooter': '🚁 打飞机大战',
            'maze': '🗺️ 走迷宫', 'puzzle': '🧩 数字拼图 (待开发)', 'match': '🀄 连连看 (待开发)',
            'pacman': '🟡 吃豆人 (待开发)', 'frogger': '🐸 青蛙过河 (待开发)', 'lasso': '🤠 套马 (待开发)', 'racing': '🏇 赛马 (待开发)',
            'sudoku': '🔢 数独', 'codewalker': '👨‍💻 代码行者'
        };
        const difficultyNames = { 'easy': '简单', 'normal': '普通', 'hard': '困难' };

        gameTitle.textContent = gameTitles[gameType] || '游戏';
        difficultyIndicator.textContent = difficultyNames[this.currentDifficulty] || '普通';
        gameContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        modal.style.display = 'block';

        this.currentGame = { type: gameType, instance: null };

        setTimeout(() => {
            this.loadGame(gameType, gameContainer);
            this.setupGameControls(this.currentGame);
        }, 500);
    }

    setupGameControls(game) {
        const controlsContainer = document.getElementById('gameControls');
        controlsContainer.innerHTML = '';

        // Hide all specific controls by default
        const sudokuControls = document.getElementById('sudokuControls');
        if (sudokuControls) sudokuControls.style.display = 'none';

        const gameInstance = this.gameInstances[game.type];
        if (!gameInstance) {
            console.error(`Game instance for ${game.type} not found after loading!`);
            return;
        }
        game.instance = gameInstance;

        const addBtn = (id, text, action, key, condition = true) => {
            if (typeof action !== 'function' || !condition) return;
            const btn = document.createElement('button');
            btn.id = id;
            btn.className = 'control-btn';
            btn.textContent = `${text} (${key})`;
            btn.onclick = () => action.call(gameInstance);
            controlsContainer.appendChild(btn);
        };

        if (game.type === 'sudoku' || game.type === 'codewalker') {
            if (game.type === 'sudoku' && sudokuControls) sudokuControls.style.display = 'flex';
            addBtn('restartBtn', '新谜题', gameInstance.restart, 'L', 'restart' in gameInstance);
        } else {
            if (game.type !== 'racing') {
                addBtn('startBtn', '开始', gameInstance.start, 'J', 'start' in gameInstance);
            }
            addBtn('pauseBtn', '暂停', gameInstance.pause, 'P', 'pause' in gameInstance);
            addBtn('restartBtn', '重启', gameInstance.restart, 'L', 'restart' in gameInstance);
            addBtn('prevLevelBtn', '上关', gameInstance.previousLevel, 'N', 'previousLevel' in gameInstance);
            addBtn('nextLevelBtn', '下关', gameInstance.nextLevel, 'M', 'nextLevel' in gameInstance);
        }
    }

    loadGame(gameType, container) {
        const gameLoaders = {
            'snake': this.loadSnakeGame, '2048': this.load2048Game, 'breakout': this.loadBreakoutGame,
            'tetris': this.loadTetrisGame, 'minesweeper': this.loadMinesweeperGame, 'maze': this.loadMazeGame,
            'shooter': this.loadShooterGame,
            // 'puzzle': this.loadPuzzleGame, 'match': this.loadMatchGame,
            // 'pacman': this.loadPacmanGame, 'frogger': this.loadFroggerGame, 'lasso': this.loadLassoGame,
            // 'racing': this.loadRacingGame,
            'sudoku': this.loadSudokuGame,
            // 'codewalker': this.loadCodeWalkerGame,
        };
        const loader = gameLoaders[gameType];
        if (loader) {
            loader.call(this, container);
        } else {
            container.innerHTML = '<p>游戏开发中，敬请期待...</p>';
        }
    }

    // 贪吃蛇游戏
    loadSnakeGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="snakeScore">0</div></div>
                <div class="info-item"><div class="info-label">长度</div><div class="info-value" id="snakeLength">1</div></div>
                <div class="info-item"><div class="info-label">最高分</div><div class="info-value" id="snakeHighScore">0</div></div>
            </div>
            <canvas id="snakeCanvas" class="game-canvas" width="800" height="800"></canvas>
            <p style="text-align: center; margin-top: 1rem; color: #666;">使用方向键或WASD控制蛇的移动</p>`;
        this.gameInstances['snake'] = new SnakeGame();
        this.gameInstances['snake'].setDifficulty(this.currentDifficulty);
        this.gameInstances['snake'].init();
        if (this.gameInstances['snake'].start) this.gameInstances['snake'].start();
    }

    // 2048游戏
    load2048Game(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="game2048Score">0</div></div>
                <div class="info-item"><div class="info-label">最高分</div><div class="info-value" id="game2048HighScore">0</div></div>
            </div>
            <div id="game2048Board" class="game-2048-board"></div>
            <p style="text-align: center; margin-top: 1rem; color: #666;">使用方向键移动方块，合并相同数字</p>`;
        this.gameInstances['2048'] = new Game2048();
        this.gameInstances['2048'].setDifficulty(this.currentDifficulty);
        this.gameInstances['2048'].init();
    }

    // 打砖块游戏
    loadBreakoutGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="breakoutScore">0</div></div>
                <div class="info-item"><div class="info-label">生命</div><div class="info-value" id="breakoutLives">3</div></div>
                <div class="info-item"><div class="info-label">关卡</div><div class="info-value" id="breakoutLevel">1</div></div>
            </div>
            <canvas id="breakoutCanvas" class="game-canvas" width="720" height="480"></canvas>
            <p style="text-align: center; margin-top: 1rem; color: #666;">使用左右方向键或鼠标移动挡板</p>`;
        this.gameInstances['breakout'] = new BreakoutGame();
        this.gameInstances['breakout'].setDifficulty(this.currentDifficulty);
        this.gameInstances['breakout'].init();
        if (this.gameInstances['breakout'].start) this.gameInstances['breakout'].start();
    }

    // 俄罗斯方块游戏
    loadTetrisGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="tetrisScore">0</div></div>
                <div class="info-item"><div class="info-label">行数</div><div class="info-value" id="tetrisLines">0</div></div>
                <div class="info-item"><div class="info-label">等级</div><div class="info-value" id="tetrisLevel">1</div></div>
                <div class="info-item"><div class="info-label">最高分</div><div class="info-value" id="tetrisHighScore">0</div></div>
            </div>
            <canvas id="tetrisCanvas" class="game-canvas" width="480" height="960"></canvas>
            <p style="text-align: center; margin-top: 1rem; color: #666;">方向键移动和旋转，空格键硬降，P键暂停</p>`;
        this.gameInstances['tetris'] = new TetrisGame();
        this.gameInstances['tetris'].setDifficulty(this.currentDifficulty);
        this.gameInstances['tetris'].init();
        if (this.gameInstances['tetris'].start) this.gameInstances['tetris'].start();
    }

    // 扫雷游戏
    loadMinesweeperGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">剩余地雷</div><div class="info-value" id="minesweeperMines">10</div></div>
                <div class="info-item"><div class="info-label">用时</div><div class="info-value" id="minesweeperTime">0</div></div>
                <div class="info-item"><div class="info-label">难度</div><div class="info-value" id="minesweeperDifficulty">初级</div></div>
                <div class="info-item"><div class="info-label">最佳时间</div><div class="info-value" id="minesweeperHighScore">999</div></div>
            </div>
            <canvas id="minesweeperCanvas" class="game-canvas" width="540" height="540"></canvas>
            <p style="text-align: center; margin-top: 1rem; color: #666;">左键点击揭开格子，右键点击标记地雷</p>`;
        this.gameInstances['minesweeper'] = new MinesweeperGame();
        this.gameInstances['minesweeper'].setDifficulty(this.currentDifficulty);
        this.gameInstances['minesweeper'].init();
        if (this.gameInstances['minesweeper'].start) this.gameInstances['minesweeper'].start();
    }

    // 走迷宫游戏
    loadMazeGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <p>找到通往出口的路！</p>
            </div>
            <canvas id="mazeCanvas" class="game-canvas" width="500" height="500"></canvas>
            <p style="text-align: center; margin-top: 1rem; color: #666;">使用方向键移动</p>`;
        this.gameInstances['maze'] = new MazeGame();
        this.gameInstances['maze'].setDifficulty(this.currentDifficulty);
        this.gameInstances['maze'].init();
        if (this.gameInstances['maze'].start) this.gameInstances['maze'].start();
    }

    // 打飞机大战游戏
    loadShooterGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="shooterScore">0</div></div>
                <div class="info-item"><div class="info-label">生命</div><div class="info-value" id="shooterLives">3</div></div>
                <div class="info-item"><div class="info-label">关卡</div><div class="info-value" id="shooterLevel">1</div></div>
                <div class="info-item"><div class="info-label">最高分</div><div class="info-value" id="shooterHighScore">0</div></div>
            </div>
            <canvas id="shooterCanvas" class="game-canvas" width="800" height="600"></canvas>
            <p style="text-align: center; margin-top: 1rem; color: #666;">使用方向键或WASD移动，空格键射击，或使用鼠标控制</p>`;
        this.gameInstances['shooter'] = new ShooterGame();
        this.gameInstances['shooter'].setDifficulty(this.currentDifficulty);
        this.gameInstances['shooter'].init();
        if (this.gameInstances['shooter'].start) this.gameInstances['shooter'].start();
    }

    // 数字拼图游戏
    loadPuzzleGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">步数</div><div class="info-value" id="puzzleMoves">0</div></div>
            </div>
            <div id="puzzleBoard" class="puzzle-board"></div>
            <p style="text-align: center; margin-top: 1rem; color: #666;">点击方块将其移动到空白位置</p>`;
        this.gameInstances['puzzle'] = new PuzzleGame();
        this.gameInstances['puzzle'].setDifficulty(this.currentDifficulty);
        this.gameInstances['puzzle'].init();
    }

    // 连连看游戏
    loadMatchGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="matchScore">0</div></div>
                <div class="info-item"><div class="info-label">时间</div><div class="info-value" id="matchTime">60</div></div>
            </div>
            <div id="matchBoard" class="match-board"></div>`;
        this.gameInstances['match'] = new MatchGame();
        this.gameInstances['match'].setDifficulty(this.currentDifficulty);
        this.gameInstances['match'].init();
    }

    // 吃豆人游戏
    loadPacmanGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="pacmanScore">0</div></div>
                <div class="info-item"><div class="info-label">生命</div><div class="info-value" id="pacmanLives">3</div></div>
            </div>
            <canvas id="pacmanCanvas"></canvas>`;
        this.gameInstances['pacman'] = new PacmanGame();
        this.gameInstances['pacman'].setDifficulty(this.currentDifficulty);
        this.gameInstances['pacman'].init();
    }

    // 青蛙过河游戏
    loadFroggerGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="froggerScore">0</div></div>
                <div class="info-item"><div class="info-label">生命</div><div class="info-value" id="froggerLives">3</div></div>
            </div>
            <canvas id="froggerCanvas"></canvas>`;
        this.gameInstances['frogger'] = new FroggerGame();
        this.gameInstances['frogger'].setDifficulty(this.currentDifficulty);
        this.gameInstances['frogger'].init();
    }

    // 套马游戏
    loadLassoGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">分数</div><div class="info-value" id="lassoScore">0</div></div>
                <div class="info-item"><div class="info-label">时间</div><div class="info-value" id="lassoTime">60</div></div>
            </div>
            <canvas id="lassoCanvas"></canvas>`;
        this.gameInstances['lasso'] = new LassoGame();
        this.gameInstances['lasso'].setDifficulty(this.currentDifficulty);
        this.gameInstances['lasso'].init();
    }

    // 赛马游戏
    loadRacingGame(container) {
        container.innerHTML = `
            <div class="game-info">
                <div class="info-item"><div class="info-label">金币</div><div class="info-value" id="racingMoney">1000</div></div>
            </div>
            <canvas id="racingCanvas"></canvas>
            <div id="racingControls">
                <p>请选择一匹马下注 (100 金币):</p>
                <button class="control-btn" onclick="gameCollection.racingGame.placeBet(0, 100)">1号</button>
                <button class="control-btn" onclick="gameCollection.racingGame.placeBet(1, 100)">2号</button>
                <button class="control-btn" onclick="gameCollection.racingGame.placeBet(2, 100)">3号</button>
                <button class="control-btn" onclick="gameCollection.racingGame.placeBet(3, 100)">4号</button>
                <button class="control-btn" onclick="gameCollection.racingGame.placeBet(4, 100)">5号</button>
                <button class="control-btn" onclick="gameCollection.racingGame.placeBet(5, 100)">6号</button>
            </div>`;
        this.gameInstances['racing'] = new RacingGame();
        this.gameInstances['racing'].setDifficulty(this.currentDifficulty);
        this.gameInstances['racing'].init();
    }

    // 数独游戏
    loadSudokuGame(container) {
        container.innerHTML = `
            <div id="sudokuBoard" class="sudoku-board"></div>
        `;
        this.gameInstances['sudoku'] = new SudokuGame();
        this.gameInstances['sudoku'].setDifficulty(this.currentDifficulty);
        this.gameInstances['sudoku'].init(); // Init will now call start() internally
    }

    closeGame() {
        const modal = document.getElementById('gameModal');
        modal.style.display = 'none';

        if (this.currentGame && this.gameInstances[this.currentGame.type] && typeof this.gameInstances[this.currentGame.type].stop === 'function') {
            this.gameInstances[this.currentGame.type].stop();
        }
        
        const overlays = document.querySelectorAll('.game-overlay');
        overlays.forEach(overlay => overlay.remove());
        
        this.currentGame = null;
    }
}

// 搜索功能
function searchGames() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
    
    // 重置标签按钮状态
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.classList.remove('active');
    });
}

// 实时搜索
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchGames);
    }
});

// 标签筛选功能
function filterGames(category) {
    const gameCards = document.querySelectorAll('.game-card');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    // 更新按钮状态
    filterTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 筛选游戏卡片
    gameCards.forEach(card => {
        if (category === 'all') {
            card.classList.remove('hidden');
        } else {
            const cardTags = card.dataset.tags;
            if (cardTags && cardTags.includes(category)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
    
    // 清空搜索框
    document.getElementById('searchInput').value = '';
}

// 全局函数
function playGameWithDifficulty(gameType) {
    gameCollection.playGameWithDifficulty(gameType);
}

function playGame(gameType) {
    gameCollection.playGame(gameType);
}

function closeGame() {
    gameCollection.closeGame();
}

function showAbout() {
    alert('经典游戏合集 v1.0\n\n这是一个包含多款经典小游戏的网页合集。\n\n新功能：\n·新增创意游戏：代码行者\n·全面修复数独和2048的顽固bug\n·优化了数独的游戏界面\n\n开发者：wswldcs\n项目部署地址: https://wswldcs.github.io/game/');
}

// 统计菜单功能
function showStatsMenu() {
    const dropdown = document.getElementById('statsDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// 点击外部关闭统计菜单
document.addEventListener('click', (e) => {
    if (!e.target.closest('.stats-menu')) {
        const dropdown = document.getElementById('statsDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
});

// 初始化游戏合集
let gameCollection;
window.onload = () => {
    gameCollection = new GameCollection();
};