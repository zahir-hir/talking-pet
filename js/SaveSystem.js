/**
 * SaveSystem.js
 * Handles LocalStorage persistence, auto-save, and offline decay calculation with strict data sanitization.
 */
class SaveSystem {
    constructor(petState) {
        this.petState = petState;
        this.storageKey = 'bobi_virtual_pet_save_v1';
        this.autoSaveInterval = null;
    }

    init() {
        this.load();

        this.autoSaveInterval = setInterval(() => {
            this.save();
        }, 5000);

        window.addEventListener('beforeunload', () => this.save());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.save();
            }
        });
    }

    save() {
        const data = {
            hunger: this.petState.hunger,
            happiness: this.petState.happiness,
            energy: this.petState.energy,
            cleanliness: this.petState.cleanliness,
            health: this.petState.health,
            coins: this.petState.coins,
            xp: this.petState.xp,
            level: this.petState.level,
            furColor: this.petState.furColor,
            bedColor: this.petState.bedColor,
            currentHat: this.petState.currentHat,
            lastSavedTime: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Save failed:', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return;

            const data = JSON.parse(raw);
            if (typeof data.hunger === 'number' && !isNaN(data.hunger)) this.petState.hunger = data.hunger;
            if (typeof data.happiness === 'number' && !isNaN(data.happiness)) this.petState.happiness = data.happiness;
            if (typeof data.energy === 'number' && !isNaN(data.energy)) this.petState.energy = data.energy;
            if (typeof data.cleanliness === 'number' && !isNaN(data.cleanliness)) this.petState.cleanliness = data.cleanliness;
            if (typeof data.health === 'number' && !isNaN(data.health)) this.petState.health = data.health;
            if (typeof data.coins === 'number' && !isNaN(data.coins)) this.petState.coins = data.coins;
            if (typeof data.xp === 'number' && !isNaN(data.xp)) this.petState.xp = data.xp;
            if (typeof data.level === 'number' && !isNaN(data.level)) this.petState.level = data.level;

            if (typeof data.furColor === 'string' && data.furColor.startsWith('#')) this.petState.furColor = data.furColor;
            if (typeof data.bedColor === 'string' && data.bedColor.startsWith('#')) this.petState.bedColor = data.bedColor;
            if (typeof data.currentHat === 'string') this.petState.currentHat = data.currentHat;

            this.petState.checkUnlocks();

            if (data.lastSavedTime && typeof data.lastSavedTime === 'number') {
                const elapsedSeconds = (Date.now() - data.lastSavedTime) / 1000;
                if (elapsedSeconds > 60) {
                    const decayUnits = Math.floor(elapsedSeconds / 180);
                    this.petState.setHunger(this.petState.hunger - decayUnits);
                    this.petState.setHappiness(this.petState.happiness - decayUnits);
                    this.petState.setCleanliness(this.petState.cleanliness - decayUnits);
                    if (!this.petState.isSleeping) {
                        this.petState.setEnergy(this.petState.energy - decayUnits);
                    }
                }
            }

            this.petState.notify();
        } catch (e) {
            console.warn('Load save failed, resetting save:', e);
            localStorage.removeItem(this.storageKey);
        }
    }
}
