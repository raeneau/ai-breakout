// Make shop variables global by attaching to window
// window.SHADOW_BALL_COST = 50;
window.SHADOW_BALL_COST = 0;
window.SHADOW_BALL_BASE_CHANCE = 0.05;
window.SHADOW_BALL_CHANCE_INCREMENT = 0.05;
window.SHADOW_BALL_MAX_CHANCE = 0.3;
// window.SHADOW_CHANCE_UPGRADE_COST = 30;
window.SHADOW_CHANCE_UPGRADE_COST = 0;

// window.BURN_UPGRADE_COST = 75;
window.BURN_UPGRADE_COST = 0;

window.BURN_CHANCE_BASE = 0.05;
window.BURN_CHANCE_INCREMENT = 0.05;
window.BURN_CHANCE_MAX = 0.3;
// window.BURN_CHANCE_UPGRADE_COST = 30;
window.BURN_CHANCE_UPGRADE_COST = 0;

// Shop state
window.hasShadowBallUpgrade = false;
window.shadowBallChance = SHADOW_BALL_BASE_CHANCE;
window.shadowBallChanceLevel = 0;

window.hasBurnUpgrade = false;
window.burnChance = BURN_CHANCE_BASE;
window.burnChanceLevel = 0;

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

  // Shadow ball upgrade handlers
  document
    .getElementById("multiballUpgrade")
    .addEventListener("click", function () {
      if (
        !window.hasShadowBallUpgrade &&
        window.score >= window.SHADOW_BALL_COST
      ) {
        window.score -= window.SHADOW_BALL_COST;
        window.hasShadowBallUpgrade = true;
        this.textContent = "SHADOW BALL (Purchased)";
        this.classList.add("purchased");
        window.updateShopUI();
      }
    });

  document
    .getElementById("shadowChanceUpgrade")
    .addEventListener("click", function () {
      if (
        window.hasShadowBallUpgrade &&
        window.shadowBallChance < window.SHADOW_BALL_MAX_CHANCE &&
        window.score >= window.SHADOW_CHANCE_UPGRADE_COST
      ) {
        window.score -= window.SHADOW_CHANCE_UPGRADE_COST;
        window.shadowBallChance += window.SHADOW_BALL_CHANCE_INCREMENT;
        window.shadowBallChanceLevel++;
        window.updateShopUI();
      }
    });

  // Burn upgrade handlers
  document.getElementById("burnUpgrade").addEventListener("click", function () {
    if (!window.hasBurnUpgrade && window.score >= window.BURN_UPGRADE_COST) {
      window.score -= window.BURN_UPGRADE_COST;
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
        window.score -= window.BURN_CHANCE_UPGRADE_COST;
        window.burnChance += window.BURN_CHANCE_INCREMENT;
        window.burnChanceLevel++;
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
  } else {
    shadowBallButton.textContent = `SHADOW BALL (${window.SHADOW_BALL_COST} points)`;
    if (window.score >= window.SHADOW_BALL_COST) {
      shadowBallButton.classList.remove("disabled");
    } else {
      shadowBallButton.classList.add("disabled");
    }
    shadowChanceButton.classList.add("locked");
  }

  if (window.hasShadowBallUpgrade) {
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
}

// Reset shop state
export function resetShop() {
  window.hasShadowBallUpgrade = false;
  window.shadowBallChance = SHADOW_BALL_BASE_CHANCE;
  window.shadowBallChanceLevel = 0;

  window.hasBurnUpgrade = false;
  window.burnChance = BURN_CHANCE_BASE;
  window.burnChanceLevel = 0;

  updateShopUI();
}
