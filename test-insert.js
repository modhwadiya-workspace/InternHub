fetch('http://localhost:8080/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': 'myadminsecretkey'
  },
  body: JSON.stringify({
    query: `mutation ($name:String!, $email:String!, $password:String!, $role:String!, $department_id:Int!, $gender:String, $contact_number:String!) {
      insert_users_one(object: {
        name: $name,
        email: $email,
        password: $password,
        role: $role,
        department_id: $department_id,
        gender: $gender,
        contact_number: $contact_number
      }) {
        id
      }
    }`,
    variables: {
      name: "Test User 20",
      email: "t21@example.com",
      password: "123",
      role: "intern",
      department_id: 1,
      gender: "male",
      contact_number: "1234567890"
    }
  })
}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)))
