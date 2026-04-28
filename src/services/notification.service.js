
import slackService from "./slack.service.js"

async function handleBolnaEvent(payload) {
  // filter only call end event
  if (payload.status !== "completed") {
    return;
  }


  const data = extractData(payload);

  // can add more channels later (email, SMS, etc.)
  await slackService.sendCallSummary(data);
}

function extractData(payload) {
  return {
    id: payload.id,
    agent_id: payload.agent_id,
    duration: payload.telephony_data?.duration || 0,
    transcript: payload.transcript || "No transcript",
  };
}

export default {
  handleBolnaEvent,
};

