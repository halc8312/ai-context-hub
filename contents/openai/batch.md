# OpenAI Batch API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Batch API allows you to send asynchronous groups of requests at 50% lower cost with higher rate limits. Batches complete within 24 hours and are ideal for processing jobs that don't require immediate responses.

## Rate Limiting
- Batch creation: 100 batches per day
- Requests per batch: Up to 50,000
- Total tokens per batch: 250M tokens
- Concurrent batches: 100 per organization
- Higher per-model TPM limits than synchronous APIs

## Security Considerations
- Batch files should not contain sensitive API keys
- Monitor batch outputs for sensitive information
- Implement access controls for batch results
- Validate input data before batch submission
- Consider data retention policies for batch files

## Create Batch

Submit a batch of requests for asynchronous processing.

**Endpoint:** `POST /v1/batches`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| input_file_id | string | Yes | File ID containing batch requests (JSONL format) |
| endpoint | string | Yes | API endpoint: "/v1/chat/completions", "/v1/embeddings", "/v1/completions" |
| completion_window | string | Yes | Processing window: "24h" |
| metadata | object | No | Custom metadata for the batch |

### Basic Batch Example

```javascript
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createBatch(inputFileId) {
  try {
    const batch = await openai.batches.create({
      input_file_id: inputFileId,
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
      metadata: {
        description: "Daily customer inquiry processing",
        batch_type: "customer_support"
      }
    });
    
    console.log('Batch created:', batch.id);
    console.log('Status:', batch.status);
    console.log('Created at:', new Date(batch.created_at * 1000).toISOString());
    
    return batch;
  } catch (error) {
    console.error('Error creating batch:', error.message);
  }
}
```

### Response

```json
{
  "id": "batch_abc123",
  "object": "batch",
  "endpoint": "/v1/chat/completions",
  "errors": null,
  "input_file_id": "file-abc123",
  "completion_window": "24h",
  "status": "validating",
  "output_file_id": null,
  "error_file_id": null,
  "created_at": 1718764800,
  "in_progress_at": null,
  "expires_at": 1718851200,
  "finalizing_at": null,
  "completed_at": null,
  "failed_at": null,
  "expired_at": null,
  "cancelling_at": null,
  "cancelled_at": null,
  "request_counts": {
    "total": 0,
    "completed": 0,
    "failed": 0
  },
  "metadata": {
    "description": "Daily customer inquiry processing",
    "batch_type": "customer_support"
  }
}
```

## Prepare Batch Input File

Create a JSONL file with batch requests.

```javascript
async function prepareBatchFile(requests, outputPath) {
  const batchRequests = requests.map((request, index) => ({
    custom_id: `request-${index}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: request.model || "gpt-3.5-turbo",
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000
    }
  }));
  
  // Write to JSONL file
  const jsonlContent = batchRequests
    .map(req => JSON.stringify(req))
    .join('\n');
  
  await fs.promises.writeFile(outputPath, jsonlContent);
  
  // Upload file
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(outputPath),
      purpose: 'batch'
    });
    
    console.log(`Batch file uploaded: ${file.id}`);
    return file.id;
  } catch (error) {
    console.error('Error uploading batch file:', error.message);
    throw error;
  }
}

// Example usage
const requests = [
  {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Summarize the benefits of exercise." }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Explain photosynthesis in simple terms." }
    ]
  }
];

const fileId = await prepareBatchFile(requests, 'batch_input.jsonl');
```

## Retrieve Batch

Get the status and details of a batch.

**Endpoint:** `GET /v1/batches/{batch_id}`

```javascript
async function getBatchStatus(batchId) {
  try {
    const batch = await openai.batches.retrieve(batchId);
    
    console.log('Batch ID:', batch.id);
    console.log('Status:', batch.status);
    console.log('Progress:', `${batch.request_counts.completed}/${batch.request_counts.total}`);
    
    if (batch.status === 'completed') {
      console.log('Output file:', batch.output_file_id);
      if (batch.error_file_id) {
        console.log('Error file:', batch.error_file_id);
      }
    } else if (batch.status === 'failed') {
      console.log('Failure reason:', batch.errors);
    }
    
    return batch;
  } catch (error) {
    console.error('Error retrieving batch:', error.message);
  }
}
```

## Cancel Batch

Cancel an in-progress batch.

**Endpoint:** `POST /v1/batches/{batch_id}/cancel`

```javascript
async function cancelBatch(batchId) {
  try {
    const batch = await openai.batches.cancel(batchId);
    console.log(`Batch ${batchId} cancellation initiated`);
    console.log('Status:', batch.status);
    return batch;
  } catch (error) {
    console.error('Error cancelling batch:', error.message);
  }
}
```

## List Batches

List all batches with optional filters.

**Endpoint:** `GET /v1/batches`

```javascript
async function listBatches(options = {}) {
  try {
    const batches = await openai.batches.list({
      limit: options.limit || 20,
      after: options.after // Cursor for pagination
    });
    
    for (const batch of batches.data) {
      console.log(`ID: ${batch.id}`);
      console.log(`Status: ${batch.status}`);
      console.log(`Created: ${new Date(batch.created_at * 1000).toISOString()}`);
      console.log(`Progress: ${batch.request_counts.completed}/${batch.request_counts.total}`);
      console.log('---');
    }
    
    return batches.data;
  } catch (error) {
    console.error('Error listing batches:', error.message);
  }
}
```

## Process Batch Results

Download and process completed batch results.

```javascript
async function processBatchResults(batchId) {
  try {
    // Get batch details
    const batch = await openai.batches.retrieve(batchId);
    
    if (batch.status !== 'completed') {
      throw new Error(`Batch not completed. Status: ${batch.status}`);
    }
    
    // Download output file
    const outputFile = await openai.files.content(batch.output_file_id);
    const outputContent = await streamToString(outputFile.body);
    
    // Parse results
    const results = outputContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // Process successful results
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    
    // Handle errors if any
    if (batch.error_file_id) {
      const errorFile = await openai.files.content(batch.error_file_id);
      const errorContent = await streamToString(errorFile.body);
      const errors = errorContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
      
      console.log('Errors:', errors);
    }
    
    return {
      successful: successful,
      failed: failed,
      batch: batch
    };
  } catch (error) {
    console.error('Error processing results:', error.message);
    throw error;
  }
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
```

## Batch Processing Workflow

```javascript
class BatchProcessor {
  constructor(openai) {
    this.openai = openai;
  }
  
  async processBatch(requests, options = {}) {
    try {
      // 1. Prepare batch file
      console.log('Preparing batch file...');
      const fileId = await this.prepareBatchFile(requests);
      
      // 2. Create batch
      console.log('Creating batch...');
      const batch = await this.openai.batches.create({
        input_file_id: fileId,
        endpoint: options.endpoint || "/v1/chat/completions",
        completion_window: "24h",
        metadata: options.metadata || {}
      });
      
      console.log(`Batch created: ${batch.id}`);
      
      // 3. Monitor progress
      const completedBatch = await this.monitorBatch(batch.id, options.checkInterval);
      
      // 4. Process results
      console.log('Processing results...');
      const results = await this.downloadResults(completedBatch);
      
      return results;
    } catch (error) {
      console.error('Batch processing error:', error.message);
      throw error;
    }
  }
  
  async prepareBatchFile(requests) {
    const batchRequests = requests.map((request, index) => ({
      custom_id: request.custom_id || `request-${Date.now()}-${index}`,
      method: "POST",
      url: request.endpoint || "/v1/chat/completions",
      body: request.body || {
        model: request.model || "gpt-3.5-turbo",
        messages: request.messages,
        ...request.options
      }
    }));
    
    const jsonlContent = batchRequests
      .map(req => JSON.stringify(req))
      .join('\n');
    
    const tempFile = `batch_${Date.now()}.jsonl`;
    await fs.promises.writeFile(tempFile, jsonlContent);
    
    const file = await this.openai.files.create({
      file: fs.createReadStream(tempFile),
      purpose: 'batch'
    });
    
    // Clean up temp file
    await fs.promises.unlink(tempFile);
    
    return file.id;
  }
  
  async monitorBatch(batchId, checkInterval = 60000) {
    let batch;
    const startTime = Date.now();
    
    while (true) {
      batch = await this.openai.batches.retrieve(batchId);
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[${elapsed}s] Status: ${batch.status} - Progress: ${batch.request_counts.completed}/${batch.request_counts.total}`);
      
      if (['completed', 'failed', 'expired'].includes(batch.status)) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    if (batch.status === 'failed') {
      throw new Error(`Batch failed: ${JSON.stringify(batch.errors)}`);
    }
    
    if (batch.status === 'expired') {
      throw new Error('Batch expired before completion');
    }
    
    return batch;
  }
  
  async downloadResults(batch) {
    const results = {
      successful: [],
      failed: [],
      stats: {
        total: batch.request_counts.total,
        completed: batch.request_counts.completed,
        failed: batch.request_counts.failed
      }
    };
    
    // Download main output file
    if (batch.output_file_id) {
      const outputFile = await this.openai.files.content(batch.output_file_id);
      const content = await this.streamToString(outputFile.body);
      
      content.split('\n')
        .filter(line => line.trim())
        .forEach(line => {
          const result = JSON.parse(line);
          if (result.response && result.response.body) {
            results.successful.push({
              custom_id: result.custom_id,
              response: result.response.body
            });
          }
        });
    }
    
    // Download error file if exists
    if (batch.error_file_id) {
      const errorFile = await this.openai.files.content(batch.error_file_id);
      const content = await this.streamToString(errorFile.body);
      
      content.split('\n')
        .filter(line => line.trim())
        .forEach(line => {
          const error = JSON.parse(line);
          results.failed.push({
            custom_id: error.custom_id,
            error: error.error
          });
        });
    }
    
    return results;
  }
  
  async streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
}
```

## Batch Use Cases

### Bulk Content Generation

```javascript
async function generateBulkContent(topics) {
  const requests = topics.map(topic => ({
    custom_id: `content-${topic.id}`,
    messages: [
      {
        role: "system",
        content: "You are a content writer. Write engaging, SEO-friendly articles."
      },
      {
        role: "user",
        content: `Write a 500-word article about: ${topic.title}`
      }
    ],
    model: "gpt-4-turbo",
    max_tokens: 1000
  }));
  
  const processor = new BatchProcessor(openai);
  const results = await processor.processBatch(requests, {
    metadata: {
      job_type: "content_generation",
      total_topics: topics.length
    }
  });
  
  return results;
}
```

### Bulk Data Analysis

```javascript
async function analyzeCustomerFeedback(feedbackList) {
  const requests = feedbackList.map(feedback => ({
    custom_id: `feedback-${feedback.id}`,
    messages: [
      {
        role: "system",
        content: "Analyze customer feedback for sentiment, key issues, and suggestions."
      },
      {
        role: "user",
        content: feedback.text
      }
    ],
    model: "gpt-3.5-turbo",
    response_format: { type: "json_object" }
  }));
  
  const processor = new BatchProcessor(openai);
  const results = await processor.processBatch(requests);
  
  // Aggregate results
  const analysis = results.successful.map(result => ({
    id: result.custom_id,
    analysis: JSON.parse(result.response.choices[0].message.content)
  }));
  
  return analysis;
}
```

### Bulk Embeddings

```javascript
async function generateBulkEmbeddings(texts) {
  const batchRequests = texts.map((text, index) => ({
    custom_id: `embedding-${index}`,
    method: "POST",
    url: "/v1/embeddings",
    body: {
      model: "text-embedding-3-small",
      input: text.content,
      encoding_format: "float"
    }
  }));
  
  // Create batch file
  const jsonlContent = batchRequests
    .map(req => JSON.stringify(req))
    .join('\n');
  
  const tempFile = `embeddings_batch_${Date.now()}.jsonl`;
  await fs.promises.writeFile(tempFile, jsonlContent);
  
  // Upload and create batch
  const file = await openai.files.create({
    file: fs.createReadStream(tempFile),
    purpose: 'batch'
  });
  
  const batch = await openai.batches.create({
    input_file_id: file.id,
    endpoint: "/v1/embeddings",
    completion_window: "24h"
  });
  
  // Clean up
  await fs.promises.unlink(tempFile);
  
  return batch.id;
}
```

## Cost Optimization

```javascript
class BatchCostOptimizer {
  constructor() {
    // Approximate costs (check OpenAI pricing)
    this.pricing = {
      'gpt-4-turbo': {
        sync: { input: 0.01, output: 0.03 },
        batch: { input: 0.005, output: 0.015 } // 50% discount
      },
      'gpt-3.5-turbo': {
        sync: { input: 0.0005, output: 0.0015 },
        batch: { input: 0.00025, output: 0.00075 }
      }
    };
  }
  
  estimateSavings(requests, model = 'gpt-3.5-turbo') {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    requests.forEach(request => {
      // Rough estimation
      const inputTokens = JSON.stringify(request.messages).length / 4;
      const outputTokens = request.max_tokens || 500;
      
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
    });
    
    const syncCost = 
      (totalInputTokens / 1000 * this.pricing[model].sync.input) +
      (totalOutputTokens / 1000 * this.pricing[model].sync.output);
    
    const batchCost = 
      (totalInputTokens / 1000 * this.pricing[model].batch.input) +
      (totalOutputTokens / 1000 * this.pricing[model].batch.output);
    
    return {
      syncCost: syncCost.toFixed(4),
      batchCost: batchCost.toFixed(4),
      savings: (syncCost - batchCost).toFixed(4),
      savingsPercent: ((1 - batchCost / syncCost) * 100).toFixed(1)
    };
  }
  
  shouldUseBatch(requests, urgency = 'low') {
    if (urgency === 'high') return false;
    if (requests.length < 10) return false;
    
    const savings = this.estimateSavings(requests);
    return parseFloat(savings.savings) > 1.0; // Use batch if saving > $1
  }
}
```

## Error Handling

```javascript
async function robustBatchOperation(operation, retries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error.status === 400) {
        console.error('Bad request:', error.message);
        if (error.message.includes('file')) {
          throw new Error('Invalid batch file format');
        } else if (error.message.includes('endpoint')) {
          throw new Error('Invalid endpoint specified');
        }
        throw error; // Don't retry bad requests
      } else if (error.status === 404) {
        throw new Error('Batch or file not found');
      } else if (error.status === 429) {
        throw new Error('Batch creation limit exceeded');
      } else if (error.status >= 500) {
        console.log(`Server error. Retrying in ${attempt + 1} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}
```