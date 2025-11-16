import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { DashwrightConfig, ArtifactUpload } from './types';

export class Uploader {
  private client: AxiosInstance;
  private config: DashwrightConfig;
  private authHeaders: Record<string, string>;

  constructor(config: DashwrightConfig) {
    this.config = {
      uploadArtifacts: true,
      uploadScreenshots: true,
      uploadVideos: true,
      uploadLogs: true,
      retryAttempts: 0, // Disable retries for faster error diagnosis
      retryDelay: 1000,
      ...config,
    };

    // Build request headers similar to reporter: use apiKeyHeader if provided,
    // otherwise auto-detect api keys and use X-API-Key for those, or Bearer for JWTs.
    this.authHeaders = {};
    const token = this.config.apiToken || '';
    const apiKeyHeader = this.config.apiKeyHeader;

    if (apiKeyHeader) {
      this.authHeaders[apiKeyHeader] = token;
    } else if (typeof token === 'string' && (token.startsWith('dw_') || token.startsWith('ak_'))) {
      this.authHeaders['X-API-Key'] = token;
    } else if (token) {
      this.authHeaders['Authorization'] = `Bearer ${token}`;
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: this.authHeaders,
      timeout: 15000, // 15s timeout for faster error diagnosis
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`   🌐 Axios request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('   ❌ Axios request setup error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`   ✅ Axios response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error(`   ❌ Axios response error: ${error.message}`);
        if (error.code) console.error(`   Error code: ${error.code}`);
        return Promise.reject(error);
      }
    );
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

    const uploadUrl = '/artifacts/upload';
    const fullUrl = `${this.client.defaults.baseURL}${uploadUrl}`;
    console.log(`📤 Uploading to: ${fullUrl}`);
    console.log(`   Auth headers: ${JSON.stringify(this.authHeaders)}`);
    
    try {
      await this.retryRequest(async () => {
        console.log(`   → Attempt to upload ${filename} (size=${stats.size})...`);
        const mergedHeaders = {
          ...this.authHeaders,
          ...formData.getHeaders(),
        };
        console.log(`   → Full headers: ${JSON.stringify(mergedHeaders)}`);
        
        const response = await this.client.post(uploadUrl, formData, {
          headers: mergedHeaders,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
        
        // Check response status
        if (response.status >= 400) {
          throw new Error(`Upload failed with status ${response.status}: ${JSON.stringify(response.data)}`);
        }
        
        console.log(`✅ Upload successful (status=${response.status}), artifact ID: ${response.data.id || 'unknown'}`);
        return response;
      });
    } catch (error: any) {
      console.error(`\n❌ Upload failed for ${filename}`);
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.code);
      
      if (error.response) {
        console.error('   Response received:');
        console.error('     Status:', error.response.status);
        console.error('     Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('     Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('   No response received from server (timeout or network error)');
        console.error('   Request summary:', {
          url: `${error.config?.baseURL}${error.config?.url}`,
          method: error.config?.method,
          timeout: error.config?.timeout,
          headers: error.config?.headers,
        });
      } else {
        console.error('   Setup error (before request sent)');
        console.error('   Full error:', error);
      }
      
      // Don't throw - allow other uploads to continue
      console.error(`   ⚠️  Continuing with remaining uploads...\n`);
    }
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
    } catch (error: any) {
      const maxAttempts = this.config.retryAttempts || 3;
      if (attempt < maxAttempts) {
        console.log(`   ⚠️  Retry attempt ${attempt + 1}/${maxAttempts} after ${this.config.retryDelay || 1000}ms...`);
        console.log(`   Error was: ${error.message || error.code || 'Unknown error'}`);
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
