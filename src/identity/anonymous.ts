import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';

function getIdentityPath(): string {
  return join(homedir(), '.accept', 'identity');
}

export function getAnonymousId(): string {
  const path = getIdentityPath();

  if (existsSync(path)) {
    const id = readFileSync(path, 'utf-8').trim();
    if (id) return id;
  }

  const id = uuidv4();
  const dir = join(homedir(), '.accept');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, id);
  return id;
}
