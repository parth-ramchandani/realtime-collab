import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { sessionRouter } from "./routes/session.routes";
import { registerSocketHandlers } from "./sockets/socket";
import { env } from "./utils/env";
import { connectMongo } from "./db/mongo";
import { aiRouter } from "./routes/ai.routes";
import { configureSocketAdapter } from "./sockets/adapter";

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/session", sessionRouter);
app.use("/ai/session", aiRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigin
  }
});

registerSocketHandlers(io);

async function startServer() {
  await connectMongo();
  await configureSocketAdapter(io);

  httpServer.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
