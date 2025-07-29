// 游戏统计功能
class GameStats {
    constructor() {
        this.storageKey = 'kiloGamesStats';
        this.data = this.loadStats();
    }

    // 加载统计数据
    loadStats() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('加载统计数据失败:', error);
        }
        
        // 默认统计数据结构
        return {
            totalVisits: 0,
            totalGames: 0,
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            games: {
                snake: { playCount: 0, highScore: 0, lastPlayed: null },
                '2048': { playCount: 0, highScore: 0, lastPlayed: null },
                breakout: { playCount: 0, highScore: 0, lastPlayed: null },
                tetris: { playCount: 0, highScore: 0, lastPlayed: null },
                minesweeper: { playCount: 0, highScore: 0, lastPlayed: null },
                shooter: { playCount: 0, highScore: 0, lastPlayed: null },
                sokoban: { playCount: 0, highScore: 0, lastPlayed: null },
                puzzle: { playCount: 0, highScore: 0, lastPlayed: null },
                match: { playCount: 0, highScore: 0, lastPlayed: null },
                pacman: { playCount: 0, highScore: 0, lastPlayed: null },
                frogger: { playCount: 0, highScore: 0, lastPlayed: null },
                lasso: { playCount: 0, highScore: 0, lastPlayed: null },
                racing: { playCount: 0, highScore: 0, lastPlayed: null }
            }
        };
    }

    // 保存统计数据
    saveStats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.warn('保存统计数据失败:', error);
        }
    }

    // 记录访问
    recordVisit() {
        this.data.totalVisits++;
        this.data.lastVisit = new Date().toISOString();
        this.saveStats();
        this.updateDisplay();
    }

    // 记录游戏游玩
    recordGamePlay(gameType) {
        if (!this.data.games[gameType]) {
            this.data.games[gameType] = { playCount: 0, highScore: 0, lastPlayed: null };
        }
        
        this.data.games[gameType].playCount++;
        this.data.games[gameType].lastPlayed = new Date().toISOString();
        this.data.totalGames++;
        
        this.saveStats();
        this.updateDisplay();
        this.updateGameCardStats(gameType);
    }

    // 更新游戏高分
    updateHighScore(gameType, score) {
        if (!this.data.games[gameType]) {
            this.data.games[gameType] = { playCount: 0, highScore: 0, lastPlayed: null };
        }
        
        if (score > this.data.games[gameType].highScore) {
            this.data.games[gameType].highScore = score;
            this.saveStats();
            return true; // 返回true表示创造了新纪录
        }
        return false;
    }

    // 获取游戏统计
    getGameStats(gameType) {
        return this.data.games[gameType] || { playCount: 0, highScore: 0, lastPlayed: null };
    }

    // 更新显示
    updateDisplay() {
        // 更新头部统计显示
        const totalVisitsElement = document.getElementById('totalVisits');
        const totalGamesElement = document.getElementById('totalGames');
        
        if (totalVisitsElement) {
            totalVisitsElement.textContent = this.data.totalVisits.toLocaleString();
        }
        
        if (totalGamesElement) {
            totalGamesElement.textContent = this.data.totalGames.toLocaleString();
        }

        // 更新所有游戏卡片的统计
        Object.keys(this.data.games).forEach(gameType => {
            this.updateGameCardStats(gameType);
        });
    }

    // 更新游戏卡片统计
    updateGameCardStats(gameType) {
        const gameCard = document.querySelector(`[data-game="${gameType}"]`);
        if (gameCard) {
            const playCountElement = gameCard.querySelector('.play-count');
            if (playCountElement) {
                playCountElement.textContent = this.data.games[gameType].playCount;
            }
        }
    }

    // 获取总统计
    getTotalStats() {
        return {
            totalVisits: this.data.totalVisits,
            totalGames: this.data.totalGames,
            firstVisit: this.data.firstVisit,
            lastVisit: this.data.lastVisit,
            mostPlayedGame: this.getMostPlayedGame(),
            totalPlayTime: this.getTotalPlayTime()
        };
    }

    // 获取最受欢迎的游戏
    getMostPlayedGame() {
        let maxPlays = 0;
        let mostPlayed = null;
        
        Object.entries(this.data.games).forEach(([gameType, stats]) => {
            if (stats.playCount > maxPlays) {
                maxPlays = stats.playCount;
                mostPlayed = gameType;
            }
        });
        
        return mostPlayed;
    }

    // 计算总游戏时间（估算）
    getTotalPlayTime() {
        // 简单估算：每次游戏平均5分钟
        return this.data.totalGames * 5;
    }

    // 导出统计数据
    exportStats() {
        const stats = {
            ...this.data,
            exportDate: new Date().toISOString(),
            summary: this.getTotalStats()
        };
        
        const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kilo-games-stats-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 重置统计数据
    resetStats() {
        if (confirm('确定要重置所有统计数据吗？此操作不可恢复！')) {
            localStorage.removeItem(this.storageKey);
            this.data = this.loadStats();
            this.updateDisplay();
            alert('统计数据已重置');
        }
    }

    // 显示详细统计
    showDetailedStats() {
        const stats = this.getTotalStats();
        const gameStats = Object.entries(this.data.games)
            .filter(([_, data]) => data.playCount > 0)
            .sort((a, b) => b[1].playCount - a[1].playCount)
            .map(([game, data]) => `${this.getGameName(game)}: ${data.playCount}次 (最高分: ${data.highScore})`)
            .join('\n');

        const message = `
📊 Kilo游戏合集统计报告

🔢 总体数据:
• 总访问次数: ${stats.totalVisits}
• 总游戏次数: ${stats.totalGames}
• 首次访问: ${new Date(stats.firstVisit).toLocaleDateString()}
• 最后访问: ${new Date(stats.lastVisit).toLocaleDateString()}
• 最受欢迎: ${stats.mostPlayedGame ? this.getGameName(stats.mostPlayedGame) : '暂无'}
• 估算游戏时间: ${stats.totalPlayTime}分钟

🎮 游戏详情:
${gameStats || '暂无游戏记录'}
        `;

        alert(message);
    }

    // 获取游戏中文名称
    getGameName(gameType) {
        const names = {
            'snake': '贪吃蛇',
            '2048': '2048',
            'breakout': '打砖块',
            'tetris': '俄罗斯方块',
            'minesweeper': '扫雷',
            'shooter': '打飞机大战',
            'sokoban': '推箱子',
            'puzzle': '数字拼图',
            'match': '连连看',
            'pacman': '吃豆人',
            'frogger': '青蛙过河',
            'lasso': '套马',
            'racing': '赛马'
        };
        return names[gameType] || gameType;
    }
}

// 添加统计菜单功能
document.addEventListener('DOMContentLoaded', () => {
    // 添加统计菜单到页面
    const header = document.querySelector('.header .container');
    if (header) {
        const statsMenu = document.createElement('div');
        statsMenu.className = 'stats-menu';
        statsMenu.innerHTML = `
            <button class="stats-btn" onclick="showStatsMenu()" title="统计菜单">📊</button>
            <div class="stats-dropdown" id="statsDropdown">
                <a href="#" onclick="gameCollection.stats.showDetailedStats()">查看详细统计</a>
                <a href="#" onclick="gameCollection.stats.exportStats()">导出数据</a>
                <a href="#" onclick="gameCollection.stats.resetStats()">重置数据</a>
            </div>
        `;
        header.appendChild(statsMenu);
    }
});

// 显示统计菜单
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