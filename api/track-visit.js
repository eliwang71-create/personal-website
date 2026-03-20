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
        return forwarded.split(",")[0].trim();
    }

    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
        return realIp.trim();
    }

    return req.socket?.remoteAddress || "unknown";
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
                browser
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                record.ip,
                record.userAgent,
                record.path,
                record.referer,
                record.visitedAt,
                record.deviceType,
                record.os,
                record.browser
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

        await insertVisitRecord(db, {
            ip,
            userAgent,
            path,
            referer,
            visitedAt,
            browser,
            os,
            deviceType
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
            deviceType
        }));

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error("[track-visit] failed:", error.message);
        res.status(500).json({ ok: false, error: "Failed to log visit" });
    }
};
