import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist:', distDir);
  process.exit(1);
}

const targetDirs = [
  path.join(distDir, 'browser'),
  path.join(distDir, 'app'),
  path.join(distDir, 'ai-chatbot-admin-console'),
  path.join(distDir, 'ai-chatbot-admin-console', 'browser')
];

function copyFiles(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    // Skip recursion into target directories if we are copying from root dist
    if (src === distDir && ['browser', 'app', 'ai-chatbot-admin-console'].includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const target of targetDirs) {
  copyFiles(distDir, target);
}

console.log('✔ Build artifacts successfully synchronized across all target distribution paths.');
