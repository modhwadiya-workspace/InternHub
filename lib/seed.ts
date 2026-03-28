import { gql } from "./hasura";
import bcrypt from "bcryptjs";

export async function ensureAdminExists() {
  try {
    console.log("🛠 Checking for default admin user...");

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@internhub.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const ADMIN_NAME = "Administrator";

    // 1. Check if an admin already exists
    const checkAdminQuery = `
      query {
        users(where: {role: {_eq: "admin"}}) {
          id
        }
      }
    `;

    const adminCheckRes = await gql(checkAdminQuery);
    if (adminCheckRes?.errors) {
      console.error("❌ Error checking for admin:", adminCheckRes.errors);
      return;
    }

    if (adminCheckRes?.data?.users?.length > 0) {
      console.log("✅ Admin user already exists. Skipping seed.");
      return;
    }

    // 2. Hash password and insert Admin User (No department association required)
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const createAdminMutation = `
      mutation ($name: String!, $email: String!, $password: String!, $role: String!) {
        insert_users_one(object: {
          name: $name,
          email: $email,
          password: $password,
          role: $role,
          contact_number: "0000000000"
        }) {
          id
        }
      }
    `;

    const createAdminRes = await gql(createAdminMutation, {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin"
    });

    if (createAdminRes?.errors) {
      console.error("❌ Failed to create admin user:", createAdminRes.errors);
    } else {
      console.log(`🚀 Created default admin user: ${ADMIN_EMAIL}`);
    }

  } catch (error) {
    console.error("❌ Unexpected error during admin seeding:", error);
  }
}
