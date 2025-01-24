import pLimit from 'p-limit';

export class GatewayHttpClient {
  constructor(session) {
    this.session = session;
    this.session.dispatcher.addListener('GLADYS_GATEWAY_CONNECTED', this.emptyQueue.bind(this));
    // Allow a maximum of 5 concurrent API calls
    this.limiter = pLimit(5);
    this.queue = [];
    this.pendingRequests = new Map(); // Cache for pending GET requests
  }

  async emptyQueue() {
    this.queue.forEach(func => {
      func();
    });
    this.queue = [];
  }

  getCacheKey(url, query) {
    // Create a unique key based on the URL and query parameters
    const queryKey = query ? JSON.stringify(query) : '';
    return `${url}?${queryKey}`;
  }

  async callApi(func, url, data) {
    try {
      const result = await this.limiter(() => this.session.gatewayClient[func](url, data));
      return result;
    } catch (e) {
      const error = {
        response: {
          status: e.status,
          data: e
        }
      };
      throw error;
    }
  }

  async callApiWhenReady(func, url, data) {
    if (this.session.ready) {
      return this.callApi(func, url, data);
    }
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const response = await this.callApi(func, url, data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async get(url, query) {
    const cacheKey = this.getCacheKey(url, query);

    // Check if a GET request with the same parameters is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // If no request is in progress, create a new one and cache it
    const requestPromise = this.callApiWhenReady('sendRequestGet', url, query);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove the completed request from the cache
      this.pendingRequests.delete(cacheKey);
    }
  }

  async post(url, body) {
    return this.callApiWhenReady('sendRequestPost', url, body);
  }

  async patch(url, body) {
    return this.callApiWhenReady('sendRequestPatch', url, body);
  }

  async delete(url) {
    return this.callApiWhenReady('sendRequestDelete', url);
  }
}
