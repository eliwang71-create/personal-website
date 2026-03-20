import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, LockKeyhole, MoonStar, MoveHorizontal, SunMedium, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ALBUMS, CONTACT_TOPICS, LINKS, PROJECTS, VIDEO_GALLERIES } from "./data/site-data";
import { initFluidBg } from "./utils/fluid-bg";
import { trackVisit } from "./utils/tracking";

const VIEW_LABELS = {
    home: "HOME",
    about: "IDENTITY",
    projects: "WORKS",
    media: "GALLERY",
    links: "LINKS",
    contact: "CONTACT"
};

const VIEW_TRANSITION = {
    duration: 0.65,
    ease: [0.22, 1, 0.36, 1]
};

const THEME_TRANSITION_EASE = [0.23, 1, 0.32, 1];

const THEME_VISUALS = {
    dark: {
        background: "#09090B",
        duration: 1.2,
        bufferPeak: 0,
        bufferDuration: 0,
        bufferFrames: [0, 0]
    },
    light: {
        background: "#F1F1F1",
        duration: 2.45,
        bufferPeak: 0.14,
        bufferDuration: 2.9,
        bufferFrames: [0.02, 0.14, 0.11, 0.06, 0]
    }
};

const IS_TOUCH_DEVICE =
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;
const CURSOR_BASE_SIZE = 8;
const CURSOR_HOVER_SIZE = 48;

const PROJECT_TONE_STYLES = {
    violet: {
        accent: "#c084fc",
        accentSoft: "rgba(192, 132, 252, 0.18)",
        gradient: "linear-gradient(135deg, rgba(14, 14, 18, 0.98) 0%, rgba(75, 29, 149, 0.92) 100%)"
    },
    indigo: {
        accent: "#818cf8",
        accentSoft: "rgba(129, 140, 248, 0.18)",
        gradient: "linear-gradient(135deg, rgba(11, 14, 22, 0.98) 0%, rgba(49, 46, 129, 0.92) 100%)"
    },
    emerald: {
        accent: "#34d399",
        accentSoft: "rgba(52, 211, 153, 0.18)",
        gradient: "linear-gradient(135deg, rgba(11, 16, 15, 0.98) 0%, rgba(6, 95, 70, 0.92) 100%)"
    },
    amber: {
        accent: "#fbbf24",
        accentSoft: "rgba(251, 191, 36, 0.18)",
        gradient: "linear-gradient(135deg, rgba(20, 16, 10, 0.98) 0%, rgba(146, 64, 14, 0.92) 100%)"
    }
};

const PROJECT_SWIPE_THRESHOLD = 9000;

const PROJECT_SLIDE_VARIANTS = {
    enter: (direction) => ({
        x: direction > 0 ? 96 : -96,
        opacity: 0,
        scale: 0.985
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction) => ({
        x: direction > 0 ? -96 : 96,
        opacity: 0,
        scale: 0.985
    })
};

function getStoredTheme() {
    const currentTheme = document.documentElement.dataset.theme;

    if (currentTheme === "light" || currentTheme === "dark") {
        return currentTheme;
    }

    try {
        const storedTheme = localStorage.getItem("yw-theme");
        if (storedTheme === "light" || storedTheme === "dark") {
            return storedTheme;
        }
    } catch {
        return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function hasStoredThemePreference() {
    try {
        const storedTheme = localStorage.getItem("yw-theme");
        return storedTheme === "light" || storedTheme === "dark";
    } catch {
        return false;
    }
}

function wrapIndex(nextIndex, total) {
    return ((nextIndex % total) + total) % total;
}

function getIrisOrigin(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    return {
        x,
        y,
        radius
    };
}

function getProjectToneStyle(tone) {
    return PROJECT_TONE_STYLES[tone] || PROJECT_TONE_STYLES.violet;
}

function ProjectPreviewArtwork({ project, immersive = false }) {
    const tone = getProjectToneStyle(project.heroTone);

    return (
        <div
            className={`project-artwork ${immersive ? "project-artwork--immersive" : ""}`}
            style={{
                "--project-accent": tone.accent,
                "--project-accent-soft": tone.accentSoft,
                "--project-gradient": tone.gradient
            }}
        >
            <div className="project-artwork__noise"></div>
            <div className="project-artwork__halo"></div>
            <div className="project-artwork__grid"></div>
            <div className="project-artwork__content">
                <div className="project-artwork__eyebrow">{project.indexLabel}</div>
                <h4 className="project-artwork__title">{project.title}</h4>
                <div className="project-artwork__meta">
                    <span>{project.stack[0]}</span>
                    <span>{project.stack[1] || project.stack[0]}</span>
                    <span>{project.stack[2] || project.stack[0]}</span>
                </div>
            </div>
        </div>
    );
}

function ProjectDetailLinks({ links, interactive = true }) {
    return (
        <div className="project-links">
            {links.map((link) =>
                interactive && link.type === "external" && link.href ? (
                    <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="project-link cursor-hover">
                        <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                        <span>{link.label}</span>
                    </a>
                ) : (
                    <span key={link.label} className="project-link project-link--label">
                        <LockKeyhole size={14} strokeWidth={1.8} aria-hidden="true" />
                        <span>{link.label}</span>
                    </span>
                )
            )}
        </div>
    );
}

function ProjectsView({ onOpenProject }) {
    return (
        <div className="project-grid mb-32" aria-live="polite">
            {PROJECTS.map((project, index) => (
                <motion.button
                    key={project.key}
                    type="button"
                    className="glow-card project-card project-card--interactive cursor-hover"
                    layoutId={`project-card-${project.key}`}
                    onClick={(event) => onOpenProject(index, event)}
                >
                    <div className="project-card__content">
                        <ProjectPreviewArtwork project={project} />
                        <div className="project-card__header">
                            <div className="deco-text text-purple-400">{project.indexLabel}</div>
                            <div className="project-card__cta">
                                <span>Open Preview</span>
                                <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                            </div>
                        </div>
                        <h3 className="project-card__title">{project.title}</h3>
                        <p className="project-card__summary">{project.summary}</p>
                        <div className="project-card__tags">
                            {project.stack.slice(0, 4).map((tag) => (
                                <span key={tag} className="project-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="project-card__links">
                            <ProjectDetailLinks links={project.links} interactive={false} />
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}

function ProjectOverlay({ overlayState, onClose, onChange, onJump }) {
    const project = overlayState ? PROJECTS[overlayState.index] : null;
    const origin = overlayState?.origin;
    const direction = overlayState?.direction || 0;
    const initialClip = origin ? `circle(0px at ${origin.x}px ${origin.y}px)` : "circle(0px at 50% 50%)";
    const finalClip = origin ? `circle(${origin.radius}px at ${origin.x}px ${origin.y}px)` : "circle(150vmax at 50% 50%)";
    const shouldUseSharedLayout = Boolean(overlayState && overlayState.sourceKey === project?.key && !overlayState.hasPaginated);

    const handleDragEnd = (_event, info) => {
        const swipe = info.offset.x * info.velocity.x;

        if (swipe <= -PROJECT_SWIPE_THRESHOLD) {
            onChange(1);
            return;
        }

        if (swipe >= PROJECT_SWIPE_THRESHOLD) {
            onChange(-1);
        }
    };

    return (
        <AnimatePresence>
            {project ? (
                <motion.div
                    className="project-iris-overlay"
                    initial={{ opacity: 0, clipPath: initialClip, WebkitClipPath: initialClip }}
                    animate={{ opacity: 1, clipPath: finalClip, WebkitClipPath: finalClip }}
                    exit={{ opacity: 0, clipPath: initialClip, WebkitClipPath: initialClip }}
                    transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                    onClick={onClose}
                >
                    <div className="project-iris-overlay__backdrop"></div>
                    <div className="project-iris-shell" onClick={(event) => event.stopPropagation()}>
                        <div className="project-iris-toolbar">
                            <div className="project-iris-toolbar__meta">
                                <span className="project-iris-toolbar__mono">
                                    <MoveHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />
                                    Drag / Swipe / Arrow Keys
                                </span>
                                <span className="project-iris-toolbar__counter">
                                    {String(overlayState.index + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
                                </span>
                            </div>

                            <button type="button" className="project-iris-close cursor-hover" onClick={onClose} aria-label="关闭项目预览">
                                <X size={18} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="project-iris-stage">
                            <button
                                type="button"
                                className="project-iris-nav project-iris-nav--prev cursor-hover"
                                onClick={() => onChange(-1)}
                                aria-label="查看上一个项目"
                            >
                                <ChevronLeft size={22} strokeWidth={1.8} aria-hidden="true" />
                            </button>

                            <div className="project-iris-viewport">
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.section
                                        key={project.key}
                                        className="project-iris-slide"
                                        custom={direction}
                                        variants={PROJECT_SLIDE_VARIANTS}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 210, damping: 28, mass: 0.92 },
                                            opacity: { duration: 0.22 },
                                            scale: { duration: 0.22 }
                                        }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.18}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <motion.article
                                            className="project-iris-card"
                                            layoutId={shouldUseSharedLayout ? `project-card-${project.key}` : undefined}
                                        >
                                            <div className="project-iris-card__visual">
                                                <ProjectPreviewArtwork project={project} immersive />
                                            </div>

                                            <div className="project-iris-card__body">
                                                <div className="project-iris-card__intro">
                                                    <div className="project-iris-card__eyebrow">{project.indexLabel}</div>
                                                    <h3 className="project-iris-card__title">{project.title}</h3>
                                                    <p className="project-iris-card__summary">{project.overview}</p>
                                                </div>

                                                <div className="project-iris-card__tags">
                                                    {project.stack.map((tag) => (
                                                        <span key={tag} className="project-iris-tag">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="project-iris-card__details">
                                                    <section className="project-iris-block">
                                                        <div className="project-iris-block__label">Role</div>
                                                        <p>{project.role}</p>
                                                    </section>

                                                    <section className="project-iris-block">
                                                        <div className="project-iris-block__label">What I Did</div>
                                                        <ul className="project-iris-list">
                                                            {project.whatIDid.map((item) => (
                                                                <li key={item}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </section>

                                                    <section className="project-iris-block">
                                                        <div className="project-iris-block__label">Result</div>
                                                        <ul className="project-iris-list">
                                                            {project.result.map((item) => (
                                                                <li key={item}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </section>
                                                </div>

                                                <div className="project-iris-card__links">
                                                    <ProjectDetailLinks links={project.links} />
                                                </div>
                                            </div>
                                        </motion.article>
                                    </motion.section>
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                className="project-iris-nav project-iris-nav--next cursor-hover"
                                onClick={() => onChange(1)}
                                aria-label="查看下一个项目"
                            >
                                <ChevronRight size={22} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="project-iris-footer">
                            <div className="project-iris-footer__mono">Immersive Project Gallery</div>
                            <div className="project-iris-pagination" role="tablist" aria-label="项目切换">
                                {PROJECTS.map((item, index) => {
                                    const isActive = index === overlayState.index;

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            aria-label={`查看 ${item.title}`}
                                            className={`project-iris-indicator ${isActive ? "is-active" : ""}`}
                                            onClick={() => onJump(index)}
                                        >
                                            <span></span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function MediaView({ onOpenAlbum, onOpenVideoGallery }) {
    const albums = [ALBUMS.gongga, ALBUMS.coast, ALBUMS.city, ALBUMS.night];
    const activeGallery = VIDEO_GALLERIES.chuanxiDrive;

    return (
        <div className="max-w-7xl mx-auto px-6 pt-40">
            <div className="mb-20">
                <div className="deco-text mb-4">Media / Gallery</div>
                <h2 className="text-5xl md:text-7xl font-['Space_Grotesk'] font-bold tracking-tighter mb-6">
                    MEDIA<span className="text-purple-500">.</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                    这里集中放旅行照片和视频内容。照片负责氛围与构图，视频承接更完整的动态记录。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
                {albums.map((album, index) => (
                    <article
                        key={album.key}
                        className={`glow-card group cursor-hover p-2 album-card ${index % 2 === 1 ? "md:translate-y-16" : ""}`}
                    >
                        <motion.div layoutId={`album-card-${album.key}`}>
                            <button
                                type="button"
                                className="block w-full text-left"
                                onClick={(event) => onOpenAlbum(album.key, 0, event)}
                            >
                                <div className="relative aspect-[4/3] overflow-hidden rounded theme-adaptive-frame">
                                    <img src={album.cover} alt={album.headline} className="theme-adaptive-image theme-adaptive-image--media media-card-image w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-700"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="deco-text text-white/80 mb-2">{album.label}</div>
                                        <h3 className="text-2xl font-bold text-white">{album.headline}</h3>
                                        <p className="text-white/60 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                                            {album.excerpt}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    </article>
                ))}
            </div>

            <div className="mt-10 mb-10 deco-text">Video Clips</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
                <article className="glow-card group cursor-hover p-3 album-card">
                    <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => onOpenVideoGallery(activeGallery.key, 0)}
                    >
                        <div className="block relative aspect-video overflow-hidden rounded theme-adaptive-frame">
                            <img
                                src={activeGallery.videos[0].poster}
                                alt="川西自驾视频封面"
                                className="theme-adaptive-image theme-adaptive-image--media media-card-image w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/15 transition-colors duration-700"></div>
                            <div className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
                                <i className="ph ph-play-fill text-xl"></i>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="deco-text text-white/80 mb-2">{activeGallery.label}</div>
                                <h3 className="text-2xl font-bold text-white">{activeGallery.headline}</h3>
                                <p className="text-white/60 text-sm mt-2">{activeGallery.excerpt}</p>
                            </div>
                        </div>
                    </button>
                </article>

                <article className="glow-card group p-3">
                    <div className="block relative aspect-video overflow-hidden rounded theme-adaptive-frame">
                        <img
                            src="/assets/media/posters/chuanxi-drive/chuanxi-drive-04.jpg"
                            alt="下一组视频预留封面"
                            className="theme-adaptive-image theme-adaptive-image--media w-full h-full object-cover opacity-75 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-black/55 transition-colors duration-700"></div>
                        <div className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                            <i className="ph ph-film-slate text-xl"></i>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="deco-text text-white/70 mb-2">Video 02 / Reserved</div>
                            <h3 className="text-2xl font-bold text-white">下一组视频预留位</h3>
                            <p className="text-white/55 text-sm mt-2">这个卡片先保留给你后面要补充的另一组视频内容，当前不绑定播放逻辑。</p>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
}

function PhotoOverlay({ overlayState, onClose, onChange, onJump }) {
    const album = overlayState ? ALBUMS[overlayState.albumKey] : null;
    const imageSrc = album ? album.images[overlayState.index] : "";
    const origin = overlayState?.origin;
    const direction = overlayState?.direction || 0;
    const initialClip = origin ? `circle(0px at ${origin.x}px ${origin.y}px)` : "circle(0px at 50% 50%)";
    const finalClip = origin ? `circle(${origin.radius}px at ${origin.x}px ${origin.y}px)` : "circle(150vmax at 50% 50%)";
    const shouldUseSharedLayout = Boolean(overlayState && overlayState.sourceKey === album?.key && !overlayState.hasPaginated);

    const handleDragEnd = (_event, info) => {
        const swipe = info.offset.x * info.velocity.x;

        if (swipe <= -PROJECT_SWIPE_THRESHOLD) {
            onChange(1);
            return;
        }

        if (swipe >= PROJECT_SWIPE_THRESHOLD) {
            onChange(-1);
        }
    };

    return (
        <AnimatePresence>
            {album ? (
                <motion.div
                    className="photo-iris-overlay"
                    initial={{ opacity: 0, clipPath: initialClip, WebkitClipPath: initialClip }}
                    animate={{ opacity: 1, clipPath: finalClip, WebkitClipPath: finalClip }}
                    exit={{ opacity: 0, clipPath: initialClip, WebkitClipPath: initialClip }}
                    transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                    onClick={onClose}
                >
                    <div className="photo-iris-overlay__backdrop"></div>
                    <div className="photo-iris-shell" onClick={(event) => event.stopPropagation()}>
                        <div className="photo-iris-toolbar">
                            <div className="photo-iris-toolbar__meta">
                                <span className="photo-iris-toolbar__mono">
                                    <MoveHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />
                                    Album Internal Navigation
                                </span>
                                <span className="photo-iris-toolbar__counter">
                                    {String(overlayState.index + 1).padStart(2, "0")} / {String(album.images.length).padStart(2, "0")}
                                </span>
                            </div>

                            <button type="button" className="photo-iris-close cursor-hover" onClick={onClose} aria-label="关闭相册预览">
                                <X size={18} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="photo-iris-stage">
                            <button
                                type="button"
                                className="photo-iris-nav photo-iris-nav--prev cursor-hover"
                                onClick={() => onChange(-1)}
                                aria-label="查看上一张照片"
                            >
                                <ChevronLeft size={22} strokeWidth={1.8} aria-hidden="true" />
                            </button>

                            <div className="photo-iris-viewport">
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.section
                                        key={`${album.key}-${overlayState.index}`}
                                        className="photo-iris-slide"
                                        custom={direction}
                                        variants={PROJECT_SLIDE_VARIANTS}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 210, damping: 28, mass: 0.92 },
                                            opacity: { duration: 0.22 },
                                            scale: { duration: 0.22 }
                                        }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.18}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <motion.article
                                            className="photo-iris-card"
                                            layoutId={shouldUseSharedLayout ? `album-card-${album.key}` : undefined}
                                        >
                                            <div className="photo-iris-frame">
                                                <img src={imageSrc} alt={album.title} className="photo-iris-image theme-adaptive-image" />
                                                <div className="photo-iris-image__shade"></div>
                                                <div className="photo-iris-image__meta">
                                                    <div className="photo-iris-image__label">{album.label}</div>
                                                    <h3 className="photo-iris-image__title">{album.headline}</h3>
                                                    <p className="photo-iris-image__excerpt">{album.excerpt}</p>
                                                </div>
                                            </div>
                                        </motion.article>
                                    </motion.section>
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                className="photo-iris-nav photo-iris-nav--next cursor-hover"
                                onClick={() => onChange(1)}
                                aria-label="查看下一张照片"
                            >
                                <ChevronRight size={22} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="photo-iris-footer">
                            <div className="photo-iris-footer__mono">{album.title}</div>
                            <div className="photo-iris-pagination" role="tablist" aria-label={`${album.title} 照片切换`}>
                                {album.images.map((src, index) => {
                                    const isActive = index === overlayState.index;

                                    return (
                                        <button
                                            key={`${album.key}-${src}-${index}`}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            aria-label={`查看第 ${index + 1} 张照片`}
                                            className={`photo-iris-indicator ${isActive ? "is-active" : ""}`}
                                            onClick={() => onJump(index)}
                                        >
                                            <span></span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function VideoOverlay({ overlayState, onClose, onChange }) {
    const videoRef = useRef(null);
    const gallery = overlayState ? VIDEO_GALLERIES[overlayState.galleryKey] : null;
    const currentVideo = gallery ? gallery.videos[overlayState.index] : null;

    useEffect(() => {
        if (!currentVideo || !videoRef.current) {
            return;
        }

        const video = videoRef.current;
        video.pause();
        video.src = currentVideo.src;
        video.poster = currentVideo.poster || "";
        video.load();

        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {});
        }
    }, [currentVideo]);

    return (
        <AnimatePresence>
            {gallery && currentVideo ? (
                <motion.div
                    id="video-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    onClick={onClose}
                    style={{ display: "flex" }}
                >
                    <button className="overlay-close cursor-hover" onClick={onClose} aria-label="关闭视频">
                        ✕
                    </button>
                    <button className="overlay-nav-btn overlay-nav-btn--prev cursor-hover" onClick={(event) => onChange(-1, event)} aria-label="上一个视频">
                        ←
                    </button>
                    <button className="overlay-nav-btn overlay-nav-btn--next cursor-hover" onClick={(event) => onChange(1, event)} aria-label="下一个视频">
                        →
                    </button>

                    <motion.div
                        key={currentVideo.src}
                        className="video-overlay__stage"
                        onClick={(event) => event.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.28 }}
                    >
                        <video ref={videoRef} id="full-video" controls playsInline preload="metadata" />
                    </motion.div>

                    <div className="photo-overlay__meta">
                        <div id="video-caption">{gallery.title}</div>
                        <div id="video-index">
                            {String(overlayState.index + 1).padStart(2, "0")} / {String(gallery.videos.length).padStart(2, "0")}
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function ActiveView({ activeView, onSwitchView, onOpenAlbum, onOpenVideoGallery, onOpenProject, homeEntryReady }) {
    switch (activeView) {
        case "about":
            return (
                <div className="max-w-6xl mx-auto px-6 pt-40">
                    <div className="mb-20">
                        <div className="deco-text mb-4">About Me</div>
                        <h2 className="text-5xl md:text-7xl font-['Space_Grotesk'] font-bold tracking-tighter mb-6">
                            PROFILE<span className="text-purple-500">.</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            这一页聚焦我的自我介绍、技术方向、技能栈和个人定位，让网站不只是一个视觉入口，也是一份持续更新的个人说明书。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                        <div>
                            <h3 className="text-2xl mb-4">个人简介</h3>
                            <p className="text-gray-400 leading-relaxed">
                                我是王一轩，软件开发工程师，主要围绕前端、后端和 Web 开发展开工作。除了构建页面和服务，我也在持续整理自己的项目表达、旅行记录和平台内容，希望把它们沉淀成一个真实可用的个人主页系统。
                            </p>
                        </div>
                        <div className="glow-card p-10">
                            <div className="text-4xl font-['Space_Grotesk'] text-white/10 absolute top-6 right-6 font-bold">01</div>
                            <h3 className="text-xl mb-4 relative z-10">我的工作方式</h3>
                            <p className="text-gray-400 text-sm leading-relaxed relative z-10 mb-6">
                                我比较关注结构、节奏和完整度，习惯把想法拆成可以落地的页面、模块和流程，而不是只停留在概念层。
                            </p>
                            <div className="flex gap-3 relative z-10">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-purple-300">长期主义</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-purple-300">工程化思维</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 deco-text">Skills & Stack</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
                        <div className="glow-card p-8 cursor-hover">
                            <div className="text-purple-400 mb-2">
                                <i className="ph ph-browsers text-2xl"></i>
                            </div>
                            <h3 className="text-lg mb-4">界面与交互 (Frontend)</h3>
                            <div className="flex flex-wrap gap-2">
                                {["React", "Tailwind", "GSAP", "Three.js"].map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-white/5 rounded text-xs text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="glow-card p-8 cursor-hover">
                            <div className="text-purple-400 mb-2">
                                <i className="ph ph-database text-2xl"></i>
                            </div>
                            <h3 className="text-lg mb-4">服务与数据 (Backend)</h3>
                            <div className="flex flex-wrap gap-2">
                                {["Node.js", "MySQL", "REST API"].map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-white/5 rounded text-xs text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="glow-card p-8 cursor-hover">
                            <div className="text-purple-400 mb-2">
                                <i className="ph ph-cpu text-2xl"></i>
                            </div>
                            <h3 className="text-lg mb-4">工程能力 (Engineering)</h3>
                            <div className="flex flex-wrap gap-2">
                                {["C++", "架构拆解", "性能优化"].map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-white/5 rounded text-xs text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        case "projects":
            return (
                <div className="max-w-7xl mx-auto px-6 pt-40">
                    <div className="mb-20">
                        <div className="deco-text mb-4">Featured Projects</div>
                        <h2 className="text-5xl md:text-7xl font-['Space_Grotesk'] font-bold tracking-tighter mb-6">
                            WORKS<span className="text-purple-500">.</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            这里收拢了我正在持续维护的个人站点、两类工程化项目，以及一段把需求真正推进到交付的实习实践。
                        </p>
                    </div>
                    <ProjectsView onOpenProject={onOpenProject} />
                </div>
            );
        case "media":
            return <MediaView onOpenAlbum={onOpenAlbum} onOpenVideoGallery={onOpenVideoGallery} />;
        case "links":
            return (
                <div className="max-w-7xl mx-auto px-6 pt-40">
                    <div className="mb-20">
                        <div className="deco-text mb-4">Links</div>
                        <h2 className="text-5xl md:text-7xl font-['Space_Grotesk'] font-bold tracking-tighter mb-6">
                            LINKS<span className="text-purple-500">.</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">这一页负责平台分发。项目、旅行视频和日常内容会从这里流向不同平台。</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                        {LINKS.map((link) => (
                            <a key={link.title} href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className="glow-card cursor-hover p-10 block">
                                <div className="text-purple-400 mb-4 text-2xl">
                                    <i className={`ph ${link.icon}`}></i>
                                </div>
                                <h3 className="text-2xl mb-3">{link.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{link.description}</p>
                            </a>
                        ))}
                    </div>
                </div>
            );
        case "contact":
            return (
                <div className="max-w-6xl mx-auto px-6 pt-40">
                    <div className="mb-20">
                        <div className="deco-text mb-4">Contact</div>
                        <h2 className="text-5xl md:text-7xl font-['Space_Grotesk'] font-bold tracking-tighter mb-6">
                            CONTACT<span className="text-purple-500">.</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">如果你想交流项目、合作想法或者只是想认识一下我，可以从这里开始联系。</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        <div className="glow-card p-10">
                            <div className="text-purple-400 font-['Space_Grotesk'] text-xs tracking-widest mb-4">EMAIL</div>
                            <h3 className="text-2xl mb-3">wangyx030212@163.com</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">适合正式合作、项目咨询、技术交流或内容联动。</p>
                        </div>
                        <div className="glow-card p-10">
                            <div className="text-purple-400 font-['Space_Grotesk'] text-xs tracking-widest mb-4">STATUS</div>
                            <h3 className="text-2xl mb-3">开放交流中</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">目前更关注个人项目、网站持续迭代、旅行内容整理和 Web 开发相关方向。</p>
                        </div>
                    </div>
                    <div className="glow-card p-10 mb-32">
                        <div className="text-purple-400 font-['Space_Grotesk'] text-xs tracking-widest mb-4">TOPICS</div>
                        <h3 className="text-2xl mb-4">可以聊什么</h3>
                        <div className="flex flex-wrap gap-3">
                            {CONTACT_TOPICS.map((topic) => (
                                <span key={topic} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-purple-300">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case "home":
        default:
            return (
                <>
                    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 pt-28 md:pt-32">
                        <motion.div
                            className="deco-text mb-8 tracking-[0.6em] text-white/30"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: homeEntryReady ? 1 : 0, y: homeEntryReady ? 0 : 18 }}
                            transition={{ duration: 0.9, delay: homeEntryReady ? 0.12 : 0, ease: VIEW_TRANSITION.ease }}
                        >
                            Established 2026 / Home Edition
                        </motion.div>

                        <motion.div
                            className="title-mask"
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: homeEntryReady ? 1 : 0, y: homeEntryReady ? 0 : 60 }}
                            transition={{ duration: 1.25, delay: homeEntryReady ? 0.2 : 0, ease: [0.19, 1, 0.22, 1] }}
                        >
                            <h2 className="text-6xl md:text-[10rem] font-['Space_Grotesk'] font-bold leading-[0.8] tracking-tighter uppercase">YIXUAN</h2>
                        </motion.div>
                        <motion.div
                            className="title-mask mt-2 md:mt-4"
                            initial={{ opacity: 0, y: 70 }}
                            animate={{ opacity: homeEntryReady ? 1 : 0, y: homeEntryReady ? 0 : 70 }}
                            transition={{ duration: 1.32, delay: homeEntryReady ? 0.3 : 0, ease: [0.19, 1, 0.22, 1] }}
                        >
                            <h2 className="text-6xl md:text-[10rem] font-['Space_Grotesk'] font-bold leading-[0.8] tracking-tighter uppercase text-purple-500">WANG.</h2>
                        </motion.div>

                        <div className="mt-16 flex flex-col items-center max-w-2xl">
                            <motion.p
                                className="text-gray-400 font-light tracking-[0.2em] leading-relaxed uppercase text-[11px] md:text-xs"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: homeEntryReady ? 1 : 0, y: homeEntryReady ? 0 : 20 }}
                                transition={{ duration: 0.9, delay: homeEntryReady ? 0.72 : 0, ease: VIEW_TRANSITION.ease }}
                            >
                                Software Developer / 软件开发工程师
                            </motion.p>
                            <motion.p
                                className="mt-6 text-gray-500 font-light text-sm md:text-base leading-relaxed"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: homeEntryReady ? 1 : 0, y: homeEntryReady ? 0 : 24 }}
                                transition={{ duration: 0.95, delay: homeEntryReady ? 0.86 : 0, ease: VIEW_TRANSITION.ease }}
                            >
                                用代码构建项目，用旅行记录世界，把个人表达整理成一个持续生长的数字主页。
                            </motion.p>

                            <motion.div
                                className="mt-12 flex flex-wrap justify-center gap-6"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: homeEntryReady ? 1 : 0, y: homeEntryReady ? 0 : 24 }}
                                transition={{ duration: 0.95, delay: homeEntryReady ? 1.04 : 0, ease: VIEW_TRANSITION.ease }}
                            >
                                <button
                                    onClick={() => onSwitchView("projects", "EXPLORE")}
                                    className="cursor-hover group flex items-center gap-3 px-8 py-4 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-500"
                                >
                                    <span className="text-xs tracking-widest uppercase font-medium">查看项目</span>
                                    <i className="ph ph-arrow-up-right group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                                </button>
                                <button
                                    onClick={() => onSwitchView("media", "WANDER")}
                                    className="cursor-hover group flex items-center gap-3 px-8 py-4 border border-transparent bg-white/5 rounded-full hover:bg-white/10 transition-all duration-500"
                                >
                                    <span className="text-xs tracking-widest uppercase font-medium">Media / Gallery</span>
                                    <i className="ph ph-compass text-lg"></i>
                                </button>
                            </motion.div>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto px-6 pb-32">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-20"></div>

                        <div className="text-center mb-16">
                            <div className="deco-text mb-4">Summary</div>
                            <h3 className="text-3xl font-light">
                                我是谁，我在做什么<span className="text-purple-500">.</span>
                            </h3>
                            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-sm">
                                这里先不急着进入页面入口，而是先把我的方向、工作方式和这个站点的存在意义安静地铺开，让首屏从强视觉自然过渡到真实信息。
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <article className="glow-card cursor-hover p-10">
                                <div className="text-purple-400 font-['Space_Grotesk'] text-xs tracking-widest mb-4">IDENTITY</div>
                                <h4 className="text-xl mb-3">我是谁</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">王一轩，软件开发工程师。希望用更完整的网站结构，把项目、内容和个人路线长期整理下去。</p>
                            </article>
                            <article className="glow-card cursor-hover p-10">
                                <div className="text-purple-400 font-['Space_Grotesk'] text-xs tracking-widest mb-4">DIRECTION</div>
                                <h4 className="text-xl mb-3">我在做什么</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">持续打磨个人项目，完善 Web 开发能力，同时把旅行记录和平台内容整合到统一出口。</p>
                            </article>
                            <article className="glow-card cursor-hover p-10">
                                <div className="text-purple-400 font-['Space_Grotesk'] text-xs tracking-widest mb-4">POSITION</div>
                                <h4 className="text-xl mb-3">这个站点是什么</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">它既是个人主页，也是承接作品展示、旅行影像和平台更新的长期数字入口。</p>
                            </article>
                        </div>
                    </div>
                </>
            );
    }
}

export default function App() {
    const [theme, setTheme] = useState(getStoredTheme());
    const [activeView, setActiveView] = useState("home");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [projectOverlay, setProjectOverlay] = useState(null);
    const [photoOverlay, setPhotoOverlay] = useState(null);
    const [videoOverlay, setVideoOverlay] = useState(null);
    const [showLoader, setShowLoader] = useState(true);
    const [transitionWord, setTransitionWord] = useState("VOID");
    const [showTransitionWord, setShowTransitionWord] = useState(false);
    const [themeIntent, setThemeIntent] = useState(null);
    const [themeBuffer, setThemeBuffer] = useState(null);
    const hasExplicitThemePreferenceRef = useRef(hasStoredThemePreference());
    const themeSwitchTimeoutRef = useRef(null);
    const cursorRef = useRef(null);
    const canvasRef = useRef(null);
    const activeThemeVisual = THEME_VISUALS[theme];
    const toggleThemeState = themeIntent || theme;
    const toggleActionTheme = toggleThemeState === "dark" ? "light" : "dark";
    const toggleThemeLabel = toggleActionTheme === "light" ? "Light" : "Dark";

    const navItems = useMemo(
        () => [
            { key: "home", label: "Home" },
            { key: "about", label: "About" },
            { key: "projects", label: "Projects" },
            { key: "media", label: "Media" },
            { key: "links", label: "Links" },
            { key: "contact", label: "Contact" }
        ],
        []
    );

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.setProperty("--theme-switch-duration", `${activeThemeVisual.duration}s`);
        document.documentElement.style.setProperty("--theme-switch-ease", "cubic-bezier(0.23, 1, 0.32, 1)");

        if (hasExplicitThemePreferenceRef.current) {
            try {
                localStorage.setItem("yw-theme", theme);
            } catch {
                // Ignore storage failures.
            }
        }
        return () => undefined;
    }, [activeThemeVisual.duration, theme]);

    useEffect(() => {
        if (hasExplicitThemePreferenceRef.current) {
            return undefined;
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
        const handleChange = (event) => {
            setTheme(event.matches ? "light" : "dark");
        };

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, [theme]);

    useEffect(
        () => () => {
            if (themeSwitchTimeoutRef.current) {
                window.clearTimeout(themeSwitchTimeoutRef.current);
            }
        },
        []
    );

    useEffect(() => {
        const cleanup = initFluidBg(canvasRef.current, IS_TOUCH_DEVICE);
        return cleanup;
    }, []);

    useEffect(() => {
        if (IS_TOUCH_DEVICE) {
            document.body.classList.add("is-touch");
            return undefined;
        }

        const cursor = cursorRef.current;
        if (!cursor) {
            return undefined;
        }

        const glowCards = Array.from(document.querySelectorAll(".glow-card"));
        let pointerX = 0;
        let pointerY = 0;
        let frameId = 0;
        let cursorSize = CURSOR_BASE_SIZE;

        const moveCursor = (duration = 0.2) => {
            const nextX = pointerX - cursorSize / 2;
            const nextY = pointerY - cursorSize / 2;

            if (window.gsap) {
                window.gsap.to(cursor, {
                    x: nextX,
                    y: nextY,
                    duration
                });
                return;
            }

            cursor.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
        };

        const resizeCursor = (nextSize) => {
            cursorSize = nextSize;

            if (window.gsap) {
                window.gsap.to(cursor, {
                    width: nextSize,
                    height: nextSize,
                    x: pointerX - nextSize / 2,
                    y: pointerY - nextSize / 2,
                    duration: 0.3
                });
                return;
            }

            cursor.style.width = `${nextSize}px`;
            cursor.style.height = `${nextSize}px`;
            cursor.style.transform = `translate3d(${pointerX - nextSize / 2}px, ${pointerY - nextSize / 2}px, 0)`;
        };

        const updateGlowCards = () => {
            frameId = 0;

            glowCards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mouse-x", `${pointerX - rect.left}px`);
                card.style.setProperty("--mouse-y", `${pointerY - rect.top}px`);
            });
        };

        const handleMove = (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            moveCursor();

            if (!frameId) {
                frameId = window.requestAnimationFrame(updateGlowCards);
            }
        };

        const hoverListeners = [];
        document.querySelectorAll(".cursor-hover").forEach((item) => {
            const onEnter = () => {
                resizeCursor(CURSOR_HOVER_SIZE);
            };
            const onLeave = () => {
                resizeCursor(CURSOR_BASE_SIZE);
            };
            item.addEventListener("mouseenter", onEnter);
            item.addEventListener("mouseleave", onLeave);
            hoverListeners.push([item, onEnter, onLeave]);
        });

        document.addEventListener("mousemove", handleMove);

        return () => {
            document.removeEventListener("mousemove", handleMove);
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }
            hoverListeners.forEach(([item, onEnter, onLeave]) => {
                item.removeEventListener("mouseenter", onEnter);
                item.removeEventListener("mouseleave", onLeave);
            });
        };
    }, [activeView, mobileNavOpen, photoOverlay, projectOverlay, videoOverlay, theme, showLoader]);

    useEffect(() => {
        const overlayActive = Boolean(projectOverlay || photoOverlay || videoOverlay || mobileNavOpen);
        const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;

        if (overlayActive) {
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
        } else {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [projectOverlay, photoOverlay, videoOverlay, mobileNavOpen]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setShowLoader(false);
        }, 2800);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        trackVisit(activeView);
    }, [activeView]);

    useEffect(() => {
        const handleKeydown = (event) => {
            if (projectOverlay) {
                if (event.key === "ArrowRight") {
                    setProjectOverlay((current) => ({
                        ...current,
                        direction: 1,
                        index: wrapIndex(current.index + 1, PROJECTS.length)
                    }));
                }
                if (event.key === "ArrowLeft") {
                    setProjectOverlay((current) => ({
                        ...current,
                        direction: -1,
                        index: wrapIndex(current.index - 1, PROJECTS.length)
                    }));
                }
                if (event.key === "Escape") {
                    setProjectOverlay(null);
                }
                return;
            }

            if (videoOverlay) {
                if (event.key === "ArrowRight") {
                    setVideoOverlay((current) => ({
                        ...current,
                        index: (current.index + 1) % VIDEO_GALLERIES[current.galleryKey].videos.length
                    }));
                }
                if (event.key === "ArrowLeft") {
                    setVideoOverlay((current) => ({
                        ...current,
                        index:
                            (current.index - 1 + VIDEO_GALLERIES[current.galleryKey].videos.length) %
                            VIDEO_GALLERIES[current.galleryKey].videos.length
                    }));
                }
                if (event.key === "Escape") {
                    setVideoOverlay(null);
                }
                return;
            }

            if (photoOverlay) {
                if (event.key === "ArrowRight") {
                    setPhotoOverlay((current) => ({
                        ...current,
                        direction: 1,
                        index: wrapIndex(current.index + 1, ALBUMS[current.albumKey].images.length),
                        hasPaginated: true
                    }));
                }
                if (event.key === "ArrowLeft") {
                    setPhotoOverlay((current) => ({
                        ...current,
                        direction: -1,
                        index: wrapIndex(current.index - 1, ALBUMS[current.albumKey].images.length),
                        hasPaginated: true
                    }));
                }
                if (event.key === "Escape") {
                    setPhotoOverlay(null);
                }
                return;
            }

            if (mobileNavOpen && event.key === "Escape") {
                setMobileNavOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    }, [mobileNavOpen, photoOverlay, projectOverlay, videoOverlay]);

    const switchView = (targetId, transWord = "VOID") => {
        if (targetId === activeView) {
            setMobileNavOpen(false);
            return;
        }

        setMobileNavOpen(false);
        setProjectOverlay(null);
        setPhotoOverlay(null);
        setVideoOverlay(null);
        setTransitionWord(transWord);
        setShowTransitionWord(true);

        startTransition(() => {
            setActiveView(targetId);
        });

        window.setTimeout(() => {
            setShowTransitionWord(false);
        }, 760);
    };

    const changeTheme = () => {
        if (themeIntent || themeBuffer) {
            return;
        }

        const nextTheme = theme === "dark" ? "light" : "dark";
        const nextThemeVisual = THEME_VISUALS[nextTheme];

        hasExplicitThemePreferenceRef.current = true;
        document.documentElement.style.setProperty("--theme-switch-duration", `${nextThemeVisual.duration}s`);
        document.documentElement.style.setProperty("--theme-switch-ease", "cubic-bezier(0.23, 1, 0.32, 1)");
        if (nextTheme === "light") {
            setThemeBuffer({
                id: Date.now(),
                targetTheme: nextTheme
            });
        } else {
            setThemeBuffer(null);
        }
        setThemeIntent(nextTheme);

        if (themeSwitchTimeoutRef.current) {
            window.clearTimeout(themeSwitchTimeoutRef.current);
        }

        themeSwitchTimeoutRef.current = window.setTimeout(() => {
            setTheme(nextTheme);
            setThemeIntent(null);
            themeSwitchTimeoutRef.current = null;
        }, 100);
    };

    const openProject = (projectIndex, event) => {
        const rect = event?.currentTarget?.getBoundingClientRect?.();
        const clickX = typeof event?.clientX === "number" ? event.clientX : rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const clickY = typeof event?.clientY === "number" ? event.clientY : rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

        setPhotoOverlay(null);
        setVideoOverlay(null);
        setProjectOverlay({
            index: projectIndex,
            direction: 0,
            origin: getIrisOrigin(clickX, clickY),
            sourceKey: PROJECTS[projectIndex].key,
            hasPaginated: false
        });
    };

    const changeProject = (direction) => {
        setProjectOverlay((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                direction,
                index: wrapIndex(current.index + direction, PROJECTS.length),
                hasPaginated: true
            };
        });
    };

    const jumpProject = (projectIndex) => {
        setProjectOverlay((current) => {
            if (!current || current.index === projectIndex) {
                return current;
            }

            return {
                ...current,
                direction: projectIndex > current.index ? 1 : -1,
                index: projectIndex,
                hasPaginated: true
            };
        });
    };

    const openAlbum = (albumKey, startIndex = 0, event) => {
        const rect = event?.currentTarget?.getBoundingClientRect?.();
        const clickX = typeof event?.clientX === "number" ? event.clientX : rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const clickY = typeof event?.clientY === "number" ? event.clientY : rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

        setProjectOverlay(null);
        setVideoOverlay(null);
        setPhotoOverlay({
            albumKey,
            index: startIndex,
            direction: 0,
            origin: getIrisOrigin(clickX, clickY),
            sourceKey: albumKey,
            hasPaginated: false
        });
    };

    const changePhoto = (direction, event) => {
        event?.stopPropagation();
        setPhotoOverlay((current) => {
            if (!current) {
                return current;
            }

            const total = ALBUMS[current.albumKey].images.length;
            return {
                ...current,
                direction,
                index: wrapIndex(current.index + direction, total),
                hasPaginated: true
            };
        });
    };

    const jumpPhoto = (photoIndex) => {
        setPhotoOverlay((current) => {
            if (!current || current.index === photoIndex) {
                return current;
            }

            return {
                ...current,
                direction: photoIndex > current.index ? 1 : -1,
                index: photoIndex,
                hasPaginated: true
            };
        });
    };

    const openVideoGallery = (galleryKey, startIndex = 0) => {
        setProjectOverlay(null);
        setPhotoOverlay(null);
        setVideoOverlay({
            galleryKey,
            index: startIndex
        });
    };

    const changeVideo = (direction, event) => {
        event?.stopPropagation();
        setVideoOverlay((current) => {
            if (!current) {
                return current;
            }

            const total = VIDEO_GALLERIES[current.galleryKey].videos.length;
            return {
                ...current,
                index: (current.index + direction + total) % total
            };
        });
    };

    return (
        <LayoutGroup>
            <motion.div
                id="theme-surface"
                initial={false}
                style={{ backgroundColor: activeThemeVisual.background }}
                animate={{ backgroundColor: activeThemeVisual.background }}
                transition={{ duration: activeThemeVisual.duration, ease: THEME_TRANSITION_EASE }}
            />
            <AnimatePresence>
                {showLoader ? (
                    <motion.div
                        id="loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: VIEW_TRANSITION.ease }}
                    >
                        <div className="text-center">
                            <motion.div
                                className="overflow-hidden mb-4"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.25 }}
                            >
                                <span id="loader-text" className="block font-['Space_Grotesk'] text-[10px] tracking-[0.8em] uppercase">
                                    Initializing Homepage
                                </span>
                            </motion.div>
                            <div className="w-64 h-[1px] bg-white/5 relative mx-auto">
                                <motion.div
                                    className="loader-bar"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2.4, ease: "easeInOut" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div id="trans-layer">
                <AnimatePresence>
                    {showTransitionWord ? (
                        <motion.div
                            key={transitionWord}
                            className="trans-word"
                            initial={{ opacity: 0, letterSpacing: "10em", filter: "blur(20px)", scale: 2 }}
                            animate={{ opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)", scale: 1 }}
                            exit={{ opacity: 0, filter: "blur(10px)", scale: 0.5 }}
                            transition={{ duration: 0.62, ease: [0.25, 1, 0.5, 1] }}
                        >
                            {transitionWord}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {themeBuffer ? (
                    <motion.div
                        key={`${themeBuffer.id}-${themeBuffer.targetTheme}`}
                        id="theme-luminance-buffer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: THEME_VISUALS[themeBuffer.targetTheme].bufferFrames }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: THEME_VISUALS[themeBuffer.targetTheme].bufferDuration,
                            ease: THEME_TRANSITION_EASE,
                            times:
                                themeBuffer.targetTheme === "light"
                                    ? [0, 0.12, 0.4, 0.72, 1]
                                    : [0, 0.34, 1]
                        }}
                        onAnimationComplete={() => setThemeBuffer(null)}
                    />
                ) : null}
            </AnimatePresence>

            <div id="cursor" ref={cursorRef}></div>
            <div className="vignette"></div>
            <canvas id="bg-canvas" ref={canvasRef} className="fixed inset-0 z-[1]"></canvas>

            <div id="nav-chrome" aria-hidden="true"></div>

            <motion.nav
                id="main-nav"
                className="fixed top-0 left-0 w-full p-8 md:p-10 z-[5000] flex justify-between items-center pointer-events-none"
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: showLoader ? 0 : 1, y: showLoader ? -18 : 0 }}
                transition={{ duration: 0.9, delay: showLoader ? 0 : 0.1, ease: VIEW_TRANSITION.ease }}
            >
                <div className="nav-cluster nav-cluster--left pointer-events-auto">
                    <button
                        type="button"
                        className="nav-brand text-lg font-['Space_Grotesk'] font-bold tracking-tighter cursor-hover"
                        onClick={() => switchView("home", "RETURN")}
                    >
                        Y.WANG
                    </button>

                    <div className="hidden md:flex nav-links">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => switchView(item.key, VIEW_LABELS[item.key])}
                                aria-current={activeView === item.key ? "page" : undefined}
                                className={`deco-text nav-link cursor-hover hover:text-white transition-colors ${activeView === item.key ? "is-active" : ""}`}
                            >
                                <span className="nav-link__label">{item.label}</span>
                            </button>
                        ))}
                    </div>

                </div>

                <div className="nav-actions nav-actions--mobile pointer-events-auto">
                    <button
                        id="theme-toggle-mobile"
                        className="theme-toggle cursor-hover"
                        type="button"
                        onClick={changeTheme}
                        aria-label={theme === "dark" ? "切换到白天模式" : "切换到暗黑模式"}
                        aria-pressed={theme === "light"}
                    >
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.span
                                key={toggleActionTheme}
                                className="theme-toggle__content"
                                initial={{ opacity: 0, filter: "blur(8px)", rotate: -110, scale: 0.9 }}
                                animate={{ opacity: 1, filter: "blur(0px)", rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, filter: "blur(8px)", rotate: 110, scale: 0.9 }}
                                transition={{ duration: 0.34, ease: THEME_TRANSITION_EASE }}
                            >
                                <span id="theme-toggle-icon" className="theme-toggle__icon" aria-hidden="true">
                                    {toggleActionTheme === "light" ? <SunMedium size={18} strokeWidth={1.9} /> : <MoonStar size={18} strokeWidth={1.9} />}
                                </span>
                                <span id="theme-toggle-text">{toggleThemeLabel}</span>
                            </motion.span>
                        </AnimatePresence>
                    </button>
                    <button
                        id="mobile-nav-toggle"
                        className="mobile-nav-toggle md:hidden pointer-events-auto cursor-hover"
                        aria-label="打开导航"
                        aria-expanded={mobileNavOpen}
                        aria-controls="mobile-nav-drawer"
                        onClick={() => setMobileNavOpen((open) => !open)}
                    >
                        <i className="ph ph-list text-2xl"></i>
                    </button>
                </div>
            </motion.nav>

            <div id="mobile-nav-drawer" className={`mobile-nav-drawer md:hidden ${mobileNavOpen ? "is-open" : ""}`} aria-hidden={!mobileNavOpen}>
                <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)}></div>
                <div className="mobile-nav-panel">
                    <div className="mobile-nav-header">
                        <div className="deco-text text-white/50">Navigation</div>
                        <button className="mobile-nav-close cursor-hover" onClick={() => setMobileNavOpen(false)} aria-label="关闭导航">
                            <i className="ph ph-x text-2xl"></i>
                        </button>
                    </div>
                    <div className="mobile-nav-links">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                aria-current={activeView === item.key ? "page" : undefined}
                                className={`mobile-nav-link ${activeView === item.key ? "is-active" : ""}`}
                                onClick={() => switchView(item.key, VIEW_LABELS[item.key])}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.section
                    key={activeView}
                    id={activeView}
                    className="view active"
                    initial={{ opacity: 0, scale: 1.06, filter: "blur(18px)", y: 40 }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, filter: "blur(18px)", y: -40 }}
                    transition={VIEW_TRANSITION}
                >
                    <ActiveView
                        activeView={activeView}
                        onSwitchView={switchView}
                        onOpenAlbum={openAlbum}
                        onOpenProject={openProject}
                        onOpenVideoGallery={openVideoGallery}
                        homeEntryReady={!showLoader}
                    />
                </motion.section>
            </AnimatePresence>

            <ProjectOverlay
                overlayState={projectOverlay}
                onClose={() => setProjectOverlay(null)}
                onChange={changeProject}
                onJump={jumpProject}
            />
            <PhotoOverlay
                overlayState={photoOverlay}
                onClose={() => setPhotoOverlay(null)}
                onChange={changePhoto}
                onJump={jumpPhoto}
            />
            <VideoOverlay overlayState={videoOverlay} onClose={() => setVideoOverlay(null)} onChange={changeVideo} />
        </LayoutGroup>
    );
}
