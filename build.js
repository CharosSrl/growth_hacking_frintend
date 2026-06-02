#!/usr/bin/env node
// Netlify build script: copies all frontend files to dist/ and injects
// Firebase config from env vars into dist/index.html.
// Run locally: node build.js   (reads .env; Netlify provides process.env)

const fs   = require('fs');
const path = require('path');

// ── Load .env for local builds ─────────────────────────────────────

try {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#\s][^=]*)=(.*)/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  });
} catch {}

// ── Firebase config from env vars ─────────────────────────────────

const cfg = {
  apiKey:            process.env.FIREBASE_API_KEY             || '',
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN         || '',
  projectId:         process.env.FIREBASE_PROJECT_ID          || '',
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET      || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             process.env.FIREBASE_APP_ID              || '',
  measurementId:     process.env.FIREBASE_MEASUREMENT_ID      || '',
};

if (!cfg.apiKey || cfg.apiKey.startsWith('YOUR_')) {
  console.error('Missing FIREBASE_API_KEY — add it to .env or Netlify env vars');
  process.exit(1);
}

// ── Copy all source files to dist/ ────────────────────────────────

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (['dist', 'node_modules', '.git'].includes(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    // Only copy web assets; exclude credentials, build tooling, docs
    const ext = path.extname(entry.name);
    const skip = ['build.js','netlify.toml','package.json','package-lock.json'];
    if (skip.includes(entry.name)) continue;
    if (entry.isFile() && !['.html','.css','.js','.svg','.png','.ico','.webp'].includes(ext)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.rmSync('dist', { recursive: true, force: true });
copyDir('.', 'dist');

// ── Inject Firebase config into dist/index.html ───────────────────

const indexPath = path.join('dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(
  /window\.FIREBASE_CONFIG = \{.*?\};/s,
  `window.FIREBASE_CONFIG = ${JSON.stringify(cfg)};`
);

fs.writeFileSync(indexPath, html);
console.log('dist/ built — Firebase config injected');
