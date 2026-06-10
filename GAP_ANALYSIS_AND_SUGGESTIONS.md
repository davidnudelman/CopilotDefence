# Copilot Defence: Gap Analysis & Improvement Roadmap

This document outlines the discrepancies between the current implementation of **Copilot Defence** and the vision described in the `README.md`, along with a roadmap for visual, mechanical, and architectural improvements.

---

## 1. Gap Analysis

| Feature | Current Implementation | README / Target Vision | Status |
| :--- | :--- | :--- | :--- |
| **Summoning** | Deterministic 3-of-a-kind merge. | Recipe-based Mythic summons (specific Legendaries). | 🔴 Major Gap |
| **Multiplayer** | Solo only. | 2-Player Co-op (Split Board). | 🔴 Major Gap |
| **Units** | 5 Generic Families (Frost, Burn, etc.). | Role-specific units (Bandit for gold, Stun robots). | 🟡 Partial Gap |
| **Visuals** | Emojis on circular bases. | Cartoonish 2D Chibi sprites / Particle FX. | 🔴 Major Gap |
| **Economy** | Safe Box & Money Gun (Basic). | Deep artifact system, Luck Stone roulette, Golems. | 🟡 Partial Gap |
| **Dungeon** | Secondary screen for passive damage. | Active farming area for specific units (Bandits). | 🟡 Partial Gap |
| **Codebase** | Single 2000+ line `game.js`. | Modular, maintainable architecture. | 🔴 Major Gap |

---

## 2. Suggested Improvements

### 🎨 Visual Fidelity & UI
*   **SVG Sprites:** Replace emojis with scalable SVG characters. This allows for programmatic animation (squash/stretch), color swapping for rarities, and higher resolution.
*   **Card-based UI:** Update the inspector and summon buttons to look like "Cards" with rarity-colored borders and better typography.
*   **Particle Engine:** Add distinct effects for different damage types (electric arcs for Arcane, fire plumes for Burn, ice crystals for Frost).
*   **Merge Animation:** A "vacuum" effect where two units are sucked into the third, followed by a light burst.

### 🎮 Game Modes & Mechanics
*   **Simulated Co-op (AI Partner):** Implement a second board controlled by a basic AI. The AI will summon and merge units, and enemies will traverse both boards. This fulfills the "Co-op" feel without requiring a server.
*   **Mythic Recipes:** Transition from "Merge 3 Legendaries for a random Mythic" to "Combine Legendary A + Legendary B + Luck Stones for Mythic C."
*   **Adaptive Difficulty:** A "Hyper-Casual" mode with auto-merge options, vs. a "God" mode with manual positioning and active skill timing.

### ⚔️ Units & Economy
*   **Economic Units:** Introduce the **Bandit** (Common/Rare) which generates gold on hit/kill.
*   **Utility Units:** Introduce **Stun/Slow Pylons** that don't deal damage but provide essential crowd control for high-difficulty waves.
*   **More Artifacts:**
    *   *Coin Magnet:* Small chance to double gold from kills.
    *   *Overclock:* Increases attack speed of all units for 5 seconds after a boss is killed.
    *   *Emergency Patch:* Once per run, restore 5 HP when it hits 0.

---

## 3. Architectural Roadmap

To support the above, the codebase should be refactored into modules:

1.  **`core/`**: Game loop, Wave management, Pathfinding.
2.  **`entities/`**: Unit and Enemy classes (handling stats, abilities, and state).
3.  **`ui/`**: Renderer, Input handling, Sheet/Popup management.
4.  **`systems/`**: Economy, Artifacts, Missions, and the new **AI Partner** logic.
5.  **`data/`**: Unit catalogues, Wave definitions, and Recipes.

---

## 4. Implementation Plan

1.  **Phase 1: Foundation.** Refactor `game.js` into modules.
2.  **Phase 2: Recipes & Economy.** Implement the Mythic Recipe system and new Artifacts.
3.  **Phase 3: The Partner.** Implement the split-board AI partner.
4.  **Phase 4: Visual Overhaul.** Replace emojis with SVG/CSS-based assets and add animations.
