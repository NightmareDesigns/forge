/**
 * Realistic AI Avatar - Lifelike 3D Face for Video Chat
 * Uses Three.js for 3D rendering and realistic animations
 */

import * as THREE from 'three';

export class RealisticAvatar {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.isSpeaking = false;
    this.emotionState = 'neutral'; // neutral, happy, thinking, explaining
    this.blinkTimer = 0;
    this.mouthOpenAmount = 0;
    this.headRotation = { x: 0, y: 0, z: 0 };
    
    this.initThreeJS();
    this.createRealisticFace();
    this.animate();
  }

  initThreeJS() {
    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0505);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvas.width / this.canvas.height,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting for realistic appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8b4c4c, 0.3);
    fillLight.position.set(-5, 0, 5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);
  }

  createRealisticFace() {
    // Create face group
    this.faceGroup = new THREE.Group();

    // Head - realistic sphere with proper skin tone
    const headGeometry = new THREE.SphereGeometry(1, 64, 64);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0xffdbac, // Realistic skin tone
      shininess: 5,
      specular: 0x111111
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.castShadow = true;
    this.head.receiveShadow = true;
    this.faceGroup.add(this.head);

    // Eyes - realistic with iris and pupil
    this.createRealisticEyes();

    // Eyebrows
    this.createEyebrows();

    // Nose
    this.createNose();

    // Mouth with realistic lips
    this.createMouth();

    // Hair/Head covering
    this.createHair();

    // Add subtle face details
    this.addFaceDetails();

    this.scene.add(this.faceGroup);
  }

  createRealisticEyes() {
    // Eye sockets (darker areas)
    const socketGeometry = new THREE.SphereGeometry(0.18, 32, 32);
    const socketMaterial = new THREE.MeshPhongMaterial({
      color: 0xffe5d0,
      shininess: 1
    });

    // Left eye
    const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial);
    leftSocket.position.set(-0.25, 0.15, 0.85);
    this.faceGroup.add(leftSocket);

    const leftEyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 })
    );
    leftEyeWhite.position.set(-0.25, 0.15, 0.88);
    this.faceGroup.add(leftEyeWhite);

    const leftIris = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x4a90e2, shininess: 50 })
    );
    leftIris.position.set(-0.25, 0.15, 0.95);
    this.faceGroup.add(leftIris);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 })
    );
    leftPupil.position.set(-0.25, 0.15, 0.98);
    this.faceGroup.add(leftPupil);

    // Right eye (mirror of left)
    const rightSocket = leftSocket.clone();
    rightSocket.position.set(0.25, 0.15, 0.85);
    this.faceGroup.add(rightSocket);

    const rightEyeWhite = leftEyeWhite.clone();
    rightEyeWhite.position.set(0.25, 0.15, 0.88);
    this.faceGroup.add(rightEyeWhite);

    const rightIris = leftIris.clone();
    rightIris.position.set(0.25, 0.15, 0.95);
    this.faceGroup.add(rightIris);

    const rightPupil = leftPupil.clone();
    rightPupil.position.set(0.25, 0.15, 0.98);
    this.faceGroup.add(rightPupil);

    // Store for animation
    this.leftEye = { white: leftEyeWhite, iris: leftIris, pupil: leftPupil };
    this.rightEye = { white: rightEyeWhite, iris: rightIris, pupil: rightPupil };

    // Eyelids for blinking
    this.createEyelids();
  }

  createEyelids() {
    const eyelidGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 32);
    const eyelidMaterial = new THREE.MeshPhongMaterial({
      color: 0xffdbac,
      shininess: 5
    });

    this.leftUpperEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    this.leftUpperEyelid.rotation.z = Math.PI / 2;
    this.leftUpperEyelid.position.set(-0.25, 0.27, 0.88);
    this.faceGroup.add(this.leftUpperEyelid);

    this.leftLowerEyelid = this.leftUpperEyelid.clone();
    this.leftLowerEyelid.position.set(-0.25, 0.03, 0.88);
    this.faceGroup.add(this.leftLowerEyelid);

    this.rightUpperEyelid = this.leftUpperEyelid.clone();
    this.rightUpperEyelid.position.set(0.25, 0.27, 0.88);
    this.faceGroup.add(this.rightUpperEyelid);

    this.rightLowerEyelid = this.leftLowerEyelid.clone();
    this.rightLowerEyelid.position.set(0.25, 0.03, 0.88);
    this.faceGroup.add(this.rightLowerEyelid);
  }

  createEyebrows() {
    const browGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
    const browMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a3728,
      shininess: 10
    });

    this.leftBrow = new THREE.Mesh(browGeometry, browMaterial);
    this.leftBrow.position.set(-0.25, 0.4, 0.85);
    this.leftBrow.rotation.z = -0.1;
    this.faceGroup.add(this.leftBrow);

    this.rightBrow = this.leftBrow.clone();
    this.rightBrow.position.set(0.25, 0.4, 0.85);
    this.rightBrow.rotation.z = 0.1;
    this.faceGroup.add(this.rightBrow);
  }

  createNose() {
    const noseGeometry = new THREE.ConeGeometry(0.12, 0.3, 16);
    const noseMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd4a8,
      shininess: 3
    });

    this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
    this.nose.rotation.x = Math.PI / 2;
    this.nose.position.set(0, 0.05, 0.95);
    this.faceGroup.add(this.nose);

    // Nostrils
    const nostrilGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const nostrilMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a3728,
      shininess: 1
    });

    const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
    leftNostril.position.set(-0.08, -0.08, 1.0);
    this.nose.add(leftNostril);

    const rightNostril = leftNostril.clone();
    rightNostril.position.set(0.08, -0.08, 1.0);
    this.nose.add(rightNostril);
  }

  createMouth() {
    // Upper lip
    const lipGeometry = new THREE.TorusGeometry(0.25, 0.04, 16, 32, Math.PI);
    const lipMaterial = new THREE.MeshPhongMaterial({
      color: 0xcc6677,
      shininess: 20
    });

    this.upperLip = new THREE.Mesh(lipGeometry, lipMaterial);
    this.upperLip.rotation.x = Math.PI;
    this.upperLip.position.set(0, -0.25, 0.88);
    this.faceGroup.add(this.upperLip);

    // Lower lip
    this.lowerLip = this.upperLip.clone();
    this.lowerLip.rotation.x = 0;
    this.lowerLip.position.set(0, -0.33, 0.88);
    this.faceGroup.add(this.lowerLip);

    // Teeth (visible when mouth opens)
    const teethGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.1);
    const teethMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 50
    });

    this.teeth = new THREE.Mesh(teethGeometry, teethMaterial);
    this.teeth.position.set(0, -0.29, 0.82);
    this.teeth.visible = false;
    this.faceGroup.add(this.teeth);
  }

  createHair() {
    // Stylized hair/head covering
    const hairGeometry = new THREE.SphereGeometry(1.05, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hairMaterial = new THREE.MeshPhongMaterial({
      color: 0x2d1b1b,
      shininess: 30
    });

    this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
    this.hair.position.y = 0.1;
    this.faceGroup.add(this.hair);
  }

  addFaceDetails() {
    // Add subtle cheek highlights
    const cheekGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const cheekMaterial = new THREE.MeshPhongMaterial({
      color: 0xffb3c1,
      transparent: true,
      opacity: 0.3,
      shininess: 10
    });

    const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
    leftCheek.position.set(-0.4, -0.1, 0.85);
    this.faceGroup.add(leftCheek);

    const rightCheek = leftCheek.clone();
    rightCheek.position.set(0.4, -0.1, 0.85);
    this.faceGroup.add(rightCheek);
  }

  animate() {
    if (!this.renderer) return;

    const time = Date.now() / 1000;
    const FRAME_TIME = 1 / 60; // Target 60 FPS

    // Natural head movement (subtle breathing motion)
    this.faceGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
    this.faceGroup.rotation.x = Math.sin(time * 0.3) * 0.05;
    this.faceGroup.position.y = Math.sin(time * 0.8) * 0.05;

    // Realistic blinking
    this.blinkTimer += FRAME_TIME;
    if (this.blinkTimer > 3 + Math.random() * 2) {
      this.performBlink();
      this.blinkTimer = 0;
    }

    // Speaking animation - realistic lip sync
    if (this.isSpeaking) {
      this.animateSpeaking(time);
    } else {
      // Return to neutral
      this.mouthOpenAmount *= 0.9;
      this.updateMouthPosition();
    }

    // Eyebrow expressions based on emotion
    this.updateEyebrows();

    // Render scene
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(() => this.animate());
  }

  performBlink() {
    const blinkDuration = 0.1;
    const startY = 0.27;
    
    // Animate upper eyelids down
    this.animateEyelid(this.leftUpperEyelid, startY, 0.15, blinkDuration);
    this.animateEyelid(this.rightUpperEyelid, startY, 0.15, blinkDuration);

    // Animate back up after brief pause
    setTimeout(() => {
      this.animateEyelid(this.leftUpperEyelid, 0.15, startY, blinkDuration);
      this.animateEyelid(this.rightUpperEyelid, 0.15, startY, blinkDuration);
    }, blinkDuration * 1000);
  }

  animateEyelid(eyelid, fromY, toY, duration) {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      eyelid.position.y = fromY + (toY - fromY) * progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  animateSpeaking(time) {
    // Realistic mouth movement with phoneme simulation
    const speechFrequency = 8 + Math.random() * 4;
    const speechAmplitude = 0.5 + Math.random() * 0.3;
    
    this.mouthOpenAmount = Math.abs(Math.sin(time * speechFrequency)) * speechAmplitude;
    this.updateMouthPosition();

    // Slight jaw movement
    this.head.rotation.x = Math.sin(time * speechFrequency) * 0.02;

    // Eyebrow movement while speaking
    this.leftBrow.position.y = 0.4 + Math.sin(time * speechFrequency * 0.5) * 0.02;
    this.rightBrow.position.y = 0.4 + Math.sin(time * speechFrequency * 0.5) * 0.02;
  }

  updateMouthPosition() {
    // Open mouth by moving lips apart
    this.upperLip.position.y = -0.25 + this.mouthOpenAmount * 0.08;
    this.lowerLip.position.y = -0.33 - this.mouthOpenAmount * 0.12;

    // Show teeth when mouth is significantly open
    this.teeth.visible = this.mouthOpenAmount > 0.3;
    
    // Adjust lip shape when speaking
    this.upperLip.scale.set(1, 1 + this.mouthOpenAmount * 0.2, 1);
    this.lowerLip.scale.set(1, 1 + this.mouthOpenAmount * 0.2, 1);
  }

  updateEyebrows() {
    switch (this.emotionState) {
      case 'happy':
        this.leftBrow.rotation.z = -0.15;
        this.rightBrow.rotation.z = 0.15;
        this.leftBrow.position.y = 0.42;
        this.rightBrow.position.y = 0.42;
        break;
      case 'thinking':
        this.leftBrow.rotation.z = -0.2;
        this.rightBrow.rotation.z = 0.05;
        this.leftBrow.position.y = 0.43;
        this.rightBrow.position.y = 0.39;
        break;
      case 'explaining':
        this.leftBrow.rotation.z = -0.12;
        this.rightBrow.rotation.z = 0.12;
        this.leftBrow.position.y = 0.41;
        this.rightBrow.position.y = 0.41;
        break;
      default: // neutral
        this.leftBrow.rotation.z = -0.1;
        this.rightBrow.rotation.z = 0.1;
        this.leftBrow.position.y = 0.4;
        this.rightBrow.position.y = 0.4;
    }
  }

  setEmotion(emotion) {
    this.emotionState = emotion;
  }

  startSpeaking() {
    this.isSpeaking = true;
    this.setEmotion('explaining');
  }

  stopSpeaking() {
    this.isSpeaking = false;
    this.setEmotion('neutral');
  }

  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
      this.scene.clear();
    }
  }
}
