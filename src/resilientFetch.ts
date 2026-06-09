import type { ResilientOptions } from './types';

class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttemptTime = 0;
  private readonly threshold: number;
  private readonly cooldown: number;

  constructor(threshold = 5, cooldown = 10000) {
    this.threshold = threshold;
    this.cooldown = cooldown;
  }

  public checkCall(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  public recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  public recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.cooldown;
    }
  }
}

const breakers = new Map<string, CircuitBreaker>();

function getBreaker(key: string, threshold?: number, cooldown?: number): CircuitBreaker {
  let breaker = breakers.get(key);
  if (!breaker) {
    breaker = new CircuitBreaker(threshold, cooldown);
    breakers.set(key, breaker);
  }
  return breaker;
}

/**
 * Creates a fetch client wrapped in resilience logic.
 */
export function createResilientFetch(globalOptions: ResilientOptions = {}): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString =
      input instanceof URL ? input.toString() : typeof input === 'string' ? input : input.url;

    let host = 'global';
    try {
      host = new URL(urlString).host;
    } catch (_) {
      // Ignored
    }

    const retries = globalOptions.retries ?? 3;
    const initialDelay = globalOptions.initialDelayMs ?? 500;
    const maxDelay = globalOptions.maxDelayMs ?? 10000;
    const backoffFactor = globalOptions.backoffFactor ?? 2;
    const retryOnStatus = globalOptions.retryOnStatus ?? [429, 500, 502, 503, 504];
    const timeout = globalOptions.timeoutMs;

    const cbOptions = globalOptions.circuitBreaker || {};
    const breaker = getBreaker(host, cbOptions.failureThreshold, cbOptions.cooldownMs);

    if (!breaker.checkCall()) {
      throw new Error(`Circuit Breaker is OPEN for host ${host}. Request blocked.`);
    }

    let attempt = 0;

    const executeWithTimeout = async (requestInit: RequestInit): Promise<Response> => {
      if (!timeout) {
        return fetch(input, requestInit);
      }
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const res = await fetch(input, { ...requestInit, signal });
        clearTimeout(timeoutId);
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    while (true) {
      try {
        const response = await executeWithTimeout(init || {});

        if (retryOnStatus.includes(response.status) && attempt < retries) {
          throw new Error(`Status ${response.status} triggered retry.`);
        }

        breaker.recordSuccess();
        return response;
      } catch (err: any) {
        attempt++;
        breaker.recordFailure();

        if (attempt > retries || err.name === 'AbortError') {
          throw err;
        }

        const delay = Math.min(maxDelay, initialDelay * Math.pow(backoffFactor, attempt - 1));
        const jitter = Math.random() * 0.3 * delay; // 30% randomized jitter
        const finalDelay = delay + jitter;

        await new Promise((resolve) => setTimeout(resolve, finalDelay));
      }
    }
  };
}

export const resilientFetch = createResilientFetch();
