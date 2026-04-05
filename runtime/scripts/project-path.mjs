#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const configDir = path.join(repoRoot, 'config');
const localConfigPath = path.join(configDir, 'projects.local.json');

export function getProjectMap() {
  if (!fs.existsSync(localConfigPath)) {
    throw new Error(`Missing ${localConfigPath}. Copy config/projects.example.json to config/projects.local.json and update it.`);
  }

  return JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
}

export function getProjectPath(projectName) {
  const projectMap = getProjectMap();
  const projectPath = projectMap[projectName];

  if (!projectPath) {
    throw new Error(`No project mapping found for '${projectName}' in ${localConfigPath}`);
  }

  return path.resolve(projectPath);
}
