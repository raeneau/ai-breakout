import {
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_RADIUS,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_PADDING,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  SPEED_INCREMENT,
  PADDLE_SPEED,
  PADDLE_ACCELERATION,
  PADDLE_FRICTION,
  BRICK_COLORS,
  STRONG_BRICK_HITS,
  SUPER_BRICK_HITS,
  SPARKLE_COUNT,
  SPARKLE_SPEED,
  SPARKLE_LIFETIME,
  BURN_DAMAGE_INTERVAL,
  BURN_DURATION,
  RIPPLE_DURATION,
  RIPPLE_MAX_RADIUS,
  RIPPLE_START_RADIUS,
  SPLASH_DAMAGE_CHANCE,
  PADDLE_GLOW_DURATION,
  PADDLE_COLOR,
  PADDLE_HIT_COLOR,
  PADDLE_FADE_DURATION,
  MAX_BALL_ANGLE,
  PADDLE_INFLUENCE,
  GOLD_BRICK_HITS,
  GOLD_BRICK_POINTS,
  GOLD_BRICK_CHANCE,
  GOLD_PULSE_DURATION,
  GOLD_PULSE_MIN_BRIGHTNESS,
  GOLD_PULSE_MAX_BRIGHTNESS,
  CHAIN_UPGRADE_COST,
  CHAIN_CHANCE,
  CHAIN_BASE_LENGTH,
  CHAIN_COLOR,
  CHAIN_LINE_WIDTH,
  CHAIN_DURATION,
  CHAIN_LENGTH_UPGRADE_COST,
  CHAIN_MAX_LENGTH,
  CHAIN_LENGTH_INCREMENT,
  CHAIN_BASE_CHANCE,
  CHAIN_CHANCE_INCREMENT,
  CHAIN_MAX_CHANCE,
  CHAIN_CHANCE_UPGRADE_COST,
} from "./constants.js";

// First, declare all canvas-related variables
let canvas, ctx;
let ballX, ballY, ballSpeedX, ballSpeedY, paddleX;

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
let ripples = [];
let paddleGlowTime = 0;
let hasChainUpgrade = false;
let activeChains = [];
let chainLength = CHAIN_BASE_LENGTH;
let chainLengthLevel = 0;
let chainChance = CHAIN_BASE_CHANCE;
let chainChanceLevel = 0;
let hasShadowBallUpgrade = false;
let shadowBallChance = SHADOW_BALL_BASE_CHANCE;
let shadowBallChanceLevel = 0;

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

  document
    .getElementById("chainUpgrade")
    .addEventListener("click", function () {
      if (!hasChainUpgrade && window.score >= CHAIN_UPGRADE_COST) {
        window.score -= CHAIN_UPGRADE_COST;
        hasChainUpgrade = true;
        this.textContent = "CHAIN LIGHTNING (Purchased)";
        this.classList.add("purchased");
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

  // Add chain length upgrade handler
  document
    .getElementById("chainLengthUpgrade")
    .addEventListener("click", function () {
      if (
        hasChainUpgrade &&
        chainLength < CHAIN_MAX_LENGTH &&
        window.score >= CHAIN_LENGTH_UPGRADE_COST
      ) {
        window.score -= CHAIN_LENGTH_UPGRADE_COST;
        chainLength += CHAIN_LENGTH_INCREMENT;
        chainLengthLevel++;
        updateShopUI();
      }
    });

  // Add chain chance upgrade handler
  document
    .getElementById("chainChanceUpgrade")
    .addEventListener("click", function () {
      if (
        hasChainUpgrade &&
        chainChance < CHAIN_MAX_CHANCE &&
        window.score >= CHAIN_CHANCE_UPGRADE_COST
      ) {
        window.score -= CHAIN_CHANCE_UPGRADE_COST;
        chainChance += CHAIN_CHANCE_INCREMENT;
        chainChanceLevel++;
        updateShopUI();
      }
    });

  // Add this to the initializeGame function with the other event listeners
  document
    .getElementById("multiballUpgrade")
    .addEventListener("click", function () {
      if (!hasShadowBallUpgrade && window.score >= SHADOW_BALL_COST) {
        window.score -= SHADOW_BALL_COST;
        hasShadowBallUpgrade = true;
        this.textContent = "SHADOW BALL (Purchased)";
        this.classList.add("purchased");
        updateShopUI();
      }
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
      // Only count bricks that still have status > 0
      if (bricks[c][r].status > 0) {
        return false;
      }
    }
  }
  return true;
}

// Add this helper function to apply splash damage
function applySplashDamage(col, row) {
  // Create ripple effect at the center of the brick
  const brickX =
    col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT + BRICK_WIDTH / 2;
  const brickY =
    row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP + BRICK_HEIGHT / 2;
  ripples.push(new Ripple(brickX, brickY));

  // Define the four adjacent directions (up, right, down, left)
  const directions = [
    [0, -1], // up
    [1, 0], // right
    [0, 1], // down
    [-1, 0], // left
  ];

  // Check each adjacent brick
  for (const [dc, dr] of directions) {
    const newCol = col + dc;
    const newRow = row + dr;

    // Check if the adjacent position is within bounds
    if (
      newCol >= 0 &&
      newCol < BRICK_COLS &&
      newRow >= 0 &&
      newRow < BRICK_ROWS
    ) {
      // If there's a brick and it's not already destroyed
      if (bricks[newCol][newRow].status > 0) {
        const originalStatus = bricks[newCol][newRow].status;
        bricks[newCol][newRow].status--;

        if (bricks[newCol][newRow].status === 0) {
          pointsSinceLastMiss += originalStatus;
          bricksDestroyed++;
          burningBricks.delete(`${newCol},${newRow}`);
        }
      }
    }
  }
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

          // Add chain lightning check here
          if (hasChainUpgrade && Math.random() < chainChance) {
            triggerChainLightning(c, r);
          }

          // Apply splash damage if upgrade is purchased and chance roll succeeds
          if (hasSplashUpgrade && Math.random() < SPLASH_DAMAGE_CHANCE) {
            applySplashDamage(c, r);
          }

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
            if (b.isGold) {
              pointsSinceLastMiss += GOLD_BRICK_POINTS;
            } else {
              pointsSinceLastMiss += originalStatus;
            }
            bricksDestroyed++;
            burningBricks.delete(`${c},${r}`);

            // Only check for cleared bricks after a brick is fully destroyed
            if (areBricksCleared()) {
              if (!addNewBricks()) {
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

  // Calculate the color based on fade time
  if (paddleGlowTime > 0) {
    // Interpolate between hit color and normal color
    const progress = paddleGlowTime / PADDLE_FADE_DURATION;
    const r1 = parseInt(PADDLE_HIT_COLOR.slice(1, 3), 16);
    const g1 = parseInt(PADDLE_HIT_COLOR.slice(3, 5), 16);
    const b1 = parseInt(PADDLE_HIT_COLOR.slice(5, 7), 16);
    const r2 = parseInt(PADDLE_COLOR.slice(1, 3), 16);
    const g2 = parseInt(PADDLE_COLOR.slice(3, 5), 16);
    const b2 = parseInt(PADDLE_COLOR.slice(5, 7), 16);

    const r = Math.round(r2 + (r1 - r2) * progress);
    const g = Math.round(g2 + (g1 - g2) * progress);
    const b = Math.round(b2 + (b1 - b2) * progress);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    paddleGlowTime--;
  } else {
    ctx.fillStyle = PADDLE_COLOR;
  }

  ctx.fill();
  ctx.closePath();
}

// Add this helper function to adjust color brightness
function adjustBrightness(hexColor, factor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Adjust brightness
  const adjustedR = Math.min(255, Math.round(r * factor));
  const adjustedG = Math.min(255, Math.round(g * factor));
  const adjustedB = Math.min(255, Math.round(b * factor));

  // Convert back to hex
  return `#${adjustedR.toString(16).padStart(2, "0")}${adjustedG
    .toString(16)
    .padStart(2, "0")}${adjustedB.toString(16).padStart(2, "0")}`;
}

function drawBricks() {
  // Get the current frame count for pulsing
  const frameCount = performance.now() / (1000 / 60); // Approximate frame count

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
        if (bricks[c][r].isGold) {
          // Calculate pulse factor using sine wave
          const pulseProgress =
            (frameCount % GOLD_PULSE_DURATION) / GOLD_PULSE_DURATION;
          const pulseFactor =
            GOLD_PULSE_MIN_BRIGHTNESS +
            ((Math.sin(pulseProgress * Math.PI * 2) + 1) / 2) *
              (GOLD_PULSE_MAX_BRIGHTNESS - GOLD_PULSE_MIN_BRIGHTNESS);

          ctx.fillStyle = adjustBrightness(BRICK_COLORS.GOLD, pulseFactor);
        } else if (bricks[c][r].status === SUPER_BRICK_HITS) {
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

  // Draw score on the left
  ctx.textAlign = "left";
  ctx.fillText("Score: " + window.score, 8, 20);

  // Show potential points if there are any accumulated
  if (pointsSinceLastMiss > 0) {
    const potential = lastHitByPaddle
      ? pointsSinceLastMiss * 2
      : pointsSinceLastMiss;
    ctx.fillText("Potential: +" + potential, 8, 40);
  }

  // Draw round counter on the right
  ctx.textAlign = "right";
  ctx.fillText("Round " + currentRound, canvas.width - 8, 20);
}

function drawResetButton() {
  ctx.fillStyle = "#0095DD";
  ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 + 20, 100, 40);
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Reset Game", canvas.width / 2, canvas.height / 2 + 45);
}

// Export the resetGame function and attach it to window
export function resetGame() {
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
  ripples = [];
  paddleGlowTime = 0;
  hasChainUpgrade = false;
  activeChains = [];
  chainLength = CHAIN_BASE_LENGTH;
  chainLengthLevel = 0;
  chainChance = CHAIN_BASE_CHANCE;
  chainChanceLevel = 0;
  hasShadowBallUpgrade = false;
  shadowBallChance = SHADOW_BALL_BASE_CHANCE;
  shadowBallChanceLevel = 0;
}
window.resetGame = resetGame;

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
        // Calculate where on the paddle the ball hit (0 = left edge, 1 = right edge)
        const relativeIntersectX = (ballX - paddleX) / PADDLE_WIDTH;

        // Convert to an angle between -MAX_BALL_ANGLE and MAX_BALL_ANGLE
        const bounceAngle = (relativeIntersectX * 2 - 1) * MAX_BALL_ANGLE;

        // Calculate new ball velocity
        const speed = Math.sqrt(
          ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY
        );

        // Add paddle velocity influence to the angle
        const paddleInfluence =
          (paddleVelocity / PADDLE_SPEED) * PADDLE_INFLUENCE;
        const finalAngle = bounceAngle + paddleInfluence;

        // Set new ball velocity
        ballSpeedX = speed * Math.sin(finalAngle);
        ballSpeedY = -speed * Math.cos(finalAngle); // Negative because y increases downward

        // Rest of the collision code (points, effects, etc.)
        const normalPoints = pointsSinceLastMiss;
        const totalPoints = pointsSinceLastMiss * 2;
        const bonus = totalPoints - normalPoints;
        window.score += totalPoints;
        paddleBonusPoints += bonus;
        pointsSinceLastMiss = 0;
        lastHitByPaddle = true;

        paddleGlowTime = PADDLE_GLOW_DURATION;
        createSparkles(ballX, ballY);

        // Add shadow ball spawning code here
        if (
          window.hasShadowBallUpgrade &&
          Math.random() < window.shadowBallChance
        ) {
          const velocity = getRandomShadowBallVelocity();
          tempBalls.push({
            x: ballX,
            y: ballY,
            speedX: velocity.x,
            speedY: velocity.y,
          });
          tempBallHits.push(0);
        }

        // Rest of collision code...
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
              const originalStatus = b.status;
              b.status--;
              if (b.status === 0) {
                pointsSinceLastMiss += originalStatus;
                bricksDestroyed++;
                burningBricks.delete(`${c},${r}`);
              }

              // Add this section to check for cleared bricks
              if (areBricksCleared()) {
                if (!addNewBricks()) {
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

    // Update and draw sparkles
    sparkles = sparkles.filter((sparkle) => {
      const alive = sparkle.update();
      if (alive) {
        sparkle.draw(ctx);
      }
      return alive;
    });

    updateBurningBricks();

    // Update and draw ripples
    ripples = ripples.filter((ripple) => {
      const alive = ripple.update();
      if (alive) {
        ripple.draw(ctx);
      }
      return alive;
    });

    // Update and draw chain lightning effects
    activeChains = activeChains.filter((chain) => {
      const alive = chain.update();
      if (alive) {
        chain.draw(ctx);
      }
      return alive;
    });
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

  if (random < GOLD_BRICK_CHANCE) {
    status = GOLD_BRICK_HITS;
    return {
      x: x,
      y: y,
      status: status,
      isGold: true,
    };
  } else {
    // Recalculate random chance for remaining brick types
    const remainingRandom = Math.random();
    if (remainingRandom < superBrickChance) {
      status = SUPER_BRICK_HITS;
    } else if (remainingRandom < superBrickChance + strongBrickChance) {
      status = STRONG_BRICK_HITS;
    } else {
      status = 1;
    }
    return {
      x: x,
      y: y,
      status: status,
      isGold: false,
    };
  }
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

  // Chain upgrades
  const chainButton = document.getElementById("chainUpgrade");
  const chainChanceButton = document.getElementById("chainChanceUpgrade");
  const chainLengthButton = document.getElementById("chainLengthUpgrade");

  if (hasChainUpgrade) {
    chainButton.textContent = "CHAIN LIGHTNING (Purchased)";
    chainButton.classList.add("purchased");
    chainChanceButton.classList.remove("locked");
    chainLengthButton.classList.remove("locked");

    if (chainChance >= CHAIN_MAX_CHANCE) {
      chainChanceButton.textContent = "CHAIN CHANCE (MAX)";
      chainChanceButton.classList.add("purchased");
    } else {
      chainChanceButton.textContent = `CHAIN CHANCE (+${
        CHAIN_CHANCE_INCREMENT * 100
      }%) (${CHAIN_CHANCE_UPGRADE_COST} pts)`;
      if (window.score >= CHAIN_CHANCE_UPGRADE_COST) {
        chainChanceButton.classList.remove("disabled");
      } else {
        chainChanceButton.classList.add("disabled");
      }
    }

    if (chainLength >= CHAIN_MAX_LENGTH) {
      chainLengthButton.textContent = "CHAIN LENGTH (MAX)";
      chainLengthButton.classList.add("purchased");
    } else {
      chainLengthButton.textContent = `CHAIN LENGTH +1 (${CHAIN_LENGTH_UPGRADE_COST} points)`;
      if (window.score >= CHAIN_LENGTH_UPGRADE_COST) {
        chainLengthButton.classList.remove("disabled");
      } else {
        chainLengthButton.classList.add("disabled");
      }
    }
  } else {
    chainButton.textContent = `CHAIN LIGHTNING (${CHAIN_UPGRADE_COST} points)`;
    if (window.score >= CHAIN_UPGRADE_COST) {
      chainButton.classList.remove("disabled");
    } else {
      chainButton.classList.add("disabled");
    }
    chainChanceButton.classList.add("locked");
    chainChanceButton.textContent = "CHAIN CHANCE (Locked)";
    chainLengthButton.classList.add("locked");
    chainLengthButton.textContent = "CHAIN LENGTH (Locked)";
  }
}

// Add this function to update stats display
function updateStats() {
  document.getElementById("bricksDestroyed").textContent = bricksDestroyed;
  document.getElementById("paddleBonusPoints").textContent = paddleBonusPoints;

  const shadowBallStats = document.getElementById("shadowBallStats");
  if (hasShadowBallUpgrade) {
    shadowBallStats.style.display = "block";
    document.getElementById("shadowBallChance").textContent =
      Math.round(shadowBallChance * 100) + "%";
  } else {
    shadowBallStats.style.display = "none";
  }

  const burnStats = document.getElementById("burnStats");
  if (hasBurnUpgrade) {
    burnStats.style.display = "block";
    document.getElementById("burnChance").textContent =
      Math.round(burnChance * 100) + "%";
  } else {
    burnStats.style.display = "none";
  }

  // Add splash damage stats
  const splashStats = document.getElementById("splashStats");
  if (hasSplashUpgrade) {
    splashStats.style.display = "block";
    document.getElementById("splashChance").textContent =
      Math.round(SPLASH_DAMAGE_CHANCE * 100) + "%";
  } else {
    splashStats.style.display = "none";
  }

  // Add chain lightning stats
  const chainStats = document.getElementById("chainStats");
  if (hasChainUpgrade) {
    chainStats.style.display = "block";
    document.getElementById("chainChance").textContent =
      Math.round(chainChance * 100) + "%";
  } else {
    chainStats.style.display = "none";
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

          // Check if all bricks are cleared after a brick is destroyed by burning
          if (areBricksCleared()) {
            if (!addNewBricks()) {
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

    // Remove burn effect after duration or if brick is gone
    if (
      brick.burnTimer >= BURN_DURATION ||
      bricks[key.split(",")[0]][key.split(",")[1]].status === 0
    ) {
      burningBricks.delete(key);
    }
  }
}

// Add this new class to manage ripple effects
class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = RIPPLE_DURATION;
    this.maxLife = RIPPLE_DURATION;
    this.startRadius = RIPPLE_START_RADIUS;
  }

  update() {
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    // Use easeOut function to make the expansion smoother and slower at the end
    const easeOut = 1 - Math.pow(progress, 2);
    const radius =
      this.startRadius + (RIPPLE_MAX_RADIUS - this.startRadius) * easeOut;
    const opacity = progress * 0.7; // Increased from 0.5 to 0.7 for better visibility

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 149, 221, ${opacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }
}

// Add this class to manage chain lightning effects
class ChainLightning {
  constructor(startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.life = CHAIN_DURATION;
  }

  update() {
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const opacity = this.life / CHAIN_DURATION;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
    ctx.lineWidth = CHAIN_LINE_WIDTH;
    ctx.stroke();
    ctx.closePath();
  }
}

// Add this function to find the next brick in a chain
function findNextBrick(currentCol, currentRow, excludedBricks) {
  const possibleBricks = [];

  // Define the four adjacent directions (up, right, down, left)
  const directions = [
    [0, -1], // up
    [1, 0], // right
    [0, 1], // down
    [-1, 0], // left
  ];

  // Check only adjacent bricks
  for (const [dc, dr] of directions) {
    const newCol = currentCol + dc;
    const newRow = currentRow + dr;

    // Skip if out of bounds
    if (
      newCol < 0 ||
      newCol >= BRICK_COLS ||
      newRow < 0 ||
      newRow >= BRICK_ROWS
    )
      continue;

    // Skip if this brick is already in the chain
    if (excludedBricks.has(`${newCol},${newRow}`)) continue;

    // Skip if brick is already destroyed
    if (bricks[newCol][newRow].status === 0) continue;

    // Add to possible targets
    possibleBricks.push({ col: newCol, row: newRow });
  }

  // Return random adjacent brick from possibilities, or null if none found
  if (possibleBricks.length === 0) return null;
  return possibleBricks[Math.floor(Math.random() * possibleBricks.length)];
}

// Add this function to handle chain lightning effect
function triggerChainLightning(startCol, startRow) {
  let currentCol = startCol;
  let currentRow = startRow;
  const chainedBricks = new Set([`${startCol},${startRow}`]);

  for (let i = 0; i < chainLength - 1; i++) {
    const nextBrick = findNextBrick(currentCol, currentRow, chainedBricks);
    if (!nextBrick) break;

    // Add visual effect
    const startX =
      currentCol * (BRICK_WIDTH + BRICK_PADDING) +
      BRICK_OFFSET_LEFT +
      BRICK_WIDTH / 2;
    const startY =
      currentRow * (BRICK_HEIGHT + BRICK_PADDING) +
      BRICK_OFFSET_TOP +
      BRICK_HEIGHT / 2;
    const endX =
      nextBrick.col * (BRICK_WIDTH + BRICK_PADDING) +
      BRICK_OFFSET_LEFT +
      BRICK_WIDTH / 2;
    const endY =
      nextBrick.row * (BRICK_HEIGHT + BRICK_PADDING) +
      BRICK_OFFSET_TOP +
      BRICK_HEIGHT / 2;

    activeChains.push(new ChainLightning(startX, startY, endX, endY));

    // Damage the brick
    const originalStatus = bricks[nextBrick.col][nextBrick.row].status;
    bricks[nextBrick.col][nextBrick.row].status--;

    if (bricks[nextBrick.col][nextBrick.row].status === 0) {
      if (bricks[nextBrick.col][nextBrick.row].isGold) {
        pointsSinceLastMiss += GOLD_BRICK_POINTS;
      } else {
        pointsSinceLastMiss += originalStatus;
      }
      bricksDestroyed++;
      burningBricks.delete(`${nextBrick.col},${nextBrick.row}`);
    }

    chainedBricks.add(`${nextBrick.col},${nextBrick.row}`);
    currentCol = nextBrick.col;
    currentRow = nextBrick.row;
  }
}
