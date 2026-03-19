import { initGalleryViewer } from "./gallery-viewer.js";
import { initLabScene } from "./lab-scene.js";

const navItems = [
    { id: "home", word: "HOME" },
    { id: "about", word: "IDENTITY" },
    { id: "projects", word: "WORKS" },
    { id: "travel", word: "JOURNEY" },
    { id: "lab", word: "LAB" },
    { id: "contact", word: "CONNECT" }
];

let particleSystem = null;
let activePageId = "home";
let isAnimating = false;
let closeMobileNav = () => {};
let hasLabScene = false;

function getInitialViewId() {
    const hash = window.location.hash.replace("#", "").trim();
    return navItems.some((item) => item.id === hash) ? hash : "home";
}

function setActiveNav(viewId) {
    document.querySelectorAll("[data-scene-link]").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.sceneLink === viewId);
    });
}

function initMobileNav() {
    const toggle = document.querySelector("[data-mobile-toggle]");
    const panel = document.querySelector("[data-mobile-nav]");

    if (!toggle || !panel) {
        return;
    }

    closeMobileNav = () => {
        panel.classList.remove("is-open");
        document.body.classList.remove("menu-open");
    };

    toggle.addEventListener("click", () => {
        const nextState = !panel.classList.contains("is-open");
        panel.classList.toggle("is-open", nextState);
        document.body.classList.toggle("menu-open", nextState);
    });
}

function initFluidBg() {
    const canvas = document.getElementById("bg-canvas");

    if (!canvas || !window.THREE) {
        return null;
    }

    const scene = new window.THREE.Scene();
    const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new window.THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const count = window.innerWidth < 768 ? 2800 : 5000;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count * 3; index += 1) {
        positions[index] = (Math.random() - 0.5) * 40;
    }

    const geometry = new window.THREE.BufferGeometry();
    geometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));

    const material = new window.THREE.PointsMaterial({
        size: window.innerWidth < 768 ? 0.024 : 0.02,
        color: 0x7c3aed,
        transparent: true,
        opacity: 0,
        blending: window.THREE.AdditiveBlending
    });

    particleSystem = new window.THREE.Points(geometry, material);
    scene.add(particleSystem);
    camera.position.z = 15;

    const animate = () => {
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
        window.requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { material };
}

function ensureLabScene() {
    if (hasLabScene) {
        return;
    }

    initLabScene();
    hasLabScene = true;
}

function initCursor() {
    const cursor = document.getElementById("cursor");

    if (!cursor || !window.gsap) {
        return;
    }

    document.addEventListener("mousemove", (event) => {
        window.gsap.to(cursor, {
            x: event.clientX - 4,
            y: event.clientY - 4,
            duration: 0.2
        });

        document.querySelectorAll(".glow-card").forEach((card) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
        });
    });

    document.querySelectorAll(".cursor-hover").forEach((element) => {
        element.addEventListener("mouseenter", () => {
            window.gsap.to(cursor, { scale: 6, duration: 0.3 });
        });
        element.addEventListener("mouseleave", () => {
            window.gsap.to(cursor, { scale: 1, duration: 0.3 });
        });
    });
}

function switchView(targetId, transWord = "VOID", shouldPushState = true) {
    if (targetId === activePageId || isAnimating || !window.gsap) {
        return;
    }

    const current = document.getElementById(activePageId);
    const next = document.getElementById(targetId);
    const transWordEl = document.querySelector("[data-scene-transition-word]");

    if (!current || !next || !transWordEl) {
        return;
    }

    isAnimating = true;
    closeMobileNav();
    next.scrollTop = 0;

    next.classList.add("active");
    next.style.display = "block";
    transWordEl.textContent = transWord;

    const timeline = window.gsap.timeline({
        onComplete: () => {
            current.classList.remove("active");
            current.style.display = "none";
            current.style.opacity = "0";
            current.style.transform = "";
            current.style.filter = "";
            current.style.pointerEvents = "";

            activePageId = targetId;
            isAnimating = false;
            setActiveNav(targetId);

            if (targetId === "lab") {
                ensureLabScene();
            }

            if (shouldPushState) {
                window.history.pushState(
                    null,
                    "",
                    targetId === "home" ? window.location.pathname : `#${targetId}`
                );
            }
        }
    });

    timeline.to(current, {
        opacity: 0,
        scale: 0.8,
        filter: "blur(20px)",
        y: -50,
        duration: 1.5,
        ease: "expo.inOut"
    });

    timeline.fromTo(transWordEl, {
        opacity: 0,
        letterSpacing: "10em",
        filter: "blur(20px)",
        scale: 2
    }, {
        opacity: 1,
        letterSpacing: "0.2em",
        filter: "blur(0px)",
        scale: 1,
        duration: 1.2,
        ease: "power4.out"
    }, "-=1.2");

    timeline.to(transWordEl, {
        opacity: 0,
        scale: 0.5,
        filter: "blur(10px)",
        duration: 0.8,
        ease: "power4.in"
    }, "-=0.2");

    timeline.set(next, {
        display: "block",
        opacity: 0,
        scale: 1.2,
        filter: "blur(20px)",
        y: 50
    }, "-=0.8");

    timeline.to(next, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 1.8,
        ease: "expo.out"
    }, "-=0.8");

    if (particleSystem) {
        timeline.to(particleSystem.rotation, {
            z: "+=0.5",
            duration: 2,
            ease: "power2.inOut"
        }, 0);

        timeline.to(particleSystem.material, {
            opacity: 0.8,
            duration: 1,
            yoyo: true,
            repeat: 1
        }, 0);
    }
}

function bindSceneLinks() {
    document.querySelectorAll("[data-scene-link]").forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = item.dataset.sceneLink;
            const transWord = item.dataset.sceneWord || targetId.toUpperCase();
            switchView(targetId, transWord);
        });
    });

    window.addEventListener("popstate", () => {
        const targetId = getInitialViewId();

        if (targetId === activePageId) {
            return;
        }

        const meta = navItems.find((item) => item.id === targetId);
        switchView(targetId, meta?.word || targetId.toUpperCase(), false);
    });
}

function startOpening(points, initialView) {
    const nav = document.getElementById("main-nav");
    const loader = document.getElementById("loader");
    const timeline = window.gsap.timeline({
        onComplete: () => {
            if (loader) {
                loader.style.display = "none";
            }

            if (initialView !== "home") {
                document.querySelectorAll(".view").forEach((view) => {
                    const isTarget = view.id === initialView;
                    view.classList.toggle("active", isTarget);
                    view.style.display = isTarget ? "block" : "none";
                    view.style.opacity = isTarget ? "1" : "0";
                });
                activePageId = initialView;
                setActiveNav(initialView);

                if (initialView === "lab") {
                    ensureLabScene();
                }
            }
        }
    });

    timeline.to(".loader-bar, .home-loader__bar", {
        width: "100%",
        duration: 2.5,
        ease: "power2.inOut"
    });
    timeline.to("#loader-text", { opacity: 1, duration: 0.8 }, 0.5);
    timeline.to("#loader", {
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut"
    }, "+=0.3");

    if (points?.material) {
        timeline.to(points.material, { opacity: 0.3, duration: 3 }, "-=1");
    }

    if (nav) {
        timeline.to(nav, { opacity: 1, duration: 2 }, "-=1.5");
    }

    timeline.to(".hero-title-line", {
        y: 0,
        opacity: 1,
        duration: 2,
        stagger: 0.2,
        ease: "expo.out"
    }, "-=1.5");

    timeline.to(".hero-desc", {
        opacity: 1,
        y: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "power2.out"
    }, "-=1");
}

function bootstrap() {
    activePageId = getInitialViewId();
    initMobileNav();
    initCursor();
    initGalleryViewer();
    const bg = initFluidBg();
    bindSceneLinks();
    setActiveNav(activePageId);

    document.querySelectorAll(".view").forEach((view) => {
        const isHome = view.id === "home";
        view.classList.toggle("active", isHome);
        view.style.display = isHome ? "block" : "none";
        view.style.opacity = isHome ? "1" : "0";
    });

    startOpening(bg, activePageId);
}

window.switchView = switchView;

bootstrap();
