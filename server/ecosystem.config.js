module.exports = {
  apps: [
    {
      name: "swiftgoma-api",
      script: "server.js",
      cwd: __dirname,
      exec_mode: "cluster",
      instances: 2,
      max_memory_restart: "400M",

      env: {
        NODE_ENV: "production",
      },
      min_uptime: "10s",
      max_restarts: 10,
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      time: true,
    },
  ],
};
