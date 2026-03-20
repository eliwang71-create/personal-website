const DEVICE_MODEL_NAME_MAP = {
    "2211133C": "Xiaomi 13"
};

function normalizeModelValue(model = "") {
    if (typeof model !== "string") {
        return null;
    }

    const normalized = model.trim();
    return normalized || null;
}

function looksLikeModelCode(model = "") {
    return /^[A-Z0-9-]{5,}$/i.test(model);
}

function resolveDeviceModel(model = "") {
    const normalized = normalizeModelValue(model);
    if (!normalized) {
        return {
            deviceModel: null,
            deviceModelRaw: null
        };
    }

    const mapped = DEVICE_MODEL_NAME_MAP[normalized.toUpperCase()];
    if (mapped) {
        return {
            deviceModel: mapped,
            deviceModelRaw: normalized
        };
    }

    return {
        deviceModel: normalized,
        deviceModelRaw: looksLikeModelCode(normalized) ? normalized : null
    };
}

module.exports = {
    resolveDeviceModel
};
