import { randomBytes } from 'crypto';
import * as path from 'path';

export class FileUtil {
  /**
   * Sanitize filename to prevent path traversal attacks
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators and null bytes
    return path.basename(filename).replace(/[\/\\:\*\?"<>\|]/g, '_');
  }

  /**
   * Generate unique filename with timestamp and random string
   */
  static generateUniqueFilename(originalFilename: string): string {
    const sanitized = this.sanitizeFilename(originalFilename);
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    
    return `${name}-${timestamp}-${random}${ext}`;
  }

  /**
   * Validate MIME type against expected types
   */
  static isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return mimeType === allowed;
    });
  }
}
