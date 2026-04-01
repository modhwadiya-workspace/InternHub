import { metadata } from "../lib/hasura";

async function checkSources() {
  console.log("Checking Hasura sources...");
  try {
    const res = await metadata("export_metadata", {});
    console.log("Sources found in metadata:");
    res.sources.forEach((s: any) => {
      console.log(`- ${s.name} (${s.kind}) - ${s.tables.length} tables tracked`);
    });
  } catch (e) {
    console.error("Failed to export metadata:", e);
  }
}

checkSources();
