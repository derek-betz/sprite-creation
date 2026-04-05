#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const configDir = path.join(repoRoot, 'config');
const localConfigPath = path.join(configDir, 'projects.local.json');
const exampleConfigPath = path.join(configDir, 'projects.example.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (!fs.existsSync(localConfigPath)) {
  console.log(`No local project map found at ${localConfigPath}`);
  console.log(`Copy ${exampleConfigPath} to ${localConfigPath} and update paths.`);
  process.exit(0);
}

const config = readJson(localConfigPath);
const entries = Object.entries(config);

if (entries.length === 0) {
  console.log('projects.local.json exists but contains no project mappings.');
  process.exit(0);
}

for (const [name, targetPath] of entries) {
  const exists = fs.existsSync(targetPath);
  console.log(`${name}: ${targetPath} ${exists ? '✓' : '✗ missing'}`);
}
