import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { MembershipStatus, UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getPrisma } from "@/lib/db";

const googleCredentials =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
    : null;

const bootstrapAdminEmails = new Set(
  (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "database" },
  providers: googleCredentials ? [Google(googleCredentials)] : [],
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.membershipStatus = user.membershipStatus;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email || !bootstrapAdminEmails.has(user.email.toLowerCase())) {
        return;
      }

      await getPrisma().user.update({
        where: { email: user.email },
        data: {
          role: UserRole.ADMIN,
          membershipStatus: MembershipStatus.APPROVED,
        },
      });
    },
  },
});
