# OpenAI Assistants API

**Version:** v2  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Assistants API allows you to build AI assistants with models, tools, and knowledge to respond to user queries. Assistants can access multiple tools in parallel, including Code Interpreter, File Search, and Function calling.

## Rate Limiting
- Assistant operations: 100 requests per minute
- Message creation: 500 requests per minute
- Run creation: 100 requests per minute
- File operations: 100 requests per minute
- Storage: 100GB per organization

## Security Considerations
- Assistants are scoped to your organization
- Implement proper user authentication
- Monitor assistant outputs for sensitive data
- Use thread isolation for user conversations
- Review code interpreter outputs before sharing

## Create Assistant

Create an assistant with a model and instructions.

**Endpoint:** `POST /v1/assistants`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| model | string | Yes | Model ID to use |
| name | string | No | Name of the assistant |
| description | string | No | Description of assistant's purpose |
| instructions | string | No | System instructions for assistant behavior |
| tools | array | No | List of tools: code_interpreter, file_search, function |
| tool_resources | object | No | Resources for tools (files, vector stores) |
| metadata | object | No | Key-value pairs for storing additional info |
| temperature | number | No | Sampling temperature (0-2) |
| top_p | number | No | Nucleus sampling (0-1) |
| response_format | object | No | Output format specification |

### Basic Assistant Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Data Analyst",
      instructions: "You are a data analyst. Help users analyze data, create visualizations, and derive insights.",
      model: "gpt-4-turbo",
      tools: [
        { type: "code_interpreter" },
        { type: "file_search" }
      ],
      tool_resources: {
        code_interpreter: {
          file_ids: [] // Add file IDs for analysis
        },
        file_search: {
          vector_store_ids: [] // Add vector store IDs
        }
      }
    });
    
    console.log('Assistant created:', assistant.id);
    console.log('Name:', assistant.name);
    console.log('Model:', assistant.model);
    
    return assistant;
  } catch (error) {
    console.error('Error creating assistant:', error.message);
  }
}
```

### Response

```json
{
  "id": "asst_abc123",
  "object": "assistant",
  "created_at": 1718764800,
  "name": "Data Analyst",
  "description": null,
  "model": "gpt-4-turbo",
  "instructions": "You are a data analyst. Help users analyze data, create visualizations, and derive insights.",
  "tools": [
    { "type": "code_interpreter" },
    { "type": "file_search" }
  ],
  "tool_resources": {
    "code_interpreter": {
      "file_ids": []
    },
    "file_search": {
      "vector_store_ids": []
    }
  },
  "metadata": {},
  "temperature": 1.0,
  "top_p": 1.0,
  "response_format": "auto"
}
```

## Create Thread

Create a thread for a conversation.

**Endpoint:** `POST /v1/threads`

### Example

```javascript
async function createThread() {
  try {
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: "Help me analyze this sales data"
        }
      ],
      metadata: {
        user_id: "user_123",
        session_id: "session_456"
      }
    });
    
    console.log('Thread created:', thread.id);
    return thread;
  } catch (error) {
    console.error('Error creating thread:', error.message);
  }
}
```

## Add Message to Thread

Add a message to an existing thread.

**Endpoint:** `POST /v1/threads/{thread_id}/messages`

### Example

```javascript
async function addMessage(threadId, content, attachments = []) {
  try {
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content,
      attachments: attachments.map(fileId => ({
        file_id: fileId,
        tools: [{ type: "code_interpreter" }, { type: "file_search" }]
      }))
    });
    
    console.log('Message added:', message.id);
    return message;
  } catch (error) {
    console.error('Error adding message:', error.message);
  }
}
```

## Run Assistant

Create a run to execute the assistant on a thread.

**Endpoint:** `POST /v1/threads/{thread_id}/runs`

### Basic Run Example

```javascript
async function runAssistant(threadId, assistantId) {
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: "Please provide detailed analysis with visualizations where appropriate."
    });
    
    console.log('Run started:', run.id);
    console.log('Status:', run.status);
    
    return run;
  } catch (error) {
    console.error('Error creating run:', error.message);
  }
}
```

## Stream Run Output

Stream the assistant's response in real-time.

```javascript
async function streamAssistantResponse(threadId, assistantId) {
  try {
    const stream = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      stream: true
    });
    
    for await (const event of stream) {
      if (event.event === 'thread.message.delta') {
        const delta = event.data.delta;
        if (delta.content && delta.content[0].type === 'text') {
          process.stdout.write(delta.content[0].text.value);
        }
      } else if (event.event === 'thread.run.completed') {
        console.log('\n\nRun completed');
        break;
      } else if (event.event === 'thread.run.failed') {
        console.error('\n\nRun failed:', event.data.last_error);
        break;
      }
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
  }
}
```

## Function Calling with Assistants

```javascript
async function createFunctionCallingAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Weather Assistant",
      instructions: "You help users get weather information for cities.",
      model: "gpt-4-turbo",
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the current weather for a location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "City and state, e.g., San Francisco, CA"
                },
                unit: {
                  type: "string",
                  enum: ["celsius", "fahrenheit"],
                  description: "Temperature unit"
                }
              },
              required: ["location"]
            }
          }
        }
      ]
    });
    
    return assistant;
  } catch (error) {
    console.error('Error creating function assistant:', error.message);
  }
}

async function handleFunctionCall(threadId, runId, toolCallId, functionName, args) {
  // Simulate function execution
  const result = {
    temperature: 72,
    condition: "Sunny",
    humidity: 45
  };
  
  try {
    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: [{
        tool_call_id: toolCallId,
        output: JSON.stringify(result)
      }]
    });
    
    console.log('Tool output submitted');
  } catch (error) {
    console.error('Error submitting tool output:', error.message);
  }
}
```

## Complete Assistant Workflow

```javascript
class AssistantManager {
  constructor(openai) {
    this.openai = openai;
  }
  
  async createCompleteAssistant(config) {
    try {
      // 1. Upload files if needed
      const fileIds = [];
      if (config.files) {
        for (const filePath of config.files) {
          const file = await this.openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: 'assistants'
          });
          fileIds.push(file.id);
          console.log(`Uploaded file: ${file.id}`);
        }
      }
      
      // 2. Create vector store if using file search
      let vectorStoreId = null;
      if (config.useFileSearch && fileIds.length > 0) {
        const vectorStore = await this.openai.beta.vectorStores.create({
          name: config.name + " Knowledge Base",
          file_ids: fileIds
        });
        vectorStoreId = vectorStore.id;
        console.log(`Created vector store: ${vectorStoreId}`);
      }
      
      // 3. Create assistant
      const assistantConfig = {
        name: config.name,
        instructions: config.instructions,
        model: config.model || "gpt-4-turbo",
        tools: [],
        tool_resources: {}
      };
      
      if (config.useCodeInterpreter) {
        assistantConfig.tools.push({ type: "code_interpreter" });
        assistantConfig.tool_resources.code_interpreter = {
          file_ids: fileIds
        };
      }
      
      if (config.useFileSearch) {
        assistantConfig.tools.push({ type: "file_search" });
        assistantConfig.tool_resources.file_search = {
          vector_store_ids: vectorStoreId ? [vectorStoreId] : []
        };
      }
      
      if (config.functions) {
        config.functions.forEach(func => {
          assistantConfig.tools.push({
            type: "function",
            function: func
          });
        });
      }
      
      const assistant = await this.openai.beta.assistants.create(assistantConfig);
      console.log(`Created assistant: ${assistant.id}`);
      
      return {
        assistant: assistant,
        fileIds: fileIds,
        vectorStoreId: vectorStoreId
      };
    } catch (error) {
      console.error('Error creating complete assistant:', error.message);
      throw error;
    }
  }
  
  async runConversation(assistantId, messages) {
    try {
      // Create thread with initial messages
      const thread = await this.openai.beta.threads.create({
        messages: messages
      });
      
      console.log(`Created thread: ${thread.id}`);
      
      // Create and monitor run
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });
      
      console.log(`Started run: ${run.id}`);
      
      // Wait for completion
      const completedRun = await this.waitForRunCompletion(thread.id, run.id);
      
      // Get messages
      const threadMessages = await this.openai.beta.threads.messages.list(thread.id);
      
      return {
        thread: thread,
        run: completedRun,
        messages: threadMessages.data
      };
    } catch (error) {
      console.error('Error running conversation:', error.message);
      throw error;
    }
  }
  
  async waitForRunCompletion(threadId, runId) {
    let run;
    
    while (true) {
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      
      console.log(`Run status: ${run.status}`);
      
      if (run.status === 'completed') {
        return run;
      } else if (run.status === 'failed') {
        throw new Error(`Run failed: ${run.last_error?.message}`);
      } else if (run.status === 'cancelled') {
        throw new Error('Run was cancelled');
      } else if (run.status === 'expired') {
        throw new Error('Run expired');
      } else if (run.status === 'requires_action') {
        // Handle function calls
        await this.handleRequiredAction(threadId, run);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  async handleRequiredAction(threadId, run) {
    if (run.required_action?.type === 'submit_tool_outputs') {
      const toolOutputs = [];
      
      for (const toolCall of run.required_action.submit_tool_outputs.tool_calls) {
        if (toolCall.type === 'function') {
          const result = await this.executeFunction(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(result)
          });
        }
      }
      
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
        tool_outputs: toolOutputs
      });
    }
  }
  
  async executeFunction(name, args) {
    // Implement your function logic here
    console.log(`Executing function: ${name}`, args);
    
    // Example implementation
    switch (name) {
      case 'get_weather':
        return {
          temperature: 72,
          condition: 'Sunny',
          location: args.location
        };
      default:
        return { error: 'Function not implemented' };
    }
  }
}
```

## Managing Assistant Files

```javascript
class AssistantFileManager {
  constructor(openai) {
    this.openai = openai;
  }
  
  async uploadAndAttachFiles(assistantId, filePaths) {
    const attachedFiles = [];
    
    for (const filePath of filePaths) {
      try {
        // Upload file
        const file = await this.openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: 'assistants'
        });
        
        console.log(`Uploaded: ${file.id}`);
        
        // Update assistant to include file
        await this.openai.beta.assistants.update(assistantId, {
          tool_resources: {
            code_interpreter: {
              file_ids: [file.id]
            }
          }
        });
        
        attachedFiles.push({
          fileId: file.id,
          filename: file.filename,
          bytes: file.bytes
        });
      } catch (error) {
        console.error(`Error with file ${filePath}:`, error.message);
      }
    }
    
    return attachedFiles;
  }
  
  async createKnowledgeBase(name, filePaths) {
    try {
      // Upload files
      const fileIds = [];
      for (const filePath of filePaths) {
        const file = await this.openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: 'assistants'
        });
        fileIds.push(file.id);
      }
      
      // Create vector store
      const vectorStore = await this.openai.beta.vectorStores.create({
        name: name,
        file_ids: fileIds
      });
      
      console.log(`Created vector store: ${vectorStore.id}`);
      console.log(`Files: ${fileIds.length}`);
      
      // Wait for processing
      await this.waitForVectorStoreProcessing(vectorStore.id);
      
      return vectorStore;
    } catch (error) {
      console.error('Error creating knowledge base:', error.message);
      throw error;
    }
  }
  
  async waitForVectorStoreProcessing(vectorStoreId) {
    while (true) {
      const vectorStore = await this.openai.beta.vectorStores.retrieve(vectorStoreId);
      
      if (vectorStore.status === 'completed') {
        console.log('Vector store processing completed');
        break;
      } else if (vectorStore.status === 'failed') {
        throw new Error('Vector store processing failed');
      }
      
      console.log(`Processing... (${vectorStore.file_counts.in_progress} files in progress)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

## Assistant Templates

```javascript
// Data Analysis Assistant
const dataAnalystConfig = {
  name: "Data Analysis Expert",
  instructions: `You are an expert data analyst. Your capabilities include:
- Analyzing datasets and identifying patterns
- Creating visualizations using Python
- Performing statistical analysis
- Generating insights and recommendations

Always explain your analysis clearly and provide visualizations when helpful.`,
  model: "gpt-4-turbo",
  useCodeInterpreter: true,
  useFileSearch: true,
  files: ["sales_data.csv", "customer_data.xlsx"]
};

// Research Assistant
const researchAssistantConfig = {
  name: "Research Assistant",
  instructions: `You are a research assistant specialized in:
- Finding relevant information from provided documents
- Summarizing key findings
- Answering questions based on the knowledge base
- Providing citations for your responses

Always cite the source documents when providing information.`,
  model: "gpt-4-turbo",
  useFileSearch: true,
  files: ["research_papers.pdf", "technical_docs.md"]
};

// Customer Support Assistant
const supportAssistantConfig = {
  name: "Customer Support Agent",
  instructions: `You are a helpful customer support agent. Your role is to:
- Answer customer questions politely and accurately
- Look up information from the knowledge base
- Escalate complex issues when needed
- Maintain a friendly and professional tone

If you cannot find an answer, acknowledge this and offer to escalate.`,
  model: "gpt-3.5-turbo",
  useFileSearch: true,
  functions: [
    {
      name: "escalate_ticket",
      description: "Escalate a support ticket to human agent",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] }
        },
        required: ["reason", "priority"]
      }
    }
  ]
};
```

## Error Handling

```javascript
async function robustAssistantOperation(operation, retries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error.status === 400) {
        console.error('Bad request:', error.message);
        if (error.message.includes('model')) {
          throw new Error('Invalid model specified');
        } else if (error.message.includes('tools')) {
          throw new Error('Invalid tool configuration');
        }
        throw error; // Don't retry bad requests
      } else if (error.status === 404) {
        throw new Error('Assistant or resource not found');
      } else if (error.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
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