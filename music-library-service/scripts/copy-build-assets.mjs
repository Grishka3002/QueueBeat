import { cpSync, existsSync, mkdirSync } from "node:fs";

const copies = [
  ["src/generated/prisma", "dist/generated/prisma"],
];

for (const [from, to] of copies) {
  if (!existsSync(from)) {
    throw new Error(`Missing build asset: ${from}. Run npm run prisma:generate first.`);
  }

  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

