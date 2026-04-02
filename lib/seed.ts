import { gqlAdmin, metadata } from "./hasura";
import bcrypt from "bcryptjs";

export async function ensureAdminExists() {
  try {
    console.log("🛠 Checking for default admin user...");

    // 0. Ensure Hasura is configured correctly (Add source and track tables)
    console.log("🛠 Ensuring Hasura metadata is configured...");
    const DB_URL = "postgres://postgres:postgres@postgres:5432/internhub";
    
    // Attempt to add source (might already exist)
    await metadata("pg_add_source", {
      name: "default",
      configuration: {
        connection_info: {
          database_url: DB_URL,
          pool_settings: { max_connections: 50, idle_timeout: 180, retries: 1 }
        }
      }
    });

    // Track required tables
    const tables = ["users", "departments", "interns", "announcements", "password_reset_otps"];
    for (const table of tables) {
      await metadata("pg_track_table", {
        source: "default",
        table: { schema: "public", name: table }
      });
    }

    // Track relationships (Ignore errors if already exist)
    try {
      await metadata("pg_create_object_relationship", {
        source: "default",
        table: { schema: "public", name: "users" },
        name: "department",
        using: { foreign_key_constraint_on: "department_id" }
      });
    } catch (e) {}

    try {
      await metadata("pg_create_array_relationship", {
        source: "default",
        table: { schema: "public", name: "users" },
        name: "interns",
        using: { foreign_key_constraint_on: { table: { schema: "public", name: "interns" }, column: "user_id" } }
      });
    } catch (e) {}

    try {
      await metadata("pg_create_object_relationship", {
        source: "default",
        table: { schema: "public", name: "interns" },
        name: "user",
        using: { foreign_key_constraint_on: "user_id" }
      });
    } catch (e) {}

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@internhub.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
    const ADMIN_NAME = "Administrator";

    // 1. Check if an admin already exists
    const checkAdminQuery = `
      query {
        users(where: {role: {_eq: "admin"}}) {
          id
        }
      }
    `;

    const adminCheckRes = await gqlAdmin(checkAdminQuery);
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

    const createAdminRes = await gqlAdmin(createAdminMutation, {
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
