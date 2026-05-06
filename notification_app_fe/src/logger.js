const LOG_SERVER_URL = "http://localhost:5000/api/logs";

/**
 * @param {string} stack
 * @param {string} level
 * @param {string} packageName
 * @param {string} message
 * @param {object} metadata
 */
export async function Log(stack, level, packageName, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    stack,
    level,
    package: packageName,
    message,
    metadata,
    sourceUrl: window.location.href,
    userAgent: navigator.userAgent,
  };

  try {
    const response = await fetch(LOG_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
    });

    if (!response.ok) {
      console.error(
        `Server responded with status ${response.status}`
      );
    }
  } catch (error) {
    console.error(
      `Failed to send log to server:`,
      error.message
    );
    console.log("FALLBACK_LOG", JSON.stringify(logEntry));
  }
}

/**
 * @param {object} filters
 * @param {number} limit
 */
export async function getLogs(filters = {}, limit = 100) {
  try {
    const params = new URLSearchParams({
      limit,
      ...filters,
    });

    const response = await fetch(`${LOG_SERVER_URL}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[LOGGING_ERROR] Failed to retrieve logs:", error.message);
    return { success: false, error: error.message, logs: [] };
  }
}

export async function getLogStats() {
  try {
    const response = await fetch(`${LOG_SERVER_URL}/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Failed to retrieve log statistics:",
      error.message
    );
    return { success: false, error: error.message, stats: {} };
  }
}
