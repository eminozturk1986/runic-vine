const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runUITest() {
    console.log('🚀 Starting Runic Vine UI Test...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let testResults = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    try {
        const page = await browser.newPage();
        
        // Set viewport for consistent testing
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the game
        const indexPath = path.join(__dirname, '..', 'index.html');
        const fileUrl = `file://${indexPath}`;
        
        console.log('📄 Loading game page...');
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        
        // Test 1: Check if start screen loads
        console.log('✅ Test 1: Start screen loads');
        await page.waitForSelector('.start-screen', { timeout: 5000 });
        await page.waitForSelector('#player-name', { timeout: 3000 });
        await page.waitForSelector('#player-email', { timeout: 3000 });
        testResults.passed++;
        testResults.details.push('✅ Start screen loaded successfully');
        
        // Test 2: Fill in player information
        console.log('✅ Test 2: Fill player information');
        const testName = 'Test Player';
        const testEmail = 'test@example.com';
        
        await page.type('#player-name', testName);
        await page.type('#player-email', testEmail);
        testResults.passed++;
        testResults.details.push('✅ Player information entered');
        
        // Test 3: Start the game
        console.log('✅ Test 3: Start game');
        await page.click('button[type="submit"]');
        
        // Wait for game screen to load
        await page.waitForSelector('.game-screen', { timeout: 5000 });
        await page.waitForSelector('.grape-variety', { timeout: 3000 });
        await page.waitForSelector('#timer-display', { timeout: 3000 });
        testResults.passed++;
        testResults.details.push('✅ Game screen loaded successfully');
        
        // Test 4: Check if grape variety is displayed
        console.log('✅ Test 4: Grape variety displayed');
        const grapeVariety = await page.$eval('.grape-variety', el => el.textContent);
        if (grapeVariety && grapeVariety.trim().length > 0) {
            testResults.passed++;
            testResults.details.push(`✅ Grape variety displayed: "${grapeVariety.trim()}"`);
        } else {
            testResults.failed++;
            testResults.details.push('❌ No grape variety displayed');
        }
        
        // Test 5: Check if timer is running
        console.log('✅ Test 5: Timer functionality');
        const initialTimer = await page.$eval('#timer-display', el => el.textContent);
        await page.waitForTimeout(2000); // Wait 2 seconds
        const laterTimer = await page.$eval('#timer-display', el => el.textContent);
        
        if (initialTimer !== laterTimer) {
            testResults.passed++;
            testResults.details.push(`✅ Timer is running: ${initialTimer} → ${laterTimer}`);
        } else {
            testResults.failed++;
            testResults.details.push(`❌ Timer not working: ${initialTimer} = ${laterTimer}`);
        }
        
        // Test 6: Wait for map to load and click a country
        console.log('✅ Test 6: Map interaction');
        await page.waitForSelector('.country', { timeout: 5000 });
        
        // Get all countries and click a random one
        const countries = await page.$$('.country');
        if (countries.length > 0) {
            const randomCountry = countries[Math.floor(Math.random() * countries.length)];
            await randomCountry.click();
            
            // Wait for feedback
            await page.waitForTimeout(1500);
            testResults.passed++;
            testResults.details.push('✅ Successfully clicked a country');
        } else {
            testResults.failed++;
            testResults.details.push('❌ No countries found on map');
        }
        
        // Test 7: Check score tracking
        console.log('✅ Test 7: Score tracking');
        const score = await page.$eval('#score-display', el => el.textContent);
        const questions = await page.$eval('#questions-display', el => el.textContent);
        
        if (parseInt(questions) > 0) {
            testResults.passed++;
            testResults.details.push(`✅ Score tracking works: ${score} correct out of ${questions} questions`);
        } else {
            testResults.failed++;
            testResults.details.push('❌ Score tracking not working');
        }
        
        // Test 8: Fast-forward timer by manipulating the app directly
        console.log('✅ Test 8: Timer expiry simulation');
        await page.evaluate(() => {
            // Access the app instance and force timer to almost expire
            if (window.app && window.app.timeRemaining) {
                window.app.timeRemaining = 2; // Set to 2 seconds remaining
            }
        });
        
        // Wait for game to end
        await page.waitForSelector('.end-screen', { timeout: 10000 });
        testResults.passed++;
        testResults.details.push('✅ Game ended successfully when timer expired');
        
        // Test 9: Check final score screen
        console.log('✅ Test 9: Final score screen');
        await page.waitForSelector('.final-score-section', { timeout: 3000 });
        await page.waitForSelector('.player-name', { timeout: 3000 });
        
        const playerNameDisplay = await page.$eval('.player-name', el => el.textContent);
        if (playerNameDisplay.includes(testName)) {
            testResults.passed++;
            testResults.details.push(`✅ Player name displayed correctly: "${playerNameDisplay}"`);
        } else {
            testResults.failed++;
            testResults.details.push(`❌ Player name not displayed correctly: "${playerNameDisplay}"`);
        }
        
        // Test 10: Check leaderboard
        console.log('✅ Test 10: Leaderboard functionality');
        await page.waitForSelector('.leaderboard-section', { timeout: 3000 });
        
        // Check if leaderboard table exists or "no scores" message
        const leaderboardExists = await page.$('.leaderboard-table');
        const noScoresMessage = await page.$('.no-scores');
        
        if (leaderboardExists) {
            // Check if our test player is in the leaderboard
            const leaderboardText = await page.$eval('.leaderboard-table', el => el.textContent);
            if (leaderboardText.includes(testName)) {
                testResults.passed++;
                testResults.details.push('✅ Test player found in leaderboard');
            } else {
                testResults.failed++;
                testResults.details.push('❌ Test player not found in leaderboard');
            }
        } else if (noScoresMessage) {
            // If it's the first run, there might be no scores yet
            testResults.passed++;
            testResults.details.push('✅ Leaderboard shows "no scores" message (expected for first run)');
        } else {
            testResults.failed++;
            testResults.details.push('❌ Leaderboard section not found');
        }
        
        // Test 11: Check Play Again button
        console.log('✅ Test 11: Play Again functionality');
        const playAgainButton = await page.$('button[onclick*="startNewGame"]');
        if (playAgainButton) {
            testResults.passed++;
            testResults.details.push('✅ Play Again button found');
        } else {
            testResults.failed++;
            testResults.details.push('❌ Play Again button not found');
        }
        
        // Test 12: Test localStorage persistence
        console.log('✅ Test 12: localStorage persistence');
        const scores = await page.evaluate(() => {
            return localStorage.getItem('runicVineScores');
        });
        
        if (scores) {
            const parsedScores = JSON.parse(scores);
            if (Array.isArray(parsedScores) && parsedScores.length > 0) {
                const hasTestPlayer = parsedScores.some(score => score.name === testName);
                if (hasTestPlayer) {
                    testResults.passed++;
                    testResults.details.push('✅ Score saved to localStorage successfully');
                } else {
                    testResults.failed++;
                    testResults.details.push('❌ Test player score not found in localStorage');
                }
            } else {
                testResults.failed++;
                testResults.details.push('❌ localStorage scores is not a valid array');
            }
        } else {
            testResults.failed++;
            testResults.details.push('❌ No scores found in localStorage');
        }
        
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`❌ Test failed with error: ${error.message}`);
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
    
    // Print results
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    console.log('\n📝 DETAILED RESULTS');
    console.log('===================');
    testResults.details.forEach(detail => console.log(detail));
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Runic Vine is working correctly.');
        process.exit(0);
    } else {
        console.log(`\n⚠️ ${testResults.failed} test(s) failed. Please check the issues above.`);
        process.exit(1);
    }
}

// Check if puppeteer is installed
try {
    require('puppeteer');
} catch (error) {
    console.error('❌ Puppeteer is not installed. Please run: npm install puppeteer');
    process.exit(1);
}

// Run the test
runUITest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});