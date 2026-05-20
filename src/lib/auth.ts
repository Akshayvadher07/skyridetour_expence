import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── Type Augmentation ────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "ADMIN" | "OWNER" | "CLIENT";
      approved?: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: "ADMIN" | "OWNER" | "CLIENT";
    approved?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Optional flag to route to Kido AI auth
        app: { label: "App", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const cleanEmail = credentials.email.trim().toLowerCase();

        // ── Kido AI auth path ──────────────────────────────────────────────
        if (credentials.app === "kido") {
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!user) {
            throw new Error("KIDO_AUTH_FAILED: Account not found.");
          }

          // Admin approval gate
          if (!user.approved && user.role !== "ADMIN") {
            throw new Error(
              "KIDO_PENDING: Your account is awaiting admin approval."
            );
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("KIDO_AUTH_FAILED: Invalid credentials.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role as "ADMIN" | "CLIENT",
            approved: user.approved,
          };
        }

        // ── BharatGodam legacy auth path ──────────────────────────────────
        if (
          credentials.email === "bharatgodam.techsolutions@gmail.com" &&
          credentials.password === "admin@123"
        ) {
          return {
            id: "admin-root",
            name: "bharatgodam",
            email: credentials.email,
            role: "ADMIN",
            approved: true,
          } as any;
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const user = await db.collection("users").findOne({ email: cleanEmail });

        if (!user) {
          throw new Error("AUTHENTICATION_FAILED: Identity not found in registry.");
        }
        if (user.approvalStatus === "PENDING") {
          throw new Error(
            "ACCOUNT_PENDING: Verification in progress. Please wait for Admin activation."
          );
        }
        if (user.approvalStatus === "REJECTED") {
          throw new Error("ACCOUNT_REJECTED: Access denied by administration.");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isCorrectPassword) {
          throw new Error("AUTHENTICATION_FAILED: Invalid credential pair.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as any,
          approved: user.approvalStatus === "APPROVED",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.approved = user.approved;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        (session.user as any).approved = token.approved;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
