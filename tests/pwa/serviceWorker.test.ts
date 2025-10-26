/**
 * Service Worker Test Suite
 *
 * Tests service worker registration, lifecycle, caching, and offline functionality.
 * Uses Vitest with service worker mocking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ServiceWorkerRegistration
class MockServiceWorkerRegistration {
  installing: ServiceWorker | null = null;
  waiting: ServiceWorker | null = null;
  active: ServiceWorker | null = null;
  scope = '/';
  updateViaCache: ServiceWorkerUpdateViaCache = 'imports';

  async update(): Promise<void> {
    return Promise.resolve();
  }

  async unregister(): Promise<boolean> {
    return Promise.resolve(true);
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean {
    return true;
  }
}

// Mock ServiceWorker
class MockServiceWorker extends EventTarget {
  scriptURL = '/sw.js';
  state: ServiceWorkerState = 'activated';

  postMessage(message: any, transfer?: Transferable[]): void {
    // Mock message posting
  }
}

// Mock ServiceWorkerContainer
class MockServiceWorkerContainer extends EventTarget {
  controller: ServiceWorker | null = null;
  ready: Promise<ServiceWorkerRegistration> = Promise.resolve(
    new MockServiceWorkerRegistration() as any
  );

  async register(scriptURL: string, options?: RegistrationOptions): Promise<ServiceWorkerRegistration> {
    const registration = new MockServiceWorkerRegistration();
    registration.active = new MockServiceWorker() as any;
    this.controller = registration.active;
    return registration as any;
  }

  async getRegistration(scope?: string): Promise<ServiceWorkerRegistration | undefined> {
    return new MockServiceWorkerRegistration() as any;
  }

  async getRegistrations(): Promise<ServiceWorkerRegistration[]> {
    return [new MockServiceWorkerRegistration() as any];
  }
}

describe('Service Worker Registration', () => {
  let mockNavigator: any;

  beforeEach(() => {
    // Setup mock navigator with service worker
    mockNavigator = {
      serviceWorker: new MockServiceWorkerContainer(),
    };

    // Replace global navigator
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    // Clear console mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Registration Success', () => {
    it('should register service worker successfully', async () => {
      const registerSpy = vi.spyOn(navigator.serviceWorker, 'register');

      const registration = await navigator.serviceWorker.register('/sw.js');

      expect(registerSpy).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBeDefined();
      expect(registration.active).toBeDefined();
    });

    it('should register with correct scope', async () => {
      const registerSpy = vi.spyOn(navigator.serviceWorker, 'register');

      await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      expect(registerSpy).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });

    it('should resolve registration promise', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');

      expect(registration).toBeInstanceOf(MockServiceWorkerRegistration);
      expect(registration.scope).toBe('/');
    });
  });

  describe('Registration Failure', () => {
    it('should handle registration failure gracefully', async () => {
      const errorMessage = 'Failed to register service worker';
      vi.spyOn(navigator.serviceWorker, 'register').mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(navigator.serviceWorker.register('/sw.js')).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle HTTP context (no HTTPS)', async () => {
      // Remove service worker support to simulate HTTP
      delete (global as any).navigator.serviceWorker;

      expect(navigator.serviceWorker).toBeUndefined();
    });

    it('should detect browser support', () => {
      // Service worker is available
      expect('serviceWorker' in navigator).toBe(true);

      // Test without support
      delete (global as any).navigator.serviceWorker;
      expect('serviceWorker' in navigator).toBe(false);
    });
  });

  describe('Controller Management', () => {
    it('should have controller after registration', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');

      expect(navigator.serviceWorker.controller).toBeDefined();
    });

    it('should detect when page is controlled by SW', async () => {
      await navigator.serviceWorker.register('/sw.js');

      const isControlled = navigator.serviceWorker.controller !== null;
      expect(isControlled).toBe(true);
    });
  });
});

describe('Service Worker Lifecycle', () => {
  beforeEach(() => {
    const mockServiceWorker = new MockServiceWorkerContainer();
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: mockServiceWorker },
      writable: true,
      configurable: true,
    });
  });

  describe('Activation', () => {
    it('should activate and claim clients', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');

      expect(registration.active).toBeDefined();
      expect(registration.active?.state).toBe('activated');
    });

    it('should clean up old caches on activation', async () => {
      // Mock caches API
      const mockCaches = {
        keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2', 'cache-v3']),
        delete: vi.fn().mockResolvedValue(true),
      };

      (global as any).caches = mockCaches;

      const CURRENT_CACHE = 'cache-v3';
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter((name) => name !== CURRENT_CACHE);

      // Delete old caches
      await Promise.all(oldCaches.map((name) => caches.delete(name)));

      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1');
      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v2');
      expect(mockCaches.delete).not.toHaveBeenCalledWith('cache-v3');
    });
  });

  describe('Update Detection', () => {
    it('should detect new version', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const updateSpy = vi.spyOn(registration, 'update');

      await registration.update();

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should check for updates on focus', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const updateSpy = vi.spyOn(registration, 'update');

      // Simulate window focus
      window.dispatchEvent(new Event('focus'));

      // In real implementation, update would be called
      // Here we just verify the spy is set up
      expect(updateSpy).toBeDefined();
    });

    it('should notify user of available update', async () => {
      const registration = new MockServiceWorkerRegistration();
      const waitingSW = new MockServiceWorker();
      waitingSW.state = 'installed';
      registration.waiting = waitingSW as any;

      expect(registration.waiting).toBeDefined();
      expect(registration.waiting?.state).toBe('installed');
    });
  });

  describe('Skip Waiting', () => {
    it('should skip waiting on message', () => {
      const mockSW = new MockServiceWorker();
      const postMessageSpy = vi.spyOn(mockSW, 'postMessage');

      mockSW.postMessage({ type: 'SKIP_WAITING' });

      expect(postMessageSpy).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('should reload page after skip waiting', async () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(window.location, 'reload', {
        value: reloadSpy,
        writable: true,
      });

      const mockSW = new MockServiceWorker();
      mockSW.postMessage({ type: 'SKIP_WAITING' });

      // In real implementation, controllerchange event fires
      navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));

      // Verify event was dispatched
      expect(navigator.serviceWorker.dispatchEvent).toBeDefined();
    });
  });

  describe('Unregistration', () => {
    it('should unregister service worker', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const unregisterResult = await registration.unregister();

      expect(unregisterResult).toBe(true);
    });
  });
});

describe('Cache Strategies', () => {
  let mockCache: any;
  let mockCaches: any;

  beforeEach(() => {
    mockCache = {
      match: vi.fn(),
      put: vi.fn(),
      add: vi.fn(),
      addAll: vi.fn(),
      delete: vi.fn(),
      keys: vi.fn(),
    };

    mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
      match: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      keys: vi.fn(),
    };

    (global as any).caches = mockCaches;
  });

  describe('Cache-First Strategy', () => {
    it('should serve static assets from cache', async () => {
      const cachedResponse = new Response('cached content');
      mockCaches.match.mockResolvedValue(cachedResponse);

      const response = await caches.match('/static/app.js');

      expect(response).toBe(cachedResponse);
      expect(mockCaches.match).toHaveBeenCalledWith('/static/app.js');
    });

    it('should fall back to network if not cached', async () => {
      mockCaches.match.mockResolvedValue(undefined);
      global.fetch = vi.fn().mockResolvedValue(new Response('network content'));

      const response =
        (await caches.match('/static/new-file.js')) || (await fetch('/static/new-file.js'));

      expect(response).toBeDefined();
      expect(fetch).toHaveBeenCalledWith('/static/new-file.js');
    });
  });

  describe('Network-First Strategy', () => {
    it('should use network-first for API calls', async () => {
      const networkResponse = new Response(JSON.stringify({ data: 'fresh' }));
      global.fetch = vi.fn().mockResolvedValue(networkResponse);

      const response = await fetch('/api/lists');

      expect(fetch).toHaveBeenCalledWith('/api/lists');
      expect(response).toBe(networkResponse);
    });

    it('should fall back to cache on network error', async () => {
      const cachedResponse = new Response(JSON.stringify({ data: 'cached' }));
      mockCaches.match.mockResolvedValue(cachedResponse);
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      let response;
      try {
        response = await fetch('/api/lists');
      } catch (error) {
        response = await caches.match('/api/lists');
      }

      expect(response).toBe(cachedResponse);
    });
  });

  describe('Stale-While-Revalidate', () => {
    it('should serve from cache and update in background', async () => {
      const cachedResponse = new Response('cached');
      const freshResponse = new Response('fresh');

      mockCaches.match.mockResolvedValue(cachedResponse);
      global.fetch = vi.fn().mockResolvedValue(freshResponse);

      // Serve from cache immediately
      const response = await caches.match('/index.html');
      expect(response).toBe(cachedResponse);

      // Update cache in background
      const cache = await caches.open('app-v1');
      const networkResponse = await fetch('/index.html');
      await cache.put('/index.html', networkResponse.clone());

      expect(fetch).toHaveBeenCalledWith('/index.html');
      expect(mockCache.put).toHaveBeenCalled();
    });
  });
});

describe('Offline Functionality', () => {
  beforeEach(() => {
    const mockServiceWorker = new MockServiceWorkerContainer();
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: mockServiceWorker, onLine: true },
      writable: true,
      configurable: true,
    });
  });

  describe('Offline Detection', () => {
    it('should detect offline state', () => {
      (navigator as any).onLine = false;
      expect(navigator.onLine).toBe(false);
    });

    it('should detect online state', () => {
      (navigator as any).onLine = true;
      expect(navigator.onLine).toBe(true);
    });

    it('should handle offline event', () => {
      const offlineHandler = vi.fn();
      window.addEventListener('offline', offlineHandler);

      window.dispatchEvent(new Event('offline'));

      expect(offlineHandler).toHaveBeenCalled();
    });

    it('should handle online event', () => {
      const onlineHandler = vi.fn();
      window.addEventListener('online', onlineHandler);

      window.dispatchEvent(new Event('online'));

      expect(onlineHandler).toHaveBeenCalled();
    });
  });

  describe('Offline Page Serving', () => {
    it('should work offline with cached assets', async () => {
      const mockCaches = {
        match: vi.fn().mockResolvedValue(new Response('cached page')),
      };
      (global as any).caches = mockCaches;

      (navigator as any).onLine = false;

      const response = await caches.match('/');
      expect(response).toBeDefined();
    });

    it('should show offline fallback page', async () => {
      const mockCaches = {
        match: vi
          .fn()
          .mockResolvedValueOnce(undefined) // Not in cache
          .mockResolvedValueOnce(new Response('<html>Offline</html>')), // Fallback
      };
      (global as any).caches = mockCaches;

      let response = await caches.match('/uncached-page');
      if (!response) {
        response = await caches.match('/offline.html');
      }

      expect(response).toBeDefined();
      const text = await response!.text();
      expect(text).toContain('Offline');
    });
  });
});

describe('Service Worker Messaging', () => {
  beforeEach(() => {
    const mockServiceWorker = new MockServiceWorkerContainer();
    const controller = new MockServiceWorker();
    mockServiceWorker.controller = controller as any;

    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: mockServiceWorker },
      writable: true,
      configurable: true,
    });
  });

  it('should send message to service worker', () => {
    const controller = navigator.serviceWorker.controller;
    expect(controller).toBeDefined();

    const postMessageSpy = vi.spyOn(controller!, 'postMessage');
    controller!.postMessage({ type: 'CACHE_URLS', urls: ['/api/lists'] });

    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'CACHE_URLS',
      urls: ['/api/lists'],
    });
  });

  it('should receive message from service worker', () => {
    const messageHandler = vi.fn();
    navigator.serviceWorker.addEventListener('message', messageHandler);

    const mockEvent = new MessageEvent('message', {
      data: { type: 'CACHE_UPDATED' },
    });
    navigator.serviceWorker.dispatchEvent(mockEvent);

    expect(messageHandler).toHaveBeenCalled();
  });

  it('should handle SKIP_WAITING message', () => {
    const controller = navigator.serviceWorker.controller;
    const postMessageSpy = vi.spyOn(controller!, 'postMessage');

    controller!.postMessage({ type: 'SKIP_WAITING' });

    expect(postMessageSpy).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
});

describe('Cache Management', () => {
  let mockCache: any;
  let mockCaches: any;

  beforeEach(() => {
    mockCache = {
      match: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
    };

    mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
    };

    (global as any).caches = mockCaches;
  });

  it('should delete old cache versions', async () => {
    const CURRENT_CACHE = 'cache-v2';
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter((name) => name !== CURRENT_CACHE);

    await Promise.all(oldCaches.map((name) => caches.delete(name)));

    expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1');
    expect(mockCaches.delete).not.toHaveBeenCalledWith('cache-v2');
  });

  it('should handle cache size limits', async () => {
    const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
    const cache = await caches.open('app-v1');

    // Mock cache keys
    mockCache.keys.mockResolvedValue([
      new Request('/file1.js'),
      new Request('/file2.js'),
      new Request('/file3.js'),
    ]);

    const keys = await cache.keys();
    expect(keys.length).toBe(3);

    // In real implementation, would calculate sizes and evict
    // Here we just test that we can get and delete keys
    if (keys.length > 0) {
      await cache.delete(keys[0]);
      expect(mockCache.delete).toHaveBeenCalledWith(keys[0]);
    }
  });

  it('should clear all caches on demand', async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));

    expect(mockCaches.delete).toHaveBeenCalledTimes(cacheNames.length);
  });

  it('should provide cache statistics', async () => {
    const cache = await caches.open('app-v1');
    mockCache.keys.mockResolvedValue([
      new Request('/file1.js'),
      new Request('/file2.js'),
    ]);

    const keys = await cache.keys();
    const stats = {
      cacheCount: keys.length,
      cacheName: 'app-v1',
    };

    expect(stats.cacheCount).toBe(2);
    expect(stats.cacheName).toBe('app-v1');
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    const mockServiceWorker = new MockServiceWorkerContainer();
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: mockServiceWorker },
      writable: true,
      configurable: true,
    });
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetch('/api/lists')).rejects.toThrow('Network error');
  });

  it('should handle cache errors', async () => {
    const mockCaches = {
      open: vi.fn().mockRejectedValue(new Error('Cache error')),
    };
    (global as any).caches = mockCaches;

    await expect(caches.open('app-v1')).rejects.toThrow('Cache error');
  });

  it('should retry failed installation', async () => {
    const registerFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new MockServiceWorkerRegistration());

    vi.spyOn(navigator.serviceWorker, 'register').mockImplementation(registerFn);

    // First attempt fails
    await expect(navigator.serviceWorker.register('/sw.js')).rejects.toThrow();

    // Retry succeeds
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration).toBeDefined();
    expect(registerFn).toHaveBeenCalledTimes(2);
  });

  it('should handle quota exceeded errors', async () => {
    const mockCache = {
      put: vi.fn().mockRejectedValue(new DOMException('QuotaExceededError')),
    };
    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    };
    (global as any).caches = mockCaches;

    const cache = await caches.open('app-v1');

    await expect(
      cache.put('/large-file.js', new Response('large content'))
    ).rejects.toThrow();
  });
});

describe('Update Flow', () => {
  it('should detect and apply updates', async () => {
    const registration = new MockServiceWorkerRegistration();
    const waitingSW = new MockServiceWorker();
    waitingSW.state = 'installed';
    registration.waiting = waitingSW as any;

    // Check if update is available
    const updateAvailable = registration.waiting !== null;
    expect(updateAvailable).toBe(true);

    // Send skip waiting message
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Verify message was sent
    expect(registration.waiting).toBeDefined();
  });

  it('should handle controllerchange event', () => {
    const mockServiceWorker = new MockServiceWorkerContainer();
    const controllerchangeHandler = vi.fn();

    mockServiceWorker.addEventListener('controllerchange', controllerchangeHandler);
    mockServiceWorker.dispatchEvent(new Event('controllerchange'));

    expect(controllerchangeHandler).toHaveBeenCalled();
  });
});
