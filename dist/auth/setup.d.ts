import { AuthConfig } from '../types.js';
export declare function loadAuthConfig(): AuthConfig | null;
export declare function saveAuthConfig(config: AuthConfig): void;
export declare function setupAuth(url: string, apiKey?: string): Promise<AuthConfig>;
//# sourceMappingURL=setup.d.ts.map