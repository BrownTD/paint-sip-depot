import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyEmailCode } from "@/lib/email-verification";
import { signInSchema } from "@/lib/validations";
import { normalizeEmail } from "@/lib/utils";
import bcrypt from "bcryptjs";

const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
    ? [
        Facebook({
          clientId: process.env.AUTH_FACEBOOK_ID,
          clientSecret: process.env.AUTH_FACEBOOK_SECRET,
        }),
      ]
    : []),
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      verificationCode: { label: "Verification Code", type: "text" },
      authFlow: { label: "Auth Flow", type: "text" },
    },
    async authorize(credentials) {
      const authFlow = credentials?.authFlow === "admin" ? "admin" : "host";
      const verificationCode =
        typeof credentials?.verificationCode === "string" ? credentials.verificationCode : "";

      if (verificationCode) {
        const email = typeof credentials?.email === "string" ? normalizeEmail(credentials.email) : "";
        const userForVerification = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });

        if (!userForVerification || !userForVerification.passwordHash) {
          return null;
        }

        if (!userForVerification.emailVerified) {
          const result = await verifyEmailCode(email, verificationCode);

          if (!result.ok) return null;
        }

        const verifiedUser = await prisma.user.findUnique({
          where: { id: userForVerification.id },
        });

        if (!verifiedUser?.emailVerified) return null;
        if (authFlow === "admin" && verifiedUser.role !== "ADMIN") return null;
        if (authFlow === "host" && verifiedUser.role === "ADMIN") return null;

        return {
          id: verifiedUser.id,
          email: verifiedUser.email,
          name: verifiedUser.name,
          role: verifiedUser.role,
        };
      }

      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const normalizedEmail = normalizeEmail(parsed.data.email);

      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      });

      if (!user || !user.passwordHash) return null;

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;
      if (!user.emailVerified) return null;
      if (authFlow === "admin" && user.role !== "ADMIN") return null;
      if (authFlow === "host" && user.role === "ADMIN") return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "HOST";
      }

      if ((!token.role || !token.id) && token.email) {
        const normalizedEmail = normalizeEmail(token.email);
        const dbUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
          },
          select: { id: true, role: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!user.email) return false;

      if (account?.provider !== "credentials") {
        const normalizedEmail = normalizeEmail(user.email);

        await prisma.user.updateMany({
          where: {
            email: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
          },
          data: {
            email: normalizedEmail,
            emailVerified: new Date(),
          },
        }).catch(() => null);
      }

      return true;
    },
  },
}); 
