// 赛马游戏
class RacingGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.horses = [];
        this.raceFinished = true;
        this.winner = null;
        this.playerBet = null;
        this.playerMoney = 1000;
        this.isRunning = false;
        this.difficulty = 'normal';
        this.animationFrameId = null;
    }

    init() {
        this.canvas = document.getElementById('racingCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        this.loadPlayerMoney();
        this.createHorses();
        this.bindEvents();
        this.draw(); // Initial draw
        this.updateUI();
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.oddsMultiplier = 2;
                this.speedVariance = 0.3;
                break;
            case 'normal':
                this.oddsMultiplier = 3;
                this.speedVariance = 0.4;
                break;
            case 'hard':
                this.oddsMultiplier = 4;
                this.speedVariance = 0.5;
                break;
        }
    }
    
    createHorses() {
        this.horses = [];
        for (let i = 0; i < 6; i++) {
            this.horses.push({
                x: 0,
                y: 50 + i * 50,
                speed: 0,
                color: `hsl(${i * 60}, 100%, 50%)`,
                name: `赛马 ${i + 1}`
            });
        }
    }

    bindEvents() {
        // Betting buttons can be handled in the main UI
    }
    
    placeBet(horseIndex, amount) {
        if (!this.raceFinished) {
            this.showEndMessage("请等待当前比赛结束！", false);
            return;
        }
        if (this.playerMoney >= amount) {
            this.playerBet = { horseIndex, amount };
            this.playerMoney -= amount;
            this.updateUI();
            this.start();
        } else {
            this.showEndMessage("金币不足！", false);
        }
    }

    render() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.render());
    }

    update() {
        if (this.raceFinished || !this.isRunning) return;
        
        for (const horse of this.horses) {
            horse.x += horse.speed + (Math.random() - this.speedVariance); // Random burst
            if (horse.x >= this.canvas.width - 40) {
                if (!this.winner) { // First horse to finish wins
                    this.winner = horse;
                    this.raceFinished = true;
                    this.handleRaceEnd();
                    break; // Stop the loop once a winner is found
                }
            }
        }
    }
    
    handleRaceEnd() {
        this.isRunning = false;
        let message = `比赛结束！获胜的是 ${this.winner.name}。`;
        if (this.playerBet && this.horses.indexOf(this.winner) === this.playerBet.horseIndex) {
            const winnings = this.playerBet.amount * this.oddsMultiplier;
            this.playerMoney += winnings;
            message = `恭喜！你赢得了 ${winnings} 金币！`;
        }
        this.playerBet = null;
        this.savePlayerMoney();
        this.updateUI();
        this.showEndMessage(message);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#3CB371'; // Green field
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw tracks
        for (let i = 0; i < 7; i++) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.ctx.fillRect(0, 25 + i * 50, this.canvas.width, 2);
        }
        
        // Draw finish line
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.canvas.width - 20, 0, 10, this.canvas.height);

        // Draw horses
        this.horses.forEach(horse => {
            this.ctx.fillStyle = horse.color;
            this.ctx.fillRect(horse.x, horse.y, 40, 20);
            this.ctx.fillStyle = 'black';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(horse.name, horse.x + 2, horse.y + 14);
        });
    }
    
    updateUI() {
        const moneyEl = document.getElementById('racingMoney');
        if (moneyEl) moneyEl.textContent = Math.floor(this.playerMoney);
    }

    start() {
        if (!this.raceFinished) return; // Don't start a new race if one is running
        
        this.stop(); // Ensure everything is clean
        
        this.raceFinished = false;
        this.isRunning = true;
        this.winner = null;
        
        this.horses.forEach(horse => {
            horse.x = 0;
            horse.speed = (1 + Math.random()) * this.speedMultiplier;
        });
        
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
    }

    restart() {
        this.stop();
        this.raceFinished = true;
        this.playerBet = null;
        this.winner = null;
        this.createHorses();
        this.draw();
        this.updateUI();
    }

    showEndMessage(message, autoClear = true) {
        const overlay = document.createElement('div');
        overlay.className = 'racing-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = 'white';
        overlay.style.padding = '20px';
        overlay.style.borderRadius = '10px';
        overlay.style.textAlign = 'center';
        overlay.textContent = message;

        this.canvas.parentElement.style.position = 'relative';
        this.canvas.parentElement.appendChild(overlay);

        if(autoClear) {
            setTimeout(() => overlay.remove(), 3000);
        }
    }

    loadPlayerMoney() {
        if (gameCollection && gameCollection.stats) {
            this.playerMoney = gameCollection.stats.getStat('racing', 'money', 1000);
        }
    }

    savePlayerMoney() {
        if (gameCollection && gameCollection.stats) {
            gameCollection.stats.updateStat('racing', 'money', this.playerMoney);
        }
    }
}