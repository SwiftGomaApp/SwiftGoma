const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { env } = require("./env");
const { getPrismaClient } = require("./prisma");
const { getRedisClient } = require("./redis");

let io = null;

const LOCATION_CACHE_TTL_SECONDS = 300;

function locationCacheKey(orderId, role) {
  return `order:${orderId}:location:${role}`;
}

async function assertCanAccessOrder(userId, orderId) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      buyerId: true,
      rider: { select: { userId: true } },
      shop: { select: { sellerProfile: { select: { userId: true } } } },
    },
  });
  if (!order) return null;

  if (order.buyerId === userId) return "BUYER";
  if (order.rider && order.rider.userId === userId) return "RIDER";
  if (order.shop.sellerProfile.userId === userId) return "SELLER";
  return null;
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("UNAUTHORIZED"));

    try {
      const payload = jwt.verify(token, env.jwt.accessSecret);
      socket.userId = payload.sub || payload.userId;
      next();
    } catch (err) {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on("order:join", async (orderId, ack) => {
      try {
        const role = await assertCanAccessOrder(socket.userId, orderId);
        if (!role) {
          if (ack) ack({ error: "FORBIDDEN" });
          return;
        }

        socket.join(`order:${orderId}`);

        const redis = getRedisClient();
        let lastKnown = { buyer: null, rider: null };

        if (redis) {
          const [buyerLoc, riderLoc] = await Promise.all([
            redis.get(locationCacheKey(orderId, "BUYER")),
            redis.get(locationCacheKey(orderId, "RIDER")),
          ]);
          lastKnown = {
            buyer: buyerLoc ? JSON.parse(buyerLoc) : null,
            rider: riderLoc ? JSON.parse(riderLoc) : null,
          };
        } else {
          console.warn(
            "[socket] Redis unavailable — skipping last-known-location cache.",
          );
        }

        if (ack) ack({ role, lastKnown });
      } catch (err) {
        console.error("[socket] order:join failed:", err.message);
        if (ack) ack({ error: "INTERNAL_ERROR" });
      }
    });

    socket.on("location:update", async ({ orderId, latitude, longitude }) => {
      try {
        const role = await assertCanAccessOrder(socket.userId, orderId);
        if (!role || (role !== "BUYER" && role !== "RIDER")) return;
        if (typeof latitude !== "number" || typeof longitude !== "number")
          return;

        const payload = {
          role,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        };

        const redis = getRedisClient();
        if (redis) {
          await redis.set(
            locationCacheKey(orderId, role),
            JSON.stringify(payload),
            "EX",
            LOCATION_CACHE_TTL_SECONDS,
          );
        } else {
          console.warn(
            "[socket] Redis unavailable — location update not cached.",
          );
        }

        socket.to(`order:${orderId}`).emit("location:update", payload);
      } catch (err) {
        console.error("[socket] location:update failed:", err.message);
      }
    });

    socket.on("order:leave", (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io)
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToOrder(orderId, event, payload) {
  if (!io) return;
  io.to(`order:${orderId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToUser, emitToOrder };
