# OpenAI Embeddings API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Embeddings API converts text into numerical vectors that capture semantic meaning. These vectors can be used for search, clustering, recommendations, anomaly detection, diversity measurement, and classification.

## Rate Limiting
- Default rate limit: 3,000 RPM (requests per minute)
- Token limits: 1,000,000 TPM (tokens per minute)
- Batch processing recommended for large datasets
- Maximum input tokens per request varies by model

## Security Considerations
- Embeddings can potentially be reversed to approximate original text
- Store embeddings securely if they contain sensitive information
- Consider data privacy regulations when storing user-generated embeddings
- Implement access controls for embedding databases

## Create Embedding

Creates an embedding vector representing the input text.

**Endpoint:** `POST /v1/embeddings`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| input | string or array | Yes | Input text to embed, string or array of strings |
| model | string | Yes | ID of the model to use |
| encoding_format | string | No | Format to return embeddings in ("float" or "base64") |
| dimensions | integer | No | Number of dimensions (only for text-embedding-3 models) |
| user | string | No | Unique identifier for end-user tracking |

### Basic Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createEmbedding(text) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });
    
    console.log(`Embedding dimension: ${embedding.data[0].embedding.length}`);
    console.log(`Tokens used: ${embedding.usage.total_tokens}`);
    
    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error.message);
  }
}

// Usage
const vector = await createEmbedding("OpenAI embeddings are useful for semantic search");
```

### Response

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        -0.006929283,
        -0.005336422,
        -0.013174597,
        // ... many more numbers
      ]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 10,
    "total_tokens": 10
  }
}
```

## Batch Embeddings

Process multiple texts in a single request for efficiency.

```javascript
async function createBatchEmbeddings(texts) {
  try {
    // Process in batches to avoid rate limits
    const batchSize = 100;
    const embeddings = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch
      });
      
      embeddings.push(...response.data);
      
      // Add delay to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return embeddings.map(item => ({
      text: texts[item.index],
      embedding: item.embedding
    }));
  } catch (error) {
    console.error('Batch embedding error:', error.message);
    throw error;
  }
}
```

## Dimension Reduction

Reduce embedding dimensions for efficiency (text-embedding-3 models only).

```javascript
async function createReducedEmbedding(text, dimensions = 256) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      dimensions: dimensions // Must be less than model's native dimensions
    });
    
    console.log(`Reduced to ${dimensions} dimensions`);
    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Dimension reduction error:', error.message);
  }
}
```

## Semantic Search Implementation

```javascript
class SemanticSearch {
  constructor(model = "text-embedding-3-small") {
    this.model = model;
    this.documents = [];
    this.embeddings = [];
  }
  
  async addDocuments(documents) {
    try {
      // Create embeddings for all documents
      const texts = documents.map(doc => doc.content);
      const response = await openai.embeddings.create({
        model: this.model,
        input: texts
      });
      
      // Store documents with their embeddings
      response.data.forEach((item, index) => {
        this.documents.push(documents[index]);
        this.embeddings.push(item.embedding);
      });
      
      console.log(`Added ${documents.length} documents`);
    } catch (error) {
      console.error('Error adding documents:', error.message);
    }
  }
  
  async search(query, topK = 5) {
    try {
      // Get query embedding
      const queryResponse = await openai.embeddings.create({
        model: this.model,
        input: query
      });
      
      const queryEmbedding = queryResponse.data[0].embedding;
      
      // Calculate cosine similarities
      const similarities = this.embeddings.map((embedding, index) => ({
        index: index,
        score: this.cosineSimilarity(queryEmbedding, embedding)
      }));
      
      // Sort by similarity and return top results
      similarities.sort((a, b) => b.score - a.score);
      
      return similarities.slice(0, topK).map(item => ({
        document: this.documents[item.index],
        score: item.score
      }));
    } catch (error) {
      console.error('Search error:', error.message);
      throw error;
    }
  }
  
  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Usage example
const search = new SemanticSearch();

await search.addDocuments([
  { id: 1, content: "OpenAI provides AI models for developers" },
  { id: 2, content: "Machine learning is transforming industries" },
  { id: 3, content: "Natural language processing enables chatbots" }
]);

const results = await search.search("AI development tools", 2);
console.log(results);
```

## Clustering Example

```javascript
async function clusterDocuments(documents, numClusters = 3) {
  try {
    // Get embeddings for all documents
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: documents.map(doc => doc.text)
    });
    
    const embeddings = response.data.map(item => item.embedding);
    
    // Simple k-means clustering implementation
    const clusters = kMeansClustering(embeddings, numClusters);
    
    // Group documents by cluster
    const groupedDocs = Array(numClusters).fill(null).map(() => []);
    clusters.forEach((cluster, index) => {
      groupedDocs[cluster].push(documents[index]);
    });
    
    return groupedDocs;
  } catch (error) {
    console.error('Clustering error:', error.message);
  }
}

function kMeansClustering(embeddings, k) {
  // Simplified k-means implementation
  const assignments = new Array(embeddings.length);
  const centroids = embeddings.slice(0, k);
  
  for (let iteration = 0; iteration < 10; iteration++) {
    // Assign points to nearest centroid
    for (let i = 0; i < embeddings.length; i++) {
      let minDist = Infinity;
      let closestCentroid = 0;
      
      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(embeddings[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = j;
        }
      }
      
      assignments[i] = closestCentroid;
    }
    
    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = embeddings.filter((_, i) => assignments[i] === j);
      if (clusterPoints.length > 0) {
        centroids[j] = averageVectors(clusterPoints);
      }
    }
  }
  
  return assignments;
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function averageVectors(vectors) {
  const sum = vectors[0].slice();
  for (let i = 1; i < vectors.length; i++) {
    for (let j = 0; j < sum.length; j++) {
      sum[j] += vectors[i][j];
    }
  }
  return sum.map(val => val / vectors.length);
}
```

## Classification with Embeddings

```javascript
class EmbeddingClassifier {
  constructor(model = "text-embedding-3-small") {
    this.model = model;
    this.classes = {};
  }
  
  async train(examples) {
    // examples: [{ text: "...", label: "category" }, ...]
    try {
      // Group examples by label
      const grouped = {};
      examples.forEach(example => {
        if (!grouped[example.label]) {
          grouped[example.label] = [];
        }
        grouped[example.label].push(example.text);
      });
      
      // Create embeddings for each class
      for (const [label, texts] of Object.entries(grouped)) {
        const response = await openai.embeddings.create({
          model: this.model,
          input: texts
        });
        
        // Store average embedding for each class
        const embeddings = response.data.map(item => item.embedding);
        this.classes[label] = this.averageEmbedding(embeddings);
      }
      
      console.log(`Trained on ${Object.keys(this.classes).length} classes`);
    } catch (error) {
      console.error('Training error:', error.message);
    }
  }
  
  async classify(text) {
    try {
      // Get embedding for input text
      const response = await openai.embeddings.create({
        model: this.model,
        input: text
      });
      
      const embedding = response.data[0].embedding;
      
      // Find closest class
      let maxSimilarity = -1;
      let predictedClass = null;
      
      for (const [label, classEmbedding] of Object.entries(this.classes)) {
        const similarity = this.cosineSimilarity(embedding, classEmbedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          predictedClass = label;
        }
      }
      
      return {
        label: predictedClass,
        confidence: maxSimilarity
      };
    } catch (error) {
      console.error('Classification error:', error.message);
      throw error;
    }
  }
  
  averageEmbedding(embeddings) {
    const sum = embeddings[0].slice();
    for (let i = 1; i < embeddings.length; i++) {
      for (let j = 0; j < sum.length; j++) {
        sum[j] += embeddings[i][j];
      }
    }
    return sum.map(val => val / embeddings.length);
  }
  
  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

## Best Practices

### Text Preprocessing

```javascript
function preprocessTextForEmbedding(text) {
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove special characters if needed
  // text = text.replace(/[^\w\s]/gi, '');
  
  // Truncate to model's token limit (approximately)
  const maxChars = 8000; // ~2000 tokens
  if (text.length > maxChars) {
    text = text.substring(0, maxChars) + '...';
  }
  
  return text;
}
```

### Caching Embeddings

```javascript
class EmbeddingCache {
  constructor() {
    this.cache = new Map();
  }
  
  async getEmbedding(text, model = "text-embedding-3-small") {
    const cacheKey = `${model}:${text}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await openai.embeddings.create({
        model: model,
        input: text
      });
      
      const embedding = response.data[0].embedding;
      this.cache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      throw error;
    }
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}
```

## Error Handling

```javascript
async function robustEmbeddingCreation(text, retries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });
      
      return embedding;
    } catch (error) {
      lastError = error;
      
      if (error.status === 400) {
        // Bad request - don't retry
        console.error('Invalid input:', error.message);
        throw error;
      } else if (error.status === 429) {
        // Rate limit - exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (error.status >= 500) {
        // Server error - retry with delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}
```