import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

function buildConnectionString(): string {
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

const pool = new Pool({
  connectionString: buildConnectionString(),
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Créer un département par défaut si aucun n'existe
  let dept = await prisma.department.findFirst();
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: "Direction Générale" },
    });
    console.log("✓ Département créé :", dept.name);
  } else {
    console.log("→ Département existant utilisé :", dept.name);
  }

  const email = "mabibe.bankati@facamstairway.com";
  const passwordHash = await bcrypt.hash("R7v@K2m#L9xPq4!T", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      departmentId: dept.id,
    },
    create: {
      fullName: "Mabibè BANKATI",
      email,
      passwordHash,
      role: "ADMIN",
      departmentId: dept.id,
    },
    select: { id: true, fullName: true, email: true, role: true },
  });

  console.log("✓ Compte Admin prêt :");
  console.log("  Email :", user.email);
  console.log("  Rôle  :", user.role);
  console.log("  Nom   :", user.fullName);
}

main()
  .catch((e) => {
    console.error("Erreur seed :", e);
    process.exit(1);
  })
  .finally(() => pool.end());
