/**
 * main.js
 * Game Initialization & 3D Rendering Loop with robust execution hooks and WebGL fallback.
 */
function initGame() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    if (typeof THREE === 'undefined') {
        console.error("Three.js library not loaded!");
        container.innerHTML = '<div style="color:white;padding:30px;text-align:center;"><h2>⚠️ 3D Engine Error</h2><p>Library Three.js tidak termuat. Pastikan file js/libs/three.min.js ada.</p></div>';
        return;
    }

    // Force a real paint cycle before measuring — guarantees non-zero dimensions
    const rect = container.getBoundingClientRect();
    let width = rect.width > 0 ? rect.width : (container.clientWidth || window.innerWidth || 400);
    let height = rect.height > 0 ? rect.height : (container.clientHeight || window.innerHeight || 600);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdff0ea);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 4.2);
    camera.lookAt(0, 0.9, 0);

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) {
        console.error("WebGL error:", e);
        container.innerHTML = '<div style="color:white;padding:30px;text-align:center;"><h2>⚠️ WebGL Error</h2><p>WebGL tidak aktif di browser Anda. Aktifkan Hardware Acceleration.</p></div>';
        return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Instantiate Game Modules
    const petState = new PetState();
    const audioController = new AudioController();
    window.gameAudio = audioController;

    const envBuilder = new EnvironmentBuilder(scene);
    envBuilder.buildRoom();
    window.gameEnv = envBuilder;

    const petController = new PetController(scene, petState);
    const petInteraction = new PetInteraction(petController, envBuilder, petState, audioController, camera);
    const needsSystem = new NeedsSystem(petState, petController);
    const currencySystem = new CurrencySystem(petState, petController, envBuilder);
    const saveSystem = new SaveSystem(petState);

    saveSystem.init();

    if (petState.furColor) petController.updateFurColor(petState.furColor);
    if (petState.bedColor) envBuilder.updateBedColor(petState.bedColor);
    if (petState.currentHat) petController.updateHat(petState.currentHat);

    const uiController = new UIController(petState, petInteraction, currencySystem, audioController);
    window.gameUI = uiController;
    uiController.updateUI();

    needsSystem.start();

    function handleResize() {
        const newW = container.clientWidth || window.innerWidth || 400;
        const newH = container.clientHeight || window.innerHeight || 600;
        if (newW > 0 && newH > 0) {
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        }
    }

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        petController.update(delta);
        envBuilder.updateMarkerAnimation(delta);
        petInteraction.updateCamera();

        renderer.render(scene, camera);
    }

    animate();
}

// Guaranteed execution hook — defer via rAF to ensure DOM is painted and container has dimensions
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(initGame));
} else {
    requestAnimationFrame(initGame);
}
