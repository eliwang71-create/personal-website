const http = require("http");
const { spawn } = require("child_process");
const { resolveDeviceModel } = require("./lib/device-models");

const HOST = process.env.TRACK_HOST || "127.0.0.1";
const PORT = Number(process.env.TRACK_PORT || 3000);
const MYSQL_BIN = process.env.MYSQL_BIN || "/opt/homebrew/bin/mysql";
const DB_NAME = process.env.DB_NAME || "personal_website";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

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
    const parentheticalMatch = userAgent.match(/\(([^)]+)\)/);
    if (!parentheticalMatch?.[1]) {
        return null;
    }

    const tokens = parentheticalMatch[1]
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);

    const androidIndex = tokens.findIndex((item) => /^Android\b/i.test(item));
    const candidates = androidIndex >= 0 ? tokens.slice(androidIndex + 1) : tokens;

    const modelToken = candidates.find((item) => {
        const normalized = item.replace(/\s+Build\/.+$/i, "").trim();
        if (!normalized) {
            return false;
        }

        if (/^(wv|mobile|linux|u)$/i.test(normalized)) {
            return false;
        }

        if (/^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(normalized)) {
            return false;
        }

        return true;
    });

    if (!modelToken) {
        return null;
    }

    return modelToken.replace(/\s+Build\/.+$/i, "").trim() || null;
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
    const deviceType = detectDeviceType(userAgent);
    const rawDeviceModel = normalizedHints.model || parseDeviceModelFromUserAgent(userAgent, os);
    const { deviceModel, deviceModelRaw } = resolveDeviceModel(rawDeviceModel, { os, deviceType });

    return {
        browser,
        browserVersion: parseBrowserVersionFromClientHints(browser, normalizedHints) || parseBrowserVersionFromUserAgent(userAgent, browser),
        os,
        osVersion: normalizeOsVersion(os, normalizedHints.platformVersion) || parseOsVersionFromUserAgent(userAgent, os),
        deviceType,
        deviceModel,
        deviceModelRaw
    };
}

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    response.end(JSON.stringify(payload));
}

function sqlEscape(value) {
    if (value === null || value === undefined) {
        return "NULL";
    }

    return `'${String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "''")
        .replace(/\u0000/g, "")
        .replace(/\r/g, " ")
        .replace(/\n/g, " ")}'`;
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

function getClientIp(request) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return normalizeIp(forwarded.split(",")[0].trim());
    }

    const realIp = request.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
        return normalizeIp(realIp.trim());
    }

    return normalizeIp(request.socket.remoteAddress || "unknown");
}

function shouldIgnoreVisit(userAgent = "", referer = "") {
    const normalizedUserAgent = String(userAgent || "").trim();
    const normalizedReferer = String(referer || "").trim();

    if (!normalizedUserAgent) {
        return true;
    }

    if (/^vercel-screenshot\/\d+/i.test(normalizedUserAgent)) {
        return true;
    }

    if (/HeadlessChrome/i.test(normalizedUserAgent)) {
        return true;
    }

    if (/bot|crawler|spider|preview/i.test(normalizedUserAgent)) {
        return true;
    }

    if (/vercel\.app\/?$/i.test(normalizedReferer) && /^vercel-screenshot\/\d+/i.test(normalizedUserAgent)) {
        return true;
    }

    return false;
}

function runMysql(sql) {
    const args = ["-u", DB_USER, DB_NAME];
    const env = { ...process.env };

    if (DB_PASSWORD) {
        env.MYSQL_PWD = DB_PASSWORD;
    }

    return new Promise((resolve, reject) => {
        const child = spawn(MYSQL_BIN, args, { env });
        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(stderr.trim() || `mysql exited with code ${code}`));
        });

        child.stdin.write(sql);
        child.stdin.end();
    });
}

function buildFullInsertSql(record) {
    return `
INSERT INTO visit_logs (
    ip,
    user_agent,
    path,
    referer,
    visited_at,
    device_type,
    os,
    os_version,
    device_model,
    device_model_raw,
    browser,
    browser_version,
    country,
    region,
    city
)
VALUES (
    ${sqlEscape(record.ip)},
    ${sqlEscape(record.userAgent)},
    ${sqlEscape(record.path)},
    ${sqlEscape(record.referer)},
    ${sqlEscape(record.visitedAt)},
    ${sqlEscape(record.deviceType)},
    ${sqlEscape(record.os)},
    ${sqlEscape(record.osVersion)},
    ${sqlEscape(record.deviceModel)},
    ${sqlEscape(record.deviceModelRaw)},
    ${sqlEscape(record.browser)},
    ${sqlEscape(record.browserVersion)},
    ${sqlEscape(record.country)},
    ${sqlEscape(record.region)},
    ${sqlEscape(record.city)}
);
`;
}

function buildLegacyInsertSql(record) {
    return `
INSERT INTO visit_logs (
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
)
VALUES (
    ${sqlEscape(record.ip)},
    ${sqlEscape(record.userAgent)},
    ${sqlEscape(record.path)},
    ${sqlEscape(record.referer)},
    ${sqlEscape(record.visitedAt)},
    ${sqlEscape(record.deviceType)},
    ${sqlEscape(record.os)},
    ${sqlEscape(record.browser)},
    ${sqlEscape(record.country)},
    ${sqlEscape(record.region)},
    ${sqlEscape(record.city)}
);
`;
}

function buildBasicInsertSql(record) {
    return `
INSERT INTO visit_logs (ip, user_agent, path, referer, visited_at)
VALUES (${sqlEscape(record.ip)}, ${sqlEscape(record.userAgent)}, ${sqlEscape(record.path)}, ${sqlEscape(record.referer)}, ${sqlEscape(record.visitedAt)});
`;
}

async function insertVisit(record) {
    try {
        await runMysql(buildFullInsertSql(record));
    } catch (error) {
        if (!/Unknown column/i.test(error.message)) {
            throw error;
        }

        try {
            await runMysql(buildLegacyInsertSql(record));
        } catch (legacyError) {
            if (!/Unknown column/i.test(legacyError.message)) {
                throw legacyError;
            }

            await runMysql(buildBasicInsertSql(record));
        }
    }
}

function getGeoLocationFromHeaders(request) {
    return {
        country: decodeGeoHeader(request.headers["x-vercel-ip-country"]),
        region: decodeGeoHeader(request.headers["x-vercel-ip-country-region"]),
        city: decodeGeoHeader(request.headers["x-vercel-ip-city"])
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

async function getGeoLocation(request, ip) {
    const geoFromHeaders = getGeoLocationFromHeaders(request);
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

const server = http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
        sendJson(response, 200, { ok: true });
        return;
    }

    if (request.url !== "/api/track-visit") {
        sendJson(response, 404, { ok: false, error: "Not found" });
        return;
    }

    if (request.method !== "POST") {
        sendJson(response, 405, { ok: false, error: "Method not allowed" });
        return;
    }

    let rawBody = "";

    request.on("data", (chunk) => {
        rawBody += chunk.toString();
    });

    request.on("end", async () => {
        try {
            const body = rawBody ? JSON.parse(rawBody) : {};
            const userAgent = request.headers["user-agent"] || "unknown";
            const referer = request.headers.referer || body.referer || "";

            if (shouldIgnoreVisit(userAgent, referer)) {
                sendJson(response, 200, { ok: true, ignored: true });
                return;
            }

            const ip = getClientIp(request);
            const clientHints = body.clientHints;
            const { country, region, city } = await getGeoLocation(request, ip);
            const { browser, browserVersion, os, osVersion, deviceType, deviceModel, deviceModelRaw } = parseUserAgent(userAgent, clientHints);
            const record = {
                ip,
                userAgent,
                path: body.path || "/",
                referer,
                visitedAt: formatShanghaiDateTime(),
                browser,
                browserVersion,
                os,
                osVersion,
                deviceType,
                deviceModel,
                deviceModelRaw,
                country,
                region,
                city
            };

            await insertVisit(record);

            console.log(JSON.stringify({
                event: "visit_logged",
                ...record,
                visitedAt: new Date().toISOString()
            }));

            sendJson(response, 200, { ok: true });
        } catch (error) {
            console.error("[track-visit] failed:", error.message);
            sendJson(response, 500, { ok: false, error: "Failed to log visit" });
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Local tracking server running at http://${HOST}:${PORT}`);
    console.log(`Using MySQL database: ${DB_NAME}`);
});
