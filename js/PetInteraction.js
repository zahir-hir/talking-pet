/**
 * PetInteraction.js
 * Touch interactions, free floor tap-to-move, and care activities for Bobi.
 */
class PetInteraction {
    constructor(petController, environment, petState, audioController, camera) {
        this.pet = petController;
        this.env = environment;
        this.state = petState;
        this.audio = audioController;
        this.camera = camera;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.defaultCamPos = new THREE.Vector3(0, 3.2, 4.2);
        this.targetCamPos = this.defaultCamPos.clone();

        this.setupTouchListener();
    }

    setupTouchListener() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        container.addEventListener('pointerdown', (e) => {
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // 1. Check if Bobi model was clicked directly
            const petIntersects = this.raycaster.intersectObjects(this.pet.group.children, true);
            if (petIntersects.length > 0) {
                this.performPettingAction();
                return;
            }

            // 2. Check if Floor was clicked (Tap-to-Move anywhere!)
            if (this.env.floorMesh && !this.state.isSleeping && this.state.currentActivity !== 'eating' && this.state.currentActivity !== 'bathing') {
                const floorIntersects = this.raycaster.intersectObject(this.env.floorMesh);
                if (floorIntersects.length > 0) {
                    const point = floorIntersects[0].point;
                    this.walkToPoint(point);
                }
            }
        });
    }

    walkToPoint(point) {
        // Clamp destination within room floor boundaries
        const clampedX = Math.max(-2.3, Math.min(2.3, point.x));
        const clampedZ = Math.max(-2.0, Math.min(1.8, point.z));
        const targetPoint = new THREE.Vector3(clampedX, 0, clampedZ);

        this.audio.playTap();
        this.env.showTargetMarker(targetPoint);

        // Update Bobi's target position
        this.pet.targetPos.copy(targetPoint);
        this.state.currentActivity = 'idle';

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Jalan-jalan~ 🐾');
        }
    }

    updateCamera() {
        this.camera.position.lerp(this.targetCamPos, 0.05);
        this.camera.lookAt(0, 0.9, 0);
    }

    // --- CARE ACTIONS ---
    feed() {
        if (this.state.isSleeping) return false;

        this.state.currentActivity = 'eating';
        this.audio.playEat();

        this.pet.targetPos.copy(this.env.positions.foodBowl);
        this.pet.targetPos.x += 0.5;
        this.pet.targetRotY = -Math.PI / 3;
        this.pet.setAnimation('eating');

        this.targetCamPos.set(-1.0, 2.5, 3.0);

        this.state.setHunger(this.state.hunger + 35);
        this.state.setHappiness(this.state.happiness + 10);
        this.state.addCoins(15);
        this.state.addXP(20);

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Nyam nyam! Enak banget! 🍎');
            window.gameUI.showFloatingText('🍎 +35 Makan! (+15 🪙)', '#ff9800');
        }

        setTimeout(() => {
            if (this.state.currentActivity === 'eating') {
                this.resetToCenter();
            }
        }, 3200);

        return true;
    }

    play() {
        if (this.state.isSleeping) return false;

        this.state.currentActivity = 'playing';
        this.audio.playHappy();

        this.pet.targetPos.copy(this.env.positions.toy);
        this.pet.targetPos.x -= 0.4;
        this.pet.targetRotY = Math.PI / 4;
        this.pet.setAnimation('playing');

        this.targetCamPos.set(1.0, 2.5, 3.2);

        this.state.setHappiness(this.state.happiness + 40);
        this.state.setEnergy(this.state.energy - 12);
        this.state.addCoins(20);
        this.state.addXP(25);

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Yippee! Main bola! ⚽');
            window.gameUI.showFloatingText('⚽ +40 Senang! (+20 🪙)', '#ff4081');
        }

        setTimeout(() => {
            if (this.state.currentActivity === 'playing') {
                this.resetToCenter();
            }
        }, 3500);

        return true;
    }

    bath() {
        if (this.state.isSleeping) return false;

        this.state.currentActivity = 'bathing';
        this.audio.playBath();

        this.pet.targetPos.copy(this.env.positions.bath);
        this.pet.targetPos.z -= 0.2;
        this.pet.targetRotY = Math.PI / 6;
        this.pet.setAnimation('bathing');

        this.targetCamPos.set(-1.2, 2.3, 3.2);

        this.state.setCleanliness(this.state.cleanliness + 45);
        this.state.addCoins(15);
        this.state.addXP(20);

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Busa busa! Segar! 🧼');
            window.gameUI.showFloatingText('🧼 +45 Bersih! (+15 🪙)', '#2196f3');
        }

        setTimeout(() => {
            if (this.state.currentActivity === 'bathing') {
                this.resetToCenter();
            }
        }, 3500);

        return true;
    }

    sleep() {
        this.state.isSleeping = true;
        this.state.currentActivity = 'sleeping';

        this.pet.targetPos.copy(this.env.positions.bed);
        this.pet.targetPos.y = 0.2;
        this.pet.targetRotY = 0;
        this.pet.setAnimation('sleeping');

        this.env.setNightMode(true);
        this.targetCamPos.set(1.4, 2.2, 2.6);

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Hoam... Selamat malam 💤');
            window.gameUI.toggleSleepOverlay(true);
        }

        return true;
    }

    wakeUp() {
        this.state.isSleeping = false;
        this.env.setNightMode(false);
        this.pet.group.rotation.x = 0;
        this.pet.leftEyelid.position.y = 0;
        this.pet.rightEyelid.position.y = 0;

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Selamat pagi! ☀️');
            window.gameUI.toggleSleepOverlay(false);
        }

        this.resetToCenter();
    }

    performPettingAction() {
        if (this.state.isSleeping) return;

        this.audio.playTap();
        this.pet.setAnimation('petReaction');

        this.state.setHappiness(this.state.happiness + 5);
        this.state.addCoins(2);
        this.state.addXP(5);

        if (window.gameUI) {
            window.gameUI.showSpeechBubble('Sayang Bobi! ❤️');
            window.gameUI.showFloatingText('❤️ High Five! (+2 🪙)', '#e91e63');
        }
    }

    resetToCenter() {
        this.state.currentActivity = 'idle';
        this.pet.targetPos.copy(this.env.positions.center);
        this.pet.targetRotY = 0;
        this.targetCamPos.copy(this.defaultCamPos);
        this.pet.setAnimation('idle');
    }
}
