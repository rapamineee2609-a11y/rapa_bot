import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { Logger } from '../core/logger.js';

export class ThumbnailManager {
  private static instance: ThumbnailManager;
  private logger: Logger;
  private thumbPath: string;
  private defaultPath: string;

  private constructor() {
    this.logger = Logger.getInstance();
    this.thumbPath = path.join(process.cwd(), 'src', 'assets', 'thumbnail.jpg');
    this.defaultPath = path.join(process.cwd(), 'src', 'assets', 'default_thumb.jpg');
    this.ensureDefault();
  }

  public static getInstance(): ThumbnailManager {
    if (!ThumbnailManager.instance) {
      ThumbnailManager.instance = new ThumbnailManager();
    }
    return ThumbnailManager.instance;
  }

  private ensureDefault(): void {
    if (!fs.existsSync(this.thumbPath)) {
      // Create a default thumbnail if not exists
      this.generateDefault();
    }
  }

  private generateDefault(): void {
    try {
      // Generate a simple colored square as default
      const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#6C63FF"/>
        <text x="150" y="160" font-family="Arial" font-size="40" fill="white" text-anchor="middle">🤖</text>
        <text x="150" y="210" font-family="Arial" font-size="20" fill="#E0E0E0" text-anchor="middle">BOT AI</text>
      </svg>`;

      fs.ensureDirSync(path.dirname(this.defaultPath));
      fs.writeFileSync(this.defaultPath, svg);
      this.logger.info('🖼️ Default thumbnail generated');
    } catch (error) {
      this.logger.error('❌ Failed to generate default thumbnail:', error);
    }
  }

  public getThumbnailBuffer(): Buffer {
    try {
      if (fs.existsSync(this.thumbPath)) {
        return fs.readFileSync(this.thumbPath);
      }
      // Fallback to default
      if (fs.existsSync(this.defaultPath)) {
        return fs.readFileSync(this.defaultPath);
      }
      // Generate on the fly
      this.generateDefault();
      return fs.readFileSync(this.defaultPath);
    } catch (error) {
      this.logger.error('❌ Failed to read thumbnail:', error);
      // Return empty buffer as last resort
      return Buffer.from('');
    }
  }

  public async setThumbnail(imagePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(imagePath)) return false;

      // Process image to standard size
      const buffer = await sharp(imagePath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      fs.writeFileSync(this.thumbPath, buffer);
      this.logger.info('✅ Thumbnail updated successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to update thumbnail:', error);
      return false;
    }
  }

  public getThumbnailPath(): string {
    return this.thumbPath;
  }
}
