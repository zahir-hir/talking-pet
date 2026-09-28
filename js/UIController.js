/**
 * UIController.js
 * DOM UI Controller: Status meters, Speech Bubbles, Microphone Talking Pet Toggle, Action Buttons, Shop.
 */
class UIController {
    constructor(petState, petInteraction, currencySystem, audioController) {
        this.state = petState;
        this.interaction = petInteraction;
        this.currency = currencySystem;
        this.audio = audioController;

        this.speechTimer = null;

        this.initDOM();
        this.bindEvents();
        this.state.subscribe(() => this.updateUI());
    }

    initDOM() {
        this.elem = {
            levelBadge: document.getElementById('level-badge'),
            xpBarFill: document.getElementById('xp-bar-fill'),
            coinCount: document.getElementById('coin-count'),

            meterHunger: document.getElementById('meter-hunger'),
            meterHappiness: document.getElementById('meter-happiness'),
            meterEnergy: document.getElementById('meter-energy'),
            meterCleanliness: document.getElementById('meter-cleanliness'),
            meterHealth: document.getElementById('meter-health'),

            speechBubble: document.getElementById('speech-bubble'),
            speechText: document.getElementById('speech-text'),

            micBtn: document.getElementById('mic-toggle-btn'),
            micBadge: document.getElementById('mic-listening-badge'),
            micBadgeText: document.getElementById('mic-badge-text'),

            btnFeed: document.getElementById('btn-feed'),
            btnPlay: document.getElementById('btn-play'),
            btnBath: document.getElementById('btn-bath'),
            btnSleep: document.getElementById('btn-sleep'),
            btnPet: document.getElementById('btn-pet'),

            sleepOverlay: document.getElementById('sleep-overlay'),
            wakeBtn: document.getElementById('wake-btn'),

            bgmBtn: document.getElementById('bgm-toggle-btn'),
            shopBtn: document.getElementById('shop-toggle-btn'),
            shopModal: document.getElementById('shop-modal'),
            closeShopBtn: document.getElementById('close-shop-btn'),
            hatGrid: document.getElementById('hat-options'),
            furColorGrid: document.getElementById('fur-color-options'),
            bedColorGrid: document.getElementById('bed-color-options'),

            levelUpModal: document.getElementById('levelup-modal'),
            newLevelText: document.getElementById('new-level-text'),
            levelUpClaimBtn: document.getElementById('levelup-claim-btn'),

            fxContainer: document.getElementById('fx-container')
        };
    }

    bindEvents() {
        // Talking Pet Mic Toggle
        this.elem.micBtn.addEventListener('click', async () => {
            this.audio.playButton();

            const isListeningNow = await this.audio.toggleMicPermission(
                // Callback on voice repeating playback start
                (durationSec) => {
                    this.elem.micBadgeText.textContent = '🗣️ Bobi berbicara...';
                    this.showSpeechBubble('🗣️ *Mengulangi suaramu!*');
                    this.interaction.pet.setAnimation('talking');

                    setTimeout(() => {
                        this.elem.micBadgeText.textContent = '👂 Bobi mendengarkan...';
                        if (this.state.currentActivity !== 'eating' && this.state.currentActivity !== 'bathing' && !this.state.isSleeping) {
                            this.interaction.pet.setAnimation('idle');
                        }
                    }, durationSec * 1000);
                },
                // Callback on user speech start
                () => {
                    this.elem.micBadgeText.textContent = '🎙️ Bobi merekam suaramu...';
                },
                // Callback on permission denied
                () => {
                    this.showSpeechBubble('⚠️ Izin mikrofon diperlukan!');
                }
            );

            if (isListeningNow) {
                this.elem.micBtn.classList.add('active');
                this.elem.micBadge.classList.remove('hidden');
                this.elem.micBadgeText.textContent = '👂 Bobi mendengarkan...';
                this.showSpeechBubble('Bicara sesuatu pada Bobi! 🎙️');
            } else {
                this.elem.micBtn.classList.remove('active');
                this.elem.micBadge.classList.add('hidden');
            }
        });

        // Action Buttons
        this.elem.btnFeed.addEventListener('click', () => {
            this.audio.playButton();
            this.interaction.feed();
        });

        this.elem.btnPlay.addEventListener('click', () => {
            this.audio.playButton();
            this.interaction.play();
        });

        this.elem.btnBath.addEventListener('click', () => {
            this.audio.playButton();
            this.interaction.bath();
        });

        this.elem.btnSleep.addEventListener('click', () => {
            this.audio.playButton();
            this.interaction.sleep();
        });

        this.elem.btnPet.addEventListener('click', () => {
            this.interaction.performPettingAction();
        });

        this.elem.wakeBtn.addEventListener('click', () => {
            this.audio.playButton();
            this.interaction.wakeUp();
        });

        this.elem.bgmBtn.addEventListener('click', () => {
            const isPlaying = this.audio.toggleBGM();
            this.elem.bgmBtn.style.opacity = isPlaying ? '1' : '0.5';
        });

        this.elem.shopBtn.addEventListener('click', () => {
            this.audio.playButton();
            this.populateShop();
            this.elem.shopModal.classList.remove('hidden');
        });

        this.elem.closeShopBtn.addEventListener('click', () => {
            this.audio.playButton();
            this.elem.shopModal.classList.add('hidden');
        });

        this.elem.levelUpClaimBtn.addEventListener('click', () => {
            this.audio.playButton();
            this.elem.levelUpModal.classList.add('hidden');
        });
    }

    updateUI() {
        this.elem.levelBadge.textContent = `Lv.${this.state.level}`;
        const requiredXP = this.state.level * 100;
        const xpPercent = Math.min(100, (this.state.xp / requiredXP) * 100);
        this.elem.xpBarFill.style.width = `${xpPercent}%`;
        this.elem.coinCount.textContent = this.state.coins;

        this.updateMeter(this.elem.meterHunger, this.elem.valHunger, this.state.hunger);
        this.updateMeter(this.elem.meterHappiness, this.elem.valHappiness, this.state.happiness);
        this.updateMeter(this.elem.meterEnergy, this.elem.valEnergy, this.state.energy);
        this.updateMeter(this.elem.meterCleanliness, this.elem.valCleanliness, this.state.cleanliness);
        this.updateMeter(this.elem.meterHealth, this.elem.valHealth, this.state.health);
    }

    updateMeter(fillElem, textElem, value) {
        fillElem.style.width = `${value}%`;
        textElem.textContent = `${value}%`;

        if (value < 25) {
            fillElem.style.filter = 'brightness(0.7) contrast(1.2)';
        } else {
            fillElem.style.filter = 'none';
        }
    }

    showSpeechBubble(text) {
        if (this.speechTimer) clearTimeout(this.speechTimer);

        this.elem.speechText.textContent = text;
        this.elem.speechBubble.classList.remove('hidden');

        this.speechTimer = setTimeout(() => {
            this.elem.speechBubble.classList.add('hidden');
        }, 2500);
    }

    toggleSleepOverlay(show) {
        if (show) {
            this.elem.sleepOverlay.classList.remove('hidden');
        } else {
            this.elem.sleepOverlay.classList.add('hidden');
        }
    }

    showFloatingText(text, color = '#ffeb3b') {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-text';
        floatEl.textContent = text;
        floatEl.style.color = color;

        floatEl.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
        floatEl.style.top = `45%`;

        this.elem.fxContainer.appendChild(floatEl);

        setTimeout(() => {
            if (floatEl.parentNode) {
                floatEl.parentNode.removeChild(floatEl);
            }
        }, 1200);
    }

    populateShop() {
        // Populate Hats
        this.elem.hatGrid.innerHTML = '';
        this.state.availableHats.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'hat-btn';
            if (this.state.currentHat === item.id) btn.classList.add('selected');

            if (!item.unlocked) {
                btn.title = `Locked (Req: Lv.${item.levelReq})`;
                btn.style.opacity = '0.4';
                btn.innerHTML = `🔒 ${item.name}`;
            } else {
                btn.innerHTML = `${item.icon} ${item.name}`;
                btn.addEventListener('click', () => {
                    this.currency.applyHat(item.id);
                    this.populateShop();
                });
            }
            this.elem.hatGrid.appendChild(btn);
        });

        // Populate Fur Colors
        this.elem.furColorGrid.innerHTML = '';
        this.state.availableFurColors.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'color-btn';
            if (this.state.furColor === item.hex) btn.classList.add('selected');
            btn.style.backgroundColor = item.hex;

            if (!item.unlocked) {
                btn.title = `Locked (Req: Lv.${item.levelReq})`;
                btn.style.opacity = '0.3';
                btn.innerHTML = '🔒';
            } else {
                btn.title = item.name;
                btn.addEventListener('click', () => {
                    this.currency.applyFurColor(item.hex);
                    this.populateShop();
                });
            }
            this.elem.furColorGrid.appendChild(btn);
        });

        // Populate Bed Colors
        this.elem.bedColorGrid.innerHTML = '';
        this.state.availableBedColors.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'color-btn';
            if (this.state.bedColor === item.hex) btn.classList.add('selected');
            btn.style.backgroundColor = item.hex;

            if (!item.unlocked) {
                btn.title = `Locked (Req: Lv.${item.levelReq})`;
                btn.style.opacity = '0.3';
                btn.innerHTML = '🔒';
            } else {
                btn.title = item.name;
                btn.addEventListener('click', () => {
                    this.currency.applyBedColor(item.hex);
                    this.populateShop();
                });
            }
            this.elem.bedColorGrid.appendChild(btn);
        });
    }

    showLevelUpModal(newLevel) {
        this.elem.newLevelText.textContent = `Level ${newLevel}`;
        this.elem.levelUpModal.classList.remove('hidden');
    }
}
