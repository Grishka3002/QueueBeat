import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance, FastifyReply } from "fastify";

const publicDir = join(process.cwd(), "public");

const contentTypes: Record<string, string> = {
  "index.html": "text/html; charset=utf-8",
  "app.css": "text/css; charset=utf-8",
  "app.js": "text/javascript; charset=utf-8",
};

export async function registerUiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => sendPublicFile(reply, "index.html"));
  app.get("/app.css", async (_request, reply) => sendPublicFile(reply, "app.css"));
  app.get("/app.js", async (_request, reply) => sendPublicFile(reply, "app.js"));
}

async function sendPublicFile(reply: FastifyReply, fileName: string) {
  const body = await readFile(join(publicDir, fileName), "utf8");
  return reply.type(contentTypes[fileName] ?? "text/plain; charset=utf-8").send(body);
}
