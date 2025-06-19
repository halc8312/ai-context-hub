# OpenAI Fine-tuning API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Fine-tuning API allows you to customize OpenAI models for your specific use case with training data. Fine-tuning improves model performance on specific tasks by training on your examples.

## Rate Limiting
- Fine-tuning job creation: 10 per hour
- Training file uploads: 100 per hour
- Job status checks: No specific limit
- Model inference: Standard model rate limits apply

## Security Considerations
- Training data should not contain sensitive information
- Fine-tuned models are private to your organization
- Monitor model outputs for potential biases
- Implement access controls for fine-tuned models
- Review training data for quality and compliance

## Create Fine-tuning Job

Creates a fine-tuning job which begins the process of creating a new model.

**Endpoint:** `POST /v1/fine_tuning/jobs`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| training_file | string | Yes | File ID of training data |
| model | string | Yes | Base model: "gpt-3.5-turbo", "gpt-4-0613", "davinci-002", "babbage-002" |
| hyperparameters | object | No | Training hyperparameters |
| suffix | string | No | String to add to model name |
| validation_file | string | No | File ID for validation data |
| integrations | array | No | Third-party integrations |
| seed | integer | No | Random seed for reproducibility |

### Basic Fine-tuning Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createFineTuningJob(trainingFileId) {
  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: trainingFileId,
      model: "gpt-3.5-turbo",
      hyperparameters: {
        n_epochs: 3,
        batch_size: 1,
        learning_rate_multiplier: 2
      },
      suffix: "custom-model"
    });
    
    console.log('Fine-tuning job created:', fineTune.id);
    console.log('Status:', fineTune.status);
    console.log('Model:', fineTune.model);
    
    return fineTune;
  } catch (error) {
    console.error('Error creating fine-tuning job:', error.message);
  }
}
```

### Response

```json
{
  "object": "fine_tuning.job",
  "id": "ftjob-abc123",
  "model": "gpt-3.5-turbo-0613",
  "created_at": 1718764800,
  "finished_at": null,
  "fine_tuned_model": null,
  "organization_id": "org-...",
  "result_files": [],
  "status": "validating_files",
  "validation_file": null,
  "training_file": "file-abc123",
  "hyperparameters": {
    "n_epochs": 3,
    "batch_size": 1,
    "learning_rate_multiplier": 2
  },
  "trained_tokens": null,
  "error": null,
  "integrations": [],
  "seed": 123,
  "estimated_finish": 1718768400
}
```

## List Fine-tuning Jobs

List your organization's fine-tuning jobs.

**Endpoint:** `GET /v1/fine_tuning/jobs`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| after | string | No | Cursor for pagination |
| limit | integer | No | Number of jobs to retrieve (1-100) |

### Example

```javascript
async function listFineTuningJobs() {
  try {
    const jobs = await openai.fineTuning.jobs.list({
      limit: 20
    });
    
    for (const job of jobs.data) {
      console.log(`Job ID: ${job.id}`);
      console.log(`Status: ${job.status}`);
      console.log(`Model: ${job.model}`);
      console.log(`Created: ${new Date(job.created_at * 1000).toISOString()}`);
      
      if (job.fine_tuned_model) {
        console.log(`Fine-tuned model: ${job.fine_tuned_model}`);
      }
      
      if (job.error) {
        console.log(`Error: ${job.error.message}`);
      }
      
      console.log('---');
    }
    
    return jobs.data;
  } catch (error) {
    console.error('Error listing jobs:', error.message);
  }
}
```

## Retrieve Fine-tuning Job

Get info about a fine-tuning job.

**Endpoint:** `GET /v1/fine_tuning/jobs/{fine_tuning_job_id}`

### Example with Status Monitoring

```javascript
async function monitorFineTuningJob(jobId) {
  let previousStatus = null;
  
  while (true) {
    try {
      const job = await openai.fineTuning.jobs.retrieve(jobId);
      
      if (job.status !== previousStatus) {
        console.log(`Status changed: ${previousStatus} → ${job.status}`);
        previousStatus = job.status;
        
        if (job.status === 'succeeded') {
          console.log(`✓ Fine-tuning completed!`);
          console.log(`Model: ${job.fine_tuned_model}`);
          console.log(`Trained tokens: ${job.trained_tokens}`);
          return job;
        } else if (job.status === 'failed') {
          console.error(`✗ Fine-tuning failed: ${job.error?.message}`);
          return job;
        } else if (job.status === 'cancelled') {
          console.log(`⚠ Fine-tuning cancelled`);
          return job;
        }
      }
      
      // Show progress
      if (job.status === 'running') {
        const elapsed = Date.now() / 1000 - job.created_at;
        const estimated = job.estimated_finish - Date.now() / 1000;
        console.log(`Running... (${Math.floor(elapsed / 60)}m elapsed, ~${Math.floor(estimated / 60)}m remaining)`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    } catch (error) {
      console.error('Error checking job status:', error.message);
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait longer on error
    }
  }
}
```

## Cancel Fine-tuning Job

Immediately cancel a fine-tuning job.

**Endpoint:** `POST /v1/fine_tuning/jobs/{fine_tuning_job_id}/cancel`

### Example

```javascript
async function cancelFineTuningJob(jobId) {
  try {
    const job = await openai.fineTuning.jobs.cancel(jobId);
    console.log(`Job ${jobId} cancelled`);
    console.log('Status:', job.status);
    return job;
  } catch (error) {
    console.error('Error cancelling job:', error.message);
  }
}
```

## List Fine-tuning Events

Get status updates for a fine-tuning job.

**Endpoint:** `GET /v1/fine_tuning/jobs/{fine_tuning_job_id}/events`

### Example

```javascript
async function getFineTuningEvents(jobId) {
  try {
    const events = await openai.fineTuning.jobs.listEvents(jobId, {
      limit: 50
    });
    
    for (const event of events.data) {
      const timestamp = new Date(event.created_at * 1000).toISOString();
      console.log(`[${timestamp}] ${event.level}: ${event.message}`);
      
      if (event.data) {
        console.log('Data:', JSON.stringify(event.data, null, 2));
      }
    }
    
    return events.data;
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}
```

## List Fine-tuning Checkpoints

List checkpoints for a fine-tuning job.

**Endpoint:** `GET /v1/fine_tuning/jobs/{fine_tuning_job_id}/checkpoints`

### Example

```javascript
async function listCheckpoints(jobId) {
  try {
    const checkpoints = await openai.fineTuning.jobs.checkpoints.list(jobId);
    
    for (const checkpoint of checkpoints.data) {
      console.log(`Checkpoint: ${checkpoint.id}`);
      console.log(`Step: ${checkpoint.step_number}`);
      console.log(`Metrics:`, checkpoint.metrics);
      console.log('---');
    }
    
    return checkpoints.data;
  } catch (error) {
    console.error('Error listing checkpoints:', error.message);
  }
}
```

## Training Data Preparation

### Format Requirements

```javascript
// GPT-3.5-turbo and GPT-4 format
const chatFormat = {
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is the capital of France?" },
    { role: "assistant", content: "The capital of France is Paris." }
  ]
};

// Legacy format (davinci-002, babbage-002)
const completionFormat = {
  prompt: "Question: What is the capital of France?\nAnswer:",
  completion: " The capital of France is Paris."
};
```

### Data Preparation Class

```javascript
class FineTuningDataPreparer {
  constructor() {
    this.minExamples = 10;
    this.maxTokensPerExample = 4096;
  }
  
  async prepareDataset(examples, outputPath, format = 'chat') {
    // Validate dataset size
    if (examples.length < this.minExamples) {
      throw new Error(`Need at least ${this.minExamples} examples`);
    }
    
    // Format and validate examples
    const formattedData = [];
    const errors = [];
    
    for (let i = 0; i < examples.length; i++) {
      try {
        const formatted = format === 'chat' 
          ? this.formatChatExample(examples[i])
          : this.formatCompletionExample(examples[i]);
        
        // Estimate tokens (rough approximation)
        const tokenEstimate = JSON.stringify(formatted).length / 4;
        if (tokenEstimate > this.maxTokensPerExample) {
          errors.push(`Example ${i}: Too long (${Math.floor(tokenEstimate)} tokens)`);
          continue;
        }
        
        formattedData.push(formatted);
      } catch (error) {
        errors.push(`Example ${i}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }
    
    // Write to JSONL file
    const jsonlContent = formattedData
      .map(item => JSON.stringify(item))
      .join('\n');
    
    await fs.promises.writeFile(outputPath, jsonlContent);
    
    console.log(`Created training file with ${formattedData.length} examples`);
    return {
      path: outputPath,
      examples: formattedData.length,
      errors: errors
    };
  }
  
  formatChatExample(example) {
    if (!example.messages || !Array.isArray(example.messages)) {
      throw new Error('Example must have messages array');
    }
    
    // Validate message structure
    example.messages.forEach(msg => {
      if (!msg.role || !msg.content) {
        throw new Error('Each message must have role and content');
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        throw new Error(`Invalid role: ${msg.role}`);
      }
    });
    
    // Ensure conversation ends with assistant message
    const lastMessage = example.messages[example.messages.length - 1];
    if (lastMessage.role !== 'assistant') {
      throw new Error('Conversation must end with assistant message');
    }
    
    return { messages: example.messages };
  }
  
  formatCompletionExample(example) {
    if (!example.prompt || !example.completion) {
      throw new Error('Example must have prompt and completion');
    }
    
    // Ensure completion starts with space (best practice)
    const completion = example.completion.startsWith(' ') 
      ? example.completion 
      : ' ' + example.completion;
    
    return {
      prompt: example.prompt,
      completion: completion
    };
  }
}
```

## Complete Fine-tuning Workflow

```javascript
class FineTuningWorkflow {
  constructor(openai) {
    this.openai = openai;
  }
  
  async runCompleteWorkflow(trainingData, options = {}) {
    try {
      console.log('1. Preparing training data...');
      const preparer = new FineTuningDataPreparer();
      const dataFile = await preparer.prepareDataset(
        trainingData,
        'training_data.jsonl',
        'chat'
      );
      
      console.log('2. Uploading training file...');
      const file = await this.openai.files.create({
        file: fs.createReadStream(dataFile.path),
        purpose: 'fine-tune'
      });
      console.log(`File uploaded: ${file.id}`);
      
      // Wait for file processing
      await this.waitForFileProcessing(file.id);
      
      console.log('3. Creating fine-tuning job...');
      const job = await this.openai.fineTuning.jobs.create({
        training_file: file.id,
        model: options.model || 'gpt-3.5-turbo',
        hyperparameters: options.hyperparameters || {
          n_epochs: 3
        },
        suffix: options.suffix
      });
      console.log(`Job created: ${job.id}`);
      
      console.log('4. Monitoring job progress...');
      const completedJob = await this.monitorJob(job.id);
      
      if (completedJob.status === 'succeeded') {
        console.log('5. Testing fine-tuned model...');
        await this.testModel(completedJob.fine_tuned_model);
        
        return {
          success: true,
          model: completedJob.fine_tuned_model,
          job: completedJob
        };
      } else {
        return {
          success: false,
          error: completedJob.error,
          job: completedJob
        };
      }
    } catch (error) {
      console.error('Workflow error:', error.message);
      throw error;
    }
  }
  
  async waitForFileProcessing(fileId, maxWait = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const file = await this.openai.files.retrieve(fileId);
      
      if (file.status === 'processed') {
        return file;
      } else if (file.status === 'error') {
        throw new Error(`File processing failed: ${file.status_details}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('File processing timeout');
  }
  
  async monitorJob(jobId) {
    let lastStatus = null;
    
    while (true) {
      const job = await this.openai.fineTuning.jobs.retrieve(jobId);
      
      if (job.status !== lastStatus) {
        console.log(`Status: ${job.status}`);
        lastStatus = job.status;
      }
      
      if (['succeeded', 'failed', 'cancelled'].includes(job.status)) {
        return job;
      }
      
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  async testModel(modelId) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: modelId,
        messages: [
          { role: "user", content: "Hello! Please introduce yourself." }
        ],
        temperature: 0.7
      });
      
      console.log('Model response:', completion.choices[0].message.content);
    } catch (error) {
      console.error('Model test error:', error.message);
    }
  }
}
```

## Cost Estimation

```javascript
class FineTuningCostEstimator {
  constructor() {
    // Approximate costs per 1K tokens (check OpenAI pricing page)
    this.trainingCosts = {
      'gpt-3.5-turbo': 0.008,
      'davinci-002': 0.006,
      'babbage-002': 0.0004
    };
  }
  
  async estimateCost(trainingFile, model, epochs = 3) {
    try {
      // Read training file
      const content = await fs.promises.readFile(trainingFile, 'utf8');
      const examples = content.split('\n').filter(line => line.trim());
      
      // Estimate tokens
      let totalTokens = 0;
      examples.forEach(line => {
        const example = JSON.parse(line);
        const text = JSON.stringify(example);
        totalTokens += Math.ceil(text.length / 4); // Rough estimate
      });
      
      // Calculate cost
      const tokensPerEpoch = totalTokens * examples.length;
      const totalTrainingTokens = tokensPerEpoch * epochs;
      const costPer1k = this.trainingCosts[model] || 0.008;
      const estimatedCost = (totalTrainingTokens / 1000) * costPer1k;
      
      return {
        examples: examples.length,
        tokensPerExample: Math.floor(totalTokens / examples.length),
        totalTrainingTokens: totalTrainingTokens,
        estimatedCost: estimatedCost.toFixed(2),
        model: model,
        epochs: epochs
      };
    } catch (error) {
      console.error('Cost estimation error:', error.message);
      throw error;
    }
  }
}
```

## Error Handling

```javascript
async function handleFineTuningErrors(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.status === 400) {
      console.error('Bad request:', error.message);
      if (error.message.includes('training_file')) {
        console.error('Training file issue - check format and content');
      } else if (error.message.includes('model')) {
        console.error('Model not available for fine-tuning');
      }
    } else if (error.status === 403) {
      console.error('Permission denied - check organization settings');
    } else if (error.status === 429) {
      console.error('Rate limit - too many fine-tuning jobs');
    } else if (error.status === 500) {
      console.error('Server error - try again later');
    } else {
      console.error('Unexpected error:', error);
    }
    
    throw error;
  }
}
```