// Global variables
let scene, camera, renderer;
let helicopter, mainRotor, tailRotor, helipad;
let spotLight, ambientLight, directionalLight;
let clock = new THREE.Clock();
let mouse = new THREE.Vector2();
let isFlying = false;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let cameraRotateLeft = false, cameraRotateRight = false, cameraRotateUp = false, cameraRotateDown = false;
let velocity = new THREE.Vector3();
let lightAngle = 0;
let cameraOffset = new THREE.Vector3(0, 5, 10);
let cameraAngle = 0;
let cameraHeight = 5;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create camera with perspective projection
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    // Create scene elements
    createGround();
    createRoads();
    createTrees();
    createHelipad();
    createHelicopter();
    createLights();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    
    // Start animation loop
    animate();
}

// Create ground with enhanced grass texture
function createGround() {
    // Create terrain with varied elevation
    const terrainSize = 200;
    const terrainResolution = 128;
    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainResolution, terrainResolution);
    
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load('textures/ground.svg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(20, 20);
    
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
        map: groundTexture,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide,
        vertexColors: true
    });
    
    // Generate terrain height map and colors
    const terrainVertices = terrainGeometry.attributes.position.array;
    const colors = [];
    
    for (let i = 0; i < terrainVertices.length; i += 3) {
        // Create varied terrain with Perlin-like noise
        const x = terrainVertices[i] / terrainSize;
        const z = terrainVertices[i+2] / terrainSize;
        
        // Simple noise function for height
        const frequency = 2;
        const height = Math.sin(x * frequency) * Math.cos(z * frequency) * 2;
        
        // Higher elevation for mountains in the distance
        const distanceFromCenter = Math.sqrt(x*x + z*z);
        const mountainHeight = Math.max(0, distanceFromCenter - 0.2) * 15;
        
        // Combine height values
        terrainVertices[i+1] = height + mountainHeight;
        
        // Color based on height
        if (terrainVertices[i+1] > 10) {
            // Snow-capped mountains
            colors.push(0.9, 0.9, 0.95); // White-blue
        } else if (terrainVertices[i+1] > 5) {
            // Rocky mountains
            colors.push(0.5, 0.5, 0.5); // Gray
        } else if (terrainVertices[i+1] > 2) {
            // Hills
            colors.push(0.4, 0.55, 0.3); // Dark green
        } else if (terrainVertices[i+1] > 0.5) {
            // Grass
            colors.push(0.2, 0.6, 0.2); // Green
        } else {
            // Base ground
            colors.push(0.3, 0.7, 0.3); // Light green
        }
    }
    
    // Add colors to geometry
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Create terrain mesh
    const ground = new THREE.Mesh(terrainGeometry, terrainMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add water
    const waterGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize);
    const waterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0077be,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.2;
    scene.add(water);
    
    // Add trees and other environment elements
    addEnvironmentElements();
}

// Add trees and other environmental elements
function addEnvironmentElements() {
    // Add trees
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 50;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        createTree(x, z);
    }
    
    // Add some rocks
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 60;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        createRock(x, z);
    }
    
    // Add clouds
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * 150;
        const y = 30 + Math.random() * 20;
        const z = (Math.random() - 0.5) * 150;
        createCloud(x, y, z);
    }
}

// Create a tree
function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x2E8B57,
        roughness: 0.8,
        metalness: 0.1
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 3.5;
    foliage.castShadow = true;
    treeGroup.add(foliage);
    
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
}

// Create a rock
function createRock(x, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.5);
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.2
    });
    
    // Distort the rock geometry
    const rockVertices = rockGeometry.attributes.position.array;
    for (let i = 0; i < rockVertices.length; i += 3) {
        rockVertices[i] += (Math.random() - 0.5) * 0.3;
        rockVertices[i+1] += (Math.random() - 0.5) * 0.3;
        rockVertices[i+2] += (Math.random() - 0.5) * 0.3;
    }
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, Math.random() * 0.5, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
}

// Create a cloud
function createCloud(x, y, z) {
    const cloudGroup = new THREE.Group();
    
    // Create several spheres to form a cloud
    const numSpheres = 5 + Math.floor(Math.random() * 5);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9
    });
    
    for (let i = 0; i < numSpheres; i++) {
        const radius = 2 + Math.random() * 3;
        const cloudGeometry = new THREE.SphereGeometry(radius, 8, 8);
        const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Position each sphere slightly offset from the center
        cloudPart.position.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 5
        );
        
        cloudGroup.add(cloudPart);
    }
    
    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);
}

// Create roads around the helipad
function createRoads() {
    // Main road
    const roadGeometry = new THREE.PlaneGeometry(4, 50);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    const mainRoad = new THREE.Mesh(roadGeometry, roadMaterial);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(10, 0, 0);
    mainRoad.receiveShadow = true;
    scene.add(mainRoad);
    
    // Road markings
    const markingGeometry = new THREE.PlaneGeometry(0.3, 2);
    const markingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    
    // Add road markings
    for (let i = -20; i <= 20; i += 5) {
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(10, 0.01, i);
        scene.add(marking);
    }
    
    // Connecting road to helipad
    const connectingRoad = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 4),
        roadMaterial
    );
    connectingRoad.rotation.x = -Math.PI / 2;
    connectingRoad.position.set(5, 0, 0);
    connectingRoad.receiveShadow = true;
    scene.add(connectingRoad);
}

// Create trees and vegetation
function createTrees() {
    // Tree function
    function createTree(x, z) {
        const tree = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2E8B57,
            roughness: 0.8,
            metalness: 0.2
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 3;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        tree.add(foliage);
        
        tree.position.set(x, 0, z);
        scene.add(tree);
    }
    
    // Create a forest of trees
    for (let i = 0; i < 50; i++) {
        // Generate random positions, avoiding the center area (helipad)
        let x, z;
        do {
            x = Math.random() * 160 - 80;
            z = Math.random() * 160 - 80;
        } while (Math.sqrt(x*x + z*z) < 15); // Keep trees away from helipad
        
        createTree(x, z);
    }
    
    // Create some bushes
    function createBush(x, z) {
        const bushGeometry = new THREE.SphereGeometry(0.7, 8, 8);
        const bushMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3A5F0B,
            roughness: 0.9,
            metalness: 0.1
        });
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(x, 0.7, z);
        bush.castShadow = true;
        bush.receiveShadow = true;
        scene.add(bush);
    }
    
    // Add some bushes
    for (let i = 0; i < 30; i++) {
        let x, z;
        do {
            x = Math.random() * 100 - 50;
            z = Math.random() * 100 - 50;
        } while (Math.sqrt(x*x + z*z) < 10); // Keep bushes away from helipad
        
        createBush(x, z);
    }
}

// Create helipad
function createHelipad() {
    const textureLoader = new THREE.TextureLoader();
    const helipadTexture = textureLoader.load('textures/helipad.svg');
    
    const helipadGeometry = new THREE.CylinderGeometry(5, 5, 0.3, 32);
    const helipadMaterial = new THREE.MeshStandardMaterial({ 
        map: helipadTexture,
        roughness: 0.5,
        metalness: 0.3
    });
    
    helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
    helipad.position.y = 0;
    helipad.receiveShadow = true;
    scene.add(helipad);
    
    // Add helipad lights
    const lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    
    // Create lights around the helipad
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.sin(angle) * 5.5;
        const z = Math.cos(angle) * 5.5;
        
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(x, 0.2, z);
        scene.add(light);
        
        // Add point light for each helipad light
        const pointLight = new THREE.PointLight(0xFFFF00, 0.5, 5);
        pointLight.position.set(x, 0.3, z);
        scene.add(pointLight);
    }
}

// Create helicopter
function createHelicopter() {
    const textureLoader = new THREE.TextureLoader();
    const bodyTexture = textureLoader.load('textures/helicopter_body.svg');
    const rotorTexture = textureLoader.load('textures/helicopter_rotor.svg');
    
    helicopter = new THREE.Group();
    
    // Create custom shader material for the helicopter body
    const customBodyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture1: { value: bodyTexture },
            time: { value: 0.0 }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });
    
    // Create more realistic military attack helicopter body
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080, // Light gray
        roughness: 0.6,
        metalness: 0.8
    });
    
    // Main body (fuselage)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
    bodyGeometry.translate(0, 0, 0.5); // Shift center for better proportions
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    helicopter.add(body);
    
    // Nose section (more pointed like attack helicopter)
    const noseGeometry = new THREE.ConeGeometry(0.8, 2, 8);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.position.set(0, 0, -2.5);
    nose.rotation.x = -Math.PI / 2;
    nose.castShadow = true;
    helicopter.add(nose);
    
    // Cockpit (more angular like reference image)
    const cockpitMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.9
    });
    
    // Main cockpit canopy
    const cockpitGeometry = new THREE.SphereGeometry(0.9, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    cockpitGeometry.scale(1.2, 0.8, 1.5); // Make it more oval and elongated
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.4, -1.2);
    cockpit.rotation.x = -Math.PI / 2;
    cockpit.castShadow = true;
    helicopter.add(cockpit);
    
    // Engine housing on top
    const engineHousingGeometry = new THREE.BoxGeometry(1.2, 0.6, 2);
    const engineHousing = new THREE.Mesh(engineHousingGeometry, bodyMaterial);
    engineHousing.position.set(0, 1, 0);
    engineHousing.castShadow = true;
    helicopter.add(engineHousing);
    
    // Create main rotor base
    const rotorBaseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
    const rotorBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const rotorBase = new THREE.Mesh(rotorBaseGeometry, rotorBaseMaterial);
    rotorBase.position.y = 1.5;
    helicopter.add(rotorBase);
    
    // Create main rotor (4 blades like reference image)
    mainRotor = new THREE.Group();
    const rotorGeometry = new THREE.BoxGeometry(0.2, 0.05, 6);
    const rotorMaterial = new THREE.MeshStandardMaterial({ 
        map: rotorTexture,
        roughness: 0.5,
        metalness: 0.5
    });
    
    // Create 4 rotor blades
    for (let i = 0; i < 4; i++) {
        const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
        rotor.rotation.y = (i * Math.PI / 2);
        rotor.castShadow = true;
        mainRotor.add(rotor);
    }
    
    mainRotor.position.y = 1.8;
    helicopter.add(mainRotor);
    
    // Create tail boom
    const tailBoomGeometry = new THREE.CylinderGeometry(0.4, 0.2, 5, 8);
    const tailBoomMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.7,
        metalness: 0.3
    });
    const tailBoom = new THREE.Mesh(tailBoomGeometry, tailBoomMaterial);
    tailBoom.position.set(0, 0.2, 3);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.castShadow = true;
    helicopter.add(tailBoom);
    
    // Tail fin (vertical stabilizer)
    const tailFinGeometry = new THREE.BoxGeometry(0.1, 1.2, 1);
    const tailFin = new THREE.Mesh(tailFinGeometry, bodyMaterial);
    tailFin.position.set(0, 0.8, 5);
    tailFin.castShadow = true;
    helicopter.add(tailFin);
    
    // Horizontal stabilizers
    const hStabGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.6);
    const hStab = new THREE.Mesh(hStabGeometry, bodyMaterial);
    hStab.position.set(0, 0.2, 5);
    hStab.castShadow = true;
    helicopter.add(hStab);
    
    // Create tail rotor
    tailRotor = new THREE.Group();
    const tailRotorGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.2);
    const tailRotorMaterial = new THREE.MeshStandardMaterial({ 
        map: rotorTexture,
        roughness: 0.5,
        metalness: 0.5
    });
    
    // Create 4 tail rotor blades
    for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(tailRotorGeometry, tailRotorMaterial);
        blade.rotation.z = (i * Math.PI / 2);
        blade.castShadow = true;
        tailRotor.add(blade);
    }
    
    tailRotor.position.set(0.5, 1.2, 5.5);
    tailRotor.rotation.y = Math.PI / 2;
    helicopter.add(tailRotor);
    
    // Add weapons/details to make it look like an attack helicopter
    // Stub wings with weapons
    const wingGeometry = new THREE.BoxGeometry(4, 0.1, 0.6);
    const wing = new THREE.Mesh(wingGeometry, bodyMaterial);
    wing.position.set(0, -0.2, 0);
    wing.castShadow = true;
    helicopter.add(wing);
    
    // Weapon pods on wings
    const podGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    
    const leftPod = new THREE.Mesh(podGeometry, bodyMaterial);
    leftPod.position.set(1.5, -0.3, 0);
    leftPod.rotation.z = Math.PI / 2;
    leftPod.castShadow = true;
    helicopter.add(leftPod);
    
    const rightPod = new THREE.Mesh(podGeometry, bodyMaterial);
    rightPod.position.set(-1.5, -0.3, 0);
    rightPod.rotation.z = Math.PI / 2;
    rightPod.castShadow = true;
    helicopter.add(rightPod);
    
    // Create landing gear (wheels instead of skids for military look)
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    // Front wheel
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.position.set(0, -1.2, -1.5);
    frontWheel.rotation.x = Math.PI / 2;
    frontWheel.castShadow = true;
    helicopter.add(frontWheel);
    
    // Rear wheels
    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.position.set(1, -1.2, 1);
    leftWheel.rotation.x = Math.PI / 2;
    leftWheel.castShadow = true;
    helicopter.add(leftWheel);
    
    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.position.set(-1, -1.2, 1);
    rightWheel.rotation.x = Math.PI / 2;
    rightWheel.castShadow = true;
    helicopter.add(rightWheel);
    
    // Wheel struts
    const strutGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const strutMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    const frontStrut = new THREE.Mesh(strutGeometry, strutMaterial);
    frontStrut.position.set(0, -0.7, -1.5);
    frontStrut.castShadow = true;
    helicopter.add(frontStrut);
    
    const leftStrut = new THREE.Mesh(strutGeometry, strutMaterial);
    leftStrut.position.set(1, -0.7, 1);
    leftStrut.castShadow = true;
    helicopter.add(leftStrut);
    
    const rightStrut = new THREE.Mesh(strutGeometry, strutMaterial);
    rightStrut.position.set(-1, -0.7, 1);
    rightStrut.castShadow = true;
    helicopter.add(rightStrut);
    
    // Position helicopter on helipad
    helicopter.position.y = 1.5;
    scene.add(helicopter);
}

// Create lights
function createLights() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun)
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Spotlight (follows mouse)
    spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 10, 5);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);
    
    // Target for spotlight
    spotLight.target = helicopter;
    
    // Add fog for atmosphere
    scene.fog = new THREE.FogExp2(0xCCCCFF, 0.005);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse movement
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update light position based on mouse movement
    lightAngle = mouse.x * Math.PI;
}

// Handle keyboard input (keydown)
function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            isFlying = !isFlying;
            break;
        case 'ArrowUp':
            moveForward = true;
            break;
        case 'ArrowDown':
            moveBackward = true;
            break;
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'ArrowRight':
            moveRight = true;
            break;
        // Camera rotation controls
        case 'KeyW':
            cameraRotateUp = true;
            break;
        case 'KeyS':
            cameraRotateDown = true;
            break;
        case 'KeyA':
            cameraRotateLeft = true;
            break;
        case 'KeyD':
            cameraRotateRight = true;
            break;
    }
}

// Handle keyboard input (keyup)
function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
            moveForward = false;
            break;
        case 'ArrowDown':
            moveBackward = false;
            break;
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'ArrowRight':
            moveRight = false;
            break;
        // Camera rotation controls
        case 'KeyW':
            cameraRotateUp = false;
            break;
        case 'KeyS':
            cameraRotateDown = false;
            break;
        case 'KeyA':
            cameraRotateLeft = false;
            break;
        case 'KeyD':
            cameraRotateRight = false;
            break;
    }
}

// Update helicopter position and camera based on keyboard input
function updateHelicopterPosition(delta) {
    // Update camera position based on W/A/S/D keys
    const cameraRotationSpeed = 1.5;
    const cameraHeightSpeed = 2.0;
    
    if (cameraRotateLeft) cameraAngle += cameraRotationSpeed * delta;
    if (cameraRotateRight) cameraAngle -= cameraRotationSpeed * delta;
    if (cameraRotateUp) cameraHeight = Math.min(15, cameraHeight + cameraHeightSpeed * delta);
    if (cameraRotateDown) cameraHeight = Math.max(2, cameraHeight - cameraHeightSpeed * delta);
    
    if (!isFlying) {
        // Update camera position even when not flying
        updateCameraPosition();
        return;
    }
    
    // Calculate velocity based on input
    velocity.x = 0;
    velocity.y = 0;
    velocity.z = 0;
    
    const speed = 5.0;
    
    if (moveForward) velocity.z -= speed * delta;
    if (moveBackward) velocity.z += speed * delta;
    if (moveLeft) velocity.x -= speed * delta;
    if (moveRight) velocity.x += speed * delta;
    
    // Apply velocity to helicopter position
    helicopter.position.x += velocity.x;
    helicopter.position.z += velocity.z;
    
    // Update camera position to follow helicopter
    updateCameraPosition();
}

// Update camera position based on current angle and helicopter position
function updateCameraPosition() {
    const radius = 10;
    cameraOffset.x = Math.sin(cameraAngle) * radius;
    cameraOffset.y = cameraHeight;
    cameraOffset.z = Math.cos(cameraAngle) * radius;
    
    camera.position.x = helicopter.position.x + cameraOffset.x;
    camera.position.y = helicopter.position.y + cameraOffset.y;
    camera.position.z = helicopter.position.z + cameraOffset.z;
    camera.lookAt(helicopter.position);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Update custom shader uniforms
    scene.traverse(function(child) {
        if (child.material && child.material.type === 'ShaderMaterial') {
            child.material.uniforms.time.value = time;
        }
    });
    
    // Rotate helicopter rotors if flying
    if (isFlying) {
        mainRotor.rotation.y += 10 * delta;
        tailRotor.rotation.x += 15 * delta;
        
        // If just started flying, move helicopter up
        if (helicopter.position.y < 10) {
            helicopter.position.y += 2 * delta;
        }
    } else {
        // Slow down rotors if not flying
        if (mainRotor.rotation.y > 0) {
            mainRotor.rotation.y += Math.max(0, 5 * delta - 0.1);
        }
        if (tailRotor.rotation.x > 0) {
            tailRotor.rotation.x += Math.max(0, 7.5 * delta - 0.15);
        }
        
        // Move helicopter down to current position when landing (not back to helipad)
        if (helicopter.position.y > 1.5) {
            helicopter.position.y -= 1 * delta;
            
            // Stop at ground level
            if (helicopter.position.y <= 1.5) {
                helicopter.position.y = 1.5;
            }
        }
    }
    
    // Update helicopter position based on keyboard input
    updateHelicopterPosition(delta);
    
    // Update spotlight position based on mouse movement
    const radius = 15;
    spotLight.position.x = Math.sin(lightAngle) * radius;
    spotLight.position.z = Math.cos(lightAngle) * radius;
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the application
window.onload = init;