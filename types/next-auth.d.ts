import type { Role } from "@/app/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    departmentId: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      departmentId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    departmentId: string;
  }
}
