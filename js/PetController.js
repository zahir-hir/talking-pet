/**
 * PetController.js
 * Advanced 3D Character Controller for "Bobi": Talking Animation, Free Walking, Eyebrows, Expressions, 3D Hats, & Particle FX.
 */
class PetController {
    constructor(scene, petState) {
        this.scene = scene;
        this.petState = petState;

        this.group = new THREE.Group();
        this.group.name = "BobiCharGroup";
        this.scene.add(this.group);

        // Body Mesh References
        this.headMesh = null;
        this.bodyMesh = null;
        this.leftEar = null;
        this.rightEar = null;
        this.leftEye = null;
        this.rightEye = null;
        this.leftEyelid = null;
        this.rightEyelid = null;
        this.leftEyebrow = null;
        this.rightEyebrow = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftFoot = null;
        this.rightFoot = null;
        this.hatGroup = null;

        // Active 3D Particles Array
        this.particles = [];

        // Animation State Variables
        this.animTime = 0;
        this.currentAnim = 'idle'; // 'idle', 'walk', 'talking', 'happy', 'sad', 'eating', 'sleeping', 'bathing', 'playing', 'petReaction'
        this.blinkTimer = 0;

        // Target Transform for movement interpolation
        this.targetPos = new THREE.Vector3(0, 0, 0);
        this.targetRotY = 0;

        this.buildCharacter();
    }

    buildCharacter() {
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        // Material setup
        const initialFurColor = this.petState.furColor || '#ffb3ba';
        this.furMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(initialFurColor),
            roughness: 0.35,
            metalness: 0.05
        });

        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });
        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff80ab, roughness: 0.6 });

        // 1. Body
        const bodyGeo = new THREE.SphereGeometry(0.45, 24, 24);
        bodyGeo.scale(1.0, 0.9, 0.95);
        this.bodyMesh = new THREE.Mesh(bodyGeo, this.furMaterial);
        this.bodyMesh.position.y = 0.42;
        this.bodyMesh.castShadow = true;
        this.group.add(this.bodyMesh);

        // Belly Patch
        const bellyGeo = new THREE.SphereGeometry(0.32, 20, 20);
        bellyGeo.scale(0.85, 0.9, 0.4);
        const bellyMesh = new THREE.Mesh(bellyGeo, whiteMat);
        bellyMesh.position.set(0, 0.4, 0.32);
        this.group.add(bellyMesh);

        // 2. Head
        const headGeo = new THREE.SphereGeometry(0.55, 28, 28);
        headGeo.scale(1.05, 0.95, 1.0);
        this.headMesh = new THREE.Mesh(headGeo, this.furMaterial);
        this.headMesh.position.set(0, 1.05, 0);
        this.headMesh.castShadow = true;
        this.group.add(this.headMesh);

        // Cheeks
        const cheekGeo = new THREE.SphereGeometry(0.12, 12, 12);
        cheekGeo.scale(1, 0.6, 0.4);
        const leftCheek = new THREE.Mesh(cheekGeo, pinkMat);
        leftCheek.position.set(-0.35, 0.98, 0.45);
        this.group.add(leftCheek);
        const rightCheek = leftCheek.clone();
        rightCheek.position.x = 0.35;
        this.group.add(rightCheek);

        // 3. Eyebrows
        const browGeo = new THREE.BoxGeometry(0.14, 0.03, 0.04);
        this.leftEyebrow = new THREE.Mesh(browGeo, darkMat);
        this.leftEyebrow.position.set(-0.22, 1.25, 0.48);
        this.group.add(this.leftEyebrow);

        this.rightEyebrow = new THREE.Mesh(browGeo, darkMat);
        this.rightEyebrow.position.set(0.22, 1.25, 0.48);
        this.group.add(this.rightEyebrow);

        // 4. Eyes & Eyelids
        const eyeGeo = new THREE.SphereGeometry(0.13, 16, 16);
        const pupilGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const shineGeo = new THREE.SphereGeometry(0.03, 10, 10);

        this.leftEye = new THREE.Group();
        this.leftEye.position.set(-0.22, 1.1, 0.45);

        const lWhite = new THREE.Mesh(eyeGeo, whiteMat);
        lWhite.scale.set(1, 1.1, 0.5);
        this.leftEye.add(lWhite);

        const lPupil = new THREE.Mesh(pupilGeo, darkMat);
        lPupil.position.set(0.02, 0, 0.08);
        this.leftEye.add(lPupil);

        const lShine = new THREE.Mesh(shineGeo, whiteMat);
        lShine.position.set(0.04, 0.04, 0.12);
        this.leftEye.add(lShine);

        const lidGeo = new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        this.leftEyelid = new THREE.Mesh(lidGeo, this.furMaterial);
        this.leftEyelid.rotation.x = Math.PI / 2;
        this.leftEyelid.position.z = 0.02;
        this.leftEyelid.scale.set(1.05, 1.05, 1.05);
        this.leftEye.add(this.leftEyelid);

        this.group.add(this.leftEye);

        this.rightEye = this.leftEye.clone();
        this.rightEye.position.x = 0.22;
        this.rightEyelid = this.rightEye.children[3];
        this.group.add(this.rightEye);

        // Nose
        const noseGeo = new THREE.SphereGeometry(0.06, 12, 12);
        noseGeo.scale(1.2, 0.8, 0.8);
        const noseMesh = new THREE.Mesh(noseGeo, darkMat);
        noseMesh.position.set(0, 1.0, 0.54);
        this.group.add(noseMesh);

        // 5. Ears
        const earGeo = new THREE.CylinderGeometry(0.05, 0.16, 0.45, 16);
        this.leftEar = new THREE.Mesh(earGeo, this.furMaterial);
        this.leftEar.position.set(-0.38, 1.52, 0);
        this.leftEar.rotation.z = 0.3;
        this.leftEar.rotation.x = -0.1;
        this.leftEar.castShadow = true;
        this.group.add(this.leftEar);

        this.rightEar = new THREE.Mesh(earGeo, this.furMaterial);
        this.rightEar.position.set(0.38, 1.52, 0);
        this.rightEar.rotation.z = -0.3;
        this.rightEar.rotation.x = -0.1;
        this.rightEar.castShadow = true;
        this.group.add(this.rightEar);

        // 6. Arms & Feet
        const armGeo = new THREE.SphereGeometry(0.14, 16, 16);
        armGeo.scale(0.8, 1.4, 0.8);
        this.leftArm = new THREE.Mesh(armGeo, this.furMaterial);
        this.leftArm.position.set(-0.45, 0.48, 0.1);
        this.leftArm.rotation.z = 0.4;
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, this.furMaterial);
        this.rightArm.position.set(0.45, 0.48, 0.1);
        this.rightArm.rotation.z = -0.4;
        this.group.add(this.rightArm);

        // Feet
        const footGeo = new THREE.SphereGeometry(0.16, 16, 16);
        footGeo.scale(1.0, 0.6, 1.4);
        this.leftFoot = new THREE.Mesh(footGeo, this.furMaterial);
        this.leftFoot.position.set(-0.25, 0.08, 0.15);
        this.group.add(this.leftFoot);

        this.rightFoot = new THREE.Mesh(footGeo, this.furMaterial);
        this.rightFoot.position.set(0.25, 0.08, 0.15);
        this.group.add(this.rightFoot);

        // Tail
        const tailGeo = new THREE.SphereGeometry(0.15, 14, 14);
        const tailMesh = new THREE.Mesh(tailGeo, this.furMaterial);
        tailMesh.position.set(0, 0.35, -0.42);
        this.group.add(tailMesh);

        // 7. Hat Attach Point
        this.hatGroup = new THREE.Group();
        this.hatGroup.position.set(0, 1.58, 0);
        this.group.add(this.hatGroup);

        this.updateHat(this.petState.currentHat);
    }

    updateFurColor(hexColor) {
        if (this.furMaterial && hexColor) {
            try {
                this.furMaterial.color.set(hexColor);
            } catch (e) {
                console.warn("Invalid fur color:", hexColor);
            }
        }
    }

    updateHat(hatId) {
        while (this.hatGroup.children.length > 0) {
            this.hatGroup.remove(this.hatGroup.children[0]);
        }

        if (!hatId || hatId === 'none') return;

        if (hatId === 'crown') {
            const crownGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.22, 8);
            const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
            const crown = new THREE.Mesh(crownGeo, crownMat);
            crown.position.y = 0.11;
            this.hatGroup.add(crown);

            const gemGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const gemMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const gem = new THREE.Mesh(gemGeo, gemMat);
            gem.position.set(0, 0.18, 0.22);
            this.hatGroup.add(gem);
        } else if (hatId === 'party') {
            const coneGeo = new THREE.ConeGeometry(0.22, 0.45, 16);
            const coneMat = new THREE.MeshStandardMaterial({ color: 0xff4081, roughness: 0.4 });
            const partyHat = new THREE.Mesh(coneGeo, coneMat);
            partyHat.position.y = 0.225;
            partyHat.rotation.z = -0.15;
            this.hatGroup.add(partyHat);

            const pomGeo = new THREE.SphereGeometry(0.06, 10, 10);
            const pomMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b });
            const pom = new THREE.Mesh(pomGeo, pomMat);
            pom.position.set(-0.04, 0.46, 0);
            this.hatGroup.add(pom);
        } else if (hatId === 'glasses') {
            const frameGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
            const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });

            const leftLens = new THREE.Mesh(frameGeo, glassMat);
            leftLens.position.set(-0.2, -0.48, 0.48);
            this.hatGroup.add(leftLens);

            const rightLens = new THREE.Mesh(frameGeo, glassMat);
            rightLens.position.set(0.2, -0.48, 0.48);
            this.hatGroup.add(rightLens);

            const bridgeGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
            const bridge = new THREE.Mesh(bridgeGeo, glassMat);
            bridge.position.set(0, -0.48, 0.48);
            this.hatGroup.add(bridge);
        } else if (hatId === 'wizard') {
            const brimGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 20);
            const wizMat = new THREE.MeshStandardMaterial({ color: 0x673ab7, roughness: 0.5 });
            const brim = new THREE.Mesh(brimGeo, wizMat);
            brim.position.y = 0.02;
            this.hatGroup.add(brim);

            const coneGeo = new THREE.ConeGeometry(0.24, 0.55, 16);
            const cone = new THREE.Mesh(coneGeo, wizMat);
            cone.position.y = 0.3;
            cone.rotation.z = -0.1;
            this.hatGroup.add(cone);
        }
    }

    setAnimation(animName) {
        this.currentAnim = animName;
        this.animTime = 0;
    }

    spawn3DParticle(type) {
        let pGeo, pMat;
        if (type === 'heart') {
            pGeo = new THREE.SphereGeometry(0.08, 8, 8);
            pMat = new THREE.MeshStandardMaterial({ color: 0xff4081, transparent: true, opacity: 0.9 });
        } else if (type === 'bubble') {
            pGeo = new THREE.SphereGeometry(0.07 + Math.random() * 0.05, 10, 10);
            pMat = new THREE.MeshStandardMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.85 });
        } else if (type === 'zzz') {
            pGeo = new THREE.SphereGeometry(0.06, 8, 8);
            pMat = new THREE.MeshStandardMaterial({ color: 0x9c27b0, transparent: true, opacity: 0.9 });
        } else {
            pGeo = new THREE.OctahedronGeometry(0.08, 0);
            pMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.2 });
        }

        const mesh = new THREE.Mesh(pGeo, pMat);
        mesh.position.copy(this.group.position);
        mesh.position.y += 1.2 + Math.random() * 0.4;
        mesh.position.x += (Math.random() - 0.5) * 0.4;
        mesh.position.z += (Math.random() - 0.5) * 0.4;

        this.scene.add(mesh);
        this.particles.push({
            mesh: mesh,
            vy: 0.6 + Math.random() * 0.4,
            life: 1.2
        });
    }

    update(delta) {
        this.animTime += delta;
        this.blinkTimer += delta;

        // Smooth position interpolation
        this.group.position.lerp(this.targetPos, 0.12);

        // Calculate movement distance to switch between walk and idle automatically
        const moveDist = this.group.position.distanceTo(this.targetPos);
        if (moveDist > 0.12 && this.currentAnim !== 'eating' && this.currentAnim !== 'bathing' && this.currentAnim !== 'sleeping' && this.currentAnim !== 'playing' && this.currentAnim !== 'talking') {
            if (this.currentAnim !== 'walk') {
                this.setAnimation('walk');
            }
            const dirX = this.targetPos.x - this.group.position.x;
            const dirZ = this.targetPos.z - this.group.position.z;
            this.targetRotY = Math.atan2(dirX, dirZ);
        } else if (moveDist <= 0.12 && this.currentAnim === 'walk') {
            this.setAnimation('idle');
            if (window.gameEnv) {
                window.gameEnv.hideTargetMarker();
            }
        }

        // Smooth rotation interpolation
        let diffRot = this.targetRotY - this.group.rotation.y;
        while (diffRot < -Math.PI) diffRot += Math.PI * 2;
        while (diffRot > Math.PI) diffRot -= Math.PI * 2;
        this.group.rotation.y += diffRot * 0.15;

        // Update 3D Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.scale.multiplyScalar(0.98);
            p.mesh.rotation.y += delta * 3;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // Blinking Logic
        if (this.blinkTimer > 3.5 && this.currentAnim !== 'sleeping') {
            const blinkProgress = (this.blinkTimer - 3.5) / 0.2;
            if (blinkProgress <= 1.0) {
                const lidScale = Math.sin(blinkProgress * Math.PI);
                this.leftEyelid.position.y = lidScale * -0.05;
                this.rightEyelid.position.y = lidScale * -0.05;
            } else {
                this.blinkTimer = 0;
                this.leftEyelid.position.y = 0;
                this.rightEyelid.position.y = 0;
            }
        }

        // Eyebrows default position
        if (this.currentAnim === 'happy' || this.currentAnim === 'talking') {
            this.leftEyebrow.rotation.z = -0.2;
            this.rightEyebrow.rotation.z = 0.2;
        } else if (this.currentAnim === 'sad') {
            this.leftEyebrow.rotation.z = 0.35;
            this.rightEyebrow.rotation.z = -0.35;
        } else {
            this.leftEyebrow.rotation.z = 0;
            this.rightEyebrow.rotation.z = 0;
        }

        // Animation Switchboard
        switch (this.currentAnim) {
            case 'idle':
                this.animateIdle();
                break;
            case 'walk':
                this.animateWalk();
                break;
            case 'talking':
                this.animateTalking();
                break;
            case 'happy':
                this.animateHappy();
                break;
            case 'sad':
                this.animateSad();
                break;
            case 'eating':
                this.animateEating();
                break;
            case 'sleeping':
                this.animateSleeping();
                break;
            case 'bathing':
                this.animateBathing();
                break;
            case 'playing':
                this.animatePlaying();
                break;
            case 'petReaction':
                this.animatePetReaction();
                break;
        }
    }

    // --- PROCEDURAL ANIMATIONS ---
    animateIdle() {
        const breathe = Math.sin(this.animTime * 2.5) * 0.025;
        this.group.position.y = this.targetPos.y + breathe;
        this.headMesh.position.y = 1.05 + Math.sin(this.animTime * 2.5) * 0.015;

        this.leftEar.rotation.z = 0.3 + Math.sin(this.animTime * 2) * 0.03;
        this.rightEar.rotation.z = -0.3 - Math.sin(this.animTime * 2) * 0.03;

        this.leftFoot.position.z = 0.15;
        this.rightFoot.position.z = 0.15;
    }

    animateWalk() {
        const walkCycle = Math.sin(this.animTime * 12);
        const bounce = Math.abs(Math.sin(this.animTime * 12)) * 0.08;

        this.group.position.y = this.targetPos.y + bounce;
        this.bodyMesh.rotation.z = walkCycle * 0.06;
        this.headMesh.rotation.z = -walkCycle * 0.05;

        this.leftFoot.position.z = 0.15 + walkCycle * 0.12;
        this.rightFoot.position.z = 0.15 - walkCycle * 0.12;

        this.leftArm.rotation.x = -walkCycle * 0.3;
        this.rightArm.rotation.x = walkCycle * 0.3;

        this.leftEar.rotation.z = 0.3 + walkCycle * 0.08;
        this.rightEar.rotation.z = -0.3 - walkCycle * 0.08;
    }

    animateTalking() {
        const talkBob = Math.sin(this.animTime * 14) * 0.12;
        this.headMesh.position.y = 1.05 + talkBob;
        this.headMesh.rotation.y = Math.sin(this.animTime * 6) * 0.12;

        this.leftEar.rotation.z = 0.3 + Math.sin(this.animTime * 10) * 0.1;
        this.rightEar.rotation.z = -0.3 - Math.sin(this.animTime * 10) * 0.1;

        if (Math.random() < 0.06) this.spawn3DParticle('star');
    }

    animateHappy() {
        const jump = Math.abs(Math.sin(this.animTime * 6)) * 0.35;
        this.group.position.y = this.targetPos.y + jump;
        this.headMesh.rotation.y = Math.sin(this.animTime * 8) * 0.15;

        this.leftEar.rotation.z = 0.3 + Math.sin(this.animTime * 12) * 0.1;
        this.rightEar.rotation.z = -0.3 - Math.sin(this.animTime * 12) * 0.1;

        if (Math.random() < 0.05) this.spawn3DParticle('star');
    }

    animateSad() {
        this.group.position.y = this.targetPos.y - 0.05;
        this.headMesh.position.y = 0.95;
        this.headMesh.rotation.x = 0.25;

        this.leftEar.rotation.z = 0.7;
        this.rightEar.rotation.z = -0.7;
    }

    animateEating() {
        const eatBob = Math.sin(this.animTime * 8) * 0.15;
        this.headMesh.position.y = 0.9 + eatBob;
        this.headMesh.rotation.x = 0.3 + eatBob * 0.5;

        this.group.position.y = this.targetPos.y + Math.abs(Math.sin(this.animTime * 4)) * 0.05;
    }

    animateSleeping() {
        this.group.position.y = this.targetPos.y + 0.1;
        this.group.rotation.x = -0.4;
        this.leftEyelid.position.y = -0.1;
        this.rightEyelid.position.y = -0.1;

        const zzzBreathe = Math.sin(this.animTime * 1.5) * 0.02;
        this.headMesh.position.y = 1.05 + zzzBreathe;

        if (Math.random() < 0.03) this.spawn3DParticle('zzz');
    }

    animateBathing() {
        const shake = Math.sin(this.animTime * 10) * 0.12;
        this.group.rotation.z = shake;
        this.group.position.y = this.targetPos.y + Math.abs(Math.sin(this.animTime * 8)) * 0.04;

        if (Math.random() < 0.08) this.spawn3DParticle('bubble');
    }

    animatePlaying() {
        const bounce = Math.abs(Math.sin(this.animTime * 7)) * 0.25;
        this.group.position.y = this.targetPos.y + bounce;
        this.group.rotation.y = this.targetRotY + Math.sin(this.animTime * 4) * 0.3;

        if (Math.random() < 0.04) this.spawn3DParticle('star');
    }

    animatePetReaction() {
        const t = this.animTime * 8;
        if (t < Math.PI * 2) {
            const squish = Math.sin(t) * 0.2;
            this.group.scale.set(1 + squish, 1 - squish, 1 + squish);
        } else {
            this.group.scale.set(1, 1, 1);
            this.setAnimation('happy');
        }
        if (Math.random() < 0.1) this.spawn3DParticle('heart');
    }
}
