const ALBUMS = {
    gongga: {
        title: "川西 · 山野行记",
        images: [
            "./assets/media/photos/chuanxi/chuanxi-01.jpg",
            "./assets/media/photos/chuanxi/chuanxi-02.jpg",
            "./assets/media/photos/chuanxi/chuanxi-03.jpg",
            "./assets/media/photos/chuanxi/chuanxi-04.jpg",
            "./assets/media/photos/chuanxi/chuanxi-05.jpg",
            "./assets/media/photos/chuanxi/chuanxi-06.jpg",
            "./assets/media/photos/chuanxi/chuanxi-07.jpg",
            "./assets/media/photos/chuanxi/chuanxi-08.jpg",
            "./assets/media/photos/chuanxi/chuanxi-09.jpg",
            "./assets/media/photos/chuanxi/chuanxi-preview-01.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-02.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-03.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-04.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-05.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-06.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-07.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-08.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-09.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-10.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-11.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-12.jpeg",
            "./assets/media/photos/chuanxi/chuanxi-preview-13.jpeg"
        ]
    },
    coast: {
        title: "厦门 · 海岸线片段",
        images: [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    city: {
        title: "上海 · 城市切面",
        images: [
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    night: {
        title: "重庆 · 夜路与光",
        images: [
            "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1600&auto=format&fit=crop"
        ]
    }
};

const VIDEO_GALLERIES = {
    chuanxiDrive: {
        title: "川西 · 自驾影像",
        videos: [
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-01.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-02.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-02.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-03.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-03.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-05.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-04.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-06.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-05.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-07.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-06.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-08.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-07.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-02.jpg" },
            { src: "./assets/media/videos/chuanxi-drive/chuanxi-drive-08.mov", poster: "./assets/media/posters/chuanxi-drive/chuanxi-drive-03.jpg" }
        ]
    }
};

const VIEW_IDS = ["home", "about", "projects", "media", "links", "contact"];
const TRACKING_ENDPOINT =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:3000/api/track-visit"
        : "/api/track-visit";

const isTouchDevice =
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

let particleSystem = null;
let activePageId = "home";
let isAnimating = false;
let lastTrackedPath = "";

let currentAlbumKey = null;
let currentIndex = 0;
let activeAlbumView = null;

let currentVideoGalleryKey = null;
let currentVideoIndex = 0;
let activeVideoView = null;

function isOverlayOpen(id) {
    const element = document.getElementById(id);
    return !!element && element.style.display === "flex";
}

function syncActiveViewOverflow() {
    const activeView = document.getElementById(activePageId);
    if (!activeView) {
        return;
    }

    const shouldLock =
        document.body.classList.contains("menu-open") ||
        isOverlayOpen("photo-overlay") ||
        isOverlayOpen("video-overlay");

    activeView.style.overflow = shouldLock ? "hidden" : "";
}

function setActiveNav(viewId) {
    document.querySelectorAll("[data-scene-link]").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.sceneLink === viewId);
    });
}

function buildTrackedPath(viewId = activePageId) {
    return `/#${viewId}`;
}

function trackVisit(path = buildTrackedPath()) {
    if (!TRACKING_ENDPOINT || path === lastTrackedPath) {
        return;
    }

    lastTrackedPath = path;

    window.fetch(TRACKING_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            path,
            referer: document.referrer || ""
        })
    }).catch(() => {
        // Ignore local tracking failures in the UI.
    });
}

function openMobileNav() {
    const drawer = document.getElementById("mobile-nav-drawer");
    const toggle = document.getElementById("mobile-nav-toggle");

    if (!drawer || !toggle) {
        return;
    }

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    syncActiveViewOverflow();
}

function closeMobileNav() {
    const drawer = document.getElementById("mobile-nav-drawer");
    const toggle = document.getElementById("mobile-nav-toggle");

    if (!drawer || !toggle) {
        return;
    }

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    syncActiveViewOverflow();
}

function initMobileNav() {
    const toggle = document.getElementById("mobile-nav-toggle");
    const drawer = document.getElementById("mobile-nav-drawer");
    const backdrop = drawer?.querySelector("[data-mobile-close]");

    if (!toggle || !drawer || !backdrop) {
        return;
    }

    toggle.addEventListener("click", () => {
        if (drawer.classList.contains("is-open")) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    });

    backdrop.addEventListener("click", closeMobileNav);
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

    return particleSystem;
}

function initCursor() {
    const cursor = document.getElementById("cursor");

    if (!cursor || !window.gsap || isTouchDevice) {
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
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });

    document.querySelectorAll(".cursor-hover").forEach((item) => {
        item.addEventListener("mouseenter", () => {
            window.gsap.to(cursor, { scale: 6, duration: 0.3 });
        });

        item.addEventListener("mouseleave", () => {
            window.gsap.to(cursor, { scale: 1, duration: 0.3 });
        });
    });
}

function handleAlbumKeydown(event, key) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAlbum(key, event);
    }
}

function handleVideoKeydown(event, key, startIndex) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openVideoGallery(key, startIndex, event);
    }
}

function updatePhotoUI(isInitial, direction = 1) {
    const album = ALBUMS[currentAlbumKey];
    const image = document.getElementById("full-photo");

    if (!album || !image) {
        return;
    }

    image.src = album.images[currentIndex];
    document.getElementById("photo-caption").innerText = album.title;
    document.getElementById("photo-index").innerText =
        `${String(currentIndex + 1).padStart(2, "0")} / ${String(album.images.length).padStart(2, "0")}`;

    window.gsap.killTweensOf(image);
    window.gsap.set(image, { x: 0, opacity: 1, scale: 1 });

    const fromX = isInitial ? 0 : (direction >= 0 ? 30 : -30);
    const fromScale = isInitial ? 0.88 : 1;

    window.gsap.fromTo(
        image,
        { x: fromX, scale: fromScale, opacity: 0 },
        {
            x: 0,
            scale: 1,
            opacity: 1,
            duration: isInitial ? 0.6 : 0.4,
            ease: isInitial ? "expo.out" : "power2.out"
        }
    );
}

function openAlbum(key, event) {
    if (event) {
        event.stopPropagation();
    }

    const album = ALBUMS[key];
    const overlay = document.getElementById("photo-overlay");

    if (!album || !overlay) {
        return;
    }

    closeVideo();

    currentAlbumKey = key;
    currentIndex = 0;
    activeAlbumView = document.getElementById(activePageId);

    overlay.style.display = "flex";
    window.gsap.set(overlay, { opacity: 0 });
    updatePhotoUI(true, 1);
    syncActiveViewOverflow();
    window.gsap.to(overlay, { opacity: 1, duration: 0.5, ease: "power2.out" });
}

function changePhoto(direction, event) {
    if (event) {
        event.stopPropagation();
    }

    const album = ALBUMS[currentAlbumKey];
    if (!album) {
        return;
    }

    currentIndex = (currentIndex + direction + album.images.length) % album.images.length;
    updatePhotoUI(false, direction);
}

function closePhoto(event) {
    if (event) {
        event.stopPropagation();
    }

    const overlay = document.getElementById("photo-overlay");
    const image = document.getElementById("full-photo");

    if (!overlay || overlay.style.display !== "flex") {
        return;
    }

    window.gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
            overlay.style.display = "none";
            if (image) {
                window.gsap.set(image, { x: 0, opacity: 1, scale: 1 });
            }
            activeAlbumView = null;
            syncActiveViewOverflow();
        }
    });
}

function updateVideoUI(isInitial, direction = 1) {
    const gallery = VIDEO_GALLERIES[currentVideoGalleryKey];
    const stage = document.querySelector(".video-overlay__stage");
    const video = document.getElementById("full-video");

    if (!gallery || !stage || !video) {
        return;
    }

    const currentVideo = gallery.videos[currentVideoIndex];
    document.getElementById("video-caption").innerText = gallery.title;
    document.getElementById("video-index").innerText =
        `${String(currentVideoIndex + 1).padStart(2, "0")} / ${String(gallery.videos.length).padStart(2, "0")}`;

    window.gsap.killTweensOf(stage);
    window.gsap.set(stage, { x: 0, opacity: 1, scale: 1 });

    video.pause();
    video.src = currentVideo.src;
    video.poster = currentVideo.poster || "";
    video.load();

    const fromX = isInitial ? 0 : (direction >= 0 ? 36 : -36);
    const fromScale = isInitial ? 0.92 : 1;

    window.gsap.fromTo(
        stage,
        { x: fromX, scale: fromScale, opacity: 0 },
        {
            x: 0,
            scale: 1,
            opacity: 1,
            duration: isInitial ? 0.6 : 0.42,
            ease: isInitial ? "expo.out" : "power2.out",
            onComplete: () => {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {});
                }
            }
        }
    );
}

function openVideoGallery(key, startIndex = 0, event) {
    if (event) {
        event.stopPropagation();
    }

    const gallery = VIDEO_GALLERIES[key];
    const overlay = document.getElementById("video-overlay");

    if (!gallery || !overlay) {
        return;
    }

    closePhoto();

    currentVideoGalleryKey = key;
    currentVideoIndex = Math.max(0, Math.min(startIndex, gallery.videos.length - 1));
    activeVideoView = document.getElementById(activePageId);

    overlay.style.display = "flex";
    window.gsap.set(overlay, { opacity: 0 });
    updateVideoUI(true, 1);
    syncActiveViewOverflow();
    window.gsap.to(overlay, { opacity: 1, duration: 0.5, ease: "power2.out" });
}

function changeVideo(direction, event) {
    if (event) {
        event.stopPropagation();
    }

    const gallery = VIDEO_GALLERIES[currentVideoGalleryKey];
    if (!gallery) {
        return;
    }

    currentVideoIndex = (currentVideoIndex + direction + gallery.videos.length) % gallery.videos.length;
    updateVideoUI(false, direction);
}

function closeVideo(event) {
    if (event) {
        event.stopPropagation();
    }

    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("full-video");
    const stage = document.querySelector(".video-overlay__stage");

    if (!overlay || overlay.style.display !== "flex") {
        return;
    }

    window.gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
            overlay.style.display = "none";
            if (video) {
                video.pause();
                video.removeAttribute("src");
                video.load();
            }
            if (stage) {
                window.gsap.set(stage, { x: 0, opacity: 1, scale: 1 });
            }
            activeVideoView = null;
            syncActiveViewOverflow();
        }
    });
}

function initSwipeSurface({ surface, target, isOpen, onChange }) {
    if (!surface || !target || !window.PointerEvent) {
        return;
    }

    const state = {
        active: false,
        dragging: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        deltaX: 0,
        deltaY: 0
    };

    const reset = () => {
        window.gsap.to(target, {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 0.25,
            ease: "power2.out"
        });
    };

    const release = () => {
        state.active = false;
        state.dragging = false;
        state.pointerId = null;
        state.startX = 0;
        state.startY = 0;
        state.deltaX = 0;
        state.deltaY = 0;
    };

    surface.addEventListener("pointerdown", (event) => {
        if (!isTouchDevice || !isOpen() || event.pointerType === "mouse") {
            return;
        }

        state.active = true;
        state.dragging = false;
        state.pointerId = event.pointerId;
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.deltaX = 0;
        state.deltaY = 0;

        if (surface.setPointerCapture) {
            try {
                surface.setPointerCapture(event.pointerId);
            } catch (error) {
                // noop
            }
        }
    });

    surface.addEventListener("pointermove", (event) => {
        if (!state.active || event.pointerId !== state.pointerId) {
            return;
        }

        state.deltaX = event.clientX - state.startX;
        state.deltaY = event.clientY - state.startY;

        if (!state.dragging) {
            if (Math.abs(state.deltaX) < 10 && Math.abs(state.deltaY) < 10) {
                return;
            }

            if (Math.abs(state.deltaX) <= Math.abs(state.deltaY)) {
                release();
                return;
            }

            state.dragging = true;
        }

        event.preventDefault();

        const progress = Math.min(Math.abs(state.deltaX) / (window.innerWidth * 0.65), 1);
        window.gsap.set(target, {
            x: state.deltaX,
            opacity: 1 - progress * 0.28,
            scale: 1 - progress * 0.04
        });
    });

    const finalize = () => {
        if (!state.active) {
            return;
        }

        const threshold = window.innerWidth * 0.2;
        const shouldChange = state.dragging && Math.abs(state.deltaX) > threshold;
        const direction = state.deltaX < 0 ? 1 : -1;

        if (shouldChange) {
            const exitX = direction === 1 ? -window.innerWidth * 0.3 : window.innerWidth * 0.3;

            window.gsap.to(target, {
                x: exitX,
                opacity: 0,
                scale: 0.96,
                duration: 0.18,
                ease: "power2.in",
                onComplete: () => {
                    window.gsap.set(target, { x: 0, opacity: 1, scale: 1 });
                    onChange(direction);
                }
            });
        } else if (state.dragging) {
            reset();
        }

        release();
    };

    surface.addEventListener("pointerup", finalize);
    surface.addEventListener("pointercancel", () => {
        if (state.dragging) {
            reset();
        }
        release();
    });
}

function initPhotoSwipe() {
    initSwipeSurface({
        surface: document.getElementById("full-photo"),
        target: document.getElementById("full-photo"),
        isOpen: () => isOverlayOpen("photo-overlay"),
        onChange: (direction) => changePhoto(direction)
    });
}

function initVideoSwipe() {
    initSwipeSurface({
        surface: document.querySelector(".video-overlay__stage"),
        target: document.querySelector(".video-overlay__stage"),
        isOpen: () => isOverlayOpen("video-overlay"),
        onChange: (direction) => changeVideo(direction)
    });
}

function switchView(targetId, transWord = "VOID") {
    if (!VIEW_IDS.includes(targetId)) {
        return;
    }

    if (targetId === activePageId || isAnimating) {
        closeMobileNav();
        return;
    }

    isAnimating = true;
    closeMobileNav();
    closePhoto();
    closeVideo();

    const current = document.getElementById(activePageId);
    const next = document.getElementById(targetId);
    const transWordEl = document.querySelector(".trans-word");

    if (!current || !next || !transWordEl) {
        isAnimating = false;
        return;
    }

    next.scrollTop = 0;
    next.classList.add("active");
    transWordEl.innerText = transWord;

    const timeline = window.gsap.timeline({
        onComplete: () => {
            current.classList.remove("active");
            current.style.display = "none";
            activePageId = targetId;
            isAnimating = false;
            setActiveNav(targetId);
            syncActiveViewOverflow();
            trackVisit(buildTrackedPath(targetId));
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

    timeline.fromTo(
        transWordEl,
        { opacity: 0, letterSpacing: "10em", filter: "blur(20px)", scale: 2 },
        { opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)", scale: 1, duration: 1.2, ease: "power4.out" },
        "-=1.2"
    );

    timeline.to(
        transWordEl,
        { opacity: 0, scale: 0.5, filter: "blur(10px)", duration: 0.8, ease: "power4.in" },
        "-=0.2"
    );

    timeline.set(
        next,
        {
            display: "block",
            opacity: 0,
            scale: 1.2,
            filter: "blur(20px)",
            y: 50
        },
        "-=0.8"
    );

    timeline.to(
        next,
        {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 1.8,
            ease: "expo.out"
        },
        "-=0.8"
    );

    if (particleSystem) {
        timeline.to(particleSystem.rotation, { z: "+=0.5", duration: 2, ease: "power2.inOut" }, 0);
        timeline.to(particleSystem.material, { opacity: 0.8, duration: 1, yoyo: true, repeat: 1 }, 0);
    }
}

function startOpening(points) {
    const timeline = window.gsap.timeline();

    window.gsap.set("#home", { opacity: 1 });
    window.gsap.set("#main-nav", { opacity: 0, y: -18 });
    window.gsap.set("#loader-text", { opacity: 0, y: 16 });

    if (points) {
        window.gsap.set(points.material, { opacity: 0 });
        window.gsap.set(points.scale, { x: 0.82, y: 0.82, z: 0.82 });
    }

    timeline.to(".loader-bar", { width: "100%", duration: 2.5, ease: "power2.inOut" });
    timeline.to("#loader-text", { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, 0.35);
    timeline.to(
        "#loader",
        {
            opacity: 0,
            duration: 1.35,
            ease: "power2.inOut",
            onComplete: () => {
                const loader = document.getElementById("loader");
                if (loader) {
                    loader.style.display = "none";
                }
            }
        },
        "+=0.25"
    );

    if (points) {
        timeline.to(points.material, { opacity: 0.3, duration: 2.8, ease: "power2.out" }, "-=1.15");
        timeline.to(points.scale, { x: 1, y: 1, z: 1, duration: 2.6, ease: "expo.out" }, "-=1.35");
    }

    timeline.to("#main-nav", { opacity: 1, y: 0, duration: 1.7, ease: "power2.out" }, "-=1.45");
    timeline.to(".hero-line", { y: 0, duration: 1.9, stagger: 0.18, ease: "expo.out" }, "-=1.45");
    timeline.to(".hero-desc", { opacity: 1, y: 0, duration: 1.2, stagger: 0.18, ease: "power2.out" }, "-=1.05");
}

function initKeybindings() {
    document.addEventListener("keydown", (event) => {
        if (isOverlayOpen("video-overlay")) {
            if (event.key === "ArrowRight") changeVideo(1);
            if (event.key === "ArrowLeft") changeVideo(-1);
            if (event.key === "Escape") closeVideo();
            return;
        }

        if (isOverlayOpen("photo-overlay")) {
            if (event.key === "ArrowRight") changePhoto(1);
            if (event.key === "ArrowLeft") changePhoto(-1);
            if (event.key === "Escape") closePhoto();
            return;
        }

        if (event.key === "Escape") {
            closeMobileNav();
        }
    });
}

function bootstrap() {
    if (isTouchDevice) {
        document.body.classList.add("is-touch");
    }

    const activeView = document.querySelector(".view.active");
    activePageId = activeView?.id || "home";
    setActiveNav(activePageId);
    initMobileNav();
    initCursor();
    initPhotoSwipe();
    initVideoSwipe();
    initKeybindings();
    syncActiveViewOverflow();
    trackVisit(buildTrackedPath(activePageId));

    const points = initFluidBg();
    startOpening(points);
}

window.openAlbum = openAlbum;
window.changePhoto = changePhoto;
window.closePhoto = closePhoto;
window.handleAlbumKeydown = handleAlbumKeydown;
window.openVideoGallery = openVideoGallery;
window.changeVideo = changeVideo;
window.closeVideo = closeVideo;
window.handleVideoKeydown = handleVideoKeydown;
window.switchView = switchView;
window.openMobileNav = openMobileNav;
window.closeMobileNav = closeMobileNav;

window.addEventListener("load", bootstrap);
