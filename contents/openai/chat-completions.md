# OpenAI Chat Completions API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Chat Completions API provides access to OpenAI's language models. Given a list of messages comprising a conversation, the model returns a response.

## Rate Limiting
- GPT-4 models: 500 RPM (requests per minute), 10,000 TPM (tokens per minute)
- GPT-3.5-turbo: 3,500 RPM, 90,000 TPM
- Rate limits vary by tier and model
- Use backoff strategies for 429 errors

## Security Considerations
- Never expose API keys in client-side code
- Implement content filtering for user inputs
- Monitor for prompt injection attempts
- Use system messages to establish safety boundaries
- Consider using the Moderation API for user content

## Create Chat Completion

Creates a model response for the given chat conversation.

**Endpoint:** `POST /v1/chat/completions`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| model | string | Yes | ID of the model to use |
| messages | array | Yes | List of messages comprising the conversation |
| temperature | number | No | Sampling temperature (0-2), default 1 |
| max_tokens | integer | No | Maximum tokens to generate |
| top_p | number | No | Nucleus sampling (0-1), default 1 |
| n | integer | No | Number of completions, default 1 |
| stream | boolean | No | Stream partial responses |
| stop | string/array | No | Stop sequences |
| presence_penalty | number | No | Penalize new tokens (-2 to 2), default 0 |
| frequency_penalty | number | No | Penalize repeated tokens (-2 to 2), default 0 |
| logit_bias | object | No | Modify token likelihood |
| user | string | No | Unique identifier for end-user |
| tools | array | No | List of available tools (functions) |
| tool_choice | string/object | No | Control tool usage |
| response_format | object | No | Specify output format |
| seed | integer | No | For deterministic sampling |

### Basic Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getChatCompletion() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that explains complex topics simply."
        },
        {
          role: "user",
          content: "Explain quantum computing in simple terms"
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log(completion.choices[0].message.content);
    console.log(`Tokens used: ${completion.usage.total_tokens}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Response

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1718764800,
  "model": "gpt-4-turbo-2024-04-09",
  "usage": {
    "prompt_tokens": 35,
    "completion_tokens": 127,
    "total_tokens": 162
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Quantum computing is like having a super-powered calculator..."
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

## Streaming Responses

Stream partial responses for real-time output.

```javascript
async function streamChatCompletion() {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "user", content: "Write a short story about a robot" }
      ],
      stream: true,
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
  }
}
```

## Function Calling

Enable the model to call functions.

```javascript
async function functionCallingExample() {
  const tools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather in a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA"
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"]
            }
          },
          required: ["location"]
        }
      }
    }
  ];
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "user", content: "What's the weather in New York?" }
      ],
      tools: tools,
      tool_choice: "auto"
    });
    
    const message = response.choices[0].message;
    
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        console.log(`Function: ${toolCall.function.name}`);
        console.log(`Arguments: ${toolCall.function.arguments}`);
        
        // Call actual function and get result
        const functionResult = await callFunction(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        
        // Continue conversation with function result
        const followUp = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "user", content: "What's the weather in New York?" },
            message,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult)
            }
          ]
        });
        
        console.log(followUp.choices[0].message.content);
      }
    }
  } catch (error) {
    console.error('Function calling error:', error.message);
  }
}
```

## JSON Mode

Force the model to output valid JSON.

```javascript
async function jsonModeExample() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON."
        },
        {
          role: "user",
          content: "List 3 programming languages with their key features"
        }
      ]
    });
    
    const jsonResponse = JSON.parse(completion.choices[0].message.content);
    console.log(jsonResponse);
  } catch (error) {
    console.error('JSON mode error:', error.message);
  }
}
```

## Vision Capabilities

Process images with GPT-4 Vision.

```javascript
async function visionExample() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What's in this image?"
            },
            {
              type: "image_url",
              image_url: {
                url: "https://example.com/image.jpg",
                detail: "high" // "low", "high", or "auto"
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });
    
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Vision error:', error.message);
  }
}
```

## Advanced Usage Patterns

### Conversation Management

```javascript
class ConversationManager {
  constructor(model = "gpt-4-turbo") {
    this.model = model;
    this.messages = [];
    this.maxTokens = 4000; // Reserve tokens for response
  }
  
  addMessage(role, content) {
    this.messages.push({ role, content });
    this.trimMessages();
  }
  
  trimMessages() {
    // Simple token estimation (4 chars ≈ 1 token)
    while (this.estimateTokens() > this.maxTokens && this.messages.length > 1) {
      // Keep system message, remove oldest user/assistant messages
      if (this.messages[1].role !== "system") {
        this.messages.splice(1, 1);
      } else {
        this.messages.splice(2, 1);
      }
    }
  }
  
  estimateTokens() {
    return this.messages.reduce((total, msg) => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);
      return total + Math.ceil(content.length / 4);
    }, 0);
  }
  
  async getResponse(userInput) {
    this.addMessage("user", userInput);
    
    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: this.messages,
        temperature: 0.7
      });
      
      const assistantMessage = completion.choices[0].message;
      this.addMessage("assistant", assistantMessage.content);
      
      return {
        content: assistantMessage.content,
        usage: completion.usage
      };
    } catch (error) {
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff

```javascript
async function createCompletionWithRetry(params, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (error) {
      lastError = error;
      
      if (error.status === 429) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (error.status >= 500) {
        const waitTime = (i + 1) * 1000;
        console.log(`Server error. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error; // Don't retry client errors
      }
    }
  }
  
  throw lastError;
}
```

### Token Usage Optimization

```javascript
async function optimizedCompletion(messages, targetTokens = 500) {
  const models = [
    { name: "gpt-3.5-turbo", costPer1k: 0.0015 },
    { name: "gpt-4-turbo", costPer1k: 0.01 }
  ];
  
  // Estimate which model is most cost-effective
  const estimatedPromptTokens = messages.reduce((sum, msg) => {
    return sum + Math.ceil(msg.content.length / 4);
  }, 0);
  
  const selectedModel = estimatedPromptTokens > 2000 
    ? models[0] // Use cheaper model for long prompts
    : models[1]; // Use better model for short prompts
  
  try {
    const completion = await openai.chat.completions.create({
      model: selectedModel.name,
      messages: messages,
      max_tokens: targetTokens,
      temperature: 0.7
    });
    
    const totalTokens = completion.usage.total_tokens;
    const cost = (totalTokens / 1000) * selectedModel.costPer1k;
    
    console.log(`Model: ${selectedModel.name}`);
    console.log(`Tokens: ${totalTokens}`);
    console.log(`Estimated cost: $${cost.toFixed(4)}`);
    
    return completion;
  } catch (error) {
    throw error;
  }
}
```

## Error Handling

```javascript
async function robustChatCompletion(messages) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages
    });
    
    return completion;
  } catch (error) {
    if (error.status === 400) {
      console.error('Bad request:', error.message);
      // Check for specific issues
      if (error.message.includes('maximum context length')) {
        console.error('Context too long - trim messages');
      }
    } else if (error.status === 401) {
      console.error('Authentication failed - check API key');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded - implement backoff');
    } else if (error.status === 500) {
      console.error('Server error - retry later');
    } else {
      console.error('Unexpected error:', error);
    }
    
    throw error;
  }
}
```