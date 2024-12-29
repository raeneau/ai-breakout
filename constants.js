// Game dimensions
export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 20;
export const BALL_RADIUS = 10;
export const BRICK_ROWS = 5;
export const BRICK_COLS = 8;
export const BRICK_WIDTH = 80;
export const BRICK_HEIGHT = 20;
export const BRICK_PADDING = 10;
export const BRICK_OFFSET_TOP = 50;
export const BRICK_OFFSET_LEFT = 35;

// Game mechanics
export const INITIAL_BALL_SPEED = 3;
export const MAX_BALL_SPEED = 5;
export const SPEED_INCREMENT = 0.0005;
export const PADDLE_SPEED = 4;
export const PADDLE_ACCELERATION = 0.4;
export const PADDLE_FRICTION = 0.9;

// Brick types and colors
export const BRICK_COLORS = {
  NORMAL: "#0095DD",
  STRONG: "#800080",
  SUPER: "#FFA500",
  GOLD: "#FFD700",
};
export const STRONG_BRICK_HITS = 3;
export const SUPER_BRICK_HITS = 5;
export const GOLD_BRICK_HITS = 5;
export const GOLD_BRICK_POINTS = 50;
export const GOLD_BRICK_CHANCE = 0.005;

// Visual effects
export const SPARKLE_COUNT = 10;
export const SPARKLE_SPEED = 3;
export const SPARKLE_LIFETIME = 30;
export const BURN_DAMAGE_INTERVAL = 60;
export const BURN_DURATION = 120;
export const RIPPLE_DURATION = 60;
export const RIPPLE_MAX_RADIUS = 40;
export const RIPPLE_START_RADIUS = 5;
export const PADDLE_GLOW_DURATION = 30;

// Shop constants
export const SHADOW_BALL_COST = 50;
export const SHADOW_BALL_BASE_CHANCE = 0.05;
export const SHADOW_BALL_CHANCE_INCREMENT = 0.05;
export const SHADOW_BALL_MAX_CHANCE = 0.3;
export const SHADOW_CHANCE_UPGRADE_COST = 30;

export const BURN_UPGRADE_COST = 75;
export const BURN_CHANCE_BASE = 0.05;
export const BURN_CHANCE_INCREMENT = 0.05;
export const BURN_CHANCE_MAX = 0.3;
export const BURN_CHANCE_UPGRADE_COST = 30;

export const SPLASH_UPGRADE_COST = 100;
export const SPLASH_DAMAGE_CHANCE = 0.25;

// Replace the glow constants with these color constants
export const PADDLE_COLOR = "#0095DD";
export const PADDLE_HIT_COLOR = "#33B5FF"; // Lighter blue
export const PADDLE_FADE_DURATION = 30; // Keep the same duration as before

// Add these with the game mechanics constants
export const MAX_BALL_ANGLE = Math.PI / 4; // 45 degrees maximum angle
export const PADDLE_INFLUENCE = 0.2; // Reduced from 0.3 to make paddle movement less influential

// Add these with the visual effects constants
export const GOLD_PULSE_DURATION = 60; // One pulse cycle takes 60 frames
export const GOLD_PULSE_MIN_BRIGHTNESS = 0.9; // Minimum brightness multiplier
export const GOLD_PULSE_MAX_BRIGHTNESS = 1.1; // Maximum brightness multiplier
