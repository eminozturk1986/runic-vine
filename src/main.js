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
            <div class="max-w-md w-full mx-auto">
                <div class="bg-white rounded-2xl shadow-xl border border-rose-100 p-8">
                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome to Runic Vine</h2>
                        <p class="text-gray-600 leading-relaxed">Test your knowledge of grape varieties and their countries of origin!</p>
                    </div>
                    
                    <form id="player-form" class="space-y-6">
                        <div>
                            <label for="player-name" class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                            <input type="text" id="player-name" 
                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200" 
                                placeholder="Enter your name" required>
                        </div>
                        
                        <div>
                            <label for="player-email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" id="player-email" 
                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200" 
                                placeholder="Enter your email" required>
                        </div>
                        
                        <div class="space-y-3 pt-4">
                            <button type="submit" 
                                class="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                                Start Game
                            </button>
                            <button type="button" 
                                class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105" 
                                onclick="app.showLeaderboard()">
                                View Rankings
                            </button>
                        </div>
                    </form>
                    
                    <div class="text-center mt-6 pt-6 border-t border-gray-100">
                        <p class="text-sm text-gray-500">
                            <i class="fas fa-wine-glass-alt text-rose-500 mr-2"></i>
                            ${this.grapeData.length} grape varieties loaded and ready
                        </p>
                    </div>
                </div>
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
        // DEBUG MODE: Force Turkish grapes for testing
        const debugMode = true; // Set to false after testing
        const turkishGrapes = ['Boğazkere', 'Emir', 'Kalecik Karası', 'Keten Gömlek', 'Narince', 'Papazkarası', 'Çalkarası', 'Öküzgözü'];
        
        if (debugMode) {
            // Find Turkish grapes that haven't been used yet
            const availableTurkishGrapes = this.grapeData.filter(grape => 
                turkishGrapes.includes(grape.variety) && !this.usedGrapes.has(grape.variety)
            );
            
            if (availableTurkishGrapes.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableTurkishGrapes.length);
                this.currentGrape = availableTurkishGrapes[randomIndex];
                this.usedGrapes.add(this.currentGrape.variety);
                console.log(`🧪 DEBUG: Selected Turkish grape: ${this.currentGrape.variety}`);
                return;
            }
        }
        
        // Normal random selection
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

    getMapIdForCountry(countryName) {
        // Reverse mapping: grape data country name -> map ID
        const reverseCountryMap = {
            // Asia reverse mappings
            'Turkey': 'Türkiye',
            'Hong Kong': 'Hong_Kong',
            'Saudi Arabia': 'Saudi_Arabia',
            'UAE': 'United_Arab_Emirates',
            'North Korea': 'North_Korea',
            'South Korea': 'South_Korea',
            'Sri Lanka': 'Sri_Lanka',
            'Timor-Leste': 'Timor_Leste',
            'Palestine': 'Palestinian_Territories',
            
            // Americas reverse mappings
            'USA': 'United_States_of_America'
        };
        
        return reverseCountryMap[countryName] || countryName;
    }

    async renderGameScreen() {
        this.gameContainer.innerHTML = `
            <div class="max-w-4xl w-full mx-auto space-y-6">
                <!-- Stats Header -->
                <div class="bg-white rounded-xl shadow-lg border border-rose-100 p-4">
                    <div class="flex justify-between items-center text-sm md:text-base">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-star text-yellow-500"></i>
                            <span>Score: <strong id="score-display" class="text-rose-600">${this.score}</strong></span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-clock text-blue-500"></i>
                            <span>Time: <strong id="timer-display" class="text-blue-600">2:00</strong></span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-question-circle text-green-500"></i>
                            <span>Questions: <strong id="questions-display" class="text-green-600">${this.totalQuestions}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Main Game Card -->
                <div class="bg-white rounded-2xl shadow-xl border border-rose-100 p-4 md:p-8">
                    <!-- Grape Variety Display -->
                    <div class="text-center mb-6">
                        <h2 class="grape-variety text-3xl md:text-4xl font-bold text-gray-900 mb-2">${this.currentGrape.variety}</h2>
                        <p class="text-gray-600">Which continent does this grape variety originate from?</p>
                    </div>
                    
                    <!-- Continent Selection -->
                    <div class="continent-selection">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button class="continent-btn bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 text-blue-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center space-y-2" data-continent="europe">
                                <i class="fas fa-monument text-2xl"></i>
                                <span>Europe</span>
                            </button>
                            <button class="continent-btn bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-200 hover:border-yellow-300 text-yellow-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center space-y-2" data-continent="asia">
                                <i class="fas fa-torii-gate text-2xl"></i>
                                <span>Asia</span>
                            </button>
                            <button class="continent-btn bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-300 text-orange-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center space-y-2" data-continent="africa">
                                <i class="fas fa-tree text-2xl"></i>
                                <span>Africa</span>
                            </button>
                            <button class="continent-btn bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 hover:border-green-300 text-green-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex flex-col items-center space-y-2" data-continent="south-america">
                                <i class="fas fa-mountain text-2xl"></i>
                                <span>Americas</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Map Section (Initially Hidden) -->
                <div class="map-section bg-white rounded-2xl shadow-xl border border-rose-100 p-4 md:p-8" style="display: none;">
                    <div class="text-center mb-4">
                        <h3 class="text-xl md:text-2xl font-bold text-gray-900 mb-2">Select the country:</h3>
                        <p class="text-sm md:text-base text-gray-600">Click on the country where this grape variety originates</p>
                    </div>
                    <div class="map-container">
                        <div id="map-placeholder" class="text-center text-gray-500 py-8">Select a continent first...</div>
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
        
        const result = continentMap[grape.country] || 'europe';
        
        // Extra debugging for ALL grapes to catch Turkish ones
        console.log('🔍 GRAPE ANALYSIS:', grape.variety, '→', grape.country);
        
        // Extra debugging for Turkish grapes
        if (grape.country === 'Turkey') {
            console.log('🇹🇷 TURKISH GRAPE DEBUG:');
            console.log('- Variety:', JSON.stringify(grape.variety));
            console.log('- Country:', JSON.stringify(grape.country));
            console.log('- Variety length:', grape.variety.length);
            console.log('- Country length:', grape.country.length);
            console.log('- Variety char codes:', [...grape.variety].map(c => c.charCodeAt(0)));
            console.log('- Country char codes:', [...grape.country].map(c => c.charCodeAt(0)));
            console.log('- Mapped continent:', result);
            console.log('- Turkey in map?', continentMap.hasOwnProperty('Turkey'));
            console.log('- Exact match test:', grape.country === 'Turkey');
        }
        
        return result;
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
                
                console.log('=== CONTINENT DEBUG ===');
                console.log('Grape variety:', this.currentGrape.variety);
                console.log('Grape country:', this.currentGrape.country);
                console.log('Selected continent:', selectedContinent);
                console.log('Correct continent:', correctContinent);
                console.log('Continents match:', selectedContinent === correctContinent);
                console.log('=======================');
                
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
                    
                    // Hide entire continent selection section to save space
                    setTimeout(() => {
                        document.querySelector('.continent-selection').style.display = 'none';
                    }, 800);
                    
                    // Load the correct continent map for country selection
                    await this.loadContinentMap(selectedContinent);
                    
                    // Show map section and scroll it into view for mobile
                    const mapSection = document.querySelector('.map-section');
                    mapSection.style.display = 'block';
                    
                    // Scroll map into view on mobile after a brief delay
                    setTimeout(() => {
                        mapSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }, 900);
                    
                } else {
                    e.target.classList.add('incorrect-continent');
                    // Also highlight the correct continent
                    const correctBtn = document.querySelector(`[data-continent="${correctContinent}"]`);
                    if (correctBtn) {
                        correctBtn.classList.add('correct-continent');
                    }
                    
                    this.continentCorrect = false;
                    
                    // Show feedback and move to next question
                    this.showFeedback('❌', 'incorrect');
                    
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
                
                // Map clicked country names to grape data country names
                const countryNameMap = {
                    // Asia mappings
                    'Türkiye': 'Turkey',
                    'Hong_Kong': 'Hong Kong',
                    'Saudi_Arabia': 'Saudi Arabia',
                    'United_Arab_Emirates': 'UAE',
                    'North_Korea': 'North Korea',
                    'South_Korea': 'South Korea',
                    'Sri_Lanka': 'Sri Lanka',
                    'Timor_Leste': 'Timor-Leste',
                    'Palestinian_Territories': 'Palestine',
                    
                    // Americas mappings
                    'United_States_of_America': 'USA',
                    'United_States': 'USA'
                };
                
                const mappedCountry = countryNameMap[clickedCountry] || clickedCountry;
                
                // Only accept clicks on countries that exist in our grape database
                if (!validCountries.includes(mappedCountry)) {
                    console.log('Invalid country clicked:', clickedCountry, '(mapped to:', mappedCountry, ')');
                    return; // Ignore clicks on small/invalid countries
                }
                
                this.selectedCountry = mappedCountry;
                this.totalQuestions++;
                
                console.log('Country selected:', this.selectedCountry, '(clicked:', clickedCountry, ')');
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
        
        console.log('=== ANSWER CHECK DEBUG ===');
        console.log('Selected country:', this.selectedCountry);
        console.log('Correct answer:', this.currentGrape.country);
        console.log('Countries match:', countryCorrect);
        console.log('========================');
        
        // Clear any existing feedback classes and styles
        document.querySelectorAll('.country').forEach(c => {
            c.classList.remove('correct', 'incorrect', 'selected');
            c.style.filter = ''; // Clear any brightness filters from touch events
        });
        
        if (countryCorrect) {
            // Perfect answer: continent was already correct to get here, now country is correct too
            this.score++;
            countryElement.classList.add('correct');
            this.showFeedback('✅', 'correct');
        } else {
            // Wrong country (but continent was correct)
            countryElement.classList.add('incorrect');
            
            // Need to find the correct country on the map using reverse mapping
            const correctCountryMapId = this.getMapIdForCountry(this.currentGrape.country);
            const correctCountry = document.getElementById(correctCountryMapId);
            console.log('Looking for correct country map ID:', correctCountryMapId);
            console.log('Found correct country element:', !!correctCountry);
            
            if (correctCountry) {
                correctCountry.classList.add('correct');
            }
            this.showFeedback(`❌ ${this.currentGrape.country}`, 'incorrect');
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
        
        // Scroll back to grape variety for mobile
        setTimeout(() => {
            const grapeVarietyElement = document.querySelector('.grape-variety');
            if (grapeVarietyElement) {
                grapeVarietyElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 100);
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
            <div class="max-w-4xl w-full mx-auto space-y-6">
                <!-- Final Score Card -->
                <div class="bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center">
                    <div class="mb-6">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-full mb-4">
                            <i class="fas fa-trophy text-3xl text-rose-600"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Time's Up!</h2>
                        <p class="text-xl text-gray-700">Well done, <span class="font-semibold text-rose-600">${this.playerData.name}</span>!</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200">
                            <div class="text-3xl font-bold text-rose-600 mb-2">${this.score}</div>
                            <div class="text-sm font-medium text-rose-800">Correct Answers</div>
                        </div>
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <div class="text-3xl font-bold text-blue-600 mb-2">${this.totalQuestions}</div>
                            <div class="text-sm font-medium text-blue-800">Total Questions</div>
                        </div>
                        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                            <div class="text-3xl font-bold text-green-600 mb-2">${percentage}%</div>
                            <div class="text-sm font-medium text-green-800">Accuracy</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button class="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg" onclick="app.startNewGame()">
                            <i class="fas fa-redo mr-2"></i>Play Again
                        </button>
                        <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105" onclick="app.renderStartScreen()">
                            <i class="fas fa-user-plus mr-2"></i>New Player
                        </button>
                    </div>
                </div>
                
                <!-- Leaderboard Card -->
                <div class="bg-white rounded-2xl shadow-xl border border-rose-100 p-8">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">
                            <i class="fas fa-trophy text-yellow-500 mr-2"></i>Top Scores
                        </h3>
                        <p class="text-gray-600">See how you rank against other players</p>
                    </div>
                    <div id="leaderboard-container">
                        ${this.renderLeaderboard()}
                    </div>
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
            return '<div class="text-center text-gray-500 py-8">Unable to load leaderboard</div>';
        }
        
        if (scores.length === 0) {
            return '<div class="text-center text-gray-500 py-8">No scores yet. Be the first to play!</div>';
        }
        
        // Get top 10 scores
        const topScores = scores.slice(0, 10);
        const currentPlayerTimestamp = Date.now();
        
        let leaderboardHTML = '<div class="space-y-3">';
        
        topScores.forEach((scoreData, index) => {
            const rank = index + 1;
            const isCurrentPlayer = Math.abs(scoreData.timestamp - currentPlayerTimestamp) < 5000; // Within 5 seconds
            const highlightClass = isCurrentPlayer ? 'ring-2 ring-rose-500 bg-rose-50' : 'bg-gray-50';
            
            let rankDisplay = rank;
            let rankIcon = '';
            if (rank === 1) {
                rankDisplay = '1st';
                rankIcon = '<i class="fas fa-trophy text-yellow-500 text-lg"></i>';
            } else if (rank === 2) {
                rankDisplay = '2nd';
                rankIcon = '<i class="fas fa-medal text-gray-400 text-lg"></i>';
            } else if (rank === 3) {
                rankDisplay = '3rd';
                rankIcon = '<i class="fas fa-award text-amber-600 text-lg"></i>';
            } else {
                rankIcon = `<span class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">${rank}</span>`;
            }
            
            leaderboardHTML += `
                <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200 ${highlightClass} transition-all duration-200">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-8">
                            ${rankIcon}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">${this.escapeHtml(scoreData.name)}</div>
                            <div class="text-sm text-gray-500">${scoreData.date}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-gray-900">${scoreData.score}/${scoreData.totalQuestions}</div>
                        <div class="text-sm font-medium text-gray-600">${scoreData.accuracy}% accuracy</div>
                    </div>
                </div>
            `;
        });
        
        leaderboardHTML += '</div>';
        
        return leaderboardHTML;
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
            <div class="max-w-2xl w-full mx-auto">
                <div class="bg-white rounded-2xl shadow-xl border border-rose-100 p-8">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                            <i class="fas fa-trophy text-2xl text-yellow-600"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Top Rankings</h2>
                        <p class="text-gray-600">See how you rank against other players</p>
                    </div>
                    
                    <div class="mb-8">
                        ${this.renderLeaderboard()}
                    </div>
                    
                    <div class="text-center">
                        <button class="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg" onclick="app.renderStartScreen()">
                            <i class="fas fa-arrow-left mr-2"></i>Back to Main
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderError() {
        this.gameContainer.innerHTML = `
            <div class="max-w-md w-full mx-auto">
                <div class="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <i class="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Error Loading Game</h2>
                    <p class="text-gray-600 mb-6">Unable to load game data. Please refresh the page.</p>
                    <button class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200" onclick="window.location.reload()">
                        <i class="fas fa-refresh mr-2"></i>Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RunicVineApp();
});