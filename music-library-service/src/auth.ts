import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config.js";

export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers["x-api-key"];
  if (apiKey !== config.apiKey) {
    await reply.code(401).send({ error: "Invalid API key" });
  }
}

