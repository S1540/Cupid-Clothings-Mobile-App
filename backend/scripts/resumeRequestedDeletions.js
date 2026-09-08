// Operational recovery, not a migration. Dry-run unless explicitly enabled.
require("dotenv").config();
const { db } = require("../firebaseAdmin");
async function main() {
  if (!process.argv.includes("--execute")) {
    const pending = await db.collection("accountDeletions").where("state", "==", "pending").get();
    console.log(JSON.stringify({ pendingRequests: pending.size, execution: false }));
    return;
  }
  if (process.env.ALLOW_REQUESTED_DELETION_RECOVERY !== "true") throw new Error("Explicit operator configuration is required.");
  const { deleteUserAccount } = require("../services/userService");
  const { resumeRequestedDeletions } = require("../services/deletionRecovery");
  console.log(JSON.stringify(await resumeRequestedDeletions(db, deleteUserAccount)));
}
main().catch(() => { console.error("Deletion recovery did not finish. No account details have been logged."); process.exitCode = 1; });
