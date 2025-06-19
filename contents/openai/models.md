# OpenAI Models API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Models API provides information about the various models available in the OpenAI API. You can list models, retrieve specific model details, and understand their capabilities.

## Rate Limiting
- Default rate limit: 500 requests per minute
- Model-specific rate limits apply to inference endpoints
- Use caching for model information that doesn't change frequently

## Security Considerations
- API keys should be stored securely and never exposed in client-side code
- Use environment variables for API key management
- Implement proper access controls for different model tiers
- Monitor usage to prevent unexpected costs

## List Models

Lists the currently available models and provides basic information about each one.

**Endpoint:** `GET /v1/models`

### Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listAvailableModels() {
  try {
    const models = await openai.models.list();
    
    for (const model of models.data) {
      console.log(`Model ID: ${model.id}`);
      console.log(`Created: ${new Date(model.created * 1000).toISOString()}`);
      console.log(`Owned by: ${model.owned_by}`);
      console.log('---');
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}
```

### Response

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4-turbo-preview",
      "object": "model",
      "created": 1706048358,
      "owned_by": "openai"
    },
    {
      "id": "gpt-4-0125-preview",
      "object": "model",
      "created": 1706037612,
      "owned_by": "openai"
    },
    {
      "id": "gpt-3.5-turbo-0125",
      "object": "model",
      "created": 1706048358,
      "owned_by": "openai"
    }
  ]
}
```

## Retrieve Model

Retrieves a specific model instance, providing basic information about the model.

**Endpoint:** `GET /v1/models/{model}`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| model | string | Yes | The ID of the model to retrieve |

### Example

```javascript
async function getModelDetails(modelId) {
  try {
    const model = await openai.models.retrieve(modelId);
    
    console.log(`Model: ${model.id}`);
    console.log(`Type: ${model.object}`);
    console.log(`Created: ${new Date(model.created * 1000).toISOString()}`);
    console.log(`Owner: ${model.owned_by}`);
    
    if (model.permission) {
      console.log('Permissions:', model.permission);
    }
  } catch (error) {
    if (error.status === 404) {
      console.error(`Model '${modelId}' not found`);
    } else {
      console.error('Error retrieving model:', error.message);
    }
  }
}

// Usage
await getModelDetails('gpt-4-turbo-preview');
```

### Response

```json
{
  "id": "gpt-4-turbo-preview",
  "object": "model",
  "created": 1706048358,
  "owned_by": "openai",
  "permission": [
    {
      "id": "modelperm-123",
      "object": "model_permission",
      "created": 1706048358,
      "allow_create_engine": false,
      "allow_sampling": true,
      "allow_logprobs": true,
      "allow_search_indices": false,
      "allow_view": true,
      "allow_fine_tuning": false,
      "organization": "*",
      "group": null,
      "is_blocking": false
    }
  ]
}
```

## Available Models

### GPT-4 Models

| Model | Description | Context Window | Training Data |
|-------|-------------|----------------|---------------|
| gpt-4-turbo | Latest GPT-4 Turbo model with vision | 128K tokens | Up to Dec 2023 |
| gpt-4-turbo-2024-04-09 | GPT-4 Turbo with vision | 128K tokens | Up to Dec 2023 |
| gpt-4-turbo-preview | GPT-4 Turbo preview | 128K tokens | Up to Dec 2023 |
| gpt-4 | Standard GPT-4 model | 8K tokens | Up to Sep 2021 |
| gpt-4-32k | Extended context GPT-4 | 32K tokens | Up to Sep 2021 |

### GPT-3.5 Models

| Model | Description | Context Window | Training Data |
|-------|-------------|----------------|---------------|
| gpt-3.5-turbo-0125 | Latest GPT-3.5 Turbo | 16K tokens | Up to Sep 2021 |
| gpt-3.5-turbo | Standard GPT-3.5 Turbo | 16K tokens | Up to Sep 2021 |
| gpt-3.5-turbo-16k | Extended context GPT-3.5 | 16K tokens | Up to Sep 2021 |

### Embedding Models

| Model | Description | Output Dimension | Max Input |
|-------|-------------|------------------|-----------|
| text-embedding-3-large | Latest large embedding model | 3072 | 8191 tokens |
| text-embedding-3-small | Latest small embedding model | 1536 | 8191 tokens |
| text-embedding-ada-002 | Previous generation model | 1536 | 8191 tokens |

### Other Models

| Model | Type | Description |
|-------|------|-------------|
| dall-e-3 | Image Generation | Latest DALL-E model |
| dall-e-2 | Image Generation | Previous DALL-E model |
| whisper-1 | Audio Transcription | Speech to text |
| tts-1 | Text-to-Speech | Standard voices |
| tts-1-hd | Text-to-Speech | High quality voices |

## Model Selection Best Practices

```javascript
// Example: Choosing the right model based on use case
function selectModel(useCase) {
  const modelSelection = {
    'complex-reasoning': 'gpt-4-turbo',
    'general-chat': 'gpt-3.5-turbo',
    'long-context': 'gpt-4-turbo-preview',
    'embeddings': 'text-embedding-3-small',
    'image-generation': 'dall-e-3',
    'speech-to-text': 'whisper-1',
    'text-to-speech': 'tts-1'
  };
  
  return modelSelection[useCase] || 'gpt-3.5-turbo';
}

// Example: Model fallback strategy
async function makeRequestWithFallback(messages) {
  const models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  
  for (const model of models) {
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7
      });
      
      console.log(`Successfully used model: ${model}`);
      return completion;
    } catch (error) {
      if (error.status === 429 || error.status === 503) {
        console.log(`Model ${model} unavailable, trying next...`);
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('All models failed');
}
```

## Error Handling

```javascript
async function handleModelErrors() {
  try {
    const models = await openai.models.list();
    return models;
  } catch (error) {
    switch (error.status) {
      case 401:
        console.error('Invalid API key');
        break;
      case 429:
        console.error('Rate limit exceeded');
        // Implement exponential backoff
        await new Promise(resolve => setTimeout(resolve, 60000));
        break;
      case 500:
      case 503:
        console.error('Server error - try again later');
        break;
      default:
        console.error('Unexpected error:', error.message);
    }
    throw error;
  }
}
```