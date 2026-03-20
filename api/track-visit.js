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

function parseUserAgent(userAgent = "") {
    return {
        browser: detectBrowser(userAgent),
        os: detectOs(userAgent),
        deviceType: detectDeviceType(userAgent)
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
        country: geoFromHeaders.country || geoFromFallback.country,
        region: geoFromHeaders.region || geoFromFallback.region,
        city: geoFromHeaders.city || geoFromFallback.city
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
    } catch (error) {
        if (error.code !== "ER_BAD_FIELD_ERROR") {
            throw error;
        }

        await db.execute(
            "INSERT INTO visit_logs (ip, user_agent, path, referer, visited_at) VALUES (?, ?, ?, ?, ?)",
            [record.ip, record.userAgent, record.path, record.referer, record.visitedAt]
        );
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
        const { browser, os, deviceType } = parseUserAgent(userAgent);
        const { country, region, city } = await getGeoLocation(req, ip);

        await insertVisitRecord(db, {
            ip,
            userAgent,
            path,
            referer,
            visitedAt,
            browser,
            os,
            deviceType,
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
            os,
            deviceType,
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
