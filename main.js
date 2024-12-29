import { initializeGame } from "./game.js";
import { initializeShop } from "./shop.js";

// Initialize the game when the page loads
window.addEventListener("load", () => {
  // Initialize shop first
  initializeShop();

  // Then initialize game
  initializeGame();
});
