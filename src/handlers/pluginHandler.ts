import { Logger } from '../core/logger.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PluginHandler {
  private static instance: PluginHandler;
  private logger: Logger;
  private plugins: Map<string, any> = new Map();
  private pluginDir: string;

  private constructor() {
    this.logger = Logger.getInstance();
    this.pluginDir = path.join(__dirname, '../plugins');
    fs.ensureDirSync(this.pluginDir);
  }

  public static getInstance(): PluginHandler {
    if (!PluginHandler.instance) {
      PluginHandler.instance = new PluginHandler();
    }
    return PluginHandler.instance;
  }

  public async loadAll(): Promise<void> {
    this.logger.info('🧩 Loading plugins...');

    const files = fs.readdirSync(this.pluginDir, { withFileTypes: true });

    for (const file of files) {
      if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        try {
          const pluginPath = path.join(this.pluginDir, file.name);
          const plugin = await import(pluginPath);
          const pluginModule = plugin.default || plugin;

          if (pluginModule.name && pluginModule.activate) {
            this.plugins.set(pluginModule.name, pluginModule);
            if (pluginModule.activate) {
              await pluginModule.activate();
            }
            this.logger.info(`✅ Plugin loaded: ${pluginModule.name}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to load plugin ${file.name}:`, error);
        }
      }
    }

    this.logger.info(`🧩 Loaded ${this.plugins.size} plugins`);
  }

  public getPlugin(name: string): any {
    return this.plugins.get(name);
  }

  public async reload(pluginName: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return false;

    try {
      if (plugin.deactivate) {
        await plugin.deactivate();
      }
      this.plugins.delete(pluginName);
      // Reload from file
      const pluginPath = path.join(this.pluginDir, `${pluginName}.js`);
      if (fs.existsSync(pluginPath)) {
        const fresh = await import(pluginPath + '?t=' + Date.now());
        const freshModule = fresh.default || fresh;
        if (freshModule.activate) {
          await freshModule.activate();
        }
        this.plugins.set(freshModule.name, freshModule);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Failed to reload plugin ${pluginName}:`, error);
      return false;
    }
  }

  public listPlugins(): { name: string; version?: string; description?: string }[] {
    return Array.from(this.plugins.values()).map((p) => ({
      name: p.name || 'unknown',
      version: p.version || '1.0.0',
      description: p.description || '',
    }));
  }
}
