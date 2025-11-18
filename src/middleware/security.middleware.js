import aj from "#config/arcjet.js";
import logger from "#config/logger.js";
import { slidingWindow } from "@arcjet/node";

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || "guest";
    let limit;
    let message;
    switch (role) {
      case "admin":
        limit = 20;
        message = "You have reached the maximum number of admin requests";
        break;
      case "user":
        limit = 10;
        message = "You have reached the maximum number of user requests";
        break;
      case "guest":
        limit = 5;
        message = "You have reached the maximum number of guest requests";
        break;
    }
    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        maxRequests: limit,
        interval: "1m",
        name: `${role}-rate-limit`,
      }),
    );
    const decision = await client.protect(req);
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn(
        `Blocked request from bot: ${req.ip} - ${req.get("user-agent")} - ${req.path}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are not allowed",
      });
    }
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn(
        `Shield request from: ${req.ip} - ${req.get("user-agent")} - ${req.path} - ${req.method}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        message: "Requests blocked by shield",
      });
    }
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn(
        `Rate limit exceded by: ${req.ip} - ${req.get("user-agent")} - ${req.path} - ${req.method}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        message: "Requests blocked by rate limit",
      });
    }
    next();
  } catch (error) {
    console.error("Arcjet Middleware Error protecting request:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export default securityMiddleware;
