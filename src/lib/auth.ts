import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "ADMIN" | "OWNER" | "WAREHOUSE_OWNER" | "CLIENT";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "OWNER" | "WAREHOUSE_OWNER" | "CLIENT";
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // TEMPORARY LOCAL DEVELOPMENT OVERRIDE
        if (credentials.email === "bharatgodam.techsolutions@gmail.com" && credentials.password === "admin@123") {
          return { id: "admin-root", name: "bharatgodam", email: credentials.email, role: "ADMIN", approvalStatus: "APPROVED" } as any;
        }

        const cleanEmail = credentials.email.trim().toLowerCase();

        // 🛡️ EXPLICIT DATABASE QUERY (No Caching)
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const user = await db.collection("users").findOne({ 
          email: cleanEmail 
        });

        if (!user) {
          throw new Error("AUTHENTICATION_FAILED: Identity not found in registry.");
        }

        // 🛡️ ADMIN APPROVAL GATE
        if (user.approvalStatus === "PENDING") {
          throw new Error("ACCOUNT_PENDING: Verification in progress. Please wait for Admin activation.");
        }
        if (user.approvalStatus === "REJECTED") {
          throw new Error("ACCOUNT_REJECTED: Access denied by administration.");
        }

        console.log("Input Password Length:", credentials.password.length);
        console.log("DB Password Stored:", user.password);

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
          approvalStatus: user.approvalStatus
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.approvalStatus = (user as any).approvalStatus;
        }
        return token;
      } catch (error) {
        console.error("[NEXTAUTH_JWT_ERROR]", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as any;
          (session.user as any).approvalStatus = token.approvalStatus;
        }
        return session;
      } catch (error) {
        console.error("[NEXTAUTH_SESSION_ERROR]", error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      } catch (error) {
        console.error("[NEXTAUTH_REDIRECT_ERROR]", error);
        return baseUrl;
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
