# OpenAI Moderations API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Moderations API allows you to check whether text is potentially harmful. The API classifies content into categories and provides severity scores to help you filter content in your applications.

## Rate Limiting
- Default rate limit: 1,000 requests per minute
- No token limits for moderation checks
- Free to use with any API key
- Batch multiple inputs for efficiency

## Security Considerations
- Use moderations for all user-generated content
- Implement client-side filtering as first defense
- Log flagged content for review
- Consider custom thresholds based on your use case
- Combine with your own content policies

## Create Moderation

Classifies if text violates OpenAI's Content Policy.

**Endpoint:** `POST /v1/moderations`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| input | string or array | Yes | Text to classify, string or array of strings |
| model | string | No | Model to use: "text-moderation-latest" or "text-moderation-stable" |

### Basic Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function moderateContent(text) {
  try {
    const moderation = await openai.moderations.create({
      input: text,
      model: "text-moderation-latest"
    });
    
    const result = moderation.results[0];
    
    console.log('Flagged:', result.flagged);
    console.log('Categories:', result.categories);
    console.log('Category scores:', result.category_scores);
    
    return result;
  } catch (error) {
    console.error('Moderation error:', error.message);
  }
}

// Usage
await moderateContent("I want to learn about machine learning.");
```

### Response

```json
{
  "id": "modr-abc123",
  "model": "text-moderation-007",
  "results": [
    {
      "flagged": false,
      "categories": {
        "sexual": false,
        "hate": false,
        "harassment": false,
        "self-harm": false,
        "sexual/minors": false,
        "hate/threatening": false,
        "violence/graphic": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "harassment/threatening": false,
        "violence": false
      },
      "category_scores": {
        "sexual": 0.000015,
        "hate": 0.000022,
        "harassment": 0.000029,
        "self-harm": 0.000005,
        "sexual/minors": 0.000003,
        "hate/threatening": 0.000002,
        "violence/graphic": 0.000008,
        "self-harm/intent": 0.000002,
        "self-harm/instructions": 0.000001,
        "harassment/threatening": 0.000027,
        "violence": 0.000098
      }
    }
  ]
}
```

## Batch Moderation

Process multiple texts in a single request.

```javascript
async function batchModerate(texts) {
  try {
    const moderation = await openai.moderations.create({
      input: texts,
      model: "text-moderation-latest"
    });
    
    const results = moderation.results.map((result, index) => ({
      text: texts[index],
      flagged: result.flagged,
      issues: Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category)
    }));
    
    return results;
  } catch (error) {
    console.error('Batch moderation error:', error.message);
  }
}

// Usage
const texts = [
  "How can I learn Python programming?",
  "What's the weather like today?",
  "Can you help me with my homework?"
];

const results = await batchModerate(texts);
results.forEach(result => {
  console.log(`Text: "${result.text.substring(0, 50)}..."`);
  console.log(`Flagged: ${result.flagged}`);
  if (result.issues.length > 0) {
    console.log(`Issues: ${result.issues.join(', ')}`);
  }
  console.log('---');
});
```

## Content Filtering System

```javascript
class ContentModerator {
  constructor(openai, options = {}) {
    this.openai = openai;
    this.thresholds = options.thresholds || this.getDefaultThresholds();
    this.customFilters = options.customFilters || [];
    this.cache = new Map();
    this.cacheMaxSize = options.cacheMaxSize || 1000;
  }
  
  getDefaultThresholds() {
    return {
      'sexual': 0.7,
      'hate': 0.7,
      'harassment': 0.7,
      'self-harm': 0.7,
      'sexual/minors': 0.1,
      'hate/threatening': 0.7,
      'violence/graphic': 0.7,
      'self-harm/intent': 0.7,
      'self-harm/instructions': 0.7,
      'harassment/threatening': 0.7,
      'violence': 0.7
    };
  }
  
  async moderateWithThresholds(text) {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }
    
    try {
      // Apply custom filters first
      for (const filter of this.customFilters) {
        if (filter.test(text)) {
          return {
            allowed: false,
            reason: 'Custom filter match',
            filter: filter.name
          };
        }
      }
      
      // OpenAI moderation
      const moderation = await this.openai.moderations.create({
        input: text
      });
      
      const result = moderation.results[0];
      const violations = [];
      
      // Check against custom thresholds
      for (const [category, score] of Object.entries(result.category_scores)) {
        if (score > this.thresholds[category]) {
          violations.push({
            category: category,
            score: score,
            threshold: this.thresholds[category]
          });
        }
      }
      
      const moderationResult = {
        allowed: violations.length === 0,
        flagged: result.flagged,
        violations: violations,
        scores: result.category_scores
      };
      
      // Update cache
      this.updateCache(text, moderationResult);
      
      return moderationResult;
    } catch (error) {
      console.error('Moderation error:', error.message);
      // Fail open or closed based on your security requirements
      return {
        allowed: false,
        error: error.message
      };
    }
  }
  
  updateCache(key, value) {
    this.cache.set(key, value);
    
    // Simple LRU: remove oldest if cache is too large
    if (this.cache.size > this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  addCustomFilter(name, regex) {
    this.customFilters.push({
      name: name,
      test: (text) => regex.test(text)
    });
  }
  
  setThreshold(category, threshold) {
    if (this.thresholds.hasOwnProperty(category)) {
      this.thresholds[category] = threshold;
    } else {
      throw new Error(`Unknown category: ${category}`);
    }
  }
}

// Usage
const moderator = new ContentModerator(openai, {
  thresholds: {
    'harassment': 0.5, // More strict
    'violence': 0.8    // Less strict
  }
});

// Add custom filters
moderator.addCustomFilter('phone_numbers', /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
moderator.addCustomFilter('email_addresses', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);

const result = await moderator.moderateWithThresholds("Your content here");
if (!result.allowed) {
  console.log('Content blocked:', result.violations || result.reason);
}
```

## Real-time Chat Moderation

```javascript
class ChatModerator {
  constructor(openai) {
    this.openai = openai;
    this.messageHistory = new Map();
    this.userViolations = new Map();
    this.banThreshold = 3;
  }
  
  async moderateMessage(userId, message) {
    try {
      // Check moderation
      const moderation = await this.openai.moderations.create({
        input: message
      });
      
      const result = moderation.results[0];
      
      if (result.flagged) {
        // Track violations
        const violations = this.userViolations.get(userId) || 0;
        this.userViolations.set(userId, violations + 1);
        
        // Log for review
        this.logViolation(userId, message, result);
        
        // Check if user should be banned
        if (violations + 1 >= this.banThreshold) {
          return {
            allowed: false,
            action: 'ban',
            reason: 'Multiple violations',
            message: 'You have been banned for repeated violations.'
          };
        }
        
        return {
          allowed: false,
          action: 'block',
          reason: this.getViolationSummary(result),
          message: 'Your message was blocked due to content policy violations.'
        };
      }
      
      // Message is clean
      this.addToHistory(userId, message);
      
      return {
        allowed: true,
        action: 'allow'
      };
    } catch (error) {
      console.error('Chat moderation error:', error.message);
      // Decide whether to fail open or closed
      return {
        allowed: false,
        action: 'error',
        message: 'Unable to process message at this time.'
      };
    }
  }
  
  getViolationSummary(result) {
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category.replace('/', ' '));
    
    return `Flagged for: ${flaggedCategories.join(', ')}`;
  }
  
  logViolation(userId, message, result) {
    const log = {
      timestamp: new Date().toISOString(),
      userId: userId,
      message: message,
      categories: result.categories,
      scores: result.category_scores
    };
    
    // In production, write to database or log service
    console.log('Violation logged:', JSON.stringify(log));
  }
  
  addToHistory(userId, message) {
    if (!this.messageHistory.has(userId)) {
      this.messageHistory.set(userId, []);
    }
    
    const history = this.messageHistory.get(userId);
    history.push({
      timestamp: Date.now(),
      message: message
    });
    
    // Keep only last 100 messages per user
    if (history.length > 100) {
      history.shift();
    }
  }
  
  getUserViolationCount(userId) {
    return this.userViolations.get(userId) || 0;
  }
  
  resetUserViolations(userId) {
    this.userViolations.delete(userId);
  }
}
```

## Content Pre-processing

```javascript
class ContentPreProcessor {
  constructor() {
    this.replacements = new Map([
      // Common obfuscation patterns
      [/[@4]/gi, 'a'],
      [/[3]/gi, 'e'],
      [/[1!]/gi, 'i'],
      [/[0]/gi, 'o'],
      [/[$5]/gi, 's'],
      [/[7]/gi, 't'],
      // Remove excessive special characters
      [/[^a-zA-Z0-9\s.,!?-]/g, ' '],
      // Normalize whitespace
      [/\s+/g, ' ']
    ]);
  }
  
  preprocess(text) {
    let processed = text;
    
    // Apply replacements
    for (const [pattern, replacement] of this.replacements) {
      processed = processed.replace(pattern, replacement);
    }
    
    // Remove zero-width characters
    processed = processed.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Normalize unicode
    processed = processed.normalize('NFKC');
    
    return processed.trim();
  }
  
  async moderateWithPreprocessing(openai, text) {
    // Moderate original
    const originalResult = await openai.moderations.create({
      input: text
    });
    
    // Moderate preprocessed
    const processed = this.preprocess(text);
    const processedResult = await openai.moderations.create({
      input: processed
    });
    
    // Return most restrictive result
    return {
      original: originalResult.results[0],
      processed: processedResult.results[0],
      flagged: originalResult.results[0].flagged || processedResult.results[0].flagged,
      preprocessedText: processed
    };
  }
}
```

## Integration Examples

### Express Middleware

```javascript
function createModerationMiddleware(openai) {
  return async (req, res, next) => {
    const contentFields = ['body', 'title', 'description', 'comment'];
    const textsToModerate = [];
    
    // Collect all text fields
    contentFields.forEach(field => {
      if (req.body && req.body[field]) {
        textsToModerate.push(req.body[field]);
      }
    });
    
    if (textsToModerate.length === 0) {
      return next();
    }
    
    try {
      const moderation = await openai.moderations.create({
        input: textsToModerate
      });
      
      const violations = moderation.results
        .map((result, index) => ({
          field: contentFields[index],
          flagged: result.flagged,
          categories: Object.entries(result.categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => category)
        }))
        .filter(item => item.flagged);
      
      if (violations.length > 0) {
        return res.status(400).json({
          error: 'Content policy violation',
          violations: violations
        });
      }
      
      next();
    } catch (error) {
      console.error('Moderation middleware error:', error);
      // Decide whether to fail open or closed
      res.status(500).json({
        error: 'Content moderation unavailable'
      });
    }
  };
}

// Usage with Express
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/posts', createModerationMiddleware(openai));

app.post('/api/posts', (req, res) => {
  // Content has been moderated
  res.json({ message: 'Post created successfully' });
});
```

### Streaming Moderation

```javascript
async function moderateStream(openai, textStream) {
  const buffer = [];
  const chunkSize = 1000; // Characters
  
  for await (const chunk of textStream) {
    buffer.push(chunk);
    
    const currentText = buffer.join('');
    
    if (currentText.length >= chunkSize) {
      const moderation = await openai.moderations.create({
        input: currentText
      });
      
      if (moderation.results[0].flagged) {
        throw new Error('Content violation detected in stream');
      }
      
      // Keep last part for context
      buffer.splice(0, buffer.length - 1);
    }
  }
  
  // Check final buffer
  if (buffer.length > 0) {
    const finalText = buffer.join('');
    const moderation = await openai.moderations.create({
      input: finalText
    });
    
    if (moderation.results[0].flagged) {
      throw new Error('Content violation detected at end of stream');
    }
  }
}
```

## Error Handling

```javascript
async function robustModeration(openai, text, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const fallbackBehavior = options.fallbackBehavior || 'block'; // 'block' or 'allow'
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const moderation = await openai.moderations.create({
        input: text
      });
      
      return moderation.results[0];
    } catch (error) {
      console.error(`Moderation attempt ${attempt + 1} failed:`, error.message);
      
      if (error.status === 429) {
        // Rate limited - wait exponentially
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (error.status >= 500) {
        // Server error - wait briefly
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Client error - don't retry
        throw error;
      }
    }
  }
  
  // All retries failed - apply fallback behavior
  console.error('All moderation attempts failed, applying fallback behavior');
  return {
    flagged: fallbackBehavior === 'block',
    categories: {},
    category_scores: {},
    error: 'Moderation service unavailable'
  };
}
```