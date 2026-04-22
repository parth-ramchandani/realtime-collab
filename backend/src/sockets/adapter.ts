import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server } from "socket.io";
import { env } from "../utils/env";

export async function configureSocketAdapter(io: Server): Promise<void> {
  if (!env.redisUrl) {
    return;
  }

  try {
    const pubClient = createClient({ url: env.redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO Redis adapter enabled.");
  } catch (error) {
    console.warn("Redis adapter unavailable. Continuing with single-node Socket.IO.", error);
  }
}
