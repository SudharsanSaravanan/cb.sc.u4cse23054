# Notification System Design

## Stage 1: REST API Design & Contract

### Core Actions
1. Retrieve user notifications (paginated)
2. Get single notification details
3. Send notification to user(s)
4. Mark notification as read/unread
5. Delete notification
6. Get unread notification count
7. Real-time notification streaming
8. Batch mark as read

---

### REST API Endpoints

#### 1. GET /api/notifications
**Retrieve all notifications for authenticated user**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Query Parameters:**
```
?page=1&limit=20&status=all|read|unread&sort=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "userId": "user_123",
        "type": "order_update|message|alert|reminder",
        "title": "Order Shipped",
        "message": "Your order #12345 has been shipped",
        "read": false,
        "priority": "high|normal|low",
        "metadata": {
          "orderId": "12345",
          "trackingUrl": "https://..."
        },
        "createdAt": "2026-05-06T10:30:00Z",
        "readAt": null,
        "expiresAt": "2026-05-13T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    },
    "unreadCount": 5
  }
}
```

---

#### 2. GET /api/notifications/:id
**Retrieve single notification**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_001",
    "userId": "user_123",
    "type": "order_update",
    "title": "Order Shipped",
    "message": "Your order #12345 has been shipped",
    "read": false,
    "priority": "high",
    "metadata": {
      "orderId": "12345",
      "trackingUrl": "https://..."
    },
    "createdAt": "2026-05-06T10:30:00Z",
    "readAt": null,
    "expiresAt": "2026-05-13T10:30:00Z"
  }
}
```

---

#### 3. POST /api/notifications
**Send notification to user(s)**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-Service-ID: <serviceId>
X-Idempotency-Key: <uniqueKey>
```

**Request Body:**
```json
{
  "userId": "user_123",
  "userIds": ["user_123", "user_456"],
  "type": "order_update",
  "title": "Order Shipped",
  "message": "Your order has been shipped",
  "priority": "high",
  "metadata": {
    "orderId": "12345",
    "trackingUrl": "https://..."
  },
  "expiresIn": 86400,
  "channels": ["in_app", "email", "sms"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "notificationIds": ["notif_001", "notif_002"],
    "message": "Notification sent to 2 users"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: title, message",
  "code": "VALIDATION_ERROR"
}
```

---

#### 4. PUT /api/notifications/:id/read
**Mark notification as read**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Request Body:**
```json
{
  "read": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_001",
    "read": true,
    "readAt": "2026-05-06T11:00:00Z"
  }
}
```

---

#### 5. POST /api/notifications/batch-read
**Mark multiple notifications as read**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Request Body:**
```json
{
  "notificationIds": ["notif_001", "notif_002", "notif_003"],
  "read": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "updated": 3,
    "message": "3 notifications marked as read"
  }
}
```

---

#### 6. DELETE /api/notifications/:id
**Delete notification**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Response (204 No Content):**
```json
{
  "success": true
}
```

---

#### 7. GET /api/notifications/count/unread
**Get unread notification count**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5,
    "byType": {
      "order_update": 2,
      "message": 2,
      "alert": 1
    }
  }
}
```

---

### Real-Time Notification Mechanism

#### WebSocket Connection
**Endpoint:** `ws://localhost:5000/ws/notifications`

**Connection Headers:**
```
Authorization: Bearer <token>
X-User-ID: <userId>
```

**Subscribe Message:**
```json
{
  "action": "subscribe",
  "channels": ["notifications", "messages"],
  "userId": "user_123"
}
```

**Real-Time Notification Event:**
```json
{
  "event": "notification_received",
  "data": {
    "id": "notif_001",
    "userId": "user_123",
    "type": "order_update",
    "title": "Order Shipped",
    "message": "Your order #12345 has been shipped",
    "priority": "high",
    "createdAt": "2026-05-06T10:30:00Z",
    "metadata": {
      "orderId": "12345"
    }
  }
}
```
---

## Stage 2: Database Design & Scalability

### Database Choice: PostgreSQL with Redis Cache
- PostgreSQL: ACID compliance, relational integrity, complex queries, proven scalability
- Redis: Real-time notifications, session cache, rate limiting
- Hybrid approach balances performance and consistency

---

### PostgreSQL Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_types (
  id SERIAL PRIMARY KEY,
  type_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_id INT REFERENCES notification_types(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  expires_at TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_read (read),
  INDEX idx_user_read (user_id, read)
);

CREATE TABLE notification_channels (
  id SERIAL PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_id (notification_id)
);

CREATE TABLE notification_delivery_logs (
  id BIGSERIAL PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_created (user_id, created_at DESC)
);
```

---

### Indexing Strategy

```sql
CREATE INDEX idx_notifications_user_created 
ON notifications(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_user_read_created 
ON notifications(user_id, read, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_expires 
ON notifications(expires_at) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_priority 
ON notifications(user_id, priority) 
WHERE deleted_at IS NULL AND read = FALSE;
```

---

### Scalability Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| High read volume | Redis caching, read replicas, pagination |
| Notification delivery latency | WebSocket real-time, message queue (RabbitMQ) |
| Storage growth | Partitioning by date, archival strategy |
| Query performance | Materialized views, aggregate tables |
| Concurrent updates | Optimistic locking, version control |
| Notification lookup | caching frequently accessed data |

**Partitioning Strategy:**
```sql
CREATE TABLE notifications_2026_05 PARTITION OF notifications
FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

---

### Queries Based on REST APIs

#### 1. GET /api/notifications
```sql
SELECT 
  id, user_id, type_id, title, message, read, 
  priority, metadata, created_at, read_at, expires_at
FROM notifications
WHERE user_id = $1 
  AND deleted_at IS NULL 
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

**With Caching (Redis):**
```
Key: notifications:user_123:page:1
TTL: 60 seconds
```

---

#### 2. GET /api/notifications/:id
```sql
SELECT *
FROM notifications
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;
```

---

#### 3. POST /api/notifications (Send)
```sql
INSERT INTO notifications 
(user_id, type_id, title, message, priority, metadata, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
RETURNING id, created_at;

-- Log delivery
INSERT INTO notification_delivery_logs 
(notification_id, user_id, channel, status)
VALUES ($1, $2, $3, 'pending');
```

---

#### 4. PUT /api/notifications/:id/read
```sql
UPDATE notifications
SET read = TRUE, read_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, read_at;

-- Invalidate cache
DELETE FROM cache WHERE key = 'notifications:' || $2 || ':*';
```

---

#### 5. POST /api/notifications/batch-read
```sql
UPDATE notifications
SET read = TRUE, read_at = NOW()
WHERE id = ANY($1::uuid[]) AND user_id = $2
RETURNING id;
```

---

#### 6. DELETE /api/notifications/:id
```sql
UPDATE notifications
SET deleted_at = NOW()
WHERE id = $1 AND user_id = $2;
```

---

#### 7. GET /api/notifications/count/unread
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE type_id = 1) as order_update,
  COUNT(*) FILTER (WHERE type_id = 2) as message,
  COUNT(*) FILTER (WHERE type_id = 3) as alert
FROM notifications
WHERE user_id = $1 
  AND read = FALSE 
  AND deleted_at IS NULL 
  AND expires_at > NOW();

-- Cache with 30 sec TTL
Key: unread_count:user_123
```

---

### Cleanup Query (Cron Job)
```sql
DELETE FROM notifications
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days'
  OR expires_at < NOW() - INTERVAL '1 day';
```

---

### Monitoring Queries

**Unread by user:**
```sql
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE read = FALSE 
  AND deleted_at IS NULL
GROUP BY user_id
ORDER BY unread_count DESC;
```

**Performance:**
```sql
SELECT 
  type_id,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) as avg_read_time
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type_id;
```

---

## Stage 3: Query Optimization & Indexing

### Query Analysis
The query:
```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;
```

**Why it's slow:**
- Full table scan on 5M rows
- No indexes to filter quickly
- Composite filtering (studentID + isRead) without index

**Solution - Composite Indexing:**
```sql
CREATE INDEX idx_student_unread ON notifications(studentID, isRead) WHERE isRead = false;
CREATE INDEX idx_student_created ON notifications(studentID, createdAt DESC);
```

**Why not add indexes on every column?**
- Massive storage overhead
- Write performance penalty (every INSERT updates all indexes)
- Index maintenance cost increases

**Optimized query:**
```sql
SELECT id, title, message, createdAt FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt ASC 
LIMIT 20;
```

**Find placement notifications in last 7 days:**
```sql
SELECT * FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;

CREATE INDEX idx_type_created ON notifications(notificationType, createdAt DESC);
```

**Expected improvement:** Full scan (O(n)) → Index scan (O(log n)) = 1000x faster with proper indexes.

---

## Stage 4: High-Load Performance Strategy

### Problem
50K students × 5M notifications = DB bottleneck on every page load

### Solutions & Tradeoffs

**1. Redis Caching**
```
CACHE KEY: notifications:student:1042:page:1
TTL: 5 minutes
```
- Instant response (cache hit)
- Stale data possible
- Cache invalidation complexity
- Cost: Memory overhead, Redis infrastructure

**2. Lazy Loading (Pagination)**
- Already in API design (page, limit)
- Reduces per-request data
- Multiple DB calls for scrolling
- Cost: Network requests increase

**3. WebSocket Real-Time Push**
- No polling/refresh needed
- Instant updates
- Connection management overhead
- Cost: Server memory for connections

**4. Background Batch Jobs**
```sql
CREATE TABLE notification_cache AS
SELECT studentID, COUNT(*) as unread_count
FROM notifications
WHERE isRead = false
GROUP BY studentID;
```
- Cron job every 5 minutes
- Eventual consistency
- Cost: Additional job scheduler

### Recommended Stack
1. Composite indexes (Stage 3)
2. Redis cache (5-min TTL) for unread counts
3. Pagination (already in API)
4. WebSocket for real-time updates
5. Background job for hot data

**Result:** ~1 sec → ~10ms response time

---

## Stage 5: Bulk Notification Reliability & Performance

### Original Pseudocode Issue
```
function notify_all(student_ids, message):
  for student_id in student_ids:
    send_email(student_id, message)      # Email API call
    save_to_db(student_id, message)      # DB insert
    notify_realtime(student_id, message) # WebSocket push
```

### Shortcomings
1. **Synchronous loop** - 50K iterations sequentially = slow
2. **No atomicity** - Email fails → DB already saved (inconsistent)
3. **No retry** - 200 students failed midway, no recovery
4. **Cascading failure** - One API timeout blocks all
5. **No idempotency** - Re-trigger = duplicate emails

### Redesign: Message Queue + Async

**API endpoint (fast):**
```javascript
app.post("/api/notifications/notify-all", async (req, res) => {
  const { studentIds, message, type } = req.body;
  
  const jobId = uuidv4();
  
  await Log("backend", "info", "bulk-notif", `Queued job ${jobId} for ${studentIds.length} students`);
  
  await queue.enqueue({
    jobId,
    studentIds,
    message,
    type,
    timestamp: Date.now(),
    retries: 0
  });
  
  res.json({ success: true, jobId, queued: studentIds.length });
});
```

**Background worker (reliable):**
```javascript
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;

async function processNotificationJob(job) {
  const { jobId, studentIds, message, type } = job;
  
  for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
    const batch = studentIds.slice(i, i + BATCH_SIZE);
    
    const dbInserts = batch.map(id => ({
      id: uuidv4(),
      studentId: id,
      message,
      type,
      read: false,
      createdAt: new Date()
    }));
    
    try {
      await db.notifications.insertMany(dbInserts);
      await Log("backend", "info", "bulk-worker", `Inserted batch ${i}/${studentIds.length}`);
    } catch (err) {
      await Log("backend", "error", "bulk-worker", `DB batch failed: ${err.message}`);
      if (job.retries < MAX_RETRIES) {
        job.retries++;
        await queue.requeue(job, delay: 5000);
        return;
      }
    }
    
    for (const student of batch) {
      try {
        await emailService.send(student.email, { title: message, type });
        await Log("backend", "info", "bulk-worker", `Email sent to ${student.email}`);
      } catch (err) {
        await Log("backend", "error", "bulk-worker", `Email failed ${student.email}: ${err.message}`);
        await db.failedDelivery.insert({ studentId: student.id, channel: "email", error: err.message });
      }
      
      const conn = wsConnections.get(student.id);
      if (conn && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify({ event: "notification_received", data: { message, type } }));
      }
    }
  }
  
  await Log("backend", "info", "bulk-worker", `Completed job ${jobId}`);
}
```

### DB + Email: Separate or Together?

**SEPARATE (Recommended)**
- DB first, then email
- If email fails → notification still in system (eventual delivery)
- Faster (no wait for email API)
- Resilient to email service outages
- Track failures in `failedDelivery` table for retry

```sql
INSERT INTO notifications (studentId, message, type, createdAt)
VALUES ($1, $2, $3, NOW());

-- If this succeeds but email fails, student still gets in-app notification
-- Retry email via background job later
```

### Idempotency Key
```javascript
const idempotencyKey = crypto
  .createHash("sha256")
  .update(`${jobId}:${studentId}:${message}`)
  .digest("hex");

const existing = await db.notifications.findOne({ idempotencyKey });
if (existing) return; // Skip duplicate

await db.notifications.insert({ idempotencyKey, studentId, message });
```

### Recovery for 200 Failed Students
```sql
SELECT studentId, email, error FROM failedDelivery 
WHERE channel = 'email' 
AND createdAt > NOW() - INTERVAL '1 hour' 
ORDER BY createdAt DESC;

-- Retry via background job with exponential backoff
```

### Performance: Batch vs Serial
- Serial: 50K × 0.5s = ~7 hours
- Batch 100: 500 × 0.5s = 4 minutes
- Batch 500: 100 × 0.5s = 50 seconds

**Final response to HR:** Job queued in <100ms. Notifications delivered within 5 mins with automatic retry.

---

## Stage 6: Priority Inbox - Smart Notification Ranking

### Problem
Show top 10 most important unread notifications first. Weight: placement > result > event, then by recency.

### Priority Weights
```
Placement: 100
Result: 50
Event: 10
Recency bonus: 1 point per hour old (newer = higher)
```

### SQL Query (Optimized)
```sql
SELECT id, studentId, type, message, createdAt,
  CASE 
    WHEN type = 'placement' THEN 100
    WHEN type = 'result' THEN 50
    WHEN type = 'event' THEN 10
    ELSE 0
  END +
  CAST(EXTRACT(EPOCH FROM (NOW() - createdAt)) / 3600 AS INT) as priority_score
FROM notifications
WHERE studentId = $1 AND read = false AND deletedAt IS NULL
ORDER BY priority_score DESC
LIMIT 10;

CREATE INDEX idx_priority ON notifications(studentId, read, type, createdAt DESC) 
WHERE read = false;
```

### Backend Implementation
```javascript
app.get("/api/notifications/priority", async (req, res) => {
  try {
    const studentId = req.headers["x-user-id"];
    
    const result = await db.query(`
      SELECT id, type, message, createdAt,
        (CASE 
          WHEN type = 'placement' THEN 100
          WHEN type = 'result' THEN 50
          WHEN type = 'event' THEN 10
          ELSE 0
        END) +
        FLOOR(EXTRACT(EPOCH FROM (NOW() - createdAt)) / 3600) as score
      FROM notifications
      WHERE studentId = $1 AND read = false
      ORDER BY score DESC
      LIMIT 10
    `, [studentId]);
    
    await Log("backend", "info", "priority-inbox", `Fetched ${result.rows.length} priority notifications`, { studentId });
    
    res.json({
      success: true,
      data: {
        notifications: result.rows.map(row => ({
          ...row,
          rank: result.rows.indexOf(row) + 1
        }))
      }
    });
  } catch (error) {
    await Log("backend", "error", "priority-inbox", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Frontend Component
```javascript
import { useEffect, useState } from 'react';
import { Log } from './logger';

export function PriorityInbox() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchPriority() {
      try {
        await Log("frontend", "info", "PriorityInbox", "Fetching priority notifications");
        
        const response = await fetch('http://localhost:5000/api/notifications/priority', {
          headers: { 'X-User-ID': 'user_123' }
        });
        
        const { data } = await response.json();
        setNotifications(data.notifications);
        
        await Log("frontend", "info", "PriorityInbox", `Loaded ${data.notifications.length} notifications`);
      } catch (error) {
        await Log("frontend", "error", "PriorityInbox", error.message);
      }
    }
    fetchPriority();
  }, []);

  const typeColor = { placement: "bg-purple-100", result: "bg-blue-100", event: "bg-gray-100" };
  const typeLabel = { placement: "Placement", result: "Result", event: "Event" };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Priority Inbox</h2>
      <div className="space-y-2">
        {notifications.map((notif, idx) => (
          <div key={notif.id} className={`p-4 rounded ${typeColor[notif.type] || 'bg-gray-100'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-sm">{typeLabel[notif.type]}</p>
                <p className="text-gray-800">{notif.message}</p>
                <p className="text-xs text-gray-600 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
              <span className="bg-white px-2 py-1 rounded text-sm font-bold">#{idx + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### How It Works
1. Calculate priority score = type_weight + hours_old
2. Order by score DESC (highest first)
3. Limit to 10 results
4. Rank display shows position

### Performance
- Query: ~5ms with index
- DB load: Minimal (only unread, composite index)
- UX: Top important notifications instant

### Tradeoff
- Recency fades over time (old placement still ranks high)
- Placement weight 100x event weight → placement always wins
- Can adjust weights based on business rules
