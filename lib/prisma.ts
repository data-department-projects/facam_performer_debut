import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// AWS RDS uses a self-signed cert — rejectUnauthorized: false skips cert verification.
// NODE_TLS_REJECT_UNAUTHORIZED=0 must also be set in .env.local for the initial TLS handshake.
//
// max/idleTimeoutMillis sont volontairement bas : sur Vercel, chaque instance de fonction
// serverless "chaude" ouvre son propre pool vers AWS RDS (pas de pooler dédié type PgBouncer
// devant la base) — un pool par défaut (illimité) multiplié par plusieurs instances
// concurrentes épuise vite les connexions disponibles côté RDS, ce qui se traduit par des
// pages qui échouent à charger de façon intermittente, sur n'importe quelle route.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Mis en cache dans tous les environnements, pas seulement hors production : c'est en
// production qu'une instance de fonction serverless "chaude" a le plus de chances de
// traiter plusieurs requêtes successives, et c'est justement là qu'il faut réutiliser le
// pool existant plutôt que d'en ouvrir un nouveau à chaque exécution.
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ["error", "warn"] });

globalForPrisma.prisma = prisma;
