const LOG_SERVER_URL = "http://localhost:5000/api/logs";

/**
 * @param {string} stack
 * @param {string} level
 * @param {string} packageName
 * @param {string} message
 * @param {object} metadata
 */
async function Log(stack, level, packageName, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    stack,
    level,
    package: packageName,
    message,
    metadata,
    sourceUrl: typeof window !== "undefined" ? window.location.href : "server",
  };

  try {
    if (typeof fetch !== "undefined") {
      await fetch(LOG_SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logEntry),
      });
    } else {
      const http = require("http");
      const https = require("https");
      const url = new URL(LOG_SERVER_URL);
      const protocol = url.protocol === "https:" ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(JSON.stringify(logEntry)),
        },
      };

      await new Promise((resolve, reject) => {
        const req = protocol.request(options, (res) => {
          res.on("data", () => {});
          res.on("end", resolve);
        });
        req.on("error", reject);
        req.write(JSON.stringify(logEntry));
        req.end();
      });
    }
  } catch (error) {
    console.error(`[LOGGING_ERROR] Failed to send log to server:`, error.message);
    console.log(JSON.stringify(logEntry));
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Log };
}

if (typeof window !== "undefined") {
  window.Log = Log;
}
