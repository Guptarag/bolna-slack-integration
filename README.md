# Bolna Slack Integration

A webhook-based integration that receives call events from Bolna and sends notifications to Slack.

## Overview

This server receives webhook events from Bolna's telephony system and forwards call completion summaries to a Slack channel via incoming webhook.

## Project Structure

```
bolna-slack-integration/
├── package.json              # Dependencies and scripts
├── src/
│   ├── server.js             # Express server entry point
│   ├── config/
│   │   └── config.js         # Configuration (Slack webhook URL)
│   ├── routes/
│   │   └── bolna.route.js    # Webhook endpoint handler
│   ├── services/
│   │   ├── notification.service.js  # Event processing logic
│   │   └── slack.service.js         # Slack message formatting & sending
│   └── utils/                # (Reserved for future utilities)
```

## How It Works

1. **Webhook Endpoint** (`POST /webhook/bolna`) - Receives call events from Bolna
2. **Event Processing** - Filters for completed calls and extracts relevant data
3. **Slack Notification** - Formats and sends the call summary to Slack

### Data Flow

```
Bolna → Webhook → notificationService → slackService → Slack Channel
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and add your Slack webhook URL:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Start the server:**
   ```bash
   node src/server.js
   ```

4. **Configure Bolna webhook:**
   Point your Bolna webhook URL to: `http://YOUR_SERVER/webhook/bolna`

---

## How to Extend

### 1. Add More Notification Channels

To send notifications to additional channels (email, SMS, Discord, etc.):

**a) Create a new service:**
```javascript
// src/services/email.service.js
import nodemailer from "nodemailer";

export async function sendEmailNotification(data) {
  const transporter = nodemailer.createTransport({ /* config */ });
  
  await transporter.sendMail({
    from: "notifications@yourapp.com",
    to: "admin@yourapp.com",
    subject: `Call Completed: ${data.id}`,
    text: formatEmailBody(data),
  });
}
```

**b) Update notification service:**
```javascript
// src/services/notification.service.js
import slackService from "./slack.service.js";
import emailService from "./email.service.js";

async function handleBolnaEvent(payload) {
  if (payload.status !== "completed") return;

  const data = extractData(payload);

  // Send to multiple channels
  await Promise.all([
    slackService.sendCallSummary(data),
    emailService.sendEmailNotification(data),
  ]);
}
```

### 2. Add More Event Types

Handle different call statuses (ringing, in-progress, failed):

```javascript
// src/services/notification.service.js
async function handleBolnaEvent(payload) {
  const handlers = {
    "ringing": handleRingingEvent,
    "in-progress": handleInProgressEvent,
    "completed": handleCompletedEvent,
    "failed": handleFailedEvent,
  };

  const handler = handlers[payload.status];
  if (handler) {
    await handler(payload);
  }
}

async function handleFailedEvent(payload) {
  const data = extractData(payload);
  await slackService.sendAlert(`⚠️ Call Failed: ${data.id} - ${data.error}`);
}
```

### 3. Add Data Enrichment

Enhance call data with additional information:

```javascript
// src/services/enrichment.service.js
export async function enrichCallData(payload) {
  const baseData = extractData(payload);
  
  // Fetch additional data from external sources
  const agentInfo = await fetchAgentInfo(baseData.agent_id);
  const customerInfo = await fetchCustomerInfo(baseData.customer_id);
  
  return {
    ...baseData,
    agent_name: agentInfo.name,
    agent_email: agentInfo.email,
    customer_name: customerInfo.name,
    customer_phone: customerInfo.phone,
  };
}
```

### 4. Add Message Templates

Create different Slack message formats:

```javascript
// src/services/slackTemplates.js
export const templates = {
  summary: (data) => `
📞 *Call Completed*
🆔 ID: ${data.id}
⏱ Duration: ${data.duration} sec
  `,
  
  detailed: (data) => `
📞 *Call Completed - Detailed*
🆔 ID: ${data.id}
🤖 Agent: ${data.agent_id}
⏱ Duration: ${data.duration} sec
📝 Transcript: ${data.transcript}
💰 Cost: ${data.cost}
  `,
  
  alert: (data) => `
🚨 *Call Alert*
🆔 ID: ${data.id}
⚠️ Status: ${data.status}
  `,
};
```

### 5. Add Webhook Verification

Secure your webhook endpoint:

```javascript
// src/routes/bolna.route.js
import crypto from "crypto";

router.post("/bolna", async (req, res) => {
  // Verify webhook signature
  const signature = req.headers["x-bolna-signature"];
  const isValid = verifySignature(req.body, signature);
  
  if (!isValid) {
    return res.status(401).send("Invalid signature");
  }
  
  // ... rest of handler
});

function verifySignature(body, signature) {
  const hash = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
}
```

### 6. Add Rate Limiting

Prevent webhook spam:

```bash
npm install express-rate-limit
```

```javascript
// src/server.js
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/webhook", limiter);
app.use("/webhook", bolnaRoutes);
```

### 7. Add Logging & Monitoring

```javascript
// src/services/notification.service.js
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "webhook.log" }),
  ],
});

async function handleBolnaEvent(payload) {
  logger.info("Received webhook", { payload });
  
  try {
    // ... existing logic
    logger.info("Notification sent", { callId: payload.id });
  } catch (error) {
    logger.error("Failed to send notification", { error });
  }
}
```

### 8. Add Database Storage

Store call data for analytics:

```bash
npm install better-sqlite3
```

```javascript
// src/services/database.service.js
import Database from "better-sqlite3";

const db = new Database("calls.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    status TEXT,
    duration INTEGER,
    transcript TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function saveCall(data) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO calls (id, agent_id, status, duration, transcript)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(data.id, data.agent_id, data.status, data.duration, data.transcript);
}
```

### 9. Add Retry Logic

Handle transient failures:

```javascript
// src/services/slack.service.js
async function sendWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

async function sendCallSummary(data) {
  await sendWithRetry(() => axios.post(config.slack_webhook_url, {
    text: formatMessage(data),
  }));
}
```

### 10. Add Environment-Based Config

Use environment variables for better security:

```javascript
// src/config/config.js
export default {
  slack_webhook_url: process.env.SLACK_WEBHOOK_URL,
  log_level: process.env.LOG_LEVEL || "info",
  port: process.env.PORT || 5000,
};
```

```bash
# .env file
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
LOG_LEVEL=debug
PORT=5000
```

---

## API Reference

### Webhook Endpoint

**POST** `/webhook/bolna`

**Request Body:**
```json
{
  "id": "call_12345",
  "agent_id": "agent_001",
  "status": "completed",
  "telephony_data": {
    "duration": 120
  },
  "transcript": "Call transcript text"
}
```

**Response:**
- `200 OK` - Webhook processed successfully
- `500 Error` - Error processing webhook
- `401 Unauthorized` - Invalid signature (if verification enabled)

---

## Testing

Test the webhook locally:

```bash
curl -X POST http://localhost:5000/webhook/bolna \
  -H "Content-Type: application/json" \
  -d '{
    "id": "call_12345",
    "agent_id": "agent_001",
    "status": "completed",
    "telephony_data": { "duration": 120 },
    "transcript": "Test call transcript"
  }'
```

---

## Deployment

### Using PM2 (Production)
```bash
npm install -g pm2
pm2 start src/server.js --name bolna-slack
```

### Using Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src/ ./src/
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## License

ISC