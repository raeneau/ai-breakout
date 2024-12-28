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
const MIN_NEW_BRICKS = 3; // Minimum number of bricks to add in new wave
const MAX_NEW_BRICKS = 20; // Maximum number of bricks to add in new wave
const BRICK_COLORS = {
  NORMAL: "#0095DD",
  STRONG: "#800080", // Purple
  SUPER: "#FFA500", // Orange
};
const STRONG_BRICK_HITS = 3;
const SUPER_BRICK_HITS = 5;
const SHOP_BUTTON_WIDTH = 100;
const SHOP_BUTTON_HEIGHT = 40;
const MULTIBALL_COST = 50;
const TEMP_BALL_HITS = 5;

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
let shopOpen = false;
let hasMultiballUpgrade = false;
let tempBalls = []; // Array to store temporary balls
let tempBallHits = []; // Array to track hits for each temp ball

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
          b.status--;
          if (b.status === 0) {
            pointsSinceLastMiss++; // Only award points when brick is destroyed
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
          // Mix colors for intermediate hits
          const mixColor =
            bricks[c][r].status >= 3 ? BRICK_COLORS.SUPER : BRICK_COLORS.STRONG;
          ctx.fillStyle = mixColor + "77"; // Add transparency
        } else {
          ctx.fillStyle = BRICK_COLORS.NORMAL;
        }
        ctx.fill();
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
  hasMultiballUpgrade = false;
  shopOpen = false;
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
        // Paddle hit - double points accumulated so far
        score += pointsSinceLastMiss * 2;
        pointsSinceLastMiss = 0;
        lastHitByPaddle = true;

        // Add chance for temporary ball
        if (hasMultiballUpgrade && Math.random() < 0.5) {
          tempBalls.push({
            x: ballX,
            y: ballY,
            speedX: -ballSpeedX, // Start with opposite horizontal direction
            speedY: ballSpeedY,
          });
          tempBallHits.push(0);
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

  // Draw shop button
  drawShopButton();

  if (shopOpen) {
    drawShopMenu();
    requestAnimationFrame(draw);
    return;
  }

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

// Add new function to draw shop button
function drawShopButton() {
  const x = canvas.width - SHOP_BUTTON_WIDTH - 10;
  const y = 10;

  ctx.fillStyle = "#0095DD";
  ctx.fillRect(x, y, SHOP_BUTTON_WIDTH, SHOP_BUTTON_HEIGHT);
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Shop", x + SHOP_BUTTON_WIDTH / 2, y + SHOP_BUTTON_HEIGHT / 2);
}

// Add function to draw shop menu
function drawShopMenu() {
  // Semi-transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Shop menu box
  const menuWidth = 300;
  const menuHeight = 400;
  const menuX = (canvas.width - menuWidth) / 2;
  const menuY = (canvas.height - menuHeight) / 2;

  ctx.fillStyle = "white";
  ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

  // Shop title
  ctx.font = "24px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.textAlign = "center";
  ctx.fillText("SHOP", canvas.width / 2, menuY + 40);

  // Multiball upgrade button
  const buttonY = menuY + 100;
  ctx.fillStyle = score >= MULTIBALL_COST ? "#0095DD" : "#999999";
  ctx.fillRect(menuX + 20, buttonY, menuWidth - 40, 60);

  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(
    hasMultiballUpgrade
      ? "MULTIBALL (Purchased)"
      : `MULTIBALL (${MULTIBALL_COST} points)`,
    canvas.width / 2,
    buttonY + 30
  );

  // Close button
  ctx.fillStyle = "#0095DD";
  ctx.fillRect(menuX + 20, menuY + menuHeight - 60, menuWidth - 40, 40);
  ctx.fillStyle = "white";
  ctx.fillText("Close", canvas.width / 2, menuY + menuHeight - 40);
}

// Add to click event listener
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (gameOver) {
    // Existing reset button logic...
  } else if (
    !shopOpen &&
    clickX > canvas.width - SHOP_BUTTON_WIDTH - 10 &&
    clickX < canvas.width - 10 &&
    clickY > 10 &&
    clickY < 10 + SHOP_BUTTON_HEIGHT
  ) {
    // Shop button clicked
    shopOpen = true;
    isPaused = true;
  } else if (shopOpen) {
    const menuWidth = 300;
    const menuHeight = 400;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Check for multiball upgrade click
    if (
      clickY > menuY + 100 &&
      clickY < menuY + 160 &&
      clickX > menuX + 20 &&
      clickX < menuX + menuWidth - 20
    ) {
      if (!hasMultiballUpgrade && score >= MULTIBALL_COST) {
        score -= MULTIBALL_COST;
        hasMultiballUpgrade = true;
      }
    }

    // Check for close button click
    if (
      clickY > menuY + menuHeight - 60 &&
      clickY < menuY + menuHeight - 20 &&
      clickX > menuX + 20 &&
      clickX < menuX + menuWidth - 20
    ) {
      shopOpen = false;
      isPaused = false;
    }
  }
});

// Draw and update temporary balls
for (let i = tempBalls.length - 1; i >= 0; i--) {
  // Draw temp ball
  ctx.beginPath();
  ctx.arc(tempBalls[i].x, tempBalls[i].y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#FFA500"; // Orange color for temp balls
  ctx.fill();
  ctx.closePath();

  // Update position
  tempBalls[i].x += tempBalls[i].speedX;
  tempBalls[i].y += tempBalls[i].speedY;

  // Wall collisions
  if (
    tempBalls[i].x + tempBalls[i].speedX > canvas.width - BALL_RADIUS ||
    tempBalls[i].x + tempBalls[i].speedX < BALL_RADIUS
  ) {
    tempBalls[i].speedX = -tempBalls[i].speedX;
  }
  if (tempBalls[i].y + tempBalls[i].speedY < BALL_RADIUS) {
    tempBalls[i].speedY = -tempBalls[i].speedY;
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
          b.status--;
          tempBallHits[i]++;

          if (b.status === 0) {
            pointsSinceLastMiss++;
          }

          // Remove ball if it has hit enough bricks
          if (tempBallHits[i] >= TEMP_BALL_HITS) {
            tempBalls.splice(i, 1);
            tempBallHits.splice(i, 1);
            break;
          }
        }
      }
    }
  }
}
