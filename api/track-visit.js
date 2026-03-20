const mysql = require("mysql2/promise");

let pool;

function formatShanghaiDateTime(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    return formatter.format(date).replace(" ", " ");
}

function detectBrowser(userAgent = "") {
    if (/edg\//i.test(userAgent)) {
        return "Edge";
    }
    if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
        return "Chrome";
    }
    if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
        return "Safari";
    }
    if (/firefox\//i.test(userAgent)) {
        return "Firefox";
    }
    if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) {
        return "Opera";
    }
    return "Unknown";
}

function parseBrowserVersionFromUserAgent(userAgent = "", browser = "Unknown") {
    if (browser === "Edge") {
        const match = userAgent.match(/Edg\/([\d.]+)/i);
        return normalizeVersion(match?.[1]);
    }

    if (browser === "Chrome") {
        const match = userAgent.match(/Chrome\/([\d.]+)/i);
        return normalizeVersion(match?.[1]);
    }

    if (browser === "Safari") {
        const match = userAgent.match(/Version\/([\d.]+)/i);
        return normalizeVersion(match?.[1]);
    }

    if (browser === "Firefox") {
        const match = userAgent.match(/Firefox\/([\d.]+)/i);
        return normalizeVersion(match?.[1]);
    }

    if (browser === "Opera") {
        const match = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/i);
        return normalizeVersion(match?.[1]);
    }

    return null;
}

function detectOs(userAgent = "") {
    if (/iphone|ipad|ipod/i.test(userAgent)) {
        return "iOS";
    }
    if (/android/i.test(userAgent)) {
        return "Android";
    }
    if (/mac os x/i.test(userAgent)) {
        return "macOS";
    }
    if (/windows nt/i.test(userAgent)) {
        return "Windows";
    }
    if (/linux/i.test(userAgent)) {
        return "Linux";
    }
    return "Unknown";
}

function detectDeviceType(userAgent = "") {
    if (/ipad|tablet/i.test(userAgent)) {
        return "Tablet";
    }
    if (/mobile|iphone|android/i.test(userAgent)) {
        return "Mobile";
    }
    return "Desktop";
}

function normalizeVersion(version = "") {
    if (typeof version !== "string" || !version.trim()) {
        return null;
    }

    return version.trim().replace(/_/g, ".");
}

function mapClientHintsPlatform(platform = "") {
    const normalized = String(platform).trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    if (normalized === "macos") {
        return "macOS";
    }

    if (normalized === "ios") {
        return "iOS";
    }

    if (normalized === "android") {
        return "Android";
    }

    if (normalized === "windows") {
        return "Windows";
    }

    if (normalized === "linux") {
        return "Linux";
    }

    return platform;
}

function parseOsVersionFromUserAgent(userAgent = "", os = "Unknown") {
    if (os === "iOS") {
        const match = userAgent.match(/OS (\d+(?:[_\.\d]+)*)/i);
        return normalizeVersion(match?.[1]);
    }

    if (os === "Android") {
        const match = userAgent.match(/Android (\d+(?:\.\d+)*)/i);
        return normalizeVersion(match?.[1]);
    }

    if (os === "macOS") {
        const match = userAgent.match(/Mac OS X (\d+(?:[_\.\d]+)*)/i);
        return normalizeVersion(match?.[1]);
    }

    if (os === "Windows") {
        const match = userAgent.match(/Windows NT (\d+(?:\.\d+)*)/i);
        return normalizeVersion(match?.[1]);
    }

    return null;
}

function parseAndroidModelFromUserAgent(userAgent = "") {
    const match = userAgent.match(/Android [^;)]*;\s*([^;)]+?)(?:\s+Build\/[^;)]+)?(?:;|\))/i);
    if (!match?.[1]) {
        return null;
    }

    const model = match[1].trim();
    if (!model || /^(wv|mobile|linux)$/i.test(model)) {
        return null;
    }

    return model;
}

function parseDeviceModelFromUserAgent(userAgent = "", os = "Unknown") {
    if (/ipad/i.test(userAgent)) {
        return "iPad";
    }

    if (/iphone/i.test(userAgent)) {
        return "iPhone";
    }

    if (/ipod/i.test(userAgent)) {
        return "iPod";
    }

    if (os === "Android") {
        return parseAndroidModelFromUserAgent(userAgent);
    }

    return null;
}

function normalizeClientHints(clientHints) {
    if (!clientHints || typeof clientHints !== "object") {
        return {};
    }

    return {
        platform: typeof clientHints.platform === "string" ? clientHints.platform.trim() : null,
        platformVersion: normalizeVersion(clientHints.platformVersion),
        model: typeof clientHints.model === "string" && clientHints.model.trim() ? clientHints.model.trim() : null,
        mobile: typeof clientHints.mobile === "boolean" ? clientHints.mobile : null,
        fullVersionList: Array.isArray(clientHints.fullVersionList)
            ? clientHints.fullVersionList
                  .filter((item) => item && typeof item.brand === "string" && typeof item.version === "string")
                  .map((item) => ({
                      brand: item.brand.trim(),
                      version: normalizeVersion(item.version)
                  }))
            : []
    };
}

function parseBrowserVersionFromClientHints(browser = "Unknown", clientHints = {}) {
    const candidates = clientHints.fullVersionList || [];
    if (!candidates.length) {
        return null;
    }

    const brandMatchers = {
        Edge: [/Microsoft Edge/i],
        Chrome: [/Google Chrome/i, /^Chrome$/i, /^Chromium$/i],
        Opera: [/Opera/i],
        Firefox: [/Firefox/i]
    };

    const matchers = brandMatchers[browser];
    if (!matchers) {
        return null;
    }

    const matchedItem = candidates.find((item) => matchers.some((matcher) => matcher.test(item.brand)));
    return normalizeVersion(matchedItem?.version);
}

function normalizeOsVersion(os = "Unknown", version = null) {
    const normalized = normalizeVersion(version);
    if (!normalized) {
        return null;
    }

    if (os === "Windows" && normalized === "0.0.0") {
        return null;
    }

    return normalized;
}

function parseUserAgent(userAgent = "", clientHints = {}) {
    const normalizedHints = normalizeClientHints(clientHints);
    const os = mapClientHintsPlatform(normalizedHints.platform) || detectOs(userAgent);
    const browser = detectBrowser(userAgent);

    return {
        browser,
        browserVersion: parseBrowserVersionFromClientHints(browser, normalizedHints) || parseBrowserVersionFromUserAgent(userAgent, browser),
        os,
        osVersion: normalizeOsVersion(os, normalizedHints.platformVersion) || parseOsVersionFromUserAgent(userAgent, os),
        deviceType: detectDeviceType(userAgent),
        deviceModel: normalizedHints.model || parseDeviceModelFromUserAgent(userAgent, os)
    };
}

function decodeGeoHeader(value = "") {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }

    try {
        return decodeURIComponent(value.trim());
    } catch {
        return value.trim();
    }
}

function getGeoLocationFromHeaders(req) {
    return {
        country: decodeGeoHeader(req.headers["x-vercel-ip-country"]),
        region: decodeGeoHeader(req.headers["x-vercel-ip-country-region"]),
        city: decodeGeoHeader(req.headers["x-vercel-ip-city"])
    };
}

function normalizeIp(ip = "") {
    if (typeof ip !== "string") {
        return "";
    }

    const normalized = ip.trim();
    if (!normalized) {
        return "";
    }

    if (normalized.startsWith("::ffff:")) {
        return normalized.slice(7);
    }

    return normalized;
}

function isPrivateIp(ip = "") {
    const normalized = normalizeIp(ip).toLowerCase();

    if (!normalized) {
        return true;
    }

    return (
        normalized === "unknown" ||
        normalized === "::1" ||
        normalized === "localhost" ||
        normalized.startsWith("10.") ||
        normalized.startsWith("192.168.") ||
        normalized.startsWith("127.") ||
        normalized.startsWith("169.254.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized) ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80:")
    );
}

function hasDetailedGeo(geo = {}) {
    return Boolean(geo.country && geo.region && geo.city);
}

function isRegionCode(value = "") {
    return typeof value === "string" && /^[A-Z0-9-]{2,6}$/.test(value.trim());
}

function mergeGeoField(headerValue, fallbackValue, { preferFallbackForCode = false } = {}) {
    if (!headerValue) {
        return fallbackValue || null;
    }

    if (preferFallbackForCode && fallbackValue && isRegionCode(headerValue)) {
        return fallbackValue;
    }

    return headerValue;
}

async function fetchGeoFromIpApi(ip) {
    const normalizedIp = normalizeIp(ip);

    if (!normalizedIp || isPrivateIp(normalizedIp)) {
        return { country: null, region: null, city: null };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
        const response = await fetch(`https://ipapi.co/${encodeURIComponent(normalizedIp)}/json/`, {
            headers: {
                Accept: "application/json",
                "User-Agent": "personal-website-ip-fallback/1.0"
            },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`ipapi status ${response.status}`);
        }

        const data = await response.json();

        if (data?.error) {
            throw new Error(data.reason || "ipapi error");
        }

        return {
            country: data.country_name || data.country || null,
            region: data.region || null,
            city: data.city || null
        };
    } catch (error) {
        console.warn("[track-visit] ipapi fallback failed:", error.message);
        return { country: null, region: null, city: null };
    } finally {
        clearTimeout(timeout);
    }
}

async function getGeoLocation(req, ip) {
    const geoFromHeaders = getGeoLocationFromHeaders(req);
    if (hasDetailedGeo(geoFromHeaders)) {
        return geoFromHeaders;
    }

    const geoFromFallback = await fetchGeoFromIpApi(ip);

    return {
        country: mergeGeoField(geoFromHeaders.country, geoFromFallback.country),
        region: mergeGeoField(geoFromHeaders.region, geoFromFallback.region, { preferFallbackForCode: true }),
        city: mergeGeoField(geoFromHeaders.city, geoFromFallback.city)
    };
}

function getPool() {
    if (pool) {
        return pool;
    }

    const {
        MYSQL_HOST,
        MYSQL_PORT = "3306",
        MYSQL_USER,
        MYSQL_PASSWORD = "",
        MYSQL_DATABASE,
        MYSQL_SSL = "true"
    } = process.env;

    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
        throw new Error("Missing MySQL environment variables");
    }

    pool = mysql.createPool({
        host: MYSQL_HOST,
        port: Number(MYSQL_PORT),
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 4,
        queueLimit: 0,
        ssl: MYSQL_SSL === "false" ? undefined : { rejectUnauthorized: false }
    });

    return pool;
}

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return normalizeIp(forwarded.split(",")[0].trim());
    }

    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
        return normalizeIp(realIp.trim());
    }

    return normalizeIp(req.socket?.remoteAddress || "unknown");
}

async function insertVisitRecord(db, record) {
    try {
        await db.execute(
            `INSERT INTO visit_logs (
                ip,
                user_agent,
                path,
                referer,
                visited_at,
                device_type,
                os,
                os_version,
                device_model,
                browser,
                browser_version,
                country,
                region,
                city
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                record.ip,
                record.userAgent,
                record.path,
                record.referer,
                record.visitedAt,
                record.deviceType,
                record.os,
                record.osVersion,
                record.deviceModel,
                record.browser,
                record.browserVersion,
                record.country,
                record.region,
                record.city
            ]
        );
    } catch (error) {
        if (error.code !== "ER_BAD_FIELD_ERROR") {
            throw error;
        }

        try {
            await db.execute(
                `INSERT INTO visit_logs (
                    ip,
                    user_agent,
                    path,
                    referer,
                    visited_at,
                    device_type,
                    os,
                    browser,
                    country,
                    region,
                    city
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.ip,
                    record.userAgent,
                    record.path,
                    record.referer,
                    record.visitedAt,
                    record.deviceType,
                    record.os,
                    record.browser,
                    record.country,
                    record.region,
                    record.city
                ]
            );
        } catch (legacyError) {
            if (legacyError.code !== "ER_BAD_FIELD_ERROR") {
                throw legacyError;
            }

            await db.execute(
                "INSERT INTO visit_logs (ip, user_agent, path, referer, visited_at) VALUES (?, ?, ?, ?, ?)",
                [record.ip, record.userAgent, record.path, record.referer, record.visitedAt]
            );
        }
    }
}

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).json({ ok: true });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, error: "Method not allowed" });
        return;
    }

    try {
        const db = getPool();
        const path = req.body?.path || "/";
        const referer = req.headers.referer || req.body?.referer || "";
        const userAgent = req.headers["user-agent"] || "unknown";
        const ip = getClientIp(req);
        const visitedAt = formatShanghaiDateTime();
        const clientHints = req.body?.clientHints;
        const { browser, browserVersion, os, osVersion, deviceType, deviceModel } = parseUserAgent(userAgent, clientHints);
        const { country, region, city } = await getGeoLocation(req, ip);

        await insertVisitRecord(db, {
            ip,
            userAgent,
            path,
            referer,
            visitedAt,
            browser,
            browserVersion,
            os,
            osVersion,
            deviceType,
            deviceModel,
            country,
            region,
            city
        });

        console.log(JSON.stringify({
            event: "visit_logged",
            ip,
            userAgent,
            path,
            referer,
            visitedAt,
            browser,
            browserVersion,
            os,
            osVersion,
            deviceType,
            deviceModel,
            country,
            region,
            city
        }));

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error("[track-visit] failed:", error.message);
        res.status(500).json({ ok: false, error: "Failed to log visit" });
    }
};
