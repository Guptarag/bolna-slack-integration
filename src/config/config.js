import dotenv from "dotenv";
dotenv.config();

export default {
  slack_webhook_url: process.env.SLACK_WEBHOOK_URL,
}; 