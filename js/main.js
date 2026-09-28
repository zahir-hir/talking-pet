/**
 * main.js
 * Game Initialization & 3D Rendering Loop with robust canvas sizing and error resilience.
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Robust width & height calculation with fallbacks
    let width = container.clientWidth || window.innerWidth || 400;
    let height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdff0ea);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 4.2);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Initialize Game Systems
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

    // Load saved data safely
    saveSystem.init();

    // Sync visuals with loaded state
    if (petState.furColor) petController.updateFurColor(petState.furColor);
    if (petState.bedColor) envBuilder.updateBedColor(petState.bedColor);
    if (petState.currentHat) petController.updateHat(petState.currentHat);

    const uiController = new UIController(petState, petInteraction, currencySystem, audioController);
    window.gameUI = uiController;
    uiController.updateUI();

    // Start Needs System Ticking
    needsSystem.start();

    // Handle Window Resize safely
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

    // Initial resize trigger to lock in dimensions
    setTimeout(handleResize, 100);

    // Main 3D Animation Loop
    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Update Pet movement & animations
        petController.update(delta);

        // Update target marker pulse
        envBuilder.updateMarkerAnimation(delta);

        // Update camera smooth movement
        petInteraction.updateCamera();

        // Render 3D Scene
        renderer.render(scene, camera);
    }

    animate();
});
