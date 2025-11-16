export interface DashwrightConfig {
  apiUrl: string;
  apiToken: string;
  organizationId: string;
  uploadArtifacts?: boolean;
  uploadScreenshots?: boolean;
  uploadVideos?: boolean;
  uploadLogs?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TestRunResult {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'skipped';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  startedAt: Date;
  finishedAt?: Date;
  branch?: string;
  commit?: string;
  environment?: string;
  metadata?: Record<string, any>;
}

export interface ArtifactUpload {
  filename: string;
  type: 'screenshot' | 'video' | 'log' | 'trace' | 'other';
  mimeType: string;
  size: number;
  testRunId: string;
  testName?: string;
}
