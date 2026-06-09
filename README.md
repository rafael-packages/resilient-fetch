# @rafaelsilvadeveloper/resilient-fetch

A strongly typed, zero-dependency TypeScript wrapper adding retries, exponential backoff, jitter, and circuit breaker patterns to native fetch.

[![NPM Version](https://img.shields.io/npm/v/@rafaelsilvadeveloper/resilient-fetch.svg?style=flat-square)](https://www.npmjs.com/package/@rafaelsilvadeveloper/resilient-fetch)
[![Discord Support](https://img.shields.io/discord/1111111111?color=7289da&label=Discord&logo=discord&style=flat-square)](https://discord.gg/7Fw7snafYS)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-blueviolet.svg?style=flat-square)](https://www.npmjs.com/package/@rafaelsilvadeveloper/resilient-fetch)

## Features

*   🛡️ **TypeScript Definitions**: Matches standard `fetch` signatures out-of-the-box.
*   📦 **Zero Dependencies**: Built on native `fetch` API. Ideal for Cloudflare Workers, Edge runtimes, Bun, and Node.js.
*   🚦 **Smart Retries & Backoff**: Exponential backoff with randomized jitter to prevent server overload.
*   🔌 **Circuit Breaker**: Auto-trip requests going to failing host domains to protect application resources.
*   ⏱️ **Timeout Handling**: Built-in request timeouts utilizing native AbortControllers.

## Installation

```bash
npm install @rafaelsilvadeveloper/resilient-fetch
```

## Getting Started

Replace your native `fetch` with `resilientFetch` for automatic protection:

```typescript
import { resilientFetch } from '@rafaelsilvadeveloper/resilient-fetch';

async function run() {
  // Works exactly like standard fetch, but retries under 429, 500, 502, 503, 504 errors!
  const response = await resilientFetch('https://api.example.com/users');
  const data = await response.json();
  console.log(data);
}

run();
```

## Custom Resilience Options

Create a custom configured resilient fetch instance:

```typescript
import { createResilientFetch } from '@rafaelsilvadeveloper/resilient-fetch';

const customFetch = createResilientFetch({
  retries: 4,               // Retry up to 4 times
  initialDelayMs: 250,      // Start backing off at 250ms
  maxDelayMs: 5000,         // Backoff capped at 5 seconds
  timeoutMs: 3000,          // Abort request if it takes longer than 3 seconds
  retryOnStatus: [429, 503], // Only retry on Rate Limit and Service Unavailable
  circuitBreaker: {
    failureThreshold: 5,    // Trip breaker after 5 failures to the same host
    cooldownMs: 30000       // Cooldown host for 30 seconds before retrying
  }
});

async function run() {
  const response = await customFetch('https://api.my-service.com/data');
}

run();
```

## Error Handling

Throws standard fetch errors or AbortErrors on timeout.

```typescript
try {
  await resilientFetch('https://failing-api.com');
} catch (error) {
  console.error('Request failed after all retries:', error);
}
```

## Support

For support, questions, or discussions, join our Discord server:

[![Discord Server](https://img.shields.io/discord/1111111111?color=7289da&label=Discord&logo=discord&style=for-the-badge)](https://discord.gg/7Fw7snafYS)

## License
MIT
