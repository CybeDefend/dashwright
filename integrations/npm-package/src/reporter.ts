import {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import axios from 'axios';
import { DashwrightConfig, TestRunResult } from './types';
import { Uploader } from './uploader';
import * as path from 'path';

export class DashwrightReporter implements Reporter {
  private config: DashwrightConfig;
  private uploader: Uploader;
  private testRunId: string | null = null;
  private startTime: Date = new Date();
  private testResults: Map<string, TestResult> = new Map();
  private client;

  constructor(config: DashwrightConfig) {
    this.config = config;
    this.uploader = new Uploader(config);
    
    // Build request headers depending on whether we should use an API key header
    const headers: Record<string, string> = {};
    const token = config.apiToken || '';
    const apiKeyHeader = config.apiKeyHeader;

    if (apiKeyHeader) {
      headers[apiKeyHeader] = token;
    } else if (typeof token === 'string' && (token.startsWith('dw_') || token.startsWith('ak_'))) {
      // convention: tokens starting with dw_ (dashwright keys) or ak_ are API keys
      headers['X-API-Key'] = token;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers,
    });
  }

  async onBegin(config: FullConfig, suite: Suite) {
    console.log('🚀 Dashwright: Starting test run...');
    this.startTime = new Date();

    // Create test run
    try {
      const response = await this.client.post('/integrations/playwright/run', {
        name: `Playwright Run - ${new Date().toISOString()}`,
        status: 'running',
        totalTests: suite.allTests().length,
        organizationId: this.config.organizationId,
        startedAt: this.startTime.toISOString(),
        environment: process.env.NODE_ENV || 'development',
        branch: process.env.GIT_BRANCH || process.env.BRANCH_NAME,
        commit: process.env.GIT_COMMIT || process.env.COMMIT_SHA,
      });

      this.testRunId = response.data.testRunId;
      console.log(`✅ Dashwright: Test run created with ID: ${this.testRunId}`);
    } catch (error: any) {
      console.error('❌ Dashwright: Failed to create test run:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request payload:', JSON.stringify(error.config.data, null, 2));
      }
    }
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    this.testResults.set(test.id, result);

    if (!this.testRunId) return;

    // Upload screenshots
    for (const attachment of result.attachments) {
      try {
        if (attachment.name === 'screenshot' && attachment.path) {
          await this.uploader.uploadScreenshot(
            attachment.path,
            this.testRunId,
            test.title
          );
        } else if (attachment.name === 'video' && attachment.path) {
          await this.uploader.uploadVideo(
            attachment.path,
            this.testRunId,
            test.title
          );
        } else if (attachment.name === 'trace' && attachment.path) {
          await this.uploader.uploadArtifact(attachment.path, {
            type: 'trace',
            mimeType: 'application/zip',
            testRunId: this.testRunId,
            testName: test.title,
          });
        }
      } catch (error) {
        console.error(`❌ Dashwright: Failed to upload artifact for test "${test.title}":`, error);
      }
    }
  }

  async onEnd(result: FullResult) {
    if (!this.testRunId) return;

    const finishTime = new Date();
    const duration = finishTime.getTime() - this.startTime.getTime();

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const testResult of this.testResults.values()) {
      if (testResult.status === 'passed') passed++;
      else if (testResult.status === 'failed') failed++;
      else if (testResult.status === 'skipped') skipped++;
    }

    const status = failed > 0 ? 'failed' : 'passed';

    try {
      await this.client.put(`/test-runs/${this.testRunId}`, {
        status,
        passedTests: passed,
        failedTests: failed,
        skippedTests: skipped,
        finishedAt: finishTime.toISOString(),
        duration,
      });

      console.log('✅ Dashwright: Test run completed successfully');
      console.log(`   Total: ${this.testResults.size} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
      console.log(`   View results: ${this.config.apiUrl.replace('/api', '')}/runs/${this.testRunId}`);
    } catch (error: any) {
      console.error('❌ Dashwright: Failed to update test run:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request payload:', JSON.stringify(error.config.data, null, 2));
      }
    }
  }

  printsToStdio() {
    return false;
  }
}
