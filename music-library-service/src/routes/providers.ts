import type { FastifyInstance } from "fastify";
import { requireApiKey } from "../auth.js";
import {
  createHitmosRun,
  getHitmosRun,
  processHitmosCatalogItems,
  ProviderImportError,
  queueHitmosCatalogItems,
  sealHitmosRun,
  type CreateHitmosRunInput,
  type HitmosCatalogItemInput,
} from "../provider-import-service.js";

type QueueItemsInput = {
  items?: HitmosCatalogItemInput[];
};

type ProcessInput = {
  limit?: number;
};

export async function registerProviderRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/providers/hitmos/runs", { preHandler: requireApiKey }, async (request, reply) => {
    try {
      const run = await createHitmosRun(request.body as CreateHitmosRunInput);
      return reply.code(201).send(run);
    } catch (error) {
      if (error instanceof ProviderImportError) {
        return reply.code(400).send({ error: error.message });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Could not create the Hitmos import run" });
    }
  });

  app.get("/v1/providers/hitmos/runs/:id", { preHandler: requireApiKey }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = await getHitmosRun(id);
    if (!run) return reply.code(404).send({ error: "Hitmos import run was not found" });
    return run;
  });

  app.post(
    "/v1/providers/hitmos/runs/:id/items",
    { preHandler: requireApiKey },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as QueueItemsInput;
      try {
        const result = await queueHitmosCatalogItems(id, body?.items ?? []);
        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof ProviderImportError) {
          return reply.code(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Could not queue Hitmos catalog items" });
      }
    },
  );

  app.post(
    "/v1/providers/hitmos/runs/:id/process",
    { preHandler: requireApiKey },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as ProcessInput;
      try {
        return await processHitmosCatalogItems(id, body?.limit);
      } catch (error) {
        if (error instanceof ProviderImportError) {
          return reply.code(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Could not process Hitmos catalog items" });
      }
    },
  );

  app.post(
    "/v1/providers/hitmos/runs/:id/seal",
    { preHandler: requireApiKey },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        return await sealHitmosRun(id);
      } catch (error) {
        if (error instanceof ProviderImportError) {
          return reply.code(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Could not seal the Hitmos import run" });
      }
    },
  );
}
