// Game constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 10;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 35;
const INITIAL_BALL_SPEED = 3;
const MAX_BALL_SPEED = 5;
const SPEED_INCREMENT = 0.0005;
const PADDLE_SPEED = 4; // Reduced from 6 for more precise control
const PADDLE_ACCELERATION = 0.4; // Reduced from 0.8 for gentler acceleration
const PADDLE_FRICTION = 0.9; // Increased from 0.85 for smoother deceleration
const MIN_NEW_BRICKS = 20; // Minimum number of bricks to add in new wave
const MAX_NEW_BRICKS = 40; // Maximum number of bricks to add in new wave
const BRICK_COLORS = {
  NORMAL: "#0095DD",
  STRONG: "#800080", // Purple
  SUPER: "#FFA500", // Orange
};
const STRONG_BRICK_HITS = 3;
const SUPER_BRICK_HITS = 5;
const SHADOW_BALL_COST = 50;
const TEMP_BALL_HITS = 5;
const SHADOW_BALL_BASE_CHANCE = 0.05; // 5% initial chance
const SHADOW_BALL_CHANCE_INCREMENT = 0.05; // 5% per upgrade
const SHADOW_BALL_MAX_CHANCE = 0.3; // 30% maximum chance
const SHADOW_CHANCE_UPGRADE_COST = 30; // Cost for each chance increase
const SPARKLE_COUNT = 10; // Number of particles per hit
const SPARKLE_SPEED = 3; // Base speed of particles
const SPARKLE_LIFETIME = 30; // How many frames the sparkles last
const BURN_UPGRADE_COST = 75;
const BURN_CHANCE = 0.15; // 15% chance to burn

const BURN_DAMAGE_INTERVAL = 60; // 1 damage per second (60 frames)
const BURN_DURATION = 120; // 2 seconds (120 frames)

// Game variables
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
const startSpeed = getRandomStartAngle();
let ballSpeedX = startSpeed.x;
let ballSpeedY = startSpeed.y;
let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
let rightPressed = false;
let leftPressed = false;
let score = 0;
let gameOver = false;
let currentSpeed = INITIAL_BALL_SPEED;
let paddleVelocity = 0; // Current speed of paddle
let pointsSinceLastMiss = 0; // Points accumulated since last paddle hit or bottom wall hit
let lastHitByPaddle = false; // Track if the last hit was by paddle
let isPaused = false;
let strongBrickChance = 0.2; // 20% chance for a strong brick
let superBrickChance = 0.1; // 10% chance for a super brick
let hasShadowBallUpgrade = false;
let tempBalls = []; // Array to store temporary balls
let tempBallHits = []; // Array to track hits for each temp ball
let shadowBallChance = SHADOW_BALL_BASE_CHANCE;
let shadowBallChanceLevel = 0; // Tracks number of chance upgrades purchased
let bricksDestroyed = 0;
let paddleBonusPoints = 0;
let sparkles = []; // Array to hold active sparkle particles
let hasBurnUpgrade = false;
let burningBricks = new Map(); // Map to track burning bricks with their timers

// Create bricks array
let bricks = [];
for (let c = 0; c < BRICK_COLS; c++) {
  bricks[c] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[c][r] = createBrick(0, 0);
  }
}

// Event listeners for paddle movement
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  } else if (e.key === " ") {
    // Spacebar
    isPaused = !isPaused;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

// Add this helper function to check for brick overlap
function doesBrickOverlap(x, y, existingBricks) {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      const brick = existingBricks[c][r];
      if (brick.status === 1) {
        // Check if the new brick would overlap with this existing brick
        if (
          !(
            x + BRICK_WIDTH + BRICK_PADDING < brick.x ||
            x > brick.x + BRICK_WIDTH + BRICK_PADDING ||
            y + BRICK_HEIGHT + BRICK_PADDING < brick.y ||
            y > brick.y + BRICK_HEIGHT + BRICK_PADDING
          )
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Add this function to generate new bricks
function addNewBricks() {
  // Determine random number of new bricks to add
  const numNewBricks =
    Math.floor(Math.random() * (MAX_NEW_BRICKS - MIN_NEW_BRICKS + 1)) +
    MIN_NEW_BRICKS;

  let bricksAdded = 0;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (bricksAdded < numNewBricks && attempts < maxAttempts) {
    // Generate random position
    const col = Math.floor(Math.random() * BRICK_COLS);
    const row = Math.floor(Math.random() * BRICK_ROWS);

    // Calculate actual position
    const brickX = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
    const brickY = row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

    // Check if position is empty and doesn't overlap
    if (
      bricks[col][row].status === 0 &&
      !doesBrickOverlap(brickX, brickY, bricks)
    ) {
      bricks[col][row] = createBrick(brickX, brickY);
      bricksAdded++;
    }

    attempts++;
  }

  return bricksAdded > 0;
}

// Add function to check if all bricks are cleared
function areBricksCleared() {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      if (bricks[c][r].status === 1) {
        return false;
      }
    }
  }
  return true;
}

// Collision detection
function collisionDetection() {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      let b = bricks[c][r];
      if (b.status > 0) {
        if (
          ballX > b.x &&
          ballX < b.x + BRICK_WIDTH &&
          ballY > b.y &&
          ballY < b.y + BRICK_HEIGHT
        ) {
          ballSpeedY = -ballSpeedY;
          const originalStatus = b.status;
          b.status--;

          // Apply burn effect
          if (hasBurnUpgrade && Math.random() < BURN_CHANCE) {
            const brickKey = `${c},${r}`;
            if (!burningBricks.has(brickKey) && b.status > 0) {
              burningBricks.set(brickKey, {
                ...b,
                burnTimer: 0,
              });
            }
          }

          if (b.status === 0) {
            pointsSinceLastMiss += originalStatus;
            bricksDestroyed++;
            burningBricks.delete(`${c},${r}`);
          }
          // Check if all bricks are cleared
          if (areBricksCleared()) {
            // Try to add new bricks
            if (!addNewBricks()) {
              // If we couldn't add new bricks, end the game as win
              gameOver = true;
              score += lastHitByPaddle
                ? pointsSinceLastMiss * 2
                : pointsSinceLastMiss;
              ctx.font = "32px Arial";
              ctx.fillStyle = "#0095DD";
              ctx.textAlign = "center";
              ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
              drawResetButton();
              return;
            }
          }
        }
      }
    }
  }
}

// Drawing functions
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      if (bricks[c][r].status > 0) {
        let brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        let brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        ctx.beginPath();
        ctx.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);

        // Color based on remaining hits
        if (bricks[c][r].status === SUPER_BRICK_HITS) {
          ctx.fillStyle = BRICK_COLORS.SUPER;
        } else if (bricks[c][r].status === STRONG_BRICK_HITS) {
          ctx.fillStyle = BRICK_COLORS.STRONG;
        } else if (bricks[c][r].status > 1) {
          const mixColor =
            bricks[c][r].status >= 3 ? BRICK_COLORS.SUPER : BRICK_COLORS.STRONG;
          ctx.fillStyle = mixColor + "77";
        } else {
          ctx.fillStyle = BRICK_COLORS.NORMAL;
        }
        ctx.fill();

        // Add red border if brick is burning
        const brickKey = `${c},${r}`;
        if (burningBricks.has(brickKey)) {
          ctx.strokeStyle = "#FF0000";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.closePath();

        // Add hit count text
        ctx.font = "16px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const brickCenterX = brickX + BRICK_WIDTH / 2;
        const brickCenterY = brickY + BRICK_HEIGHT / 2;
        ctx.fillText(
          bricks[c][r].status.toString(),
          brickCenterX,
          brickCenterY
        );
      }
    }
  }
}

function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 8, 20);

  // Show potential points if there are any accumulated
  if (pointsSinceLastMiss > 0) {
    const potential = lastHitByPaddle
      ? pointsSinceLastMiss * 2
      : pointsSinceLastMiss;
    ctx.fillText("Potential: +" + potential, 8, 40);
  }
}

function drawResetButton() {
  ctx.fillStyle = "#0095DD";
  ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 + 20, 100, 40);
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Reset Game", canvas.width / 2, canvas.height / 2 + 45);
}

function resetGame() {
  score = 0;
  gameOver = false;
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  currentSpeed = INITIAL_BALL_SPEED;

  // Set random initial direction
  const startSpeed = getRandomStartAngle();
  ballSpeedX = startSpeed.x;
  ballSpeedY = startSpeed.y;

  paddleX = (canvas.width - PADDLE_WIDTH) / 2;
  paddleVelocity = 0; // Reset paddle velocity

  // Reset bricks
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[c][r].status = 1;
    }
  }

  pointsSinceLastMiss = 0;
  lastHitByPaddle = false;
  tempBalls = [];
  tempBallHits = [];
  hasShadowBallUpgrade = false;
  shadowBallChance = SHADOW_BALL_BASE_CHANCE;
  shadowBallChanceLevel = 0;
  bricksDestroyed = 0;
  paddleBonusPoints = 0;
  updateStats();
  updateShopUI();
  sparkles = [];
  hasBurnUpgrade = false;
  burningBricks.clear();
}

// Add click event listener after the other event listeners
canvas.addEventListener("click", function (e) {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if click is within reset button bounds
    if (
      clickX > canvas.width / 2 - 50 &&
      clickX < canvas.width / 2 + 50 &&
      clickY > canvas.height / 2 + 20 &&
      clickY < canvas.height / 2 + 60
    ) {
      resetGame();
    }
  }
});

// Add this helper function to generate random ball velocity
function getRandomBallVelocity() {
  const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
  return {
    x: INITIAL_BALL_SPEED * Math.cos(angle),
    y: INITIAL_BALL_SPEED * Math.sin(angle),
  };
}

// Add this helper function to ensure minimum angle for shadow balls
function getRandomShadowBallVelocity() {
  // Random angle between 45 and 135 degrees (in radians)
  const angle = ((Math.random() * 90 + 45) * Math.PI) / 180;
  return {
    x: INITIAL_BALL_SPEED * Math.cos(angle),
    y: -INITIAL_BALL_SPEED * Math.sin(angle), // Negative because y increases downward
  };
}

// Main game loop
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw game elements
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();

  // Draw pause indicator if paused
  if (isPaused) {
    ctx.font = "32px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    requestAnimationFrame(draw);
    return;
  }

  if (!gameOver) {
    collisionDetection();

    // Ball collision with walls
    if (
      ballX + ballSpeedX > canvas.width - BALL_RADIUS ||
      ballX + ballSpeedX < BALL_RADIUS
    ) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballSpeedY < BALL_RADIUS) {
      ballSpeedY = -ballSpeedY;
    } else if (ballY + ballSpeedY > canvas.height - BALL_RADIUS) {
      if (ballX > paddleX && ballX < paddleX + PADDLE_WIDTH) {
        ballSpeedY = -ballSpeedY;
        const normalPoints = pointsSinceLastMiss;
        const totalPoints = pointsSinceLastMiss * 2;
        const bonus = totalPoints - normalPoints;
        score += totalPoints;
        paddleBonusPoints += bonus;
        pointsSinceLastMiss = 0;
        lastHitByPaddle = true;

        // Create sparkles at ball position
        createSparkles(ballX, ballY);

        // Add shadow ball with correct angle
        if (hasShadowBallUpgrade) {
          if (Math.random() < shadowBallChance) {
            const newBallVelocity = getRandomShadowBallVelocity(); // Use new angle function
            tempBalls.push({
              x: ballX,
              y: ballY,
              speedX: newBallVelocity.x,
              speedY: newBallVelocity.y,
            });
            tempBallHits.push(0);
          }
        }
      } else {
        // Bottom wall hit - add regular points and reset
        score += pointsSinceLastMiss;
        pointsSinceLastMiss = 0;
        lastHitByPaddle = false;
        ballSpeedY = -ballSpeedY; // Bounce instead of ending game
      }
    }

    // Paddle movement with acceleration and friction
    if (rightPressed) {
      paddleVelocity += PADDLE_ACCELERATION;
    } else if (leftPressed) {
      paddleVelocity -= PADDLE_ACCELERATION;
    } else {
      // Apply friction when no keys are pressed
      paddleVelocity *= PADDLE_FRICTION;
    }

    // Limit maximum speed
    paddleVelocity = Math.max(
      Math.min(paddleVelocity, PADDLE_SPEED),
      -PADDLE_SPEED
    );

    // Update paddle position
    paddleX += paddleVelocity;

    // Keep paddle within bounds
    if (paddleX < 0) {
      paddleX = 0;
      paddleVelocity = 0;
    } else if (paddleX + PADDLE_WIDTH > canvas.width) {
      paddleX = canvas.width - PADDLE_WIDTH;
      paddleVelocity = 0;
    }

    // Gradually increase speed up to max
    currentSpeed = Math.min(currentSpeed + SPEED_INCREMENT, MAX_BALL_SPEED);

    // Maintain direction while updating speed
    const speedRatio =
      currentSpeed /
      Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
    ballSpeedX *= speedRatio;
    ballSpeedY *= speedRatio;

    // Update ball position
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Handle temporary balls
    for (let i = tempBalls.length - 1; i >= 0; i--) {
      // Draw shadow ball with transparency
      ctx.beginPath();
      ctx.arc(tempBalls[i].x, tempBalls[i].y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(100, 100, 100, 0.2)"; // Grey with high transparency
      ctx.fill();
      ctx.closePath();

      // Update position
      tempBalls[i].x += tempBalls[i].speedX;
      tempBalls[i].y += tempBalls[i].speedY;

      // Wall collisions (including top wall)
      if (
        tempBalls[i].x + tempBalls[i].speedX > canvas.width - BALL_RADIUS ||
        tempBalls[i].x + tempBalls[i].speedX < BALL_RADIUS
      ) {
        tempBalls[i].speedX = -tempBalls[i].speedX;
      }
      if (tempBalls[i].y + tempBalls[i].speedY < BALL_RADIUS) {
        tempBalls[i].speedY = -tempBalls[i].speedY; // Bounce off top wall
      }

      // Check for bottom screen or paddle collision
      if (tempBalls[i].y + tempBalls[i].speedY > canvas.height - BALL_RADIUS) {
        if (
          tempBalls[i].x > paddleX &&
          tempBalls[i].x < paddleX + PADDLE_WIDTH
        ) {
          // Remove ball if it hits paddle
          tempBalls.splice(i, 1);
          tempBallHits.splice(i, 1);
          continue;
        } else {
          // Remove ball if it hits bottom
          tempBalls.splice(i, 1);
          tempBallHits.splice(i, 1);
          continue;
        }
      }

      // Check for brick collisions
      for (let c = 0; c < BRICK_COLS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
          let b = bricks[c][r];
          if (b.status > 0) {
            if (
              tempBalls[i].x > b.x &&
              tempBalls[i].x < b.x + BRICK_WIDTH &&
              tempBalls[i].y > b.y &&
              tempBalls[i].y < b.y + BRICK_HEIGHT
            ) {
              tempBalls[i].speedY = -tempBalls[i].speedY;
              const originalStatus = b.status; // Store initial hits required
              b.status--;
              if (b.status === 0) {
                pointsSinceLastMiss += originalStatus; // Points equal to hits required
              }
            }
          }
        }
      }
    }

    // Update and draw sparkles
    sparkles = sparkles.filter((sparkle) => {
      const alive = sparkle.update();
      if (alive) {
        sparkle.draw(ctx);
      }
      return alive;
    });

    updateBurningBricks();
  } else {
    // If game is over, just show the game over screen and reset button
    if (score === BRICK_ROWS * BRICK_COLS) {
      ctx.font = "32px Arial";
      ctx.fillStyle = "#0095DD";
      ctx.textAlign = "center";
      ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
    } else {
      ctx.font = "32px Arial";
      ctx.fillStyle = "#0095DD";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    }
    drawResetButton();
  }

  updateShopUI();
  updateStats();
  requestAnimationFrame(draw);
}

// Start the game
draw();

// Add this helper function after the constants
function getRandomStartAngle() {
  // Random angle between 45 and 135 degrees (in radians)
  const angle = ((Math.random() * 90 + 45) * Math.PI) / 180;
  return {
    x: INITIAL_BALL_SPEED * Math.cos(angle),
    y: -INITIAL_BALL_SPEED * Math.sin(angle), // Negative because y increases downward
  };
}

// Modify the brick creation in both initial setup and addNewBricks
function createBrick(x, y) {
  const random = Math.random();
  let status;
  if (random < superBrickChance) {
    status = SUPER_BRICK_HITS;
  } else if (random < superBrickChance + strongBrickChance) {
    status = STRONG_BRICK_HITS;
  } else {
    status = 1;
  }
  return {
    x: x,
    y: y,
    status: status,
  };
}

// Add this after the other event listeners
document
  .getElementById("multiballUpgrade")
  .addEventListener("click", function () {
    if (!hasShadowBallUpgrade && score >= SHADOW_BALL_COST) {
      score -= SHADOW_BALL_COST;
      hasShadowBallUpgrade = true;
      this.textContent = "SHADOW BALL (Purchased)";
      this.classList.add("purchased");
    }
  });

// Add this function to update shop UI
function updateShopUI() {
  const shadowBallButton = document.getElementById("multiballUpgrade");
  const chanceUpgradeButton = document.getElementById("shadowChanceUpgrade");

  // Update shadow ball button
  if (hasShadowBallUpgrade) {
    shadowBallButton.textContent = "SHADOW BALL (Purchased)";
    shadowBallButton.classList.add("purchased");
    chanceUpgradeButton.classList.remove("locked");
  } else {
    shadowBallButton.textContent = `SHADOW BALL (${SHADOW_BALL_COST} points)`;
    if (score >= SHADOW_BALL_COST) {
      shadowBallButton.classList.remove("disabled");
    } else {
      shadowBallButton.classList.add("disabled");
    }
    chanceUpgradeButton.classList.add("locked");
  }

  // Update chance upgrade button
  if (hasShadowBallUpgrade) {
    if (shadowBallChance >= SHADOW_BALL_MAX_CHANCE) {
      chanceUpgradeButton.textContent = "SHADOW CHANCE (MAX)";
      chanceUpgradeButton.classList.add("purchased");
    } else {
      chanceUpgradeButton.textContent = `SHADOW CHANCE (+${
        SHADOW_BALL_CHANCE_INCREMENT * 100
      }%) (${SHADOW_CHANCE_UPGRADE_COST} pts)`;
      if (score >= SHADOW_CHANCE_UPGRADE_COST) {
        chanceUpgradeButton.classList.remove("disabled");
      } else {
        chanceUpgradeButton.classList.add("disabled");
      }
    }
  } else {
    chanceUpgradeButton.textContent = "SHADOW CHANCE (Locked)";
  }

  // Update burn upgrade button
  const burnButton = document.getElementById("burnUpgrade");
  if (hasBurnUpgrade) {
    burnButton.textContent = "BURN CHANCE (Purchased)";
    burnButton.classList.add("purchased");
  } else {
    burnButton.textContent = `BURN CHANCE (${BURN_UPGRADE_COST} points)`;
    if (score >= BURN_UPGRADE_COST) {
      burnButton.classList.remove("disabled");
    } else {
      burnButton.classList.add("disabled");
    }
  }
}

// Add click handler for the chance upgrade
document
  .getElementById("shadowChanceUpgrade")
  .addEventListener("click", function () {
    if (
      hasShadowBallUpgrade &&
      shadowBallChance < SHADOW_BALL_MAX_CHANCE &&
      score >= SHADOW_CHANCE_UPGRADE_COST
    ) {
      score -= SHADOW_CHANCE_UPGRADE_COST;
      shadowBallChance += SHADOW_BALL_CHANCE_INCREMENT;
      shadowBallChanceLevel++;
      updateShopUI();
    }
  });

// Add function to update stats display
function updateStats() {
  document.getElementById("bricksDestroyed").textContent = bricksDestroyed;
  document.getElementById("currentStreak").textContent = pointsSinceLastMiss;
  document.getElementById("paddleBonusPoints").textContent = paddleBonusPoints;
  document.getElementById("activeShadowBalls").textContent = tempBalls.length;

  const shadowBallStats = document.getElementById("shadowBallStats");
  if (hasShadowBallUpgrade) {
    shadowBallStats.style.display = "block";
    document.getElementById("shadowBallChance").textContent =
      Math.round(shadowBallChance * 100) + "%";
  } else {
    shadowBallStats.style.display = "none";
  }
}

// Add this new class to manage individual sparkle particles
class Sparkle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * SPARKLE_SPEED;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = SPARKLE_LIFETIME;
    this.maxLife = SPARKLE_LIFETIME;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const opacity = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
    ctx.closePath();
  }
}

// Add this function to create sparkles
function createSparkles(x, y) {
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    sparkles.push(new Sparkle(x, y));
  }
}

// Add new function to handle burn effect
function updateBurningBricks() {
  for (const [key, brick] of burningBricks.entries()) {
    brick.burnTimer++;

    // Apply damage every BURN_DAMAGE_INTERVAL frames
    if (brick.burnTimer % BURN_DAMAGE_INTERVAL === 0) {
      // Get the actual brick from the game state
      const [col, row] = key.split(",").map(Number);
      if (bricks[col][row].status > 0) {
        bricks[col][row].status--;

        // If brick is destroyed by burn
        if (bricks[col][row].status === 0) {
          pointsSinceLastMiss++;
          bricksDestroyed++;
          burningBricks.delete(key);
        }
      }
    }

    // Remove burn effect after duration or if brick is gone
    if (
      brick.burnTimer >= BURN_DURATION ||
      bricks[key.split(",")[0]][key.split(",")[1]].status === 0
    ) {
      burningBricks.delete(key);
    }
  }
}

// Add burn upgrade button handler
document.getElementById("burnUpgrade").addEventListener("click", function () {
  if (!hasBurnUpgrade && score >= BURN_UPGRADE_COST) {
    score -= BURN_UPGRADE_COST;
    hasBurnUpgrade = true;
    this.textContent = "BURN CHANCE (Purchased)";
    this.classList.add("purchased");
  }
});
