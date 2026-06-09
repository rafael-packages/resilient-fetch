export interface ResilientOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOnStatus?: number[];
  timeoutMs?: number;
  circuitBreaker?: {
    failureThreshold?: number;
    cooldownMs?: number;
  };
}
