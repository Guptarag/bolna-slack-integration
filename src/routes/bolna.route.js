import express from "express"
import notificationService from "../services/notification.service.js"
const router = express.Router();

router.post("/bolna", async (req, res) => {
  try {
    const payload = req.body;
    console.log(payload)


    await notificationService.handleBolnaEvent(payload);

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing webhook");
  }
});

export default router;