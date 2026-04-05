#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { getProjectPath } from './project-path.mjs';

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: npm run project:info -- <project-name>');
  process.exit(1);
}

let projectPath;
try {
  projectPath = getProjectPath(projectName);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const exists = fs.existsSync(projectPath);
const packageJsonPath = path.join(projectPath, 'package.json');
const gitPath = path.join(projectPath, '.git');

console.log(`project: ${projectName}`);
console.log(`path: ${projectPath}`);
console.log(`exists: ${exists ? 'yes' : 'no'}`);
console.log(`git repo: ${fs.existsSync(gitPath) ? 'yes' : 'no'}`);
console.log(`package.json: ${fs.existsSync(packageJsonPath) ? 'yes' : 'no'}`);
