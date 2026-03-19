export function initLabScene() {
    const canvas = document.querySelector("[data-lab-scene]");

    if (!canvas || !window.THREE) {
        return;
    }

    const wrapper = canvas.closest(".lab-visual");
    const scene = new window.THREE.Scene();
    const camera = new window.THREE.PerspectiveCamera(52, 1, 0.1, 1000);
    const renderer = new window.THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));

    const group = new window.THREE.Group();
    scene.add(group);

    const geometry = new window.THREE.TorusKnotGeometry(1.08, 0.28, 160, 24);
    const material = new window.THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6,
        emissive: 0x0f172a,
        metalness: 0.22,
        roughness: 0.12,
        transmission: 0.3,
        transparent: true,
        opacity: 0.86,
        wireframe: true
    });

    const mesh = new window.THREE.Mesh(geometry, material);
    group.add(mesh);

    const ring = new window.THREE.Mesh(
        new window.THREE.TorusGeometry(1.95, 0.012, 16, 180),
        new window.THREE.MeshBasicMaterial({
            color: 0x5eead4,
            transparent: true,
            opacity: 0.36
        })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    const pointsGeometry = new window.THREE.BufferGeometry();
    const pointCount = 180;
    const positions = new Float32Array(pointCount * 3);

    for (let index = 0; index < pointCount; index += 1) {
        const angle = (index / pointCount) * Math.PI * 2;
        positions[index * 3] = Math.cos(angle) * 2.5;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 0.5;
        positions[index * 3 + 2] = Math.sin(angle) * 2.5;
    }

    pointsGeometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));

    const points = new window.THREE.Points(
        pointsGeometry,
        new window.THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.03,
            transparent: true,
            opacity: 0.9
        })
    );
    group.add(points);

    const ambient = new window.THREE.AmbientLight(0xffffff, 0.82);
    scene.add(ambient);

    const directional = new window.THREE.DirectionalLight(0xffffff, 1.35);
    directional.position.set(2, 3, 4);
    scene.add(directional);

    camera.position.z = 4.6;

    const resize = () => {
        const bounds = wrapper.getBoundingClientRect();
        renderer.setSize(bounds.width, bounds.height);
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
    };

    resize();

    let targetRotationX = 0;
    let targetRotationY = 0;

    wrapper.addEventListener("mousemove", (event) => {
        const bounds = wrapper.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;

        targetRotationY = x * 0.8;
        targetRotationX = -y * 0.8;
    });

    wrapper.addEventListener("mouseleave", () => {
        targetRotationX = 0;
        targetRotationY = 0;
    });

    const clock = new window.THREE.Clock();
    const animate = () => {
        const time = clock.getElapsedTime();
        group.rotation.x += (targetRotationX - group.rotation.x) * 0.04;
        group.rotation.y += (targetRotationY - group.rotation.y) * 0.04;
        mesh.rotation.z += 0.005;
        ring.rotation.z -= 0.003;
        points.rotation.y = time * 0.2;
        points.rotation.x = Math.sin(time * 0.4) * 0.1;
        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("resize", resize);
}
