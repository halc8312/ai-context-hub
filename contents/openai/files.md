# OpenAI Files API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Files API allows you to upload documents that can be used with features like Assistants, Fine-tuning, and Batch API. Files are automatically deleted after 30 days of inactivity.

## Rate Limiting
- Upload rate: 100 files per minute
- Maximum file size: 512MB
- Total storage: 100GB per organization
- File expiration: 30 days after last use

## Security Considerations
- Files are scoped to your organization
- Implement proper access controls in your application
- Sanitize filenames before upload
- Validate file contents before processing
- Monitor storage usage to avoid hitting limits
- Consider encrypting sensitive data before upload

## Upload File

Upload a file that can be used across various endpoints.

**Endpoint:** `POST /v1/files`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | file | Yes | File to upload |
| purpose | string | Yes | Purpose: "assistants", "batch", "fine-tune", "vision" |

### Example Upload

```javascript
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function uploadFile(filePath, purpose) {
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: purpose
    });
    
    console.log('File uploaded:', file.id);
    console.log('Filename:', file.filename);
    console.log('Size:', file.bytes, 'bytes');
    console.log('Status:', file.status);
    
    return file;
  } catch (error) {
    console.error('Upload error:', error.message);
  }
}

// Usage examples
await uploadFile('training_data.jsonl', 'fine-tune');
await uploadFile('knowledge_base.pdf', 'assistants');
```

### Response

```json
{
  "id": "file-abc123",
  "object": "file",
  "bytes": 120000,
  "created_at": 1718764800,
  "filename": "training_data.jsonl",
  "purpose": "fine-tune",
  "status": "processed",
  "status_details": null
}
```

## List Files

Returns a list of files belonging to the organization.

**Endpoint:** `GET /v1/files`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| purpose | string | No | Filter by purpose |
| limit | integer | No | Number of files to return (1-10000) |
| order | string | No | Sort order: "asc" or "desc" |
| after | string | No | Cursor for pagination |

### Example

```javascript
async function listFiles(options = {}) {
  try {
    const files = await openai.files.list({
      purpose: options.purpose,
      limit: options.limit || 100
    });
    
    for (const file of files.data) {
      console.log(`ID: ${file.id}`);
      console.log(`Name: ${file.filename}`);
      console.log(`Purpose: ${file.purpose}`);
      console.log(`Size: ${(file.bytes / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Created: ${new Date(file.created_at * 1000).toISOString()}`);
      console.log('---');
    }
    
    return files.data;
  } catch (error) {
    console.error('List error:', error.message);
  }
}

// List all fine-tuning files
await listFiles({ purpose: 'fine-tune' });
```

## Retrieve File Info

Get information about a specific file.

**Endpoint:** `GET /v1/files/{file_id}`

### Example

```javascript
async function getFileInfo(fileId) {
  try {
    const file = await openai.files.retrieve(fileId);
    
    console.log('File details:');
    console.log(JSON.stringify(file, null, 2));
    
    return file;
  } catch (error) {
    if (error.status === 404) {
      console.error('File not found');
    } else {
      console.error('Retrieve error:', error.message);
    }
  }
}
```

## Delete File

Delete a file.

**Endpoint:** `DELETE /v1/files/{file_id}`

### Example

```javascript
async function deleteFile(fileId) {
  try {
    const result = await openai.files.del(fileId);
    
    console.log('File deleted:', result.deleted);
    return result;
  } catch (error) {
    console.error('Delete error:', error.message);
  }
}
```

## Retrieve File Content

Download the contents of a file.

**Endpoint:** `GET /v1/files/{file_id}/content`

### Example

```javascript
async function downloadFileContent(fileId, outputPath) {
  try {
    const response = await openai.files.content(fileId);
    
    // Get the file content as a stream
    const fileStream = response.body;
    const writeStream = fs.createWriteStream(outputPath);
    
    // Pipe the response to a file
    fileStream.pipe(writeStream);
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        console.log(`File downloaded to: ${outputPath}`);
        resolve(outputPath);
      });
      
      writeStream.on('error', reject);
    });
  } catch (error) {
    console.error('Download error:', error.message);
  }
}
```

## File Management Utilities

### File Upload with Validation

```javascript
class FileUploadManager {
  constructor(openai) {
    this.openai = openai;
    this.maxSizeMB = 512;
    this.validPurposes = ['assistants', 'batch', 'fine-tune', 'vision'];
  }
  
  async uploadWithValidation(filePath, purpose) {
    // Validate purpose
    if (!this.validPurposes.includes(purpose)) {
      throw new Error(`Invalid purpose. Must be one of: ${this.validPurposes.join(', ')}`);
    }
    
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    // Check file size
    const stats = await fs.promises.stat(filePath);
    const sizeMB = stats.size / (1024 * 1024);
    
    if (sizeMB > this.maxSizeMB) {
      throw new Error(`File too large: ${sizeMB.toFixed(2)}MB (max: ${this.maxSizeMB}MB)`);
    }
    
    // Validate file format based on purpose
    this.validateFileFormat(filePath, purpose);
    
    try {
      const file = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: purpose
      });
      
      // Wait for processing
      return await this.waitForProcessing(file.id);
    } catch (error) {
      throw error;
    }
  }
  
  validateFileFormat(filePath, purpose) {
    const ext = filePath.split('.').pop().toLowerCase();
    
    const validFormats = {
      'fine-tune': ['jsonl'],
      'assistants': ['pdf', 'txt', 'docx', 'md', 'json'],
      'batch': ['jsonl'],
      'vision': ['png', 'jpg', 'jpeg', 'gif', 'webp']
    };
    
    if (!validFormats[purpose].includes(ext)) {
      throw new Error(`Invalid format for ${purpose}. Supported: ${validFormats[purpose].join(', ')}`);
    }
  }
  
  async waitForProcessing(fileId, maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const file = await this.openai.files.retrieve(fileId);
      
      if (file.status === 'processed') {
        return file;
      } else if (file.status === 'error') {
        throw new Error(`File processing failed: ${file.status_details}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('File processing timeout');
  }
}
```

### Batch File Operations

```javascript
async function batchUploadFiles(filePaths, purpose) {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      console.log(`Uploading: ${filePath}`);
      
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: purpose
      });
      
      results.push({
        originalPath: filePath,
        fileId: file.id,
        success: true
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (error) {
      results.push({
        originalPath: filePath,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}
```

### File Storage Monitor

```javascript
class FileStorageMonitor {
  constructor(openai) {
    this.openai = openai;
  }
  
  async getStorageUsage() {
    try {
      const files = await this.openai.files.list({ limit: 10000 });
      
      const stats = {
        totalFiles: files.data.length,
        totalBytes: 0,
        byPurpose: {},
        oldestFile: null,
        newestFile: null
      };
      
      files.data.forEach(file => {
        stats.totalBytes += file.bytes;
        
        // Group by purpose
        if (!stats.byPurpose[file.purpose]) {
          stats.byPurpose[file.purpose] = {
            count: 0,
            bytes: 0
          };
        }
        stats.byPurpose[file.purpose].count++;
        stats.byPurpose[file.purpose].bytes += file.bytes;
        
        // Track oldest and newest
        if (!stats.oldestFile || file.created_at < stats.oldestFile.created_at) {
          stats.oldestFile = file;
        }
        if (!stats.newestFile || file.created_at > stats.newestFile.created_at) {
          stats.newestFile = file;
        }
      });
      
      // Convert to readable format
      stats.totalSizeMB = (stats.totalBytes / 1024 / 1024).toFixed(2);
      stats.totalSizeGB = (stats.totalBytes / 1024 / 1024 / 1024).toFixed(2);
      
      return stats;
    } catch (error) {
      console.error('Storage monitor error:', error.message);
      throw error;
    }
  }
  
  async cleanupOldFiles(daysOld = 25) {
    const cutoffTime = Date.now() / 1000 - (daysOld * 24 * 60 * 60);
    const filesToDelete = [];
    
    try {
      const files = await this.openai.files.list({ limit: 10000 });
      
      for (const file of files.data) {
        if (file.created_at < cutoffTime) {
          filesToDelete.push(file);
        }
      }
      
      console.log(`Found ${filesToDelete.length} files older than ${daysOld} days`);
      
      // Delete old files
      const deletionResults = [];
      for (const file of filesToDelete) {
        try {
          await this.openai.files.del(file.id);
          deletionResults.push({
            fileId: file.id,
            filename: file.filename,
            deleted: true
          });
        } catch (error) {
          deletionResults.push({
            fileId: file.id,
            filename: file.filename,
            deleted: false,
            error: error.message
          });
        }
      }
      
      return deletionResults;
    } catch (error) {
      console.error('Cleanup error:', error.message);
      throw error;
    }
  }
}
```

## Fine-tuning Data Preparation

```javascript
async function prepareFineTuningData(examples, outputPath) {
  // Format: {"messages": [{"role": "system", "content": "..."}, ...]}
  const jsonlData = examples.map(example => {
    return JSON.stringify({
      messages: [
        { role: "system", content: example.systemPrompt || "You are a helpful assistant." },
        { role: "user", content: example.userInput },
        { role: "assistant", content: example.assistantResponse }
      ]
    });
  }).join('\n');
  
  // Write to JSONL file
  await fs.promises.writeFile(outputPath, jsonlData);
  
  // Upload for fine-tuning
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(outputPath),
      purpose: 'fine-tune'
    });
    
    console.log(`Fine-tuning data uploaded: ${file.id}`);
    return file;
  } catch (error) {
    console.error('Fine-tuning data upload error:', error.message);
    throw error;
  }
}
```

## Batch API Data Preparation

```javascript
async function prepareBatchRequests(requests, outputPath) {
  // Format batch requests
  const batchData = requests.map((request, index) => {
    return JSON.stringify({
      custom_id: `request-${index}`,
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: request.model || "gpt-3.5-turbo",
        messages: request.messages,
        temperature: request.temperature || 0.7
      }
    });
  }).join('\n');
  
  // Write to JSONL file
  await fs.promises.writeFile(outputPath, batchData);
  
  // Upload for batch processing
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(outputPath),
      purpose: 'batch'
    });
    
    console.log(`Batch data uploaded: ${file.id}`);
    return file;
  } catch (error) {
    console.error('Batch data upload error:', error.message);
    throw error;
  }
}
```

## Error Handling

```javascript
async function robustFileOperation(operation, retries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error.status === 400) {
        console.error('Bad request:', error.message);
        if (error.message.includes('size')) {
          throw new Error('File too large - maximum size is 512MB');
        } else if (error.message.includes('format')) {
          throw new Error('Invalid file format for specified purpose');
        }
        throw error; // Don't retry bad requests
      } else if (error.status === 404) {
        throw new Error('File not found');
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

// Usage
const file = await robustFileOperation(async () => {
  return await openai.files.create({
    file: fs.createReadStream('data.jsonl'),
    purpose: 'fine-tune'
  });
});
```