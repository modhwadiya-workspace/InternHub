fetch('http://localhost:8080/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': 'myadminsecretkey'
  },
  body: JSON.stringify({
    query: `query {
      users(where: {role: {_eq: "intern"}}, limit: 1) {
        id
        email
      }
    }`
  })
}).then(r=>r.json()).then(d => {
  const user = d.data.users[0];
  console.log("Logged in User ID:", user.id);
  
  const internQ = `query ($user_id: uuid!) {
    interns(where: {user_id: {_eq: $user_id}}) {
       college: collage
       joining_date
    }
  }`;
  
  return fetch('http://localhost:8080/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': 'myadminsecretkey'
    },
    body: JSON.stringify({ query: internQ, variables: { user_id: user.id } })
  }).then(r=>r.json());
}).then(d => console.log("Intern Query Result:", JSON.stringify(d, null, 2)))
