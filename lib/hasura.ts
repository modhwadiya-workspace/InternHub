export const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_ENDPOINT || "http://127.0.0.1:8082/v1/graphql";
export const ADMIN_SECRET = process.env.NEXTAUTH_HASURA_ADMIN_SECRET || "myadminsecretkey";

// Safe User Query: ONLY uses the provided JWT Token. Will throw unauthenticated error if no token is passed.
export async function gql(query: string, variables: any = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(HASURA_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// Admin System Query: Bypasses Hasura Roles. ONLY use this in auth.ts (Login) & Password Resets!
export async function gqlAdmin(query: string, variables: any = {}) {
  const res = await fetch(HASURA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export async function metadata(type: string, args: any) {
  const METADATA_URL = HASURA_URL.replace("/graphql", "/metadata");
  const res = await fetch(METADATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ type, args }),
  });
  return res.json();
}