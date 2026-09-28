/**
 * NeedsSystem.js
 * Manages real-time stat decay rates, health status calculation, and sleeping restoration.
 */
class NeedsSystem {
    constructor(petState, petController) {
        this.state = petState;
        this.pet = petController;
        this.decayInterval = null;
    }

    start() {
        // Tick stat decay every 4 seconds for balanced gameplay pacing
        this.decayInterval = setInterval(() => {
            this.tick();
        }, 4000);
    }

    stop() {
        if (this.decayInterval) {
            clearInterval(this.decayInterval);
        }
    }

    tick() {
        if (this.state.isSleeping) {
            // Restore energy while sleeping (+8 per tick)
            this.state.setEnergy(this.state.energy + 8);
            if (this.state.energy >= 100) {
                // Fully rested! Wake up automatically or notify player
                if (window.gameUI) {
                    window.gameUI.showFloatingText('⚡ Energi Penuh! ☀️', '#4caf50');
                }
            }
            // Slower decay for hunger while sleeping
            this.state.setHunger(this.state.hunger - 0.5);
            this.state.setCleanliness(this.state.cleanliness - 0.5);
        } else {
            // Normal decay tick (1 - 2 points per tick)
            this.state.setHunger(this.state.hunger - 1.5);
            this.state.setHappiness(this.state.happiness - 1.2);
            this.state.setCleanliness(this.state.cleanliness - 1.0);
            this.state.setEnergy(this.state.energy - 0.8);
        }

        // Calculate Health dynamically
        this.updateHealth();

        // Sad state trigger check
        if (!this.state.isSleeping && this.state.currentActivity === 'idle') {
            if (this.state.hunger < 25 || this.state.happiness < 25 || this.state.health < 40) {
                this.pet.setAnimation('sad');
            } else {
                this.pet.setAnimation('idle');
            }
        }
    }

    updateHealth() {
        let penalty = 0;
        if (this.state.hunger < 20) penalty += 15;
        if (this.state.cleanliness < 20) penalty += 15;
        if (this.state.energy < 15) penalty += 10;

        if (penalty > 0) {
            this.state.setHealth(this.state.health - penalty * 0.1);
        } else if (this.state.hunger > 50 && this.state.cleanliness > 50 && this.state.energy > 50) {
            // Gradually recover health when needs are met
            this.state.setHealth(this.state.health + 2);
        }
    }
}
