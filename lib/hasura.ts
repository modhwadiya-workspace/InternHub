export const HASURA_URL = "http://localhost:8080/v1/graphql";
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