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
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['@dashwright/playwright-reporter', {
      apiUrl: 'http://localhost:3000',
      apiToken: 'your-api-token',
      organizationId: 'your-organization-id',
      uploadScreenshots: true,
      uploadVideos: true,
      uploadLogs: true,
      retryAttempts: 3,
      retryDelay: 1000,
    }],
    ['html'], // You can still use other reporters
  ],
  
  // Enable screenshots and videos
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | **required** | Your Dashwright API URL |
| `apiToken` | string | **required** | Your API authentication token |
| `organizationId` | string | **required** | Your organization ID |
| `uploadScreenshots` | boolean | `true` | Upload test screenshots |
| `uploadVideos` | boolean | `true` | Upload test videos |
| `uploadLogs` | boolean | `true` | Upload test logs |
| `retryAttempts` | number | `3` | Number of retry attempts for uploads |
| `retryDelay` | number | `1000` | Delay between retries (ms) |

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
- 📝 Upload test logs and traces
- ✨ Provide real-time updates via WebSocket
- 📊 Display results in your dashboard

## View Results

After your tests complete, view the results at:
```
http://your-dashwright-url/runs/{run-id}
```

The URL will be printed in the console output.

## License

Apache-2.0 © CybeDefend
