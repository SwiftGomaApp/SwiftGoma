require("./src/instrument");

const createApp = require("./src/app");
const { env } = require("./src/config/env");

const app = createApp();

app.listen(env.port, () => {
  console.log(`Swiftgoma API listening on port ${env.port} [${env.nodeEnv}]`);
});
