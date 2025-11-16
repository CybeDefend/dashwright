# @dashwright/playwright-reporter

Official Playwright reporter for Dashwright - Upload your test results, screenshots, videos, and logs to your Dashwright dashboard.

## Installation

```bash
npm install @dashwright/playwright-reporter
# or
pnpm add @dashwright/playwright-reporter
# or
yarn add @dashwright/playwright-reporter
```

## Configuration

Add the reporter to your `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [
    [
      "@dashwright/playwright-reporter",
      {
        apiUrl: "http://localhost:3000",
        apiToken: "your-api-token",
        organizationId: "your-organization-id",
        uploadScreenshots: true,
        uploadVideos: true,
        uploadTraces: true, // 📊 Upload traces (includes console logs, network, screenshots)
        retryAttempts: 3,
        retryDelay: 1000,
      },
    ],
    ["html"], // You can still use other reporters
  ],

  // Enable screenshots, videos and traces
  use: {
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry", // 📊 Generate traces on retry (recommended)
  },
});
```

## Configuration Options

| Option              | Type    | Default      | Description                                                                                        |
| ------------------- | ------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `apiUrl`            | string  | **required** | Your Dashwright API URL                                                                            |
| `apiToken`          | string  | **required** | Your API authentication token                                                                      |
| `organizationId`    | string  | **required** | Your organization ID                                                                               |
| `uploadScreenshots` | boolean | `true`       | Upload test screenshots                                                                            |
| `uploadVideos`      | boolean | `true`       | Upload test videos                                                                                 |
| `uploadTraces`      | boolean | `true`       | Upload Playwright traces (includes console logs, network requests, DOM snapshots, and screenshots) |
| `retryAttempts`     | number  | `3`          | Number of retry attempts for uploads                                                               |
| `retryDelay`        | number  | `1000`       | Delay between retries (ms)                                                                         |

### Trace Generation

To generate traces, add the `trace` option to your Playwright config:

```typescript
use: {
  trace: 'on-first-retry',     // Generate trace on first retry (recommended)
  // or 'retain-on-failure'    // Generate trace only for failed tests
  // or 'on'                   // Generate trace for all tests (heavy)
}
```

Learn more about traces: [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

## Environment Variables

You can also configure using environment variables:

```bash
DASHWRIGHT_API_URL=http://localhost:3000
DASHWRIGHT_API_TOKEN=your-token
DASHWRIGHT_ORG_ID=your-org-id
```

## Usage

Once configured, simply run your Playwright tests as usual:

```bash
npx playwright test
```

The reporter will automatically:

- ✅ Create a test run in Dashwright
- 📸 Upload screenshots from failed tests
- 🎥 Upload videos when available
- � Upload Playwright traces (includes console logs, network requests, and DOM snapshots)
- ✨ Provide real-time updates via WebSocket
- � Display results in your dashboard with interactive trace viewer

## View Results

After your tests complete, view the results at:

```
http://your-dashwright-url/runs/{run-id}
```

The URL will be printed in the console output.

## License

Apache-2.0 © CybeDefend
