import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
const CONFIG_PATH = '.accept/config.json';
export function loadConfig() {
    if (!existsSync(CONFIG_PATH))
        return null;
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    }
    catch {
        return null;
    }
}
export function saveConfig(config) {
    mkdirSync('.accept', { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
//# sourceMappingURL=config.js.map