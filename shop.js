import {
  SHADOW_BALL_COST,
  SHADOW_BALL_BASE_CHANCE,
  SHADOW_BALL_CHANCE_INCREMENT,
  SHADOW_BALL_MAX_CHANCE,
  SHADOW_CHANCE_UPGRADE_COST,
  BURN_UPGRADE_COST,
  BURN_CHANCE_BASE,
  BURN_CHANCE_INCREMENT,
  BURN_CHANCE_MAX,
  BURN_CHANCE_UPGRADE_COST,
  SPLASH_UPGRADE_COST,
  SPLASH_DAMAGE_CHANCE,
} from "./constants.js";

// Make shop variables global by attaching to window
window.SHADOW_BALL_COST = SHADOW_BALL_COST;
window.SHADOW_BALL_BASE_CHANCE = SHADOW_BALL_BASE_CHANCE;
window.SHADOW_BALL_CHANCE_INCREMENT = SHADOW_BALL_CHANCE_INCREMENT;
window.SHADOW_BALL_MAX_CHANCE = SHADOW_BALL_MAX_CHANCE;
window.SHADOW_CHANCE_UPGRADE_COST = SHADOW_CHANCE_UPGRADE_COST;

window.BURN_UPGRADE_COST = BURN_UPGRADE_COST;
window.BURN_CHANCE_BASE = BURN_CHANCE_BASE;
window.BURN_CHANCE_INCREMENT = BURN_CHANCE_INCREMENT;
window.BURN_CHANCE_MAX = BURN_CHANCE_MAX;
window.BURN_CHANCE_UPGRADE_COST = BURN_CHANCE_UPGRADE_COST;

window.SPLASH_UPGRADE_COST = SPLASH_UPGRADE_COST;
window.SPLASH_DAMAGE_CHANCE = SPLASH_DAMAGE_CHANCE;
window.hasSplashUpgrade = false;

// Shop state
window.hasShadowBallUpgrade = false;
window.shadowBallChance = SHADOW_BALL_BASE_CHANCE;
window.shadowBallChanceLevel = 0;

window.hasBurnUpgrade = false;
window.burnChance = BURN_CHANCE_BASE;
window.burnChanceLevel = 0;

// Make the functions available globally
window.updateShopUI = updateShopUI;
window.updateStats = updateStats;

// Initialize shop
export function initializeShop() {
  // Add click handlers for tabs
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

  // Set initial text for shadow ball upgrade
  const shadowBallButton = document.getElementById("multiballUpgrade");
  // Remove any existing listeners first
  const newShadowBallButton = shadowBallButton.cloneNode(true);
  shadowBallButton.parentNode.replaceChild(
    newShadowBallButton,
    shadowBallButton
  );

  // Set initial text
  newShadowBallButton.textContent = `SHADOW BALL (${window.SHADOW_BALL_COST} points)`;

  // Add the click handler once
  newShadowBallButton.addEventListener("click", function () {
    if (
      !window.hasShadowBallUpgrade &&
      window.score >= window.SHADOW_BALL_COST
    ) {
      const currentScore = window.score; // Store current score

      // First deduct the score
      window.score = currentScore - window.SHADOW_BALL_COST;

      // Initialize all shadow ball related variables on the window object
      window.hasShadowBallUpgrade = true;
      window.shadowBallChance = window.SHADOW_BALL_BASE_CHANCE;
      window.shadowBallChanceLevel = 0;

      // Update the button appearance
      this.textContent = "SHADOW BALL (Purchased)";
      this.classList.add("purchased");

      // Update the shadow chance upgrade button
      const shadowChanceButton = document.getElementById("shadowChanceUpgrade");
      shadowChanceButton.classList.remove("locked");
      shadowChanceButton.classList.remove("disabled");
      shadowChanceButton.textContent = `SHADOW CHANCE (+${
        window.SHADOW_BALL_CHANCE_INCREMENT * 100
      }%) (${window.SHADOW_CHANCE_UPGRADE_COST} pts)`;

      // Show and update stats
      const shadowBallStats = document.getElementById("shadowBallStats");
      shadowBallStats.style.display = "block";
      document.getElementById("shadowBallChance").textContent =
        Math.round(window.shadowBallChance * 100) + "%";

      // Update UI
      window.updateShopUI();
      window.updateStats();
    }
  });

  // Do the same for shadow chance upgrade button
  const shadowChanceButton = document.getElementById("shadowChanceUpgrade");
  const newShadowChanceButton = shadowChanceButton.cloneNode(true);
  shadowChanceButton.parentNode.replaceChild(
    newShadowChanceButton,
    shadowChanceButton
  );

  newShadowChanceButton.addEventListener("click", function () {
    if (
      window.hasShadowBallUpgrade &&
      window.shadowBallChance < window.SHADOW_BALL_MAX_CHANCE &&
      window.score >= window.SHADOW_CHANCE_UPGRADE_COST
    ) {
      window.score = window.score - window.SHADOW_CHANCE_UPGRADE_COST;
      window.shadowBallChance =
        window.SHADOW_BALL_BASE_CHANCE +
        (window.shadowBallChanceLevel + 1) *
          window.SHADOW_BALL_CHANCE_INCREMENT;
      window.shadowBallChanceLevel++;

      document.getElementById("shadowBallChance").textContent =
        Math.round(window.shadowBallChance * 100) + "%";

      window.updateShopUI();
      window.updateStats();
    }
  });

  // Burn upgrade handlers
  document.getElementById("burnUpgrade").addEventListener("click", function () {
    if (!window.hasBurnUpgrade && window.score >= window.BURN_UPGRADE_COST) {
      window.score = window.score - window.BURN_UPGRADE_COST;
      window.hasBurnUpgrade = true;
      this.textContent = "BURN CHANCE (Purchased)";
      this.classList.add("purchased");
      window.updateShopUI();
    }
  });

  document
    .getElementById("burnChanceUpgrade")
    .addEventListener("click", function () {
      if (
        window.hasBurnUpgrade &&
        window.burnChance < window.BURN_CHANCE_MAX &&
        window.score >= window.BURN_CHANCE_UPGRADE_COST
      ) {
        window.score = window.score - window.BURN_CHANCE_UPGRADE_COST;
        window.burnChance =
          window.BURN_CHANCE_BASE +
          (window.burnChanceLevel + 1) * window.BURN_CHANCE_INCREMENT;
        window.burnChanceLevel++;
        window.updateShopUI();
        window.updateStats();
      }
    });

  // Add splash damage upgrade handler
  document
    .getElementById("splashUpgrade")
    .addEventListener("click", function () {
      if (
        !window.hasSplashUpgrade &&
        window.score >= window.SPLASH_UPGRADE_COST
      ) {
        window.score -= window.SPLASH_UPGRADE_COST;
        window.hasSplashUpgrade = true;
        this.textContent = "SPLASH DAMAGE (Purchased)";
        this.classList.add("purchased");
        window.updateShopUI();
      }
    });
}

// Update shop UI
export function updateShopUI() {
  // Shadow upgrades
  const shadowBallButton = document.getElementById("multiballUpgrade");
  const shadowChanceButton = document.getElementById("shadowChanceUpgrade");

  if (window.hasShadowBallUpgrade) {
    shadowBallButton.textContent = "SHADOW BALL (Purchased)";
    shadowBallButton.classList.add("purchased");
    shadowChanceButton.classList.remove("locked");
    shadowChanceButton.classList.remove("disabled");

    if (window.shadowBallChance >= window.SHADOW_BALL_MAX_CHANCE) {
      shadowChanceButton.textContent = "SHADOW CHANCE (MAX)";
      shadowChanceButton.classList.add("purchased");
    } else {
      shadowChanceButton.textContent = `SHADOW CHANCE (+${
        window.SHADOW_BALL_CHANCE_INCREMENT * 100
      }%) (${window.SHADOW_CHANCE_UPGRADE_COST} pts)`;
      if (window.score >= window.SHADOW_CHANCE_UPGRADE_COST) {
        shadowChanceButton.classList.remove("disabled");
      } else {
        shadowChanceButton.classList.add("disabled");
      }
    }
  } else {
    shadowBallButton.textContent = `SHADOW BALL (${window.SHADOW_BALL_COST} points)`;
    if (window.score >= window.SHADOW_BALL_COST) {
      shadowBallButton.classList.remove("disabled");
    } else {
      shadowBallButton.classList.add("disabled");
    }
    shadowChanceButton.classList.add("locked");
    shadowChanceButton.textContent = "SHADOW CHANCE (Locked)";
  }

  // Fire upgrades
  const burnButton = document.getElementById("burnUpgrade");
  const burnChanceButton = document.getElementById("burnChanceUpgrade");

  if (window.hasBurnUpgrade) {
    burnButton.textContent = "BURN CHANCE (Purchased)";
    burnButton.classList.add("purchased");
    burnChanceButton.classList.remove("locked");
  } else {
    burnButton.textContent = `BURN CHANCE (${window.BURN_UPGRADE_COST} points)`;
    if (window.score >= window.BURN_UPGRADE_COST) {
      burnButton.classList.remove("disabled");
    } else {
      burnButton.classList.add("disabled");
    }
    burnChanceButton.classList.add("locked");
  }

  if (window.hasBurnUpgrade) {
    if (window.burnChance >= window.BURN_CHANCE_MAX) {
      burnChanceButton.textContent = "BURN CHANCE (MAX)";
      burnChanceButton.classList.add("purchased");
    } else {
      burnChanceButton.textContent = `BURN CHANCE (+${
        window.BURN_CHANCE_INCREMENT * 100
      }%) (${window.BURN_CHANCE_UPGRADE_COST} pts)`;
      if (window.score >= window.BURN_CHANCE_UPGRADE_COST) {
        burnChanceButton.classList.remove("disabled");
      } else {
        burnChanceButton.classList.add("disabled");
      }
    }
  } else {
    burnChanceButton.textContent = "BURN CHANCE (Locked)";
  }

  // Water upgrades
  const splashButton = document.getElementById("splashUpgrade");

  if (window.hasSplashUpgrade) {
    splashButton.textContent = "SPLASH DAMAGE (Purchased)";
    splashButton.classList.add("purchased");
  } else {
    splashButton.textContent = `SPLASH DAMAGE (${window.SPLASH_UPGRADE_COST} points)`;
    if (window.score >= window.SPLASH_UPGRADE_COST) {
      splashButton.classList.remove("disabled");
    } else {
      splashButton.classList.add("disabled");
    }
  }

  updateStats();
}

// Reset shop state
export function resetShop() {
  window.hasShadowBallUpgrade = false;
  window.shadowBallChance = SHADOW_BALL_BASE_CHANCE;
  window.shadowBallChanceLevel = 0;

  window.hasBurnUpgrade = false;
  window.burnChance = BURN_CHANCE_BASE;
  window.burnChanceLevel = 0;

  window.hasSplashUpgrade = false;

  updateShopUI();
}

// Add the updateStats function to shop.js
function updateStats() {
  document.getElementById("bricksDestroyed").textContent =
    window.bricksDestroyed;
  document.getElementById("paddleBonusPoints").textContent =
    window.paddleBonusPoints;

  // Update shadow ball stats
  const shadowBallStats = document.getElementById("shadowBallStats");
  if (window.hasShadowBallUpgrade) {
    shadowBallStats.style.display = "block";
    document.getElementById("shadowBallChance").textContent =
      Math.round(window.shadowBallChance * 100) + "%";
  } else {
    shadowBallStats.style.display = "none";
  }

  const burnStats = document.getElementById("burnStats");
  if (window.hasBurnUpgrade) {
    burnStats.style.display = "block";
    document.getElementById("burnChance").textContent =
      Math.round(window.burnChance * 100) + "%";
  } else {
    burnStats.style.display = "none";
  }

  // ... rest of stats updates ...
}
