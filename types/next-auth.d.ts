import NextAuth, { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    hasuraToken?: string;
    user: {
      id?: string | null;
      role?: string | null;
      department_id?: number | null;
      college?: string | null;
      gender?: string | null;
      contact_number?: string | null;
      joining_date?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: any;
  }
}
