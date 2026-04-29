import config from "../config/config.js";

export function apiKeyAuth(req, res, next) {
  const { api_key } = config;

  // Skip if not configured (useful for local dev)
  if (!api_key) {
    return next();
  }

  const clientKey = req.headers["x-api-key"];

  if (!clientKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (clientKey !== api_key) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}
