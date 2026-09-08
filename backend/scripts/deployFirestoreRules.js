// Explicit production rules release. Does not write or migrate Firestore documents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { GoogleAuth } = require('google-auth-library');
const root = path.resolve(__dirname, '../..');
async function main() {
  if (!process.argv.includes('--deploy')) throw new Error('EXPLICIT_DEPLOY_REQUIRED');
  const backupArg = process.argv[process.argv.indexOf('--backup') + 1];
  if (!process.argv.includes('--backup') || !backupArg) throw new Error('BACKUP_REQUIRED');
  const privateRoot = fs.realpathSync(path.join(root, 'auth-migration-private-reports'));
  const backup = fs.realpathSync(path.resolve(root, backupArg));
  if (!backup.startsWith(privateRoot + path.sep)) throw new Error('INVALID_BACKUP_LOCATION');
  const manifest = JSON.parse(fs.readFileSync(path.join(backup, 'manifest.json'), 'utf8'));
  if (!manifest.completed || !manifest.roundTripVerified || Date.now() - Date.parse(manifest.readTime) > 7200000) throw new Error('RECENT_VERIFIED_BACKUP_REQUIRED');
  const credentials = JSON.parse(fs.readFileSync(path.join(root, 'backend/serviceAccountKey.json'), 'utf8'));
  const native = JSON.parse(fs.readFileSync(path.join(root, 'google-services.json'), 'utf8'));
  if (credentials.project_id !== native.project_info.project_id) throw new Error('PROJECT_MISMATCH');
  const content = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  const client = await new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient();
  const resource = `projects/${credentials.project_id}/releases/cloud.firestore`;
  const request = async (name, method = 'GET', data) => (await client.request({ url: `https://firebaserules.googleapis.com/v1/${name}`, method, ...(data ? { data } : {}), timeout: 30000, retry: false })).data;
  const previous = await request(resource);
  const oldRules = await request(previous.rulesetName);
  const oldContent = oldRules.source?.files?.[0]?.content;
  if (oldContent === content) { console.log(JSON.stringify({ alreadyDeployed: true })); return; }
  const expectedOld = fs.readFileSync(path.join(privateRoot, 'deployed-firestore-0.rules'), 'utf8');
  if (oldRules.source?.files?.length !== 1 || oldContent !== expectedOld) throw new Error('LIVE_RULES_CHANGED_SINCE_REVIEW');
  const record = { previous, previousSource: oldRules.source, candidateHash: crypto.createHash('sha256').update(content).digest('hex'), backup: path.relative(root, backup) };
  const reportPath = path.join(backup, 'rules-deployment.json');
  fs.writeFileSync(reportPath, JSON.stringify(record, null, 2));
  const candidate = await request(`projects/${credentials.project_id}/rulesets`, 'POST', { source: { files: [{ name: 'firestore.rules', content }] } });
  record.candidateRuleset = candidate.name;
  fs.writeFileSync(reportPath, JSON.stringify(record, null, 2));
  const latest = await request(resource);
  if (latest.rulesetName !== previous.rulesetName) throw new Error('LIVE_RELEASE_CHANGED_DURING_DEPLOY');
  await request(resource, 'PATCH', { release: { name: resource, rulesetName: candidate.name }, updateMask: 'rulesetName' });
  const deployed = await request(resource);
  record.deployed = deployed.rulesetName === candidate.name;
  record.verifiedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, JSON.stringify(record, null, 2));
  if (!record.deployed) throw new Error('RELEASE_VERIFICATION_FAILED');
  console.log(JSON.stringify({ deployed: true, sourceHash: record.candidateHash, previousRulesSaved: true, documentWrites: 0 }));
}
main().catch(error => { console.error(JSON.stringify({ deploymentFailed: true, reason: error.response?.status || (/^[A-Z_]+$/.test(error.message || '') ? error.message : 'RULES_API_FAILED') })); process.exitCode = 1; });
