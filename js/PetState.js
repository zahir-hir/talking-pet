/**
 * PetState.js
 * Centralized data state for Bobi's status, coins, XP, level, customizations, and hats.
 */
class PetState {
    constructor() {
        this.listeners = [];

        // Core stats (0 - 100)
        this.hunger = 80;
        this.happiness = 80;
        this.energy = 80;
        this.cleanliness = 80;
        this.health = 100;

        // Currency & Progression
        this.coins = 100;
        this.xp = 0;
        this.level = 1;

        // Pet State Flag
        this.isSleeping = false;
        this.currentActivity = 'idle'; // 'idle', 'eating', 'playing', 'bathing', 'sleeping', 'petting'

        // Customizations
        this.furColor = '#ffb3ba'; // Soft pinkish default
        this.bedColor = '#bae1ff'; // Soft pastel blue default
        this.currentHat = 'none';  // 'none', 'crown', 'party', 'glasses', 'wizard'

        // Available customization options
        this.availableFurColors = [
            { id: 'fur_pink', hex: '#ffb3ba', name: 'Pastel Pink', unlocked: true },
            { id: 'fur_yellow', hex: '#ffdfba', name: 'Pastel Yellow', unlocked: true },
            { id: 'fur_mint', hex: '#baffc9', name: 'Pastel Mint', unlocked: true },
            { id: 'fur_lavender', hex: '#e8dff5', name: 'Lavender', unlocked: false, levelReq: 2 },
            { id: 'fur_orange', hex: '#ffc3a0', name: 'Peach', unlocked: false, levelReq: 3 },
            { id: 'fur_sky', hex: '#a0c4ff', name: 'Sky Blue', unlocked: false, levelReq: 4 },
            { id: 'fur_golden', hex: '#ffd700', name: 'Golden Shiny', unlocked: false, levelReq: 5 }
        ];

        this.availableBedColors = [
            { id: 'bed_blue', hex: '#bae1ff', name: 'Sky Blue', unlocked: true },
            { id: 'bed_yellow', hex: '#ffffba', name: 'Sunshine', unlocked: true },
            { id: 'bed_green', hex: '#d4f0f0', name: 'Soft Mint', unlocked: true },
            { id: 'bed_purple', hex: '#f3c4fb', name: 'Lilac', unlocked: false, levelReq: 2 },
            { id: 'bed_red', hex: '#ffadad', name: 'Ruby Cushion', unlocked: false, levelReq: 3 }
        ];

        this.availableHats = [
            { id: 'none', name: 'Tanpa Topi', icon: '❌', unlocked: true },
            { id: 'party', name: 'Topi Pesta 🎉', icon: '🎉', unlocked: true },
            { id: 'crown', name: 'Mahkota 👑', icon: '👑', unlocked: false, levelReq: 2 },
            { id: 'glasses', name: 'Kacamata Keren 😎', icon: '😎', unlocked: false, levelReq: 3 },
            { id: 'wizard', name: 'Topi Penyihir 🧙‍♂️', icon: '🧙‍♂️', unlocked: false, levelReq: 4 }
        ];
    }

    // Subscribe to state changes
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    // Stat Setters with Clamping (0 - 100)
    setHunger(val) {
        this.hunger = Math.max(0, Math.min(100, Math.round(val)));
        this.notify();
    }

    setHappiness(val) {
        this.happiness = Math.max(0, Math.min(100, Math.round(val)));
        this.notify();
    }

    setEnergy(val) {
        this.energy = Math.max(0, Math.min(100, Math.round(val)));
        this.notify();
    }

    setCleanliness(val) {
        this.cleanliness = Math.max(0, Math.min(100, Math.round(val)));
        this.notify();
    }

    setHealth(val) {
        this.health = Math.max(0, Math.min(100, Math.round(val)));
        this.notify();
    }

    addCoins(amount) {
        this.coins += Math.max(0, amount);
        this.notify();
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.notify();
            return true;
        }
        return false;
    }

    addXP(amount) {
        this.xp += amount;
        const requiredXP = this.level * 100;
        if (this.xp >= requiredXP) {
            this.xp -= requiredXP;
            this.level += 1;
            this.checkUnlocks();
            this.notifyLevelUp();
        }
        this.notify();
    }

    checkUnlocks() {
        this.availableFurColors.forEach(item => {
            if (item.levelReq && this.level >= item.levelReq) item.unlocked = true;
        });
        this.availableBedColors.forEach(item => {
            if (item.levelReq && this.level >= item.levelReq) item.unlocked = true;
        });
        this.availableHats.forEach(item => {
            if (item.levelReq && this.level >= item.levelReq) item.unlocked = true;
        });
    }

    notifyLevelUp() {
        if (window.gameUI) {
            window.gameUI.showLevelUpModal(this.level);
        }
        if (window.gameAudio) {
            window.gameAudio.playLevelUp();
        }
    }
}
