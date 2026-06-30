const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");

const applySecurityMiddleware = (app) => {
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(hpp());
};

module.exports = { applySecurityMiddleware };
