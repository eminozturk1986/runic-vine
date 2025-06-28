// Runic Vine - Main Application Entry Point

class RunicVineApp {
    constructor() {
        this.gameContainer = document.getElementById('game-container');
        this.grapeData = [];
        this.currentGrape = null;
        this.selectedCountry = null;
        this.playerData = {
            name: '',
            email: ''
        };
        this.gameState = 'start'; // 'start', 'playing', 'ended'
        this.score = 0;
        this.totalQuestions = 0;
        this.timeRemaining = 120; // 2 minutes in seconds
        this.timerInterval = null;
        this.feedbackTimeout = null;
        this.init();
    }

    async init() {
        console.log('Runic Vine app initializing...');
        
        try {
            await this.loadGrapeData();
            this.renderStartScreen();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.renderError();
        }
    }

    async loadGrapeData() {
        try {
            const response = await fetch('./data/grape_data.json');
            if (!response.ok) {
                throw new Error('Failed to load grape data');
            }
            this.grapeData = await response.json();
            console.log(`Loaded ${this.grapeData.length} grape varieties`);
        } catch (error) {
            console.error('Error loading grape data:', error);
            throw error;
        }
    }

    renderStartScreen() {
        this.gameContainer.innerHTML = `
            <div class="start-screen">
                <h2>Welcome to Runic Vine</h2>
                <p>Test your knowledge of grape varieties and their countries of origin!</p>
                
                <form id="player-form">
                    <div class="form-group">
                        <label for="player-name">Your Name</label>
                        <input type="text" id="player-name" class="form-input" placeholder="Enter your name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="player-email">Email Address</label>
                        <input type="email" id="player-email" class="form-input" placeholder="Enter your email" required>
                    </div>
                    
                    <button type="submit" class="btn">Start Game</button>
                </form>
                
                <p style="margin-top: 2rem; color: var(--primary-blue-gray); opacity: 0.7; font-size: 0.9rem;">
                    ${this.grapeData.length} grape varieties loaded and ready
                </p>
            </div>
        `;

        // Add form submit handler
        document.getElementById('player-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePlayerSubmit();
        });
    }

    handlePlayerSubmit() {
        const name = document.getElementById('player-name').value.trim();
        const email = document.getElementById('player-email').value.trim();
        
        if (name && email) {
            this.playerData.name = name;
            this.playerData.email = email;
            console.log('Player data:', this.playerData);
            this.startGame();
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.totalQuestions = 0;
        this.timeRemaining = 120;
        this.selectRandomGrape();
        this.renderGameScreen();
        this.startTimer();
    }

    selectRandomGrape() {
        const randomIndex = Math.floor(Math.random() * this.grapeData.length);
        this.currentGrape = this.grapeData[randomIndex];
        console.log('Selected grape:', this.currentGrape);
    }

    async renderGameScreen() {
        this.gameContainer.innerHTML = `
            <div class="game-screen">
                <div class="game-header">
                    <div class="score-container">
                        <div class="score-label">Score</div>
                        <div class="score-display" id="score-display">${this.score}</div>
                    </div>
                    
                    <div class="timer-container">
                        <div class="timer-label">Time Remaining</div>
                        <div class="timer-display" id="timer-display">2:00</div>
                    </div>
                    
                    <div class="score-container">
                        <div class="score-label">Questions</div>
                        <div class="score-display" id="questions-display">${this.totalQuestions}</div>
                    </div>
                </div>

                <div class="question-section">
                    <div class="grape-variety">${this.currentGrape.variety}</div>
                    <div class="grape-description">
                        This is a placeholder description for the grape variety. 
                        The actual description will be added in a future update.
                    </div>
                </div>
                
                <div class="map-section">
                    <h3 class="map-title">Select the country of origin:</h3>
                    <div class="map-container">
                        <div id="map-placeholder">Loading map...</div>
                    </div>
                </div>
            </div>
        `;

        // Load appropriate continent map based on grape
        const continent = this.getGrapeContinent(this.currentGrape);
        console.log(`Loading ${continent} map for ${this.currentGrape.variety} from ${this.currentGrape.country}`);
        await this.loadContinentMap(continent);
        this.updateTimerDisplay();
    }

    getGrapeContinent(grape) {
        const continentMap = {
            // Europe
            'France': 'europe',
            'Germany': 'europe', 
            'Italy': 'europe',
            'Spain': 'europe',
            'Portugal': 'europe',
            'Greece': 'europe',
            'Austria': 'europe',
            'Switzerland': 'europe',
            'Hungary': 'europe',
            'Romania': 'europe',
            'Bulgaria': 'europe',
            'Croatia': 'europe',
            'Slovenia': 'europe',
            'Slovakia': 'europe',
            'Czech Republic': 'europe',
            'Poland': 'europe',
            'United Kingdom': 'europe',
            'Ireland': 'europe',
            'Netherlands': 'europe',
            'Belgium': 'europe',
            'Denmark': 'europe',
            'Sweden': 'europe',
            'Norway': 'europe',
            'Finland': 'europe',
            'Iceland': 'europe',
            'Serbia': 'europe',
            
            // North America
            'United States': 'north-america',
            'Canada': 'north-america',
            'Mexico': 'north-america',
            
            // South America
            'Argentina': 'south-america',
            'Chile': 'south-america',
            'Brazil': 'south-america',
            'Colombia': 'south-america',
            'Peru': 'south-america',
            'Venezuela': 'south-america',
            'Ecuador': 'south-america',
            'Bolivia': 'south-america',
            'Uruguay': 'south-america',
            
            // Oceania
            'Australia': 'oceania',
            'New Zealand': 'oceania',
            
            // Africa
            'South Africa': 'africa',
            
            // Asia
            'Georgia': 'asia'
        };
        
        return continentMap[grape.country] || 'europe'; // Default to Europe
    }

    async loadContinentMap(continent) {
        try {
            // Try detailed version first for Europe, then fallback to regular
            let mapFile = `./public/maps/${continent}.svg`;
            if (continent === 'europe') {
                mapFile = `./public/maps/${continent}-detailed.svg`;
            }
            
            const response = await fetch(mapFile);
            if (!response.ok) {
                throw new Error(`Failed to load ${continent} map`);
            }
            
            const svgText = await response.text();
            
            const mapPlaceholder = document.getElementById('map-placeholder');
            mapPlaceholder.innerHTML = svgText;
            
            // Add click handlers to countries
            this.setupMapInteraction();
            
        } catch (error) {
            console.error(`Error loading ${continent} map:`, error);
            document.getElementById('map-placeholder').innerHTML = `
                <p style="color: var(--primary-red);">Failed to load ${continent} map. Please refresh the page.</p>
            `;
        }
    }

    setupMapInteraction() {
        const countries = document.querySelectorAll('.country');
        
        countries.forEach(country => {
            country.addEventListener('click', (e) => {
                if (this.gameState !== 'playing') return;
                
                this.selectedCountry = e.target.id;
                this.totalQuestions++;
                
                console.log('Country selected:', this.selectedCountry);
                console.log('Correct answer:', this.currentGrape.country);
                
                this.checkAnswer(e.target);
            });
        });
    }

    checkAnswer(countryElement) {
        const isCorrect = this.selectedCountry === this.currentGrape.country;
        
        // Clear any existing feedback classes
        document.querySelectorAll('.country').forEach(c => {
            c.classList.remove('correct', 'incorrect', 'selected');
        });
        
        if (isCorrect) {
            this.score++;
            countryElement.classList.add('correct');
            this.showFeedback('✅ Correct!', 'correct');
        } else {
            countryElement.classList.add('incorrect');
            // Also highlight the correct country
            const correctCountry = document.getElementById(this.currentGrape.country);
            if (correctCountry) {
                correctCountry.classList.add('correct');
            }
            this.showFeedback('❌ Incorrect', 'incorrect');
        }
        
        // Update score display
        const scoreDisplay = document.getElementById('score-display');
        const questionsDisplay = document.getElementById('questions-display');
        if (scoreDisplay) scoreDisplay.textContent = this.score;
        if (questionsDisplay) questionsDisplay.textContent = this.totalQuestions;
        
        console.log('Score:', this.score, '/', this.totalQuestions);
        
        // Load next question after delay
        this.feedbackTimeout = setTimeout(async () => {
            await this.nextQuestion();
        }, 1500);
    }

    showFeedback(message, type) {
        // Remove any existing feedback
        const existingFeedback = document.querySelector('.feedback-message');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = `feedback-message feedback-${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        // Remove feedback after 1.2 seconds
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1200);
    }

    async nextQuestion() {
        if (this.gameState !== 'playing') return;
        
        // Clear feedback timeout
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
        
        // Select new grape and update display
        this.selectRandomGrape();
        
        // Update grape variety display
        const grapeVariety = document.querySelector('.grape-variety');
        if (grapeVariety) {
            grapeVariety.textContent = this.currentGrape.variety;
        }
        
        // Load appropriate continent map for the new grape
        const continent = this.getGrapeContinent(this.currentGrape);
        console.log(`Loading ${continent} map for next question: ${this.currentGrape.variety} from ${this.currentGrape.country}`);
        await this.loadContinentMap(continent);
        
        this.selectedCountry = null;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        timerDisplay.textContent = timeString;
        
        // Add warning/danger classes
        timerDisplay.classList.remove('timer-warning', 'timer-danger');
        if (this.timeRemaining <= 10) {
            timerDisplay.classList.add('timer-danger');
        } else if (this.timeRemaining <= 30) {
            timerDisplay.classList.add('timer-warning');
        }
    }

    endGame() {
        this.gameState = 'ended';
        
        // Clear timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
        
        // Remove any feedback messages
        const existingFeedback = document.querySelector('.feedback-message');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        this.renderEndScreen();
    }

    renderEndScreen() {
        const percentage = this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0;
        
        // Save score to leaderboard
        this.saveScore();
        
        this.gameContainer.innerHTML = `
            <div class="end-screen">
                <div class="final-score-section">
                    <h2>Time's Up!</h2>
                    <div class="player-name">Well done, ${this.playerData.name}!</div>
                    
                    <div class="score-summary">
                        <div class="score-metric">
                            <span class="score-metric-value">${this.score}</span>
                            <div class="score-metric-label">Correct Answers</div>
                        </div>
                        <div class="score-metric">
                            <span class="score-metric-value">${this.totalQuestions}</span>
                            <div class="score-metric-label">Total Questions</div>
                        </div>
                        <div class="score-metric">
                            <span class="score-metric-value">${percentage}%</span>
                            <div class="score-metric-label">Accuracy</div>
                        </div>
                    </div>
                </div>
                
                <div class="leaderboard-section">
                    <h3 class="leaderboard-title">🏆 Top Scores</h3>
                    <div id="leaderboard-container">
                        ${this.renderLeaderboard()}
                    </div>
                </div>
                
                <div class="game-buttons">
                    <button class="btn" onclick="app.startNewGame()">Play Again</button>
                    <button class="btn btn-secondary" onclick="app.renderStartScreen()">New Player</button>
                </div>
            </div>
        `;
        
        console.log('Game ended. Final score:', this.score, '/', this.totalQuestions, `(${percentage}%)`);
    }

    saveScore() {
        const scoreData = {
            name: this.playerData.name,
            email: this.playerData.email,
            score: this.score,
            totalQuestions: this.totalQuestions,
            accuracy: this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0,
            date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
            timestamp: Date.now()
        };
        
        // Get existing scores from localStorage
        let scores = [];
        try {
            const existingScores = localStorage.getItem('runicVineScores');
            if (existingScores) {
                scores = JSON.parse(existingScores);
            }
        } catch (error) {
            console.error('Error loading existing scores:', error);
            scores = [];
        }
        
        // Add new score
        scores.push(scoreData);
        
        // Sort by score (descending), then by accuracy (descending), then by timestamp (ascending for tie-breaking)
        scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
            return a.timestamp - b.timestamp;
        });
        
        // Keep only top 50 scores to prevent localStorage from growing too large
        scores = scores.slice(0, 50);
        
        // Save back to localStorage
        try {
            localStorage.setItem('runicVineScores', JSON.stringify(scores));
            console.log('Score saved successfully:', scoreData);
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    renderLeaderboard() {
        let scores = [];
        try {
            const existingScores = localStorage.getItem('runicVineScores');
            if (existingScores) {
                scores = JSON.parse(existingScores);
            }
        } catch (error) {
            console.error('Error loading scores for leaderboard:', error);
            return '<div class="no-scores">Unable to load leaderboard</div>';
        }
        
        if (scores.length === 0) {
            return '<div class="no-scores">No scores yet. Be the first to play!</div>';
        }
        
        // Get top 10 scores
        const topScores = scores.slice(0, 10);
        const currentPlayerTimestamp = Date.now();
        
        let tableHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Accuracy</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        topScores.forEach((scoreData, index) => {
            const rank = index + 1;
            const isCurrentPlayer = Math.abs(scoreData.timestamp - currentPlayerTimestamp) < 5000; // Within 5 seconds
            const rowClass = isCurrentPlayer ? 'current-player-row' : '';
            
            let rankDisplay = rank;
            if (rank === 1) rankDisplay = '<span class="rank-medal rank-1">🥇</span>';
            else if (rank === 2) rankDisplay = '<span class="rank-medal rank-2">🥈</span>';
            else if (rank === 3) rankDisplay = '<span class="rank-medal rank-3">🥉</span>';
            
            tableHTML += `
                <tr class="${rowClass}">
                    <td>${rankDisplay}</td>
                    <td>${this.escapeHtml(scoreData.name)}</td>
                    <td>${scoreData.score}/${scoreData.totalQuestions}</td>
                    <td>${scoreData.accuracy}%</td>
                    <td>${scoreData.date}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        return tableHTML;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startNewGame() {
        // Reset game state but keep player data
        this.score = 0;
        this.totalQuestions = 0;
        this.timeRemaining = 120;
        this.gameState = 'playing';
        this.selectedCountry = null;
        this.currentGrape = null;
        
        // Clear any existing timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
        
        // Start fresh game
        this.selectRandomGrape();
        this.renderGameScreen();
        this.startTimer();
    }

    renderError() {
        this.gameContainer.innerHTML = `
            <div style="text-align: center; color: var(--primary-red);">
                <h2>Error Loading Game</h2>
                <p>Unable to load game data. Please refresh the page.</p>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RunicVineApp();
});