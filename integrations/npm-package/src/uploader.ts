import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { DashwrightConfig, ArtifactUpload } from './types';

export class Uploader {
  private client: AxiosInstance;
  private config: DashwrightConfig;

  constructor(config: DashwrightConfig) {
    this.config = {
      uploadArtifacts: true,
      uploadScreenshots: true,
      uploadVideos: true,
      uploadLogs: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    // Build request headers similar to reporter: use apiKeyHeader if provided,
    // otherwise auto-detect api keys and use X-API-Key for those, or Bearer for JWTs.
    const headers: Record<string, string> = {};
    const token = this.config.apiToken || '';
    const apiKeyHeader = this.config.apiKeyHeader;

    if (apiKeyHeader) {
      headers[apiKeyHeader] = token;
    } else if (typeof token === 'string' && (token.startsWith('dw_') || token.startsWith('ak_'))) {
      headers['X-API-Key'] = token;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers,
      timeout: 60000,
    });
  }

  async uploadArtifact(
    filePath: string,
    artifactData: Omit<ArtifactUpload, 'filename' | 'size'>
  ): Promise<void> {
    console.log(`🔧 Preparing upload for: ${filePath}`);
    console.log(`   Type: ${artifactData.type}, TestRunId: ${artifactData.testRunId}`);
    
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('type', artifactData.type);
    formData.append('mimeType', artifactData.mimeType);
    formData.append('size', stats.size.toString());
    formData.append('testRunId', artifactData.testRunId);
    
    if (artifactData.testName) {
      formData.append('testName', artifactData.testName);
    }

    console.log(`📤 Uploading to: ${this.config.apiUrl}/artifacts/upload`);
    await this.retryRequest(async () => {
      const response = await this.client.post('/artifacts/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      console.log(`✅ Upload successful, artifact ID: ${response.data.id || 'unknown'}`);
      return response;
    });
  }

  async uploadScreenshot(
    screenshotPath: string,
    testRunId: string,
    testName?: string
  ): Promise<void> {
    if (!this.config.uploadScreenshots) return;

    await this.uploadArtifact(screenshotPath, {
      type: 'screenshot',
      mimeType: 'image/png',
      testRunId,
      testName,
    });
  }

  async uploadVideo(
    videoPath: string,
    testRunId: string,
    testName?: string
  ): Promise<void> {
    if (!this.config.uploadVideos) return;

    await this.uploadArtifact(videoPath, {
      type: 'video',
      mimeType: 'video/webm',
      testRunId,
      testName,
    });
  }

  async uploadLog(
    logContent: string,
    testRunId: string,
    testName?: string
  ): Promise<void> {
    if (!this.config.uploadLogs) return;

    const tempFilePath = path.join('/tmp', `log-${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, logContent);

    try {
      await this.uploadArtifact(tempFilePath, {
        type: 'log',
        mimeType: 'text/plain',
        testRunId,
        testName,
      });
    } finally {
      fs.unlinkSync(tempFilePath);
    }
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    attempt = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt < (this.config.retryAttempts || 3)) {
        await this.delay(this.config.retryDelay || 1000);
        return this.retryRequest(fn, attempt + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
