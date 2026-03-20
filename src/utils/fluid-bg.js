export function initFluidBg(canvas, isTouchDevice) {
    if (!canvas || !window.THREE) {
        return () => {};
    }

    const scene = new window.THREE.Scene();
    const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new window.THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const count = isTouchDevice ? 2800 : 5000;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count * 3; index += 1) {
        positions[index] = (Math.random() - 0.5) * 40;
    }

    const geometry = new window.THREE.BufferGeometry();
    geometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));

    const material = new window.THREE.PointsMaterial({
        size: isTouchDevice ? 0.024 : 0.02,
        color: 0x7c3aed,
        transparent: true,
        opacity: 0.28,
        blending: window.THREE.AdditiveBlending
    });

    const particleSystem = new window.THREE.Points(geometry, material);
    scene.add(particleSystem);
    camera.position.z = 15;

    let frameId = 0;

    const renderFrame = () => {
        const array = geometry.attributes.position.array;
        const time = Date.now() * 0.0005;

        for (let index = 0; index < count; index += 1) {
            const i3 = index * 3;
            array[i3 + 1] += Math.sin(time + array[i3] * 0.1) * 0.01;
            array[i3] += Math.cos(time + array[i3 + 1] * 0.1) * 0.01;
        }

        geometry.attributes.position.needsUpdate = true;
        particleSystem.rotation.y += 0.0005;
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(renderFrame);
    };

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    renderFrame();

    return () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
    };
}
