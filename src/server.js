import express from "express"
import bolnaRoutes from "./routes/bolna.route.js"

const app = express();

app.use(express.json());

app.use("/webhook", bolnaRoutes);

// Add a root route to test the server
app.get("/", (req, res) => {
  res.send("Bolna Slack Integration Server is running!");
});

const PORT = 5000;
 app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
