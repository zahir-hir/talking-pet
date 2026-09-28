/**
 * EnvironmentBuilder.js
 * Creates low-poly cozy 3D room with floor raycast mesh and animated target destination marker.
 */
class EnvironmentBuilder {
    constructor(scene) {
        this.scene = scene;

        this.positions = {
            center: new THREE.Vector3(0, 0, 0),
            foodBowl: new THREE.Vector3(-1.6, 0, -0.6),
            bed: new THREE.Vector3(1.6, 0, -0.8),
            bath: new THREE.Vector3(-1.5, 0, 1.2),
            toy: new THREE.Vector3(1.4, 0, 1.0)
        };

        this.floorMesh = null;
        this.targetMarker = null;
    }

    buildRoom() {
        const roomWidth = 6;
        const roomDepth = 5;
        const roomHeight = 3.5;

        // Floor (Exposed for Raycasting tap-to-move)
        const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xedd3b8, roughness: 0.6, metalness: 0.1 });
        this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
        this.floorMesh.name = "FloorMesh";
        this.floorMesh.rotation.x = -Math.PI / 2;
        this.floorMesh.receiveShadow = true;
        this.scene.add(this.floorMesh);

        // Destination Target Marker (Yellow pulsing ring)
        const markerGeo = new THREE.RingGeometry(0.12, 0.22, 24);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b, side: THREE.DoubleSide, transparent: true, opacity: 0 });
        this.targetMarker = new THREE.Mesh(markerGeo, markerMat);
        this.targetMarker.rotation.x = -Math.PI / 2;
        this.targetMarker.position.y = 0.015;
        this.scene.add(this.targetMarker);

        // Center Rug
        const rugGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.02, 32);
        const rugMat = new THREE.MeshStandardMaterial({ color: 0xfff0db, roughness: 0.9 });
        const rug = new THREE.Mesh(rugGeo, rugMat);
        rug.position.set(0, 0.01, 0);
        this.scene.add(rug);

        // Walls
        const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xdff0ea, roughness: 0.8 });
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
        this.scene.add(backWall);

        const sideWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
        const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
        leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);

        // Baseboard
        const trimGeo = new THREE.BoxGeometry(roomWidth, 0.15, 0.05);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.set(0, 0.075, -roomDepth / 2 + 0.025);
        this.scene.add(trim);

        this.buildBed();
        this.buildFoodBowl();
        this.buildBathTub();
        this.buildToyBall();
        this.buildDecorations();
        this.setupLighting();
    }

    showTargetMarker(pos) {
        if (this.targetMarker) {
            this.targetMarker.position.set(pos.x, 0.02, pos.z);
            this.targetMarker.material.opacity = 0.85;
            this.targetMarker.scale.set(1.4, 1.4, 1.4);
        }
    }

    hideTargetMarker() {
        if (this.targetMarker) {
            this.targetMarker.material.opacity = 0;
        }
    }

    updateMarkerAnimation(delta) {
        if (this.targetMarker && this.targetMarker.material.opacity > 0) {
            this.targetMarker.rotation.z += delta * 3;
            this.targetMarker.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
    }

    buildBed() {
        const bedGroup = new THREE.Group();
        bedGroup.position.copy(this.positions.bed);

        const rimGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.2, 24);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.7 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = 0.1;
        rim.castShadow = true;
        bedGroup.add(rim);

        const cushionGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.22, 24);
        this.bedMat = new THREE.MeshStandardMaterial({ color: 0xbae1ff, roughness: 0.5 });
        const cushion = new THREE.Mesh(cushionGeo, this.bedMat);
        cushion.position.y = 0.12;
        cushion.castShadow = true;
        bedGroup.add(cushion);

        const pillowGeo = new THREE.BoxGeometry(0.5, 0.1, 0.3);
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const pillow = new THREE.Mesh(pillowGeo, pillowMat);
        pillow.position.set(0, 0.22, -0.3);
        pillow.rotation.x = 0.2;
        bedGroup.add(pillow);

        this.scene.add(bedGroup);
    }

    updateBedColor(hexColor) {
        if (this.bedMat) {
            this.bedMat.color.set(hexColor);
        }
    }

    buildFoodBowl() {
        const bowlGroup = new THREE.Group();
        bowlGroup.position.copy(this.positions.foodBowl);

        const bowlGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.15, 16);
        const bowlMat = new THREE.MeshStandardMaterial({ color: 0xff4081, roughness: 0.3 });
        const bowl = new THREE.Mesh(bowlGeo, bowlMat);
        bowl.position.y = 0.075;
        bowl.castShadow = true;
        bowlGroup.add(bowl);

        this.foodKibble = new THREE.Group();
        const foodGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
        const foodMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
        const food = new THREE.Mesh(foodGeo, foodMat);
        food.position.y = 0.11;
        this.foodKibble.add(food);

        const appleGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const appleMat = new THREE.MeshStandardMaterial({ color: 0xff1744 });
        const apple = new THREE.Mesh(appleGeo, appleMat);
        apple.position.set(0, 0.2, 0);
        this.foodKibble.add(apple);

        bowlGroup.add(this.foodKibble);
        this.scene.add(bowlGroup);
    }

    buildBathTub() {
        const tubGroup = new THREE.Group();
        tubGroup.position.copy(this.positions.bath);

        const tubGeo = new THREE.BoxGeometry(0.9, 0.35, 0.9);
        const tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const tub = new THREE.Mesh(tubGeo, tubMat);
        tub.position.y = 0.175;
        tub.castShadow = true;
        tubGroup.add(tub);

        const waterGeo = new THREE.PlaneGeometry(0.8, 0.8);
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.1, transparent: true, opacity: 0.85 });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.3;
        tubGroup.add(water);

        const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
        for (let i = 0; i < 6; i++) {
            const bGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 12, 12);
            const bubble = new THREE.Mesh(bGeo, bubbleMat);
            bubble.position.set((Math.random() - 0.5) * 0.5, 0.33, (Math.random() - 0.5) * 0.5);
            tubGroup.add(bubble);
        }

        this.scene.add(tubGroup);
    }

    buildToyBall() {
        const toyGroup = new THREE.Group();
        toyGroup.position.copy(this.positions.toy);

        const ballGeo = new THREE.SphereGeometry(0.22, 20, 20);
        const ballMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.3 });
        this.toyBall = new THREE.Mesh(ballGeo, ballMat);
        this.toyBall.position.y = 0.22;
        this.toyBall.castShadow = true;
        toyGroup.add(this.toyBall);

        this.scene.add(toyGroup);
    }

    buildDecorations() {
        const winGroup = new THREE.Group();
        winGroup.position.set(-1.2, 2.0, -2.48);

        const frameGeo = new THREE.BoxGeometry(1.2, 1.2, 0.06);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        winGroup.add(frame);

        const glassGeo = new THREE.PlaneGeometry(1.0, 1.0);
        const glassMat = new THREE.MeshBasicMaterial({ color: 0xbbdefb });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.z = 0.035;
        winGroup.add(glass);

        this.scene.add(winGroup);
    }

    setupLighting() {
        this.ambientLight = new THREE.AmbientLight(0xfff5ea, 0.7);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfffaed, 0.8);
        this.dirLight.position.set(3, 5, 4);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.bias = -0.001;
        this.scene.add(this.dirLight);
    }

    setNightMode(isNight) {
        if (isNight) {
            this.ambientLight.color.setHex(0x1a237e);
            this.ambientLight.intensity = 0.35;
            this.dirLight.intensity = 0.2;
        } else {
            this.ambientLight.color.setHex(0xfff5ea);
            this.ambientLight.intensity = 0.7;
            this.dirLight.intensity = 0.8;
        }
    }
}
