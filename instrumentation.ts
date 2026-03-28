
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminExists } = await import("./lib/seed");
    await ensureAdminExists();
  }
}
