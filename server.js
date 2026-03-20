const http = require("http");
const { spawn } = require("child_process");

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

        await runMysql(buildBasicInsertSql(record));
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
        country: geoFromHeaders.country || geoFromFallback.country,
        region: geoFromHeaders.region || geoFromFallback.region,
        city: geoFromHeaders.city || geoFromFallback.city
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
            const ip = getClientIp(request);
            const { country, region, city } = await getGeoLocation(request, ip);
            const record = {
                ip,
                userAgent,
                path: body.path || "/",
                referer: request.headers.referer || body.referer || "",
                visitedAt: formatShanghaiDateTime(),
                browser: detectBrowser(userAgent),
                os: detectOs(userAgent),
                deviceType: detectDeviceType(userAgent),
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
