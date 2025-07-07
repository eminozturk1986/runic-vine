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
        this.continentCorrect = false;
        this.usedGrapes = new Set(); // Track used grape varieties to avoid duplicates
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
                    
                    <div class="button-group">
                        <button type="submit" class="btn">Start Game</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showLeaderboard()">View Rankings</button>
                    </div>
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
        this.usedGrapes.clear(); // Reset used grapes for new game
        this.selectRandomGrape();
        this.renderGameScreen();
        this.startTimer();
    }

    selectRandomGrape() {
        // Get available grapes (not yet used in this game)
        const availableGrapes = this.grapeData.filter(grape => 
            !this.usedGrapes.has(grape.variety)
        );
        
        // If all grapes have been used (shouldn't happen in 2 minutes), reset and use all
        if (availableGrapes.length === 0) {
            console.log('All grapes used! Resetting for continued play...');
            this.usedGrapes.clear();
            availableGrapes.push(...this.grapeData);
        }
        
        // Select random grape from available ones
        const randomIndex = Math.floor(Math.random() * availableGrapes.length);
        this.currentGrape = availableGrapes[randomIndex];
        
        // Mark this grape as used
        this.usedGrapes.add(this.currentGrape.variety);
        
        console.log(`Selected grape: ${this.currentGrape.variety} (${this.usedGrapes.size}/${this.grapeData.length} used)`);
    }

    async renderGameScreen() {
        this.gameContainer.innerHTML = `
            <div class="game-screen">
                <div class="game-header">
                    <span class="stat">Score: <strong id="score-display">${this.score}</strong></span>
                    <span class="stat">Time: <strong id="timer-display">2:00</strong></span>
                    <span class="stat">Questions: <strong id="questions-display">${this.totalQuestions}</strong></span>
                </div>

                <div class="question-section">
                    <div class="grape-variety">${this.currentGrape.variety}</div>
                </div>
                
                <div class="continent-selection">
                    <h3 class="selection-title">First, select the continent:</h3>
                    <div class="continent-buttons">
                        <button class="continent-btn" data-continent="europe">Europe</button>
                        <button class="continent-btn" data-continent="asia">Asia</button>
                        <button class="continent-btn" data-continent="africa">Africa</button>
                        <button class="continent-btn" data-continent="south-america">Americas</button>
                    </div>
                </div>
                
                <div class="map-section" style="display: none;">
                    <h3 class="map-title">Now select the country:</h3>
                    <div class="map-container">
                        <div id="map-placeholder">Select a continent first...</div>
                    </div>
                </div>
            </div>
        `;

        this.setupContinentSelection();
        this.updateTimerDisplay();
    }

    getGrapeContinent(grape) {
        const continentMap = {
            // Europe
            'Austria': 'europe',
            'Bosnia and Herzegovina': 'europe',
            'Bulgaria': 'europe',
            'Croatia': 'europe',
            'France': 'europe',
            'Germany': 'europe', 
            'Greece': 'europe',
            'Hungary': 'europe',
            'Italy': 'europe',
            'Montenegro': 'europe',
            'North Macedonia': 'europe',
            'Portugal': 'europe',
            'Romania': 'europe',
            'Serbia': 'europe',
            'Spain': 'europe',
            'Switzerland': 'europe',
            
            // Americas (using south-america map)
            'Argentina': 'south-america',
            'USA': 'south-america',
            
            // Asia
            'Armenia': 'asia',
            'China': 'asia',
            'Georgia': 'asia',
            'Indonesia': 'asia',
            'Japan': 'asia',
            'Turkey': 'asia',
            'Uzbekistan': 'asia',
            
            // Africa
            'Egypt': 'africa'
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
            
            // Ensure the SVG is properly configured for mobile touch
            const svg = mapPlaceholder.querySelector('svg');
            if (svg) {
                svg.style.touchAction = 'manipulation';
                svg.style.userSelect = 'none';
                svg.style.webkitUserSelect = 'none';
                svg.style.msUserSelect = 'none';
                
                // Ensure proper responsive behavior
                if (!svg.hasAttribute('viewBox') && svg.hasAttribute('width') && svg.hasAttribute('height')) {
                    const width = svg.getAttribute('width');
                    const height = svg.getAttribute('height');
                    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
                }
                
                // Make sure the SVG is responsive
                svg.style.width = '100%';
                svg.style.height = 'auto';
            }
            
            // Add click handlers to countries
            this.setupMapInteraction();
            
        } catch (error) {
            console.error(`Error loading ${continent} map:`, error);
            document.getElementById('map-placeholder').innerHTML = `
                <p style="color: var(--primary-red);">Failed to load ${continent} map. Please refresh the page.</p>
            `;
        }
    }

    setupContinentSelection() {
        const buttons = document.querySelectorAll('.continent-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                if (this.gameState !== 'playing') return;
                
                const selectedContinent = e.target.dataset.continent;
                const correctContinent = this.getGrapeContinent(this.currentGrape);
                
                console.log(`Selected continent: ${selectedContinent}, Correct: ${correctContinent}`);
                
                // Hide other continent buttons to save space
                buttons.forEach(btn => {
                    if (btn !== e.target) {
                        btn.style.display = 'none';
                    }
                    btn.disabled = true;
                });
                
                this.totalQuestions++;
                
                // Show feedback on selected button
                if (selectedContinent === correctContinent) {
                    e.target.classList.add('correct-continent');
                    this.continentCorrect = true;
                    
                    // Load the correct continent map for country selection
                    await this.loadContinentMap(selectedContinent);
                    
                    // Show map section right below the selected continent button
                    document.querySelector('.map-section').style.display = 'block';
                    
                } else {
                    e.target.classList.add('incorrect-continent');
                    // Also highlight the correct continent
                    const correctBtn = document.querySelector(`[data-continent="${correctContinent}"]`);
                    if (correctBtn) {
                        correctBtn.classList.add('correct-continent');
                    }
                    
                    this.continentCorrect = false;
                    
                    // Show feedback and move to next question
                    this.showFeedback('❌ Wrong continent!', 'incorrect');
                    
                    // Update score display
                    const questionsDisplay = document.getElementById('questions-display');
                    if (questionsDisplay) {
                        questionsDisplay.textContent = this.totalQuestions;
                    }
                    
                    // Move to next question after brief delay
                    setTimeout(() => {
                        this.nextQuestion();
                    }, 1500);
                }
            });
        });
    }

    resetContinentSelection() {
        // Reset continent buttons
        const buttons = document.querySelectorAll('.continent-btn');
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct-continent', 'incorrect-continent');
            btn.style.display = 'block'; // Restore hidden buttons
            // Clear any inline styles that might persist
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        });
        
        // Show continent selection, hide map
        const continentSection = document.querySelector('.continent-selection');
        const mapSection = document.querySelector('.map-section');
        
        if (continentSection) continentSection.style.display = 'block';
        if (mapSection) {
            mapSection.style.display = 'none';
            // Clear map placeholder
            const mapPlaceholder = document.getElementById('map-placeholder');
            if (mapPlaceholder) {
                mapPlaceholder.innerHTML = 'Select a continent first...';
            }
        }
    }

    setupMapInteraction() {
        const countries = document.querySelectorAll('.country');
        
        countries.forEach(country => {
            // Add both click and touch event handlers for better mobile support
            const handleSelection = (e) => {
                if (this.gameState !== 'playing') return;
                
                // Prevent default behavior to avoid conflicts
                e.preventDefault();
                e.stopPropagation();
                
                // Get all valid countries from our grape database
                const validCountries = [...new Set(this.grapeData.map(grape => grape.country))];
                const clickedCountry = e.target.id;
                
                // Only accept clicks on countries that exist in our grape database
                if (!validCountries.includes(clickedCountry)) {
                    console.log('Invalid country clicked:', clickedCountry);
                    return; // Ignore clicks on small/invalid countries
                }
                
                this.selectedCountry = clickedCountry;
                this.totalQuestions++;
                
                console.log('Country selected:', this.selectedCountry);
                console.log('Correct answer:', this.currentGrape.country);
                
                this.checkAnswer(e.target);
            };
            
            // Add click event for desktop
            country.addEventListener('click', handleSelection);
            
            // Add touch events for mobile devices
            country.addEventListener('touchstart', (e) => {
                // Add visual feedback for touch
                e.target.style.filter = 'brightness(1.2)';
            });
            
            country.addEventListener('touchend', handleSelection);
            
            country.addEventListener('touchcancel', (e) => {
                // Remove visual feedback if touch is cancelled
                e.target.style.filter = '';
            });
            
            // Ensure proper cursor and accessibility
            country.style.cursor = 'pointer';
            country.setAttribute('role', 'button');
            country.setAttribute('tabindex', '0');
            
            // Add keyboard support for accessibility
            country.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelection(e);
                }
            });
        });
    }

    checkAnswer(countryElement) {
        const countryCorrect = this.selectedCountry === this.currentGrape.country;
        
        // Clear any existing feedback classes and styles
        document.querySelectorAll('.country').forEach(c => {
            c.classList.remove('correct', 'incorrect', 'selected');
            c.style.filter = ''; // Clear any brightness filters from touch events
        });
        
        if (countryCorrect) {
            // Perfect answer: continent was already correct to get here, now country is correct too
            this.score++;
            countryElement.classList.add('correct');
            this.showFeedback('✅ Perfect! Both continent and country correct!', 'correct');
        } else {
            // Wrong country (but continent was correct)
            countryElement.classList.add('incorrect');
            // Highlight the correct country
            const correctCountry = document.getElementById(this.currentGrape.country);
            if (correctCountry) {
                correctCountry.classList.add('correct');
            }
            this.showFeedback('❌ Right continent, wrong country!', 'incorrect');
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
        
        // Remove feedback after 1.5 seconds
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1500);
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
        
        // Reset continent selection for new question
        this.resetContinentSelection();
        
        this.selectedCountry = null;
        this.continentCorrect = false;
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
        this.usedGrapes.clear(); // Reset used grapes for new game
        
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


    goToMainPage() {
        // Clear any existing timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
        
        this.gameState = 'start';
        this.renderStartScreen();
    }
    
    showLeaderboard() {
        this.gameContainer.innerHTML = `
            <div class="leaderboard-screen">
                <h2>🏆 Top Rankings</h2>
                <div class="leaderboard-container">
                    ${this.renderLeaderboard()}
                </div>
                <div class="button-group">
                    <button class="btn" onclick="app.renderStartScreen()">Back to Main</button>
                </div>
            </div>
        `;
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