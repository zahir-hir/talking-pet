/**
 * CurrencySystem.js
 * Currency management, reward calculation, and customization purchases/unlocks (Fur, Bed, Hats).
 */
class CurrencySystem {
    constructor(petState, petController, environmentBuilder) {
        this.state = petState;
        this.pet = petController;
        this.env = environmentBuilder;
    }

    applyFurColor(colorHex) {
        this.state.furColor = colorHex;
        this.pet.updateFurColor(colorHex);
        this.state.notify();
    }

    applyBedColor(colorHex) {
        this.state.bedColor = colorHex;
        this.env.updateBedColor(colorHex);
        this.state.notify();
    }

    applyHat(hatId) {
        this.state.currentHat = hatId;
        this.pet.updateHat(hatId);
        this.state.notify();
    }
}
