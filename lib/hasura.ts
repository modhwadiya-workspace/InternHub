export const HASURA_URL = "http://localhost:8082/v1/graphql";
export const ADMIN_SECRET = "myadminsecretkey";

export async function gql(query: string, variables: any = {}) {
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