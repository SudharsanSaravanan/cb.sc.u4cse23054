const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { Log } = require("./logger");

const app = express();
const http = require("http").createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: http });

app.use(express.json());
app.use(cors());

const logsStorage = [];
const notificationsDb = new Map();
const usersDb = new Map();
const wsConnections = new Map();
const MAX_LOGS = 10000;

usersDb.set("user_123", { id: "user_123", username: "demo_user" });
usersDb.set("user_456", { id: "user_456", username: "test_user" });

app.post("/api/logs", (req, res) => {
  try {
    const logEntry = req.body;
    if (!logEntry.stack || !logEntry.level || !logEntry.package || !logEntry.message) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    logsStorage.push(logEntry);
    if (logsStorage.length > MAX_LOGS) logsStorage.shift();
    res.json({ success: true, logId: logsStorage.length - 1, message: "Log received" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/logs", (req, res) => {
  try {
    const { stack, level, package: packageName, limit = 100 } = req.query;
    let filtered = [...logsStorage];
    if (stack) filtered = filtered.filter(log => log.stack === stack);
    if (level) filtered = filtered.filter(log => log.level === level);
    if (packageName) filtered = filtered.filter(log => log.package === packageName);
    filtered.reverse();
    const paginated = filtered.slice(0, Math.min(limit, 1000));
    res.json({ success: true, total: filtered.length, returned: paginated.length, logs: paginated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/logs/stats", (req, res) => {
  try {
    const stats = { totalLogs: logsStorage.length, byLevel: {}, byStack: {}, byPackage: {} };
    logsStorage.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byStack[log.stack] = (stats.byStack[log.stack] || 0) + 1;
      stats.byPackage[log.package] = (stats.byPackage[log.package] || 0) + 1;
    });
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/notifications", (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_123";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "all";

    const userNotifs = Array.from(notificationsDb.values()).filter(n => 
      n.userId === userId && !n.deletedAt
    );

    let filtered = userNotifs;
    if (status === "read") filtered = filtered.filter(n => n.read);
    if (status === "unread") filtered = filtered.filter(n => !n.read);

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadCount = userNotifs.filter(n => !n.read).length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    Log("backend", "info", "notifications-handler", `Fetched ${paginated.length} notifications`, { userId });
    res.json({
      success: true,
      data: {
        notifications: paginated,
        pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
        unreadCount
      }
    });
  } catch (error) {
    Log("backend", "error", "notifications-handler", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/notifications/:id", (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_123";
    const notif = notificationsDb.get(req.params.id);

    if (!notif || notif.userId !== userId || notif.deletedAt) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    Log("backend", "info", "notifications-handler", `Fetched notification ${req.params.id}`, { userId });
    res.json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/notifications", (req, res) => {
  try {
    const { userId, userIds, title, message, type = "alert", priority = "normal", metadata = {}, channels = ["in_app"] } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields: title, message" });
    }

    const recipients = userIds || [userId];
    const notificationIds = [];

    recipients.forEach(uid => {
      const notif = {
        id: uuidv4(),
        userId: uid,
        type,
        title,
        message,
        read: false,
        priority,
        metadata,
        createdAt: new Date().toISOString(),
        readAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        deletedAt: null
      };
      notificationsDb.set(notif.id, notif);
      notificationIds.push(notif.id);

      const conn = wsConnections.get(uid);
      if (conn && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify({ event: "notification_received", data: notif }));
      }
    });

    Log("backend", "info", "notifications-handler", `Sent notification to ${recipients.length} users`, { notificationIds });
    res.status(201).json({ success: true, data: { notificationIds, message: `Notification sent to ${recipients.length} users` } });
  } catch (error) {
    Log("backend", "error", "notifications-handler", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/notifications/:id/read", (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_123";
    const notif = notificationsDb.get(req.params.id);

    if (!notif || notif.userId !== userId) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    notif.read = true;
    notif.readAt = new Date().toISOString();

    Log("backend", "info", "notifications-handler", `Marked notification as read`, { notificationId: req.params.id, userId });
    res.json({ success: true, data: { id: notif.id, read: true, readAt: notif.readAt } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/notifications/batch-read", (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_123";
    const { notificationIds } = req.body;

    let updated = 0;
    notificationIds.forEach(id => {
      const notif = notificationsDb.get(id);
      if (notif && notif.userId === userId) {
        notif.read = true;
        notif.readAt = new Date().toISOString();
        updated++;
      }
    });

    Log("backend", "info", "notifications-handler", `Batch marked ${updated} notifications as read`, { userId });
    res.json({ success: true, data: { updated, message: `${updated} notifications marked as read` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/notifications/:id", (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_123";
    const notif = notificationsDb.get(req.params.id);

    if (!notif || notif.userId !== userId) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    notif.deletedAt = new Date().toISOString();
    Log("backend", "info", "notifications-handler", `Deleted notification`, { notificationId: req.params.id, userId });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/notifications/count/unread", (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "user_123";
    const userNotifs = Array.from(notificationsDb.values()).filter(n => n.userId === userId && !n.deletedAt);
    const unreadCount = userNotifs.filter(n => !n.read).length;

    res.json({ success: true, data: { unreadCount, byType: {} } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

wss.on("connection", (ws, req) => {
  const userId = req.headers["x-user-id"] || "user_123";
  wsConnections.set(userId, ws);

  Log("backend", "info", "ws-handler", `WebSocket connected`, { userId });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.action === "subscribe") {
        Log("backend", "info", "ws-handler", `User subscribed to channels`, { userId, channels: msg.channels });
      }
    } catch (error) {
      Log("backend", "error", "ws-handler", error.message);
    }
  });

  ws.on("close", () => {
    wsConnections.delete(userId);
    Log("backend", "info", "ws-handler", `WebSocket disconnected`, { userId });
  });

  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: "ping", timestamp: new Date().toISOString() }));
    }
  }, 30000);

  ws.on("close", () => clearInterval(heartbeat));
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

http.listen(5000, () => {
  Log("backend", "info", "server", "Server initialized on port 5000");
  console.log("Server running on port 5000...");
});