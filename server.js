const http = require("http");
const { spawn } = require("child_process");

const HOST = process.env.TRACK_HOST || "127.0.0.1";
const PORT = Number(process.env.TRACK_PORT || 3000);
const MYSQL_BIN = process.env.MYSQL_BIN || "/opt/homebrew/bin/mysql";
const DB_NAME = process.env.DB_NAME || "personal_website";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

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

function getClientIp(request) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0].trim();
    }

    const realIp = request.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
        return realIp.trim();
    }

    return request.socket.remoteAddress || "unknown";
}

function insertVisit(record) {
    const sql = `
INSERT INTO visit_logs (ip, user_agent, path, referer)
VALUES (${sqlEscape(record.ip)}, ${sqlEscape(record.userAgent)}, ${sqlEscape(record.path)}, ${sqlEscape(record.referer)});
`;

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
            const record = {
                ip: getClientIp(request),
                userAgent: request.headers["user-agent"] || "unknown",
                path: body.path || "/",
                referer: request.headers.referer || body.referer || ""
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
