export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongoUri: process.env.MONGO_URI ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  redisUrl: process.env.REDIS_URL ?? "",
  editorActivityMinIntervalMs: Number(process.env.EDITOR_ACTIVITY_MIN_INTERVAL_MS ?? 1200)
};
