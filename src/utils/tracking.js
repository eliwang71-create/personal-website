const TRACKING_ENDPOINT =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:3000/api/track-visit"
        : "/api/track-visit";

let lastTrackedPath = "";

export function buildTrackedPath(viewId) {
    return `/#${viewId}`;
}

async function collectClientHints() {
    const uaData = navigator.userAgentData;
    const hints = {
        platform: null,
        platformVersion: null,
        model: null,
        mobile: null,
        fullVersionList: null
    };

    if (!uaData) {
        return hints;
    }

    if (typeof uaData.platform === "string" && uaData.platform) {
        hints.platform = uaData.platform;
    }

    if (typeof uaData.mobile === "boolean") {
        hints.mobile = uaData.mobile;
    }

    if (typeof uaData.getHighEntropyValues !== "function") {
        return hints;
    }

    try {
        const highEntropyValues = await uaData.getHighEntropyValues(["model", "platformVersion", "fullVersionList"]);

        if (typeof highEntropyValues.model === "string" && highEntropyValues.model) {
            hints.model = highEntropyValues.model;
        }

        if (typeof highEntropyValues.platformVersion === "string" && highEntropyValues.platformVersion) {
            hints.platformVersion = highEntropyValues.platformVersion;
        }

        if (Array.isArray(highEntropyValues.fullVersionList) && highEntropyValues.fullVersionList.length) {
            hints.fullVersionList = highEntropyValues.fullVersionList
                .filter((item) => item && typeof item.brand === "string" && typeof item.version === "string")
                .map((item) => ({
                    brand: item.brand,
                    version: item.version
                }));
        }
    } catch {
        // Ignore unsupported or blocked client hints.
    }

    return hints;
}

export async function trackVisit(viewId) {
    const path = buildTrackedPath(viewId);

    if (!TRACKING_ENDPOINT || path === lastTrackedPath) {
        return;
    }

    lastTrackedPath = path;
    const clientHints = await collectClientHints();

    window.fetch(TRACKING_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            path,
            referer: document.referrer || "",
            clientHints
        })
    }).catch(() => {
        // Ignore local tracking failures in the UI.
    });
}
