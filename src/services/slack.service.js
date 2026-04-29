import axios from "axios";
import config from '../config/config.js';
import { apiKeyAuth  } from "../middleware/apikey.middleware.js";

async function sendCallSummary(data) {
  const message = formatMessage(data);

  await axios.post(`${config.slack_webhook_url}`, {
    text: message,
  });
}

function formatMessage({ id, agent_id, duration, transcript }) {
  return `
📞 *Call Completed*
🆔 ID: ${id}
🤖 Agent: ${agent_id}
⏱ Duration: ${duration} sec
📝 Transcript:${transcript}
`;
}

export default {
  sendCallSummary,
};