const query = `
  query {
    users_type: __type(name: "users") {
      name
      fields {
        name
      }
    }
  }
`;

fetch("http://localhost:8080/v1/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": "myadminsecretkey",
  },
  body: JSON.stringify({ query }),
})
  .then((res) => res.json())
  .then((data) => {
    const fields = data.data;
    console.log("USERS:", fields.users_type?.fields?.map(f => f.name).join(", "));
  })
  .catch((err) => console.error(err));
