#!/usr/bin/env node
// Injects Firebase client config from env vars into index.html → dist/index.html.
// Run: node build.js   (reads .env locally; Netlify env vars are already in process.env)

const fs = require('fs');

// Load .env for local builds (skips keys already in process.env)
try {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#\s][^=]*)=(.*)/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  });
} catch {}

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

let html = fs.readFileSync('index.html', 'utf8');

// Replace the placeholder builtin object with the real config
html = html.replace(
  /var builtin = \{[^}]+\};/,
  `var builtin = ${JSON.stringify(cfg)};`
);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('dist/index.html written with Firebase config injected');
