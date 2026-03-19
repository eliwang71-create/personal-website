function createDetailStage() {
    let stage = document.querySelector("[data-detail-stage]");

    if (stage) {
        return stage;
    }

    stage = document.createElement("div");
    stage.className = "detail-stage";
    stage.setAttribute("data-detail-stage", "");
    stage.innerHTML = `
        <div class="detail-content" data-detail-content></div>
    `;
    document.body.appendChild(stage);
    return stage;
}

function fillDetailContent(detailRoot, item) {
    const title = item.dataset.detailTitle || "";
    const description = item.dataset.detailDescription || "";

    detailRoot.innerHTML = `
        <button class="detail-close cursor-hover" type="button" data-detail-close aria-label="关闭详情">
            <i class="ph ph-x text-xl"></i>
            <span>Close</span>
        </button>
        <div class="detail-content__inner">
            <div class="detail-content__eyebrow">Travel Detail</div>
            <h2 class="detail-content__title">${title}</h2>
            ${description ? `<p class="detail-content__description">${description}</p>` : ""}
        </div>
    `;
}

function getRect(element) {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
    };
}

export function initGalleryViewer() {
    const items = document.querySelectorAll("[data-gallery-item]");

    if (!items.length || !window.gsap) {
        return;
    }

    const stage = createDetailStage();
    const detailRoot = stage.querySelector("[data-detail-content]");
    let activeState = null;
    let isLocked = false;

    const resetPage = (sceneTargets) => {
        document.body.classList.remove("is-detail-open");
        const activeScroller = document.querySelector(".view.active");
        document.body.style.overflow = "";

        if (activeScroller) {
            activeScroller.style.overflow = "";
        }

        window.gsap.set(sceneTargets, {
            clearProps: "opacity,visibility,transform,filter,pointerEvents"
        });
    };

    const openViewer = (item, trigger) => {
        if (activeState || isLocked) {
            return;
        }

        const image = item.querySelector("[data-gallery-image]");

        if (!image) {
            return;
        }

        isLocked = true;

        const rect = getRect(image);
        const radius = window.getComputedStyle(trigger).borderRadius || "24px";
        const clone = image.cloneNode(true);
        clone.classList.add("gallery-clone");
        const activeScene = item.closest(".view");
        const sceneTargets = [document.getElementById("main-nav"), activeScene].filter(Boolean);

        fillDetailContent(detailRoot, item);
        document.body.classList.add("is-detail-open");
        document.body.style.overflow = "hidden";

        if (activeScene) {
            activeScene.style.overflow = "hidden";
        }

        window.gsap.set(stage, { autoAlpha: 1, pointerEvents: "auto" });
        window.gsap.set(detailRoot, { autoAlpha: 0, y: 34 });
        window.gsap.set(clone, {
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: radius,
            zIndex: 1,
            objectFit: "cover"
        });

        stage.prepend(clone);
        image.style.opacity = "0";

        activeState = {
            image,
            clone,
            rect,
            radius,
            expanded: false,
            sceneTargets
        };

        window.gsap.timeline({
            defaults: {
                ease: "expo.inOut"
            },
            onComplete: () => {
                activeState.expanded = true;
                isLocked = false;
            }
        })
            .to(sceneTargets, {
                autoAlpha: 0,
                scale: 0.94,
                duration: 0.56,
                ease: "power2.inOut",
                pointerEvents: "none"
            }, 0)
            .fromTo(stage, {
                backgroundColor: "rgba(0, 0, 0, 0.08)"
            }, {
                backgroundColor: "rgba(0, 0, 0, 0.42)",
                duration: 0.46,
                ease: "power2.out"
            }, 0)
            .to(clone, {
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                borderRadius: 0,
                duration: 1.18,
                force3D: true
            }, 0)
            .to(detailRoot, {
                autoAlpha: 1,
                y: 0,
                duration: 0.52,
                ease: "power3.out"
            }, 0.76);
    };

    const closeViewer = () => {
        if (!activeState || isLocked) {
            return;
        }

        isLocked = true;

        const {
            image,
            clone,
            rect,
            radius
        } = activeState;
        const sceneTargets = activeState.sceneTargets || [];

        window.gsap.timeline({
            defaults: {
                ease: "expo.inOut"
            },
            onComplete: () => {
                image.style.opacity = "";
                clone.remove();
                detailRoot.innerHTML = "";
                window.gsap.set(stage, {
                    autoAlpha: 0,
                    pointerEvents: "none",
                    clearProps: "backgroundColor"
                });
                resetPage(sceneTargets);
                activeState = null;
                isLocked = false;
            }
        })
            .to(detailRoot, {
                autoAlpha: 0,
                y: 22,
                duration: 0.22,
                ease: "power2.out"
            }, 0)
            .to(stage, {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
                duration: 0.42,
                ease: "power2.out"
            }, 0.18)
            .to(sceneTargets, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.42,
                ease: "power3.out",
                pointerEvents: "auto"
            }, 0.68)
            .to(clone, {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                borderRadius: radius,
                duration: 1.02,
                force3D: true
            }, 0.08);
    };

    items.forEach((item) => {
        const trigger = item.querySelector("[data-gallery-trigger]");

        if (!trigger) {
            return;
        }

        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            openViewer(item, trigger);
        });
    });

    stage.addEventListener("click", (event) => {
        if (event.target.closest("[data-detail-close]")) {
            closeViewer();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeViewer();
        }
    });

    window.addEventListener("resize", () => {
        if (!activeState?.expanded) {
            return;
        }

        window.gsap.set(activeState.clone, {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
        });
    });
}
