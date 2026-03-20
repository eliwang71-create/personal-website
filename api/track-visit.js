const mysql = require("mysql2/promise");

let pool;

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

        await db.execute(
            "INSERT INTO visit_logs (ip, user_agent, path, referer) VALUES (?, ?, ?, ?)",
            [ip, userAgent, path, referer]
        );

        console.log(JSON.stringify({
            event: "visit_logged",
            ip,
            userAgent,
            path,
            referer,
            visitedAt: new Date().toISOString()
        }));

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error("[track-visit] failed:", error.message);
        res.status(500).json({ ok: false, error: "Failed to log visit" });
    }
};
