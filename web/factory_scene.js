import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    initFactory();
});

function initFactory() {
    const canvas = document.getElementById('factory-canvas');
    if (!canvas) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Dark background to match the workshop theme
    scene.background = new THREE.Color(0x0b0f19);
    // Add some fog for depth
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.002);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    // Isometric-ish view
    camera.position.set(100, 150, 200);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeebb, 1.5); // Warm factory light
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Spotlight for dramatic effect on the belt
    const spotLight = new THREE.SpotLight(0xffaa00, 5);
    spotLight.position.set(0, 100, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 200;
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // --- Conveyor Belt ---
    const beltWidth = 40;
    const beltLength = 1000;

    // Load Texture
    const textureLoader = new THREE.TextureLoader();
    const beltTexture = textureLoader.load('assets/conveyor_belt.png');
    beltTexture.wrapS = THREE.RepeatWrapping;
    beltTexture.wrapT = THREE.RepeatWrapping;
    beltTexture.repeat.set(1, 10); // Repeat along length
    beltTexture.rotation = Math.PI / 2; // Rotate if needed for direction

    const beltGeometry = new THREE.BoxGeometry(beltWidth, 2, beltLength);
    const beltMaterial = new THREE.MeshStandardMaterial({
        map: beltTexture,
        roughness: 0.6,
        metalness: 0.4,
        color: 0x888888
    });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.set(0, -5, 0);
    belt.receiveShadow = true;
    scene.add(belt);

    // Side Rails
    const railGeometry = new THREE.BoxGeometry(2, 5, beltLength);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    leftRail.position.set(-(beltWidth / 2 + 1), -3.5, 0);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeometry, railMaterial);
    rightRail.position.set((beltWidth / 2 + 1), -3.5, 0);
    scene.add(rightRail);

    // --- Items on Belt ---
    const items = [];
    const itemTextures = [
        'assets/toy_train.png',
        'assets/toy_bear.png',
        'assets/toy_robot.png',
        'assets/toy_gift.png'
    ];

    // Create sprites for items
    itemTextures.forEach((path, index) => {
        const map = textureLoader.load(path);
        const material = new THREE.SpriteMaterial({ map: map });
        const sprite = new THREE.Sprite(material);

        // Scale appropriately provided these are roughly square images
        sprite.scale.set(20, 20, 1);

        // Initial position spacing
        sprite.position.set(0, 7, -150 + (index * 80));

        scene.add(sprite);

        // Store for animation
        items.push({
            mesh: sprite,
            offset: index * 80,
            speed: 50 // Unit per second
        });

        // Add a shadow blob for each sprite (Sprite doesn't cast shadow well)
        const shadowGeo = new THREE.CircleGeometry(8, 32);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5
        });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -3.8; // Just above belt

        scene.add(shadow);
        items[items.length - 1].shadow = shadow;
    });

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    const beltSpeed = 0.5; // Texture offset speed

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Animate Belt Texture
        beltTexture.offset.y -= beltSpeed * delta; // Move texture

        // Animate Items
        items.forEach(item => {
            // Move item forward
            item.mesh.position.z += 80 * delta; // Match visual speed approximately

            // Loop item
            if (item.mesh.position.z > 200) {
                item.mesh.position.z = -200;
            }

            // Bobbing effect
            const time = Date.now() * 0.005;
            item.mesh.position.y = 7 + Math.sin(time + item.offset) * 1.5;

            // Sync Shadow
            if (item.shadow) {
                item.shadow.position.z = item.mesh.position.z;
                // Shadow scale pulsation
                const scale = 1 - (item.mesh.position.y - 7) * 0.1;
                item.shadow.scale.set(scale, scale, 1);
            }
        });

        renderer.render(scene, camera);
    }

    // Handle Resize
    window.addEventListener('resize', () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        renderer.setSize(width, height, false); // false prevents style update
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    animate();
}
