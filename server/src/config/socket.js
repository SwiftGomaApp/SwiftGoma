const { Server, Socket } = require("socket.io");
const jwt = require("jsonwebtoken");
const { env } = require("./env");

let io = null;

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

    socket.on("disconnect", () => {
      // room membership cleans up automatically
    });
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

module.exports = { initSocket, getIO, emitToUser };
