// =============================================================================
// SkyRideTour — NextAuth Configuration
// JWT strategy | Credentials provider | Role-aware token + session
// =============================================================================

import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// ─── Type augmentation — attach id + role to JWT token and Session ────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string | null;
      email: string | null;
      role:  UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id:   string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:    string;
    email: string;
    name:  string;
    role:  UserRole;
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

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        // ── 1. Query database for user account ─────────────────────────────
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id:           true,
              name:         true,
              email:        true,
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
              return {
                id:    user.id,
                name:  user.name,
                email: user.email,
                role:  user.role,
              };
            }
          }
        } catch (err) {
          console.error("[AUTH] Database query error in authorize:", err);
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
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id    = token.id;
        session.user.name  = token.name;
        session.user.email = token.email;
        session.user.role  = token.role;
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