#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { getProjectPath } from './project-path.mjs';

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: npm run project:open -- <project-name>');
  process.exit(1);
}

let projectPath;
try {
  projectPath = getProjectPath(projectName);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!fs.existsSync(projectPath)) {
  console.error(`Mapped path does not exist: ${projectPath}`);
  process.exit(1);
}

const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
const child = spawn(opener, [projectPath], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
