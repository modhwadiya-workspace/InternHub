import CredentialsProvider from "next-auth/providers/credentials";
import { gql } from "./hasura";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any) {
        const query = `query ($email:String!, $password:String!) {
          users(where:{email:{_eq:$email}, password:{_eq:$password}}) {
            id
            name
            email
            role
            department_id
            gender
          }
        }`;

        const res = await gql(query, {
          email: credentials.email,
          password: credentials.password,
        });

        if (res.errors) {
          console.error("GraphQL errors in auth:", res.errors);
          return null;
        }

        const user = res?.data?.users?.[0];
        if (user) return user;
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }: any) {
      session.user = token.user;
      return session;
    },
  },
};