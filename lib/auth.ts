import CredentialsProvider from "next-auth/providers/credentials";
import { gqlAdmin } from "./hasura";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},

      async authorize(credentials: any) {
        try {
          // 🔹 1. Get user by email
          const emailQuery = `
            query ($email:String!) {
              users(where:{email:{_eq:$email}}) {
                id
                name
                email
                password
                role
                department_id
                gender
                contact_number
              }
            }
          `;

          const emailRes = await gqlAdmin(emailQuery, {
            email: credentials?.email,
          });

          if (emailRes?.errors) {
            console.error("GraphQL errors in auth:", emailRes.errors);
            return null;
          }

          const user = emailRes?.data?.users?.[0];
          if (!user) return null;

          // 🔹 2. Password check (bcrypt only)
          let passwordMatch = false;
          try {
            passwordMatch = await bcrypt.compare(
              credentials?.password,
              user.password
            );
          } catch (err) {
            passwordMatch = false;
          }

          if (!passwordMatch) return null;

          // 🔹 3. Role-based extra data (intern)
          if (user.role === "intern") {
            const internQuery = `
              query ($user_id: uuid!) {
                interns(where: {user_id: {_eq: $user_id}}) {
                  college
                  joining_date
                  date_of_birth
                  degree
                }
              }
            `;

            const internRes = await gqlAdmin(internQuery, {
              user_id: String(user.id),
            });

            if (!internRes?.errors) {
              const internData = internRes?.data?.interns?.[0];

              if (internData) {
                user.college = internData.college;
                user.joining_date = internData.joining_date;
                user.date_of_birth = internData.date_of_birth;
                user.degree = internData.degree;
              }
            }
          }

          // 🔹 4. Remove password before returning (security)
          delete user.password;

          return user;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 60, // 30 minutes (1800 seconds)
  },

  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // 🔹 Update session manually
      if (trigger === "update" && session?.user) {
        token.user = { ...token.user, ...session.user };
      }
      // 🔹 First login
      else if (user) {
        token.user = user;
      }

      return token;
    },

    async session({ session, token }: any) {
      session.user = token.user;

      if (token?.user) {
        const encodedToken = jwt.sign(
          {
            "https://hasura.io/jwt/claims": {
              "x-hasura-allowed-roles": [token.user.role || "user"],
              "x-hasura-default-role": token.user.role || "user",
              "x-hasura-user-id": String(token.user.id),
            },
          },
          process.env.HASURA_JWT_SECRET || "",
          { algorithm: "HS256" }
        );
        session.hasuraToken = encodedToken;
      }
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};