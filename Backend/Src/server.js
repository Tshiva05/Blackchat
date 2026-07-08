const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets/chatSocket");

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  initSocket(io);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
