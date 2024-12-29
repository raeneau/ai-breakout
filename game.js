// First, declare all canvas-related variables
let canvas, ctx;
let ballX, ballY, ballSpeedX, ballSpeedY, paddleX;

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
const BRICK_COLORS = {
  NORMAL: "#0095DD",
  STRONG: "#800080", // Purple
  SUPER: "#FFA500", // Orange
};
const STRONG_BRICK_HITS = 3;
const SUPER_BRICK_HITS = 5;
const TEMP_BALL_HITS = 5;
const SPARKLE_COUNT = 10; // Number of particles per hit
const SPARKLE_SPEED = 3; // Base speed of particles
const SPARKLE_LIFETIME = 30; // How many frames the sparkles last

const BURN_DAMAGE_INTERVAL = 60; // 1 damage per second (60 frames)
const BURN_DURATION = 120; // 2 seconds (120 frames)

// Initialize game state variables that don't depend on canvas
let rightPressed = false;
let leftPressed = false;
window.score = 0;
let gameOver = false;
let currentSpeed = INITIAL_BALL_SPEED;
let paddleVelocity = 0;
let pointsSinceLastMiss = 0;
let lastHitByPaddle = false;
let isPaused = false;
let strongBrickChance = 0.2;
let superBrickChance = 0.1;
let bricksDestroyed = 0;
let paddleBonusPoints = 0;
let sparkles = [];
let burningBricks = new Map();
let currentRound = 1;
let tempBalls = [];
let tempBallHits = [];
let bricks = [];

// Add key handler functions
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

// Export the initialization function
export function initializeGame() {
  // Initialize canvas and context
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Now initialize canvas-dependent variables
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  const startSpeed = getRandomStartAngle();
  ballSpeedX = startSpeed.x;
  ballSpeedY = startSpeed.y;
  paddleX = (canvas.width - PADDLE_WIDTH) / 2;

  // Create bricks array
  bricks = [];
  for (let c = 0; c < BRICK_COLS; c++) {
    bricks[c] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[c][r] = createBrick(0, 0);
    }
  }

  // Add all event listeners
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
  canvas.addEventListener("click", handleGameClick);
  canvas.addEventListener("click", handleCanvasClick);

  // Add shop-related event listeners
  document
    .getElementById("shadowChanceUpgrade")
    .addEventListener("click", function () {
      if (
        hasShadowBallUpgrade &&
        shadowBallChance < SHADOW_BALL_MAX_CHANCE &&
        window.score >= SHADOW_CHANCE_UPGRADE_COST
      ) {
        window.score -= SHADOW_CHANCE_UPGRADE_COST;
        shadowBallChance += SHADOW_BALL_CHANCE_INCREMENT;
        shadowBallChanceLevel++;
        updateShopUI();
      }
    });

  document.getElementById("burnUpgrade").addEventListener("click", function () {
    if (!hasBurnUpgrade && window.score >= BURN_UPGRADE_COST) {
      window.score -= BURN_UPGRADE_COST;
      hasBurnUpgrade = true;
      this.textContent = "BURN CHANCE (Purchased)";
      this.classList.add("purchased");
    }
  });

  document
    .getElementById("burnChanceUpgrade")
    .addEventListener("click", function () {
      if (
        hasBurnUpgrade &&
        burnChance < BURN_CHANCE_MAX &&
        window.score >= BURN_CHANCE_UPGRADE_COST
      ) {
        window.score -= BURN_CHANCE_UPGRADE_COST;
        burnChance += BURN_CHANCE_INCREMENT;
        burnChanceLevel++;
        updateShopUI();
      }
    });

  // Add tab event listeners
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.style.display = "none";
      });
      const tabId = this.getAttribute("data-tab") + "Tab";
      document.getElementById(tabId).style.display = "block";
    });
  });

  // Start the game loop
  requestAnimationFrame(draw);
}

// Rename the canvas click handler to a named function
function handleCanvasClick(e) {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
      clickX > canvas.width / 2 - 50 &&
      clickX < canvas.width / 2 + 50 &&
      clickY > canvas.height / 2 + 20 &&
      clickY < canvas.height / 2 + 60
    ) {
      resetGame();
    }
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
  // Fill all positions with new bricks
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
      const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
      bricks[c][r] = createBrick(brickX, brickY);
    }
  }
  currentRound++; // Increment round when new bricks are added
  updateStats(); // Update the display
  return true;
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
          if (hasBurnUpgrade && Math.random() < burnChance) {
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
              window.score += lastHitByPaddle
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
  ctx.fillText("Score: " + window.score, 8, 20);

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
  window.score = 0;
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
  bricksDestroyed = 0;
  paddleBonusPoints = 0;
  updateStats();
  updateShopUI();
  sparkles = [];
  burningBricks.clear();
  burnChance = BURN_CHANCE_BASE;
  burnChanceLevel = 0;
  resetShop();
  currentRound = 1;
}

// Add the click handler function
function handleGameClick(e) {
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
}

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
export function draw() {
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
        window.score += totalPoints;
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
        window.score += pointsSinceLastMiss;
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
    if (window.score === BRICK_ROWS * BRICK_COLS) {
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

// Add this function to update shop UI
function updateShopUI() {
  // Shadow upgrades
  const shadowBallButton = document.getElementById("multiballUpgrade");
  const shadowChanceButton = document.getElementById("shadowChanceUpgrade");

  if (hasShadowBallUpgrade) {
    shadowBallButton.textContent = "SHADOW BALL (Purchased)";
    shadowBallButton.classList.add("purchased");
    shadowChanceButton.classList.remove("locked");
  } else {
    shadowBallButton.textContent = `SHADOW BALL (${SHADOW_BALL_COST} points)`;
    if (window.score >= SHADOW_BALL_COST) {
      shadowBallButton.classList.remove("disabled");
    } else {
      shadowBallButton.classList.add("disabled");
    }
    shadowChanceButton.classList.add("locked");
  }

  // Update shadow chance upgrade button
  if (hasShadowBallUpgrade) {
    if (shadowBallChance >= SHADOW_BALL_MAX_CHANCE) {
      shadowChanceButton.textContent = "SHADOW CHANCE (MAX)";
      shadowChanceButton.classList.add("purchased");
    } else {
      shadowChanceButton.textContent = `SHADOW CHANCE (+${
        SHADOW_BALL_CHANCE_INCREMENT * 100
      }%) (${SHADOW_CHANCE_UPGRADE_COST} pts)`;
      if (window.score >= SHADOW_CHANCE_UPGRADE_COST) {
        shadowChanceButton.classList.remove("disabled");
      } else {
        shadowChanceButton.classList.add("disabled");
      }
    }
  } else {
    shadowChanceButton.textContent = "SHADOW CHANCE (Locked)";
  }

  // Fire upgrades
  const burnButton = document.getElementById("burnUpgrade");
  const burnChanceButton = document.getElementById("burnChanceUpgrade");

  if (hasBurnUpgrade) {
    burnButton.textContent = "BURN CHANCE (Purchased)";
    burnButton.classList.add("purchased");
    burnChanceButton.classList.remove("locked");
  } else {
    burnButton.textContent = `BURN BRICKS (${BURN_UPGRADE_COST} points)`;
    if (window.score >= BURN_UPGRADE_COST) {
      burnButton.classList.remove("disabled");
    } else {
      burnButton.classList.add("disabled");
    }
    burnChanceButton.classList.add("locked");
  }

  // Update burn chance upgrade button
  if (hasBurnUpgrade) {
    if (burnChance >= BURN_CHANCE_MAX) {
      burnChanceButton.textContent = "BURN CHANCE (MAX)";
      burnChanceButton.classList.add("purchased");
    } else {
      burnChanceButton.textContent = `BURN CHANCE (+${
        BURN_CHANCE_INCREMENT * 100
      }%) (${BURN_CHANCE_UPGRADE_COST} pts)`;
      if (window.score >= BURN_CHANCE_UPGRADE_COST) {
        burnChanceButton.classList.remove("disabled");
      } else {
        burnChanceButton.classList.add("disabled");
      }
    }
  } else {
    burnChanceButton.textContent = "BURN CHANCE (Locked)";
  }
}

// Add this function to update stats display
function updateStats() {
  document.getElementById("bricksDestroyed").textContent = bricksDestroyed;
  document.getElementById("paddleBonusPoints").textContent = paddleBonusPoints;
  document.getElementById("activeShadowBalls").textContent = tempBalls.length;
  document.getElementById("currentRound").textContent = currentRound;

  const shadowBallStats = document.getElementById("shadowBallStats");
  if (hasShadowBallUpgrade) {
    shadowBallStats.style.display = "block";
    document.getElementById("shadowBallChance").textContent =
      Math.round(shadowBallChance * 100) + "%";
  } else {
    shadowBallStats.style.display = "none";
  }

  // Add burn chance to stats if upgrade is purchased
  const burnStats = document.getElementById("burnStats");
  if (hasBurnUpgrade) {
    burnStats.style.display = "block";
    document.getElementById("burnChance").textContent =
      Math.round(burnChance * 100) + "%";
  } else {
    burnStats.style.display = "none";
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
