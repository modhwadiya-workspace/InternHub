import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
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
