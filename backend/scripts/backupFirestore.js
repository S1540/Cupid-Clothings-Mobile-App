// Read-only Firestore REST snapshot. Customer data is encrypted before disk writes.
// The encryption key is protected by Windows DPAPI for the current Windows user.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { GoogleAuth } = require('google-auth-library');
const root = path.resolve(__dirname, '../..');

function protectKey(key, unprotect = false) {
  const operation = unprotect ? 'Unprotect' : 'Protect';
  const command = `Add-Type -AssemblyName System.Security; $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $result=[Security.Cryptography.ProtectedData]::${operation}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($result))`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    input: key.toString('base64'), encoding: 'utf8', windowsHide: true, timeout: 20000,
  });
  if (result.status !== 0 || !result.stdout.trim()) throw new Error('KEY_PROTECTION_FAILED');
  return Buffer.from(result.stdout.trim(), 'base64');
}

async function main() {
  if (process.platform !== 'win32') throw new Error('WINDOWS_DPAPI_REQUIRED');
  if (!process.argv.includes('--execute-read-only')) throw new Error('REQUIRES_EXECUTE_READ_ONLY');
  const credentials = JSON.parse(fs.readFileSync(path.join(root, 'backend/serviceAccountKey.json'), 'utf8'));
  const native = JSON.parse(fs.readFileSync(path.join(root, 'google-services.json'), 'utf8'));
  if (credentials.project_id !== native.project_info.project_id) throw new Error('PROJECT_MISMATCH');
  const client = await new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/datastore'] }).getClient();
  const parent = `projects/${credentials.project_id}/databases/(default)/documents`;
  const readTime = new Date(Date.now() - 60000).toISOString();
  const documents = [];
  let visited = 0;
  async function request(resource, method, values) {
    const result = await client.request({ url: `https://firestore.googleapis.com/v1/${resource}`, method, ...(method === 'GET' ? { params: values } : { data: values }), timeout: 30000, retry: false });
    return result.data;
  }
  async function visit(documentPath) {
    if (++visited > 50000) throw new Error('BACKUP_LIMIT_EXCEEDED');
    let pageToken;
    do {
      const collections = await request(`${documentPath}:listCollectionIds`, 'POST', { pageSize: 100, readTime, ...(pageToken ? { pageToken } : {}) });
      for (const id of collections.collectionIds || []) {
        let documentPage;
        do {
          const page = await request(`${documentPath}/${encodeURIComponent(id)}`, 'GET', { pageSize: 100, showMissing: true, readTime, ...(documentPage ? { pageToken: documentPage } : {}) });
          for (const doc of page.documents || []) {
            // Missing parents may still contain real documents in subcollections.
            if (doc.createTime || doc.updateTime) documents.push(doc);
            if (visited % 100 === 0) console.log(JSON.stringify({ documentsRead: documents.length }));
            await visit(doc.name);
          }
          documentPage = page.nextPageToken;
        } while (documentPage);
      }
      pageToken = collections.nextPageToken;
    } while (pageToken);
  }
  await visit(parent);
  const plaintext = Buffer.from(JSON.stringify({ format: 'firestore-rest-snapshot-v1', project: credentials.project_id, database: '(default)', readTime, documents }));
  const key = crypto.randomBytes(32);
  const wrappedKey = protectKey(key);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(zlib.gzipSync(plaintext)), cipher.final()]);
  const directory = path.join(root, 'auth-migration-private-reports', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'key.dpapi'), wrappedKey, { flag: 'wx' });
  fs.writeFileSync(path.join(directory, 'firestore.encrypted.json'), JSON.stringify({ algorithm: 'aes-256-gcm+gzip', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') }), { flag: 'wx' });
  // Verify the saved ciphertext and saved protected key, not just memory buffers.
  const saved = JSON.parse(fs.readFileSync(path.join(directory, 'firestore.encrypted.json'), 'utf8'));
  const recoveredKey = protectKey(fs.readFileSync(path.join(directory, 'key.dpapi')), true);
  const decipher = crypto.createDecipheriv('aes-256-gcm', recoveredKey, Buffer.from(saved.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(saved.tag, 'base64'));
  const recovered = zlib.gunzipSync(Buffer.concat([decipher.update(Buffer.from(saved.ciphertext, 'base64')), decipher.final()]));
  if (!recovered.equals(plaintext)) throw new Error('BACKUP_VERIFICATION_FAILED');
  const report = { completed: true, readTime, documentCount: documents.length, encryptedBytes: ciphertext.length, roundTripVerified: true, firestoreOnly: true, directory: path.relative(root, directory) };
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
main().catch(error => {
  console.error(JSON.stringify({ backupFailed: true, reason: error.response?.status || (/^[A-Z_]+$/.test(error.message || '') ? error.message : 'READ_OR_ENCRYPTION_FAILED') }));
  process.exitCode = 1;
});
