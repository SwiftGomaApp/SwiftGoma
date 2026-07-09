const { Server } = require("socket.io");
const cookie = require("cookie");
const { verifyAccessToken } = require("../shared/utils/cookie.utils");
const { prisma } = require("./db.config");
const { node_env, origin } = require("./env.config");

let io = null;

const extractToken = (socket) => {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }
  const rawCookie = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(rawCookie);
  return cookies["accessToken"] || null;
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        origin || "http://localhost:3000",
        ...(node_env !== "production" ? ["*"] : []),
      ],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) return next(new Error("NON_AUTHENTIFIE"));

      const payload = verifyAccessToken(token);

      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              role: true,
              isDeleted: true,
              isBlocked: true,
              isActive: true,
            },
          },
        },
      });

      if (!session) return next(new Error("SESSION_INVALIDE"));
      if (session.user.isDeleted) return next(new Error("COMPTE_SUPPRIME"));
      if (session.user.isBlocked) return next(new Error("COMPTE_BLOQUE"));
      if (!session.user.isActive) return next(new Error("COMPTE_INACTIF"));

      socket.userId = session.user.id;
      socket.userRole = session.user.role;
      socket.sessionId = session.id;
      next();
    } catch {
      next(new Error("TOKEN_INVALIDE"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    console.log(
      `Connected — user:${socket.userId} role:${socket.userRole} (${socket.id})`,
    );

    socket.on("delivery:join", ({ orderId }) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
      console.log(`📦 user:${socket.userId} joined order:${orderId}`);
    });

    socket.on("delivery:leave", ({ orderId }) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    socket.on("delivery:location", ({ orderId, lat, lng }) => {
      if (socket.userRole !== "DELIVERER") return;
      if (!orderId || lat == null || lng == null) return;
      io.to(`order:${orderId}`).emit("delivery:location", {
        orderId,
        lat,
        lng,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("delivery:status", ({ orderId, status, message }) => {
      if (socket.userRole !== "DELIVERER") return;
      if (!orderId || !status) return;
      io.to(`order:${orderId}`).emit("delivery:status", {
        orderId,
        status,
        message: message ?? null,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Disconnected — user:${socket.userId} — ${reason}`);
    });
  });

  console.log("Socket.io initialized");

  const publicNs = io.of("/public");
  publicNs.on("connection", (socket) => {
    socket.join("status");
    socket.on("disconnect", () => {});
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

const emitToOrder = (orderId, event, data) => {
  if (!io) return;
  io.to(`order:${orderId}`).emit(event, data);
};

const emitStatusUpdate = (payload) => {
  if (!io) return;
  io.of("/public").to("status").emit("status:updated", payload);
};

const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized.");
  return io;
};

module.exports = {
  initSocket,
  emitToUser,
  emitToOrder,
  emitStatusUpdate,
  getIo,
};
