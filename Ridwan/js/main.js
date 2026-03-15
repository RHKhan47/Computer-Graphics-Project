// Global variables
let scene, camera, renderer, controls;
let museum, statue, painting;
let spotLight, ambientLight;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let currentPaintingTexture = 0;
let paintingTextures = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
// Mouse camera control variables
let isMouseDown = false;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create camera with perspective projection
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);
    camera.lookAt(0, 1.6, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const marbleTexture = textureLoader.load('textures/marble.jpg');
    const wallTexture = textureLoader.load('textures/wall.svg');
    const floorTexture = textureLoader.load('textures/floor.svg');
    
    // Load painting textures
    paintingTextures.push(textureLoader.load('textures/painting1.svg'));
    paintingTextures.push(textureLoader.load('textures/painting2.svg'));
    paintingTextures.push(textureLoader.load('textures/painting3.svg'));
    paintingTextures.push(textureLoader.load('textures/painting4.svg'));
    paintingTextures.push(textureLoader.load('textures/painting5.svg'));

    // Create museum room
    createMuseum(wallTexture, floorTexture);
    
    // Create statue with custom shader
    createStatue(marbleTexture);
    
    // Create painting with texture
    createPainting();
    
    // Add lights
    createLights();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('click', onClick, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    
    // Start animation loop
    animate();
}

// Create museum room
function createMuseum(wallTexture, floorTexture) {
    museum = new THREE.Group();
    
    // Repeat textures
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 4);
    
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    museum.add(floor);
    
    // Create walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        map: wallTexture,
        side: THREE.DoubleSide
    });
    
    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(20, 10);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -10;
    backWall.position.y = 5;
    backWall.receiveShadow = true;
    museum.add(backWall);
    
    // Front wall with entrance
    const frontWallLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 10),
        wallMaterial
    );
    frontWallLeft.position.set(-6, 5, 10);
    frontWallLeft.receiveShadow = true;
    museum.add(frontWallLeft);
    
    const frontWallRight = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 10),
        wallMaterial
    );
    frontWallRight.position.set(6, 5, 10);
    frontWallRight.receiveShadow = true;
    museum.add(frontWallRight);
    
    const frontWallTop = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 3),
        wallMaterial
    );
    frontWallTop.position.set(0, 8.5, 10);
    frontWallTop.receiveShadow = true;
    museum.add(frontWallTop);
    
    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(20, 10);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-10, 5, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    museum.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(20, 10);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(10, 5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    museum.add(rightWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
    const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
    ceiling.position.y = 10;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    museum.add(ceiling);
    
    scene.add(museum);
}

// Create statue with custom shader
function createStatue(marbleTexture) {
    // Load enhanced marble texture
    const textureLoader = new THREE.TextureLoader();
    const enhancedMarbleTexture = textureLoader.load('textures/marble_enhanced.svg');
    
    // Create a more detailed statue using geometries
    const pedestalGeometry = new THREE.BoxGeometry(2.2, 0.5, 2.2);
    const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.7, 32);
    const lowerTorsoGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.8, 32);
    const upperTorsoGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 32);
    const neckGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.2, 16);
    const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    
    // Arms
    const shoulderGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const upperArmGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.7, 16);
    const lowerArmGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.7, 16);
    const handGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    
    // Legs
    const hipGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const upperLegGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 16);
    const lowerLegGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 16);
    const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.4);
    
    // Create custom shader material
    const customMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture1: { value: enhancedMarbleTexture },
            time: { value: 0.0 }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: THREE.DoubleSide
    });
    
    // Create statue parts
    const pedestal = new THREE.Mesh(pedestalGeometry, customMaterial);
    pedestal.position.y = 0.25;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    
    const base = new THREE.Mesh(baseGeometry, customMaterial);
    base.position.y = 0.85;
    base.castShadow = true;
    base.receiveShadow = true;
    
    const lowerTorso = new THREE.Mesh(lowerTorsoGeometry, customMaterial);
    lowerTorso.position.y = 1.65;
    lowerTorso.castShadow = true;
    lowerTorso.receiveShadow = true;
    
    const upperTorso = new THREE.Mesh(upperTorsoGeometry, customMaterial);
    upperTorso.position.y = 2.45;
    upperTorso.castShadow = true;
    upperTorso.receiveShadow = true;
    
    const neck = new THREE.Mesh(neckGeometry, customMaterial);
    neck.position.y = 2.95;
    neck.castShadow = true;
    neck.receiveShadow = true;
    
    const head = new THREE.Mesh(headGeometry, customMaterial);
    head.position.y = 3.35;
    head.castShadow = true;
    head.receiveShadow = true;
    
    // Create left arm
    const leftShoulder = new THREE.Mesh(shoulderGeometry, customMaterial);
    leftShoulder.position.set(0.6, 2.6, 0);
    leftShoulder.castShadow = true;
    leftShoulder.receiveShadow = true;
    
    const leftUpperArm = new THREE.Mesh(upperArmGeometry, customMaterial);
    leftUpperArm.position.set(0.9, 2.3, 0);
    leftUpperArm.rotation.z = -Math.PI / 4;
    leftUpperArm.castShadow = true;
    leftUpperArm.receiveShadow = true;
    
    const leftLowerArm = new THREE.Mesh(lowerArmGeometry, customMaterial);
    leftLowerArm.position.set(1.3, 1.8, 0);
    leftLowerArm.rotation.z = -Math.PI / 6;
    leftLowerArm.castShadow = true;
    leftLowerArm.receiveShadow = true;
    
    const leftHand = new THREE.Mesh(handGeometry, customMaterial);
    leftHand.position.set(1.5, 1.4, 0);
    leftHand.castShadow = true;
    leftHand.receiveShadow = true;
    
    // Create right arm
    const rightShoulder = new THREE.Mesh(shoulderGeometry, customMaterial);
    rightShoulder.position.set(-0.6, 2.6, 0);
    rightShoulder.castShadow = true;
    rightShoulder.receiveShadow = true;
    
    const rightUpperArm = new THREE.Mesh(upperArmGeometry, customMaterial);
    rightUpperArm.position.set(-0.9, 2.3, 0);
    rightUpperArm.rotation.z = Math.PI / 4;
    rightUpperArm.castShadow = true;
    rightUpperArm.receiveShadow = true;
    
    const rightLowerArm = new THREE.Mesh(lowerArmGeometry, customMaterial);
    rightLowerArm.position.set(-1.3, 1.8, 0);
    rightLowerArm.rotation.z = Math.PI / 6;
    rightLowerArm.castShadow = true;
    rightLowerArm.receiveShadow = true;
    
    const rightHand = new THREE.Mesh(handGeometry, customMaterial);
    rightHand.position.set(-1.5, 1.4, 0);
    rightHand.castShadow = true;
    rightHand.receiveShadow = true;
    
    // Create legs
    const leftHip = new THREE.Mesh(hipGeometry, customMaterial);
    leftHip.position.set(0.3, 1.3, 0);
    leftHip.castShadow = true;
    leftHip.receiveShadow = true;
    
    const leftUpperLeg = new THREE.Mesh(upperLegGeometry, customMaterial);
    leftUpperLeg.position.set(0.3, 0.8, 0);
    leftUpperLeg.castShadow = true;
    leftUpperLeg.receiveShadow = true;
    
    const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, customMaterial);
    leftLowerLeg.position.set(0.3, 0.2, 0);
    leftLowerLeg.castShadow = true;
    leftLowerLeg.receiveShadow = true;
    
    const leftFoot = new THREE.Mesh(footGeometry, customMaterial);
    leftFoot.position.set(0.3, -0.25, 0.1);
    leftFoot.castShadow = true;
    leftFoot.receiveShadow = true;
    
    const rightHip = new THREE.Mesh(hipGeometry, customMaterial);
    rightHip.position.set(-0.3, 1.3, 0);
    rightHip.castShadow = true;
    rightHip.receiveShadow = true;
    
    const rightUpperLeg = new THREE.Mesh(upperLegGeometry, customMaterial);
    rightUpperLeg.position.set(-0.3, 0.8, 0);
    rightUpperLeg.castShadow = true;
    rightUpperLeg.receiveShadow = true;
    
    const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, customMaterial);
    rightLowerLeg.position.set(-0.3, 0.2, 0);
    rightLowerLeg.castShadow = true;
    rightLowerLeg.receiveShadow = true;
    
    const rightFoot = new THREE.Mesh(footGeometry, customMaterial);
    rightFoot.position.set(-0.3, -0.25, 0.1);
    rightFoot.castShadow = true;
    rightFoot.receiveShadow = true;
    
    // Group all parts
    statue = new THREE.Group();
    statue.add(pedestal);
    statue.add(base);
    statue.add(lowerTorso);
    statue.add(upperTorso);
    statue.add(neck);
    statue.add(head);
    
    // Add arms
    statue.add(leftShoulder);
    statue.add(leftUpperArm);
    statue.add(leftLowerArm);
    statue.add(leftHand);
    statue.add(rightShoulder);
    statue.add(rightUpperArm);
    statue.add(rightLowerArm);
    statue.add(rightHand);
    
    // Add legs
    statue.add(leftHip);
    statue.add(leftUpperLeg);
    statue.add(leftLowerLeg);
    statue.add(leftFoot);
    statue.add(rightHip);
    statue.add(rightUpperLeg);
    statue.add(rightLowerLeg);
    statue.add(rightFoot);
    
    // Position the statue
    statue.position.set(-5, 0, -5);
    
    scene.add(statue);
}

// Create paintings with textures
function createPainting() {
    // Create multiple paintings
    createSinglePainting(5, 2, -9.9, 0, "painting1");
    createSinglePainting(-5, 2, -9.9, 1, "painting2");
    createSinglePainting(-9.9, 2, -5, 2, "painting3", Math.PI/2);
    createSinglePainting(9.9, 2, 0, 3, "painting4", -Math.PI/2);
    createSinglePainting(0, 2, 9.9, 4, "painting5", Math.PI);
}

// Helper function to create a single painting
function createSinglePainting(x, y, z, textureIndex, name, rotation = 0) {
    const frameGeometry = new THREE.BoxGeometry(3.2, 2.2, 0.1);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    frame.receiveShadow = true;
    
    const canvasGeometry = new THREE.PlaneGeometry(3, 2);
    const canvasMaterial = new THREE.MeshStandardMaterial({ 
        map: paintingTextures[textureIndex],
        side: THREE.DoubleSide
    });
    const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
    canvas.position.z = 0.06;
    
    const paintingGroup = new THREE.Group();
    paintingGroup.add(frame);
    paintingGroup.add(canvas);
    
    paintingGroup.position.set(x, y, z);
    paintingGroup.rotation.y = rotation;
    paintingGroup.name = name;
    
    scene.add(paintingGroup);
    
    // Store reference to first painting for backward compatibility
    if (name === "painting1") {
        painting = paintingGroup;
    }
}

// Create lights
function createLights() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Spotlight for statue
    spotLight = new THREE.SpotLight(0xffffcc, 1.2);
    spotLight.position.set(-5, 8, -5);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.2;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.target = statue;
    scene.add(spotLight);
    
    // Directional light for general illumination
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 10, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Add point lights for paintings
    const paintingLights = [
        { position: new THREE.Vector3(5, 4, -9), color: 0xffffee },
        { position: new THREE.Vector3(-5, 4, -9), color: 0xffffee },
        { position: new THREE.Vector3(-9, 4, -5), color: 0xffffee },
        { position: new THREE.Vector3(9, 4, 0), color: 0xffffee },
        { position: new THREE.Vector3(0, 4, 9), color: 0xffffee }
    ];
    
    paintingLights.forEach(light => {
        const pointLight = new THREE.PointLight(light.color, 0.8, 10);
        pointLight.position.copy(light.position);
        pointLight.castShadow = true;
        scene.add(pointLight);
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse movement
function onMouseMove(event) {
    // Update mouse position for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update camera rotation when mouse is pressed
    if (isMouseDown) {
        mouseX = (event.clientX - windowHalfX) * 0.002;
        mouseY = (event.clientY - windowHalfY) * 0.002;
        
        targetRotationX -= mouseX;
        targetRotationY -= mouseY;
        
        // Limit vertical rotation to avoid flipping
        targetRotationY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationY));
        
        // Apply rotation to camera
        camera.rotation.y = targetRotationX;
        camera.rotation.x = targetRotationY;
    }
}

// Handle mouse down
function onMouseDown(event) {
    isMouseDown = true;
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    mouseX = (event.clientX - windowHalfX) * 0.002;
    mouseY = (event.clientY - windowHalfY) * 0.002;
}

// Handle mouse up
function onMouseUp() {
    isMouseDown = false;
}

// Handle mouse click
function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (let i = 0; i < intersects.length; i++) {
        let object = intersects[i].object;
        
        // Check if painting was clicked by traversing up to find parent with name
        while (object && object.parent) {
            if (object.name === "painting" || (object.parent && object.parent.name === "painting")) {
                // Change painting texture
                currentPaintingTexture = (currentPaintingTexture + 1) % paintingTextures.length;
                const canvasMesh = painting.children[1];
                canvasMesh.material.map = paintingTextures[currentPaintingTexture];
                canvasMesh.material.needsUpdate = true;
                break;
            }
            object = object.parent;
        }
    }
}

// Handle keyboard controls
function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false;
            break;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    
    // Update shader time uniform
    if (statue) {
        statue.children.forEach(child => {
            if (child.material && child.material.uniforms) {
                child.material.uniforms.time.value = clock.getElapsedTime();
            }
        });
    }
    
    // Animate spotlight movement
    if (spotLight) {
        const angle = clock.getElapsedTime() * 0.5;
        const radius = 2;
        spotLight.position.x = -5 + Math.sin(angle) * radius;
        spotLight.position.z = -5 + Math.cos(angle) * radius;
    }
    
    // Handle keyboard movement
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    if (moveForward || moveBackward) velocity.z -= direction.z * 20.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 20.0 * delta;
    
    // Move camera
    camera.position.x += velocity.x * delta;
    camera.position.z += velocity.z * delta;
    
    // Boundary checks to keep camera inside museum
    camera.position.x = Math.max(-9, Math.min(9, camera.position.x));
    camera.position.z = Math.max(-9, Math.min(9, camera.position.z));
    
    prevTime = time;
    
    renderer.render(scene, camera);
}

// Start the application
window.onload = init;