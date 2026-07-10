import Fastify from "fastify";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { serializeJson } from "./json.js";
import { registerImportRoutes } from "./routes/imports.js";
import { registerProviderRoutes } from "./routes/providers.js";
import { registerSystemRoutes } from "./routes/system.js";
import { registerTrackRoutes } from "./routes/tracks.js";
import { registerUiRoutes } from "./routes/ui.js";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => ({ ok: true, service: "music-library" }));

app.addHook("preSerialization", async (_request, _reply, payload) =>
  serializeJson(payload),
);

await registerUiRoutes(app);
await registerSystemRoutes(app);
await registerImportRoutes(app);
await registerProviderRoutes(app);
await registerTrackRoutes(app);

const close = async () => {
  app.log.info("Shutting down music-library service");
  await app.close();
  await prisma.$disconnect();
};

process.on("SIGINT", () => {
  void close().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void close().then(() => process.exit(0));
});

await app.listen({ port: config.port, host: "0.0.0.0" });
