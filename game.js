// Game state
const gameState = {
    currentScreen: 'menu',
    isPlaying: false,
    score: 0,
    highScore: 0,
    currentOrbit: 'middle', // 'inner', 'middle', or 'outer'
    orbitRadii: {
        inner: 125, // half of orbit-inner width
        middle: 175, // half of orbit-middle width
        outer: 225  // half of orbit-outer width
    },
    shipAngle: 0,
    shipSpeed: 0.03, // radians per frame
    obstacleGenerationRate: 2000, // milliseconds between obstacle generation
    powerUpGenerationRate: 7000, // milliseconds between power-up generation
    obstacles: [],
    powerUps: [],
    hasShield: false,
    animationFrameId: null,
    obstacleTimerId: null,
    powerUpTimerId: null,
    lastTimestamp: 0,
    localHighScores: []
};

// DOM Elements
const screens = {
    menu: document.getElementById('menu-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen'),
    instructions: document.getElementById('instructions-screen'),
    highScores: document.getElementById('high-scores-screen')
};

const elements = {
    planet: document.getElementById('planet'),
    ship: document.getElementById('ship'),
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),
    newHighScore: document.getElementById('new-high-score'),
    highScoresList: document.getElementById('high-scores-list')
};

// Button event listeners
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('instructions-button').addEventListener('click', () => showScreen('instructions'));
document.getElementById('high-scores-button').addEventListener('click', () => {
    loadHighScores();
    showScreen('highScores');
});
document.getElementById('play-again-button').addEventListener('click', startGame);
document.getElementById('menu-button').addEventListener('click', () => showScreen('menu'));
document.getElementById('back-button').addEventListener('click', () => showScreen('menu'));
document.getElementById('back-from-scores-button').addEventListener('click', () => showScreen('menu'));

// Input event listeners
window.addEventListener('keydown', handleKeyPress);
window.addEventListener('touchstart', handleTouchOrClick);
window.addEventListener('mousedown', handleTouchOrClick);

// Load high score from localStorage
function loadHighScore() {
    const savedHighScore = localStorage.getItem('orbitShiftHighScore');
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
        elements.highScore.textContent = `High Score: ${gameState.highScore}`;
    }
}

// Load high scores list from localStorage
function loadHighScores() {
    const savedHighScores = localStorage.getItem('orbitShiftHighScores');
    if (savedHighScores) {
        gameState.localHighScores = JSON.parse(savedHighScores);
    }

    // Display high scores
    elements.highScoresList.innerHTML = '';
    gameState.localHighScores.sort((a, b) => b.score - a.score).slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score}`;
        elements.highScoresList.appendChild(li);
    });
}

// Save high score to localStorage
function saveHighScore() {
    localStorage.setItem('orbitShiftHighScore', gameState.highScore.toString());
    
    // Add to high scores list
    const playerName = 'Player'; // In a real game, you'd prompt for a name
    gameState.localHighScores.push({ name: playerName, score: gameState.score });
    gameState.localHighScores.sort((a, b) => b.score - a.score);
    
    // Only keep top 10 scores
    if (gameState.localHighScores.length > 10) {
        gameState.localHighScores = gameState.localHighScores.slice(0, 10);
    }
    
    localStorage.setItem('orbitShiftHighScores', JSON.stringify(gameState.localHighScores));
}

// Show the specified screen
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show the requested screen
    screens[screenName].classList.remove('hidden');
    gameState.currentScreen = screenName;
}

// Start the game
function startGame() {
    resetGameState();
    showScreen('game');
    
    // Start game loop
    gameState.lastTimestamp = performance.now();
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
    
    // Start obstacle generation
    gameState.obstacleTimerId = setInterval(generateObstacle, gameState.obstacleGenerationRate);
    
    // Start power-up generation
    gameState.powerUpTimerId = setInterval(generatePowerUp, gameState.powerUpGenerationRate);
    
    gameState.isPlaying = true;
}

// Reset game state for a new game
function resetGameState() {
    gameState.score = 0;
    gameState.currentOrbit = 'middle';
    gameState.shipAngle = 0;
    gameState.obstacles = [];
    gameState.powerUps = [];
    gameState.hasShield = false;
    
    // Remove all obstacle and power-up elements
    document.querySelectorAll('.obstacle, .power-up').forEach(el => el.remove());
    
    // Update score display
    elements.score.textContent = `Score: ${gameState.score}`;
}

// Handle key press events
function handleKeyPress(event) {
    if (!gameState.isPlaying) return;
    
    // Space bar to change orbit
    if (event.code === 'Space') {
        changeOrbit();
    }
}

// Handle touch or click events
function handleTouchOrClick() {
    if (!gameState.isPlaying) return;
    
    changeOrbit();
}

// Change the ship's orbit
function changeOrbit() {
    const orbits = ['inner', 'middle', 'outer'];
    const currentIndex = orbits.indexOf(gameState.currentOrbit);
    
    // Cycle through orbits: inner -> middle -> outer -> inner
    gameState.currentOrbit = orbits[(currentIndex + 1) % orbits.length];
}

// Generate an obstacle
function generateObstacle() {
    // Random orbit
    const orbits = ['inner', 'middle', 'outer'];
    const orbitIndex = Math.floor(Math.random() * orbits.length);
    const orbit = orbits[orbitIndex];
    
    // Random angle (avoiding the ship's position)
    let angle;
    do {
        angle = Math.random() * Math.PI * 2;
    } while (Math.abs(angle - gameState.shipAngle) < 0.5); // Avoid spawning too close to ship
    
    const obstacle = {
        orbit,
        angle,
        element: document.createElement('div')
    };
    
    // Create and position the obstacle element
    obstacle.element.className = 'obstacle';
    positionElement(obstacle.element, obstacle.orbit, obstacle.angle);
    document.querySelector('.planet-container').appendChild(obstacle.element);
    
    gameState.obstacles.push(obstacle);
}

// Generate a power-up
function generatePowerUp() {
    // Random orbit
    const orbits = ['inner', 'middle', 'outer'];
    const orbitIndex = Math.floor(Math.random() * orbits.length);
    const orbit = orbits[orbitIndex];
    
    // Random angle (avoiding the ship's position)
    let angle;
    do {
        angle = Math.random() * Math.PI * 2;
    } while (Math.abs(angle - gameState.shipAngle) < 0.5); // Avoid spawning too close to ship
    
    const powerUpType = Math.random() < 0.7 ? 'shield' : 'slowdown';
    
    const powerUp = {
        orbit,
        angle,
        type: powerUpType,
        element: document.createElement('div')
    };
    
    // Create and position the power-up element
    powerUp.element.className = 'power-up';
    powerUp.element.dataset.type = powerUpType;
    positionElement(powerUp.element, powerUp.orbit, powerUp.angle);
    document.querySelector('.planet-container').appendChild(powerUp.element);
    
    gameState.powerUps.push(powerUp);
}

// Position an element on an orbit at a specific angle
function positionElement(element, orbit, angle) {
    const radius = gameState.orbitRadii[orbit];
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    element.style.transform = `translate(${x}px, ${y}px)`;
}

// Check for collisions between the ship and obstacles/power-ups
function checkCollisions() {
    const shipOrbit = gameState.currentOrbit;
    const shipAngle = gameState.shipAngle;
    
    // Check for collision with obstacles
    gameState.obstacles.forEach((obstacle, index) => {
        if (obstacle.orbit === shipOrbit) {
            // Check if angles are close enough for a collision
            const angleDiff = Math.abs(normalizeAngle(obstacle.angle - shipAngle));
            if (angleDiff < 0.2) { // Collision threshold
                if (gameState.hasShield) {
                    // Remove the obstacle if player has shield
                    obstacle.element.remove();
                    gameState.obstacles.splice(index, 1);
                    gameState.hasShield = false;
                    
                    // Visual feedback for shield usage
                    elements.ship.style.boxShadow = '0 0 10px #ff0, 0 0 15px #ff0';
                    setTimeout(() => {
                        elements.ship.style.boxShadow = '0 0 10px #ff0, 0 0 15px #ff0';
                    }, 300);
                } else {
                    // Game over
                    gameOver();
                    return;
                }
            }
        }
    });
    
    // Check for collision with power-ups
    gameState.powerUps.forEach((powerUp, index) => {
        if (powerUp.orbit === shipOrbit) {
            // Check if angles are close enough for collection
            const angleDiff = Math.abs(normalizeAngle(powerUp.angle - shipAngle));
            if (angleDiff < 0.2) { // Collection threshold
                // Apply power-up effect
                if (powerUp.type === 'shield') {
                    gameState.hasShield = true;
                    elements.ship.style.boxShadow = '0 0 10px #0f0, 0 0 15px #0f0, 0 0 20px #0f0';
                } else if (powerUp.type === 'slowdown') {
                    // Slow down obstacle generation temporarily
                    clearInterval(gameState.obstacleTimerId);
                    gameState.obstacleGenerationRate *= 1.5;
                    gameState.obstacleTimerId = setInterval(generateObstacle, gameState.obstacleGenerationRate);
                    
                    // Reset after 5 seconds
                    setTimeout(() => {
                        clearInterval(gameState.obstacleTimerId);
                        gameState.obstacleGenerationRate /= 1.5;
                        gameState.obstacleTimerId = setInterval(generateObstacle, gameState.obstacleGenerationRate);
                    }, 5000);
                }
                
                // Remove the power-up
                powerUp.element.remove();
                gameState.powerUps.splice(index, 1);
            }
        }
    });
}

// Normalize angle to be between -PI and PI
function normalizeAngle(angle) {
    return ((angle + Math.PI) % (Math.PI * 2)) - Math.PI;
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameState.isPlaying) return;
    
    // Calculate delta time
    const deltaTime = timestamp - gameState.lastTimestamp;
    gameState.lastTimestamp = timestamp;
    
    // Move the ship
    gameState.shipAngle += gameState.shipSpeed * deltaTime;
    if (gameState.shipAngle > Math.PI * 2) {
        gameState.shipAngle -= Math.PI * 2;
    }
    
    // Position the ship
    positionElement(elements.ship, gameState.currentOrbit, gameState.shipAngle);
    
    // Rotate the ship to face the direction of travel
    elements.ship.style.transform += ` rotate(${gameState.shipAngle * (180/Math.PI) + 90}deg)`;
    
    // Check for collisions
    checkCollisions();
    
    // Increase score
    gameState.score += Math.floor(deltaTime / 100);
    elements.score.textContent = `Score: ${gameState.score}`;
    
    // Increase difficulty over time
    if (gameState.score > 0 && gameState.score % 500 === 0) {
        gameState.shipSpeed *= 1.05;
        
        // Clear and restart obstacle generation timer with faster rate
        clearInterval(gameState.obstacleTimerId);
        gameState.obstacleGenerationRate = Math.max(500, gameState.obstacleGenerationRate * 0.95);
        gameState.obstacleTimerId = setInterval(generateObstacle, gameState.obstacleGenerationRate);
    }
    
    // Continue the game loop
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameState.isPlaying = false;
    
    // Stop game timers
    cancelAnimationFrame(gameState.animationFrameId);
    clearInterval(gameState.obstacleTimerId);
    clearInterval(gameState.powerUpTimerId);
    
    // Check for high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        elements.highScore.textContent = `High Score: ${gameState.highScore}`;
        elements.newHighScore.classList.remove('hidden');
        saveHighScore();
    } else {
        elements.newHighScore.classList.add('hidden');
    }
    
    // Update final score
    elements.finalScore.textContent = `Score: ${gameState.score}`;
    
    // Show game over screen
    showScreen('gameOver');
}

// Initialize the game
function init() {
    loadHighScore();
    showScreen('menu');
}

// Start the game when loaded
window.addEventListener('load', init);