#!/usr/bin/env node
/**
 * Simple backup script for amstore.db
 * - creates consistent SQLite backup via better-sqlite3 backup API
 * - compresses the .db to .gz
 * - optionally uploads to S3 if AWS_* env vars and S3_BUCKET set
 * - keeps only the latest N local backups (BACKUP_KEEP, default 7)
 *
 * Usage:
 *  NODE_ENV=production node scripts/backup.js
 *  or `npm run backup`
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const Database = require('better-sqlite3');
require('dotenv').config();

const pipeline = promisify(require('stream').pipeline);

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB_PATH = path.join(__dirname, '..', 'amstore.db');
const KEEP = parseInt(process.env.BACKUP_KEEP || '7', 10);

const S3_ENABLED = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET);
const S3_BUCKET = process.env.S3_BUCKET;
const S3_PREFIX = process.env.S3_PREFIX || 'backups/';

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function createSqliteBackup(srcPath, destPath) {
  // uses better-sqlite3 backup API for consistent copy
  const src = new Database(srcPath, { readonly: true });
  try {
    await src.backup(destPath);
  } finally {
    src.close();
  }
}

async function gzipFile(src, dest) {
  const gzip = zlib.createGzip({ level: 9 });
  await pipeline(fs.createReadStream(src), gzip, fs.createWriteStream(dest));
}

async function uploadToS3(localPath, key) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  const fileStream = fs.createReadStream(localPath);
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileStream
  };
  await client.send(new PutObjectCommand(params));
}

async function cleanupLocalBackups(dir, keep) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.gz'))
    .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  const toDelete = files.slice(keep);
  for (const f of toDelete) {
    try { fs.unlinkSync(path.join(dir, f.name)); } catch (e) { console.warn('Failed deleting', f.name, e.message); }
  }
}

(async () => {
  try {
    await ensureDir(BACKUP_DIR);
    if (!fs.existsSync(DB_PATH)) {
      console.error('Database file not found at', DB_PATH);
      process.exit(2);
    }

    const base = `amstore-${timestamp()}`;
    const tmpDb = path.join(BACKUP_DIR, `${base}.db`);
    const gz = path.join(BACKUP_DIR, `${base}.db.gz`);

    console.log('Creating sqlite backup...', tmpDb);
    await createSqliteBackup(DB_PATH, tmpDb);

    console.log('Compressing backup to', gz);
    await gzipFile(tmpDb, gz);

    // remove temporary .db
    fs.unlinkSync(tmpDb);

    console.log('Backup created:', gz);

    if (S3_ENABLED) {
      const key = `${S3_PREFIX}${path.basename(gz)}`;
      console.log('Uploading to S3 bucket', S3_BUCKET, 'key', key);
      try {
        await uploadToS3(gz, key);
        console.log('Upload to S3 successful');
      } catch (err) {
        console.error('S3 upload failed:', err.message);
      }
    } else {
      console.log('S3 not configured, skipping upload. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and S3_BUCKET in env to enable.');
    }

    // cleanup local backups
    console.log('Applying retention policy, keeping', KEEP, 'backups locally');
    cleanupLocalBackups(BACKUP_DIR, KEEP);

    console.log('Backup process finished.');
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
})();
