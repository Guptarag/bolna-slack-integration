import express from "express"
import bolnaRoutes from "./routes/bolna.route.js"
import config from './config/config.js'
import { apiKeyAuth } from "./middleware/apiKey.middleware.js";
const app = express();

app.use(express.json());

app.use("/webhook",apiKeyAuth, bolnaRoutes);

// Add a root route to test the server
app.get("/", (req, res) => {
  res.send("Bolna Slack Integration Server is running!");
});




app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
