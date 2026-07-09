const { PrismaClient } = require("@prisma/client");
const { node_env } = require("./env.config");

const prisma = new PrismaClient({
  log: node_env === "development" ? ["query", "error", "warn"] : ["error"],
});

module.exports = { prisma };
