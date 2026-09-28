/**
 * AudioController.js
 * Procedural sound synthesizer & Talking Pet Pitch-Shifted Voice Repetition Engine.
 */
class AudioController {
    constructor() {
        this.ctx = null;
        this.bgmNode = null;
        this.isBGMPlaying = false;
        this.muted = false;

        // Microphone Voice Repetition System
        this.micStream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isListening = false;
        this.isRecording = false;
        this.speechDetectorInterval = null;
        this.silenceTimer = null;
        this.pitchRate = 1.38; // Cute high pitch factor
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- TALKING VOICE REPETITION ENGINE ---
    async toggleMicPermission(onVoiceRecorded, onSpeechStart, onPermissionDenied) {
        this.init(); this.resume();

        if (this.isListening) {
            this.stopMicListening();
            return false;
        }

        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.isListening = true;
            this.startSilenceDetection(onVoiceRecorded, onSpeechStart);
            return true;
        } catch (err) {
            console.warn("Microphone access denied or unsupported:", err);
            if (onPermissionDenied) onPermissionDenied();
            return false;
        }
    }

    startSilenceDetection(onVoiceRecorded, onSpeechStart) {
        if (!this.ctx || !this.micStream) return;

        const source = this.ctx.createMediaStreamSource(this.micStream);
        const analyser = this.ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let silenceStart = Date.now();

        this.speechDetectorInterval = setInterval(() => {
            if (!this.isListening) return;

            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const averageVolume = sum / bufferLength;

            // Volume threshold for speech detection
            if (averageVolume > 22) {
                if (!this.isRecording) {
                    this.startRecordingChunk(onSpeechStart);
                }
                silenceStart = Date.now();
            } else if (this.isRecording) {
                // If silence for 750ms after speech, stop recording & play pitch shifted back!
                if (Date.now() - silenceStart > 750) {
                    this.stopRecordingChunk(onVoiceRecorded);
                }
            }
        }, 100);
    }

    startRecordingChunk(onSpeechStart) {
        if (this.isRecording || !this.micStream) return;

        this.isRecording = true;
        this.audioChunks = [];

        try {
            this.mediaRecorder = new MediaRecorder(this.micStream);
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };
            this.mediaRecorder.start();

            if (onSpeechStart) onSpeechStart();
        } catch (e) {
            console.warn("MediaRecorder error:", e);
            this.isRecording = false;
        }
    }

    stopRecordingChunk(onVoiceRecorded) {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.isRecording = false;

        this.mediaRecorder.onstop = async () => {
            const blob = new Blob(this.audioChunks, { type: 'audio/ogg; codecs=opus' });
            const arrayBuffer = await blob.arrayBuffer();

            if (this.ctx) {
                try {
                    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                    this.playPitchShiftedAudio(audioBuffer, onVoiceRecorded);
                } catch (err) {
                    console.warn("Error decoding recorded audio:", err);
                }
            }
        };

        try {
            this.mediaRecorder.stop();
        } catch (e) {
            console.warn("MediaRecorder stop error:", e);
        }
    }

    playPitchShiftedAudio(audioBuffer, onFinished) {
        if (!this.ctx || !audioBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = audioBuffer;

        // High-pitched cute pet voice transformation!
        source.playbackRate.value = this.pitchRate;

        // Connect through gain node
        const gain = this.ctx.createGain();
        gain.gain.value = 1.2;

        source.connect(gain);
        gain.connect(this.ctx.destination);

        const duration = audioBuffer.duration / this.pitchRate;
        source.start(0);

        if (onFinished) onFinished(duration);
    }

    stopMicListening() {
        this.isListening = false;
        this.isRecording = false;

        if (this.speechDetectorInterval) {
            clearInterval(this.speechDetectorInterval);
            this.speechDetectorInterval = null;
        }

        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
    }

    // --- SOUND EFFECTS ---
    playTap() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playButton() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playEat() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(200 + Math.random() * 150, this.ctx.currentTime);

                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.06);
            }, i * 120);
        }
    }

    playBath() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startFreq = 400 + Math.random() * 300;
                osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(startFreq + 400, this.ctx.currentTime + 0.08);

                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            }, i * 90);
        }
    }

    playHappy() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.15);
            }, idx * 70);
        });
    }

    playSad() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const notes = [400, 350, 300];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
            }, idx * 120);
        });
    }

    playLevelUp() {
        if (this.muted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.25);
            }, idx * 100);
        });
    }

    toggleBGM() {
        this.init(); this.resume();
        if (this.isBGMPlaying) {
            this.stopBGM();
            return false;
        } else {
            this.startBGM();
            return true;
        }
    }

    startBGM() {
        if (!this.ctx || this.isBGMPlaying) return;
        this.isBGMPlaying = true;

        const bgmNotes = [
            261.63, 329.63, 392.00, 329.63,
            293.66, 349.23, 440.00, 349.23,
            261.63, 329.63, 392.00, 523.25
        ];

        let step = 0;
        this.bgmTimer = setInterval(() => {
            if (!this.isBGMPlaying || !this.ctx) return;
            const freq = bgmNotes[step % bgmNotes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.4);

            step++;
        }, 500);
    }

    stopBGM() {
        this.isBGMPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
