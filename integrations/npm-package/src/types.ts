export interface DashwrightConfig {
  apiUrl: string;
  apiToken: string;
  organizationId: string;
  /**
   * If set, this header name will be used to send the API token instead of
   * using the `Authorization: Bearer` header. Example: `X-API-Key`.
   * If not provided the reporter will auto-detect API keys (prefix `dw_` or `ak_`) and
   * use `X-API-Key` for those, otherwise it will send `Authorization: Bearer <token>`.
   */
  apiKeyHeader?: string;
  uploadArtifacts?: boolean;
  uploadScreenshots?: boolean;
  uploadVideos?: boolean;
  uploadTraces?: boolean;
  uploadLogs?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TestRunResult {
  id: string;
  name: string;
  status: "running" | "passed" | "failed" | "skipped";
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
  type: "screenshot" | "video" | "log" | "trace" | "other";
  mimeType: string;
  size: number;
  testRunId: string;
  testName?: string;
}
