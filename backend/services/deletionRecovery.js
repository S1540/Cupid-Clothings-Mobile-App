// Only resumes jobs created by the authenticated, recent-login deletion route.
// Never discovers accounts to delete from email, phone or missing profiles.
async function resumeRequestedDeletions(db, deleteUserAccount) {
  const jobs = await db.collection("accountDeletions").where("state", "==", "pending").limit(100).get();
  let completed = 0;
  let failed = 0;
  for (const job of jobs.docs) {
    try { await deleteUserAccount(job.id); completed++; }
    catch { failed++; }
  }
  return { completed, failed };
}
module.exports = { resumeRequestedDeletions };
