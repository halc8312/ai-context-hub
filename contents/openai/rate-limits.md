# OpenAI Rate Limits and Error Handling

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

This guide covers rate limits across OpenAI APIs, error handling strategies, and best practices for building robust applications.

## Rate Limit Overview

Rate limits are enforced at the organization level and vary by model and API endpoint. Limits are measured in:
- **RPM** (Requests Per Minute)
- **TPM** (Tokens Per Minute)
- **RPD** (Requests Per Day)

## Current Rate Limits by Model

### GPT-4 Models
| Model | Tier | RPM | TPM | RPD |
|-------|------|-----|-----|-----|
| gpt-4-turbo | Tier 1 | 500 | 30,000 | 10,000 |
| gpt-4-turbo | Tier 2 | 5,000 | 450,000 | - |
| gpt-4-turbo | Tier 3 | 5,000 | 600,000 | - |
| gpt-4-turbo | Tier 4 | 10,000 | 800,000 | - |
| gpt-4-turbo | Tier 5 | 10,000 | 30,000,000 | - |

### GPT-3.5 Models
| Model | Tier | RPM | TPM | RPD |
|-------|------|-----|-----|-----|
| gpt-3.5-turbo | Tier 1 | 3,500 | 60,000 | 10,000 |
| gpt-3.5-turbo | Tier 2 | 3,500 | 80,000 | - |
| gpt-3.5-turbo | Tier 3 | 3,500 | 160,000 | - |
| gpt-3.5-turbo | Tier 4 | 10,000 | 1,000,000 | - |
| gpt-3.5-turbo | Tier 5 | 10,000 | 50,000,000 | - |

### Other APIs
| API | Default RPM | Notes |
|-----|-------------|-------|
| Embeddings | 3,000 | 1,000,000 TPM |
| Images (DALL-E 3) | 5 | Per minute |
| Images (DALL-E 2) | 50 | Per minute |
| Audio (Whisper) | 50 | Per minute |
| Audio (TTS) | 50 | Per minute |
| Moderations | 1,000 | Free tier |
| Files | 100 | Per minute |
| Fine-tuning | 10 | Per hour |
| Assistants | 100 | Per minute |
| Batch | 100 | Batches per day |

## Understanding Rate Limit Headers

```javascript
async function checkRateLimitHeaders(response) {
  const headers = response.headers;
  
  console.log('Rate Limit Info:');
  console.log(`Limit (RPM): ${headers['x-ratelimit-limit-requests']}`);
  console.log(`Remaining (RPM): ${headers['x-ratelimit-remaining-requests']}`);
  console.log(`Reset: ${headers['x-ratelimit-reset-requests']}`);
  console.log(`Limit (TPM): ${headers['x-ratelimit-limit-tokens']}`);
  console.log(`Remaining (TPM): ${headers['x-ratelimit-remaining-tokens']}`);
  console.log(`Reset: ${headers['x-ratelimit-reset-tokens']}`);
  
  // Calculate wait time if limited
  const remainingRequests = parseInt(headers['x-ratelimit-remaining-requests']);
  if (remainingRequests === 0) {
    const resetTime = parseInt(headers['x-ratelimit-reset-requests']);
    const waitTime = resetTime - Math.floor(Date.now() / 1000);
    console.log(`Rate limited. Wait ${waitTime} seconds.`);
  }
}
```

## Error Types and Handling

### Common Error Codes

```javascript
const ERROR_CODES = {
  400: 'Bad Request - Invalid request format',
  401: 'Unauthorized - Invalid API key',
  403: 'Forbidden - Access denied',
  404: 'Not Found - Resource doesn\'t exist',
  409: 'Conflict - Resource already exists',
  422: 'Unprocessable Entity - Invalid parameters',
  429: 'Too Many Requests - Rate limit exceeded',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

async function handleAPIError(error) {
  const status = error.status || error.response?.status;
  const message = error.message || 'Unknown error';
  
  console.error(`Error ${status}: ${ERROR_CODES[status] || 'Unknown'}`);
  console.error(`Details: ${message}`);
  
  switch (status) {
    case 429:
      return handleRateLimit(error);
    case 401:
      throw new Error('Invalid API key. Check your configuration.');
    case 500:
    case 502:
    case 503:
    case 504:
      return handleServerError(error);
    default:
      throw error;
  }
}
```

## Rate Limiting Strategies

### Exponential Backoff

```javascript
class ExponentialBackoff {
  constructor(options = {}) {
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 60000; // 60 seconds
    this.maxRetries = options.maxRetries || 5;
    this.jitter = options.jitter || true;
  }
  
  async execute(operation) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error)) {
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        console.log(`Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  shouldRetry(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }
  
  calculateDelay(attempt) {
    let delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    
    if (this.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += (Math.random() * 2 - 1) * jitterRange;
    }
    
    return Math.floor(delay);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const backoff = new ExponentialBackoff();
const result = await backoff.execute(async () => {
  return await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: "Hello" }]
  });
});
```

### Token Bucket Rate Limiter

```javascript
class TokenBucketRateLimiter {
  constructor(options) {
    this.capacity = options.capacity; // Max tokens
    this.refillRate = options.refillRate; // Tokens per second
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
  
  async acquire(tokens = 1) {
    while (true) {
      this.refill();
      
      if (this.tokens >= tokens) {
        this.tokens -= tokens;
        return true;
      }
      
      // Calculate wait time
      const tokensNeeded = tokens - this.tokens;
      const waitTime = (tokensNeeded / this.refillRate) * 1000;
      
      console.log(`Rate limited. Waiting ${Math.ceil(waitTime)}ms for ${tokens} tokens`);
      await this.sleep(waitTime);
    }
  }
  
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage: Rate limit to 100 requests per minute
const rateLimiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 100 / 60 // 100 per minute
});

async function makeRateLimitedRequest(request) {
  await rateLimiter.acquire(1);
  return await request();
}
```

### Adaptive Rate Limiting

```javascript
class AdaptiveRateLimiter {
  constructor(openai) {
    this.openai = openai;
    this.limits = new Map(); // Model -> limit info
    this.requestQueue = [];
    this.processing = false;
  }
  
  async request(options) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ options, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const { options, resolve, reject } = this.requestQueue.shift();
      
      try {
        await this.waitForCapacity(options.model);
        const result = await this.makeRequest(options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
  
  async makeRequest(options) {
    try {
      const response = await this.openai.chat.completions.create(options);
      this.updateLimits(options.model, response.headers);
      return response;
    } catch (error) {
      if (error.status === 429) {
        this.handleRateLimit(options.model, error);
        throw error;
      }
      throw error;
    }
  }
  
  updateLimits(model, headers) {
    this.limits.set(model, {
      requestsLimit: parseInt(headers['x-ratelimit-limit-requests']) || 100,
      requestsRemaining: parseInt(headers['x-ratelimit-remaining-requests']) || 100,
      requestsReset: parseInt(headers['x-ratelimit-reset-requests']) || Date.now() / 1000 + 60,
      tokensLimit: parseInt(headers['x-ratelimit-limit-tokens']) || 10000,
      tokensRemaining: parseInt(headers['x-ratelimit-remaining-tokens']) || 10000,
      tokensReset: parseInt(headers['x-ratelimit-reset-tokens']) || Date.now() / 1000 + 60
    });
  }
  
  async waitForCapacity(model) {
    const limit = this.limits.get(model);
    if (!limit) return; // No limit info yet
    
    const now = Date.now() / 1000;
    
    if (limit.requestsRemaining === 0 && limit.requestsReset > now) {
      const waitTime = (limit.requestsReset - now) * 1000;
      console.log(`Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset`);
      await this.sleep(waitTime);
    }
  }
  
  handleRateLimit(model, error) {
    const retryAfter = error.headers?.['retry-after'];
    if (retryAfter) {
      const waitTime = parseInt(retryAfter) * 1000;
      console.log(`Rate limited. Retry after ${retryAfter}s`);
      
      // Update our limit tracking
      const limit = this.limits.get(model) || {};
      limit.requestsRemaining = 0;
      limit.requestsReset = Date.now() / 1000 + parseInt(retryAfter);
      this.limits.set(model, limit);
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Batch Processing for Rate Limit Optimization

```javascript
class BatchProcessor {
  constructor(openai, options = {}) {
    this.openai = openai;
    this.batchSize = options.batchSize || 20;
    this.batchDelay = options.batchDelay || 1000;
    this.queue = [];
    this.processing = false;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processBatch();
    });
  }
  
  async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      // Process batch concurrently with controlled concurrency
      const results = await this.processWithConcurrency(batch, 5);
      
      // Delay between batches
      if (this.queue.length > 0) {
        await this.sleep(this.batchDelay);
      }
    }
    
    this.processing = false;
  }
  
  async processWithConcurrency(items, concurrency) {
    const results = [];
    const executing = [];
    
    for (const item of items) {
      const promise = this.processItem(item).then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      
      results.push(promise);
      executing.push(promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
    
    return Promise.all(results);
  }
  
  async processItem({ request, resolve, reject }) {
    try {
      const result = await this.openai.chat.completions.create(request);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.halfOpenRequests = options.halfOpenRequests || 3;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenRequests) {
        this.state = 'CLOSED';
        console.log('Circuit breaker closed');
      }
    }
  }
  
  onFailure() {
    this.failures++;
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`Circuit breaker opened. Retry after ${new Date(this.nextAttempt).toISOString()}`);
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}
```

## Production-Ready Error Handler

```javascript
class OpenAIErrorHandler {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.metrics = options.metrics;
    this.alerting = options.alerting;
  }
  
  async handle(error, context = {}) {
    const errorInfo = this.parseError(error);
    
    // Log error
    this.logger.error('OpenAI API Error', {
      ...errorInfo,
      ...context
    });
    
    // Record metrics
    if (this.metrics) {
      this.metrics.increment('openai.errors', {
        status: errorInfo.status,
        type: errorInfo.type
      });
    }
    
    // Alert on critical errors
    if (this.shouldAlert(errorInfo)) {
      if (this.alerting) {
        await this.alerting.send({
          severity: 'high',
          title: 'OpenAI API Critical Error',
          details: errorInfo
        });
      }
    }
    
    // Determine action
    return this.determineAction(errorInfo);
  }
  
  parseError(error) {
    return {
      status: error.status,
      type: error.type || 'unknown',
      message: error.message,
      code: error.code,
      param: error.param,
      headers: error.headers,
      timestamp: new Date().toISOString()
    };
  }
  
  shouldAlert(errorInfo) {
    // Alert on auth failures or persistent 5xx errors
    return errorInfo.status === 401 || errorInfo.status >= 500;
  }
  
  determineAction(errorInfo) {
    switch (errorInfo.status) {
      case 429:
        return {
          action: 'retry',
          delay: this.parseRetryAfter(errorInfo.headers),
          reason: 'rate_limit'
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          action: 'retry',
          delay: 5000,
          reason: 'server_error'
        };
      
      case 401:
        return {
          action: 'fail',
          reason: 'authentication_failed'
        };
      
      case 400:
        if (errorInfo.code === 'context_length_exceeded') {
          return {
            action: 'reduce_context',
            reason: 'context_too_long'
          };
        }
        return {
          action: 'fail',
          reason: 'bad_request'
        };
      
      default:
        return {
          action: 'fail',
          reason: 'unhandled_error'
        };
    }
  }
  
  parseRetryAfter(headers) {
    const retryAfter = headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }
    return 60000; // Default to 1 minute
  }
}
```

## Best Practices Summary

### 1. Implement Retry Logic
```javascript
const makeRequestWithRetry = async (requestFn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1 || error.status === 400) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

### 2. Monitor Rate Limits
```javascript
const monitorRateLimits = (response) => {
  const remaining = response.headers['x-ratelimit-remaining-requests'];
  const limit = response.headers['x-ratelimit-limit-requests'];
  const usage = ((limit - remaining) / limit) * 100;
  
  if (usage > 80) {
    console.warn(`High rate limit usage: ${usage.toFixed(1)}%`);
  }
};
```

### 3. Use Caching
```javascript
const cache = new Map();
const cachedRequest = async (key, requestFn, ttl = 3600000) => {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const data = await requestFn();
  cache.set(key, {
    data,
    expires: Date.now() + ttl
  });
  
  return data;
};
```

### 4. Implement Graceful Degradation
```javascript
const withFallback = async (primaryFn, fallbackFn) => {
  try {
    return await primaryFn();
  } catch (error) {
    console.warn('Primary function failed, using fallback');
    return await fallbackFn();
  }
};
```

### 5. Queue Management
```javascript
class RequestQueue {
  constructor(rateLimit) {
    this.queue = [];
    this.processing = false;
    this.rateLimit = rateLimit;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift();
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      await new Promise(r => setTimeout(r, 60000 / this.rateLimit));
    }
    
    this.processing = false;
  }
}
```