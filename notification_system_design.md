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
