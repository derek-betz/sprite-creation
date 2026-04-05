#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { getProjectMap } from './project-path.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const localConfigPath = path.join(repoRoot, 'config', 'projects.local.json');
const exampleConfigPath = path.join(repoRoot, 'config', 'projects.example.json');

let config;
try {
  config = getProjectMap();
} catch {
  console.log(`No local project map found at ${localConfigPath}`);
  console.log(`Copy ${exampleConfigPath} to ${localConfigPath} and update paths.`);
  process.exit(0);
}

const entries = Object.entries(config);

if (entries.length === 0) {
  console.log('projects.local.json exists but contains no project mappings.');
  process.exit(0);
}

for (const [name, targetPath] of entries) {
  const exists = fs.existsSync(targetPath);
  console.log(`${name}: ${targetPath} ${exists ? '✓' : '✗ missing'}`);
}
