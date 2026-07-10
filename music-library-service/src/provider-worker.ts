import { CatalogProvider, ProviderRunStatus } from "./generated/prisma/index.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { processHitmosCatalogItems } from "./provider-import-service.js";

const idleDelayMs = 2_000;

async function runOnce(): Promise<number> {
  const runs = await prisma.providerImportRun.findMany({
    where: {
      provider: CatalogProvider.HITMOS,
      status: ProviderRunStatus.RUNNING,
    },
    select: { id: true },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  let imported = 0;
  for (const run of runs) {
    const result = await processHitmosCatalogItems(run.id, config.providers.maxProcessBatch);
    imported += result.imported;
  }
  return imported;
}

async function main() {
  for (;;) {
    try {
      const imported = await runOnce();
      if (imported === 0) {
        await new Promise((resolve) => setTimeout(resolve, idleDelayMs));
      }
    } catch (error) {
      console.error("Provider worker iteration failed", error);
      await new Promise((resolve) => setTimeout(resolve, idleDelayMs));
    }
  }
}

const close = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => void close());
process.on("SIGTERM", () => void close());

void main();
