import { describe, it, expect, spyOn } from 'bun:test';
import { createResilientFetch } from '../src/resilientFetch';

describe('resilientFetch', () => {
  it('should succeed on normal request', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response('ok', { status: 200 });
    });

    const fetchClient = createResilientFetch({ retries: 2, initialDelayMs: 1 });
    const res = await fetchClient('https://example.com');
    expect(res.status).toBe(200);

    fetchSpy.mockRestore();
  });

  it('should retry on error status codes', async () => {
    let calls = 0;
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls < 3) {
        return new Response('error', { status: 500 });
      }
      return new Response('success', { status: 200 });
    });

    const fetchClient = createResilientFetch({ retries: 3, initialDelayMs: 1 });
    const res = await fetchClient('https://example.com');
    expect(res.status).toBe(200);
    expect(calls).toBe(3); // 1 initial + 2 retries

    fetchSpy.mockRestore();
  });

  it('should throw after exceeding retries', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network error');
    });

    const fetchClient = createResilientFetch({ retries: 2, initialDelayMs: 1 });
    await expect(fetchClient('https://example.com')).rejects.toThrow('Network error');

    fetchSpy.mockRestore();
  });
});
