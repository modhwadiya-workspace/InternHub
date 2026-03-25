fetch("http://localhost:8080/v1/metadata", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": "myadminsecretkey",
  },
  body: JSON.stringify({
    type: "export_metadata",
    args: {}
  }),
})
  .then(res => res.json())
  .then(data => {
    const sources = data.sources.map(s => s.name);
    console.log("Sources:", sources.join(", "));
  })
  .catch(err => console.error(err));
