import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/app/generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              fullName: true,
              passwordHash: true,
              role: true,
              departmentId: true,
              isActive: true,
            },
          });

          if (!user || !user.isActive) return null;

          const valid = await verifyPassword(
            credentials.password as string,
            user.passwordHash,
          );
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            departmentId: user.departmentId,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
        token.departmentId = user.departmentId as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.departmentId = token.departmentId as string;
      }
      return session;
    },
  },
});
