import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const CONFIG_PATH = '.accept/config.json';

export interface AcceptConfig {
  appUrl?: string;
}

export function loadConfig(): AcceptConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as AcceptConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: AcceptConfig): void {
  mkdirSync('.accept', { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
