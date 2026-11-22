// =============================================================================
// SkyRideTour — NextAuth Configuration
// JWT strategy | Credentials provider | Role-aware token + session
// =============================================================================

import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth-utils";
import { clearRateLimit, consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// ─── Type augmentation — attach id + role to JWT token and Session ────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string | null;
      email: string | null;
      phone: string | null;
      role:  UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id:   string;
    role: UserRole;
    phone: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:    string;
    email: string;
    name:  string;
    role:  UserRole;
    phone: string | null;
  }
}

// ─── Auth Options ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  // ── Session via signed JWT cookie (stateless, no DB session table needed) ──
  session: {
    strategy: "jwt",
    maxAge:   7 * 24 * 60 * 60, // 7 days
    updateAge:    24 * 60 * 60, // Re-issue token once per day
  },

  // ── Custom pages — consistent with SkyRideTour routing ────────────────────
  pages: {
    signIn: "/login",
    error:  "/login",        // Error params are appended: /login?error=CredentialsSignin
  },

  // ── JWT signing secret — must be set in .env ──────────────────────────────
  secret: process.env.NEXTAUTH_SECRET,

  // ── Providers ─────────────────────────────────────────────────────────────
  providers: [
    CredentialsProvider({
      id:   "credentials",
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const ip = getClientIp(request.headers?.["x-real-ip"] ?? request.headers?.["x-forwarded-for"]);

        // ── 1. Query database for user account ─────────────────────────────
        try {
          const ipAllowed = await consumeRateLimit("login-ip", ip, 30, 15 * 60 * 1000);
          const emailAllowed = await consumeRateLimit("login-email", email, 10, 15 * 60 * 1000);
          if (!ipAllowed || !emailAllowed) return null;

          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: {
              id:           true,
              name:         true,
              email:        true,
              phone:        true,
              role:         true,
              passwordHash: true,
            },
          });

          if (user && user.passwordHash) {
            const isValid = await verifyPassword(
              credentials.password,
              user.passwordHash
            );

            if (isValid) {
              await clearRateLimit("login-email", email, 15 * 60 * 1000);
              return {
                id:    user.id,
                name:  user.name,
                email: user.email,
                phone: user.phone,
                role:  user.role,
              };
            }
          }
        } catch (error) {
          console.error(
            "[AUTH] Database query failed during authorize:",
            error instanceof Error ? error.name : "UnknownError"
          );
          throw new Error("Authentication service temporarily unavailable.");
        }

        return null; // Maps to "CredentialsSignin" error on client
      },
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.name  = user.name  ?? "";
        token.email = user.email ?? "";
        token.role  = user.role;
        token.phone = user.phone ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id    = token.id;
        session.user.name  = token.name;
        session.user.email = token.email;
        session.user.role  = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },

  // ── Security hardening ───────────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
      },
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`[AUTH] Sign in: ${user.email} (${user.id})`);
    },
    async signOut() {
      console.log(`[AUTH] Sign out`);
    },
  },

  debug: process.env.NODE_ENV === "development",
};