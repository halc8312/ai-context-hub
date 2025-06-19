# OpenAI Images API (DALL-E)

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Images API provides three methods for interacting with images: creating images from text prompts, editing existing images, and creating variations of existing images.

## Rate Limiting
- DALL-E 3: 5 images per minute
- DALL-E 2: 50 images per minute
- Rate limits apply per API key
- Generation time varies by model and size

## Security Considerations
- All prompts are filtered for safety
- Generated images are checked for policy violations
- Store API keys securely
- Monitor usage to prevent abuse
- Consider implementing user-level rate limiting
- Review OpenAI's usage policies for commercial use

## Create Image

Generate an image from a text prompt.

**Endpoint:** `POST /v1/images/generations`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| prompt | string | Yes | Text description of the desired image |
| model | string | No | Model to use ("dall-e-3" or "dall-e-2") |
| n | integer | No | Number of images (1-10 for DALL-E 2, only 1 for DALL-E 3) |
| size | string | No | Image size (see model-specific sizes below) |
| quality | string | No | Image quality ("standard" or "hd", DALL-E 3 only) |
| style | string | No | Style ("vivid" or "natural", DALL-E 3 only) |
| response_format | string | No | Format ("url" or "b64_json") |
| user | string | No | Unique identifier for end-user |

### DALL-E 3 Example

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createImageDalle3() {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A futuristic city with flying cars and neon lights, cyberpunk style",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });
    
    console.log('Image URL:', response.data[0].url);
    console.log('Revised prompt:', response.data[0].revised_prompt);
  } catch (error) {
    console.error('Error generating image:', error.message);
  }
}
```

### DALL-E 2 Example

```javascript
async function createImageDalle2() {
  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: "A serene landscape with mountains and a lake at sunset",
      n: 2,
      size: "512x512",
      response_format: "url"
    });
    
    response.data.forEach((image, index) => {
      console.log(`Image ${index + 1}: ${image.url}`);
    });
  } catch (error) {
    console.error('Error generating image:', error.message);
  }
}
```

### Response

```json
{
  "created": 1718764800,
  "data": [
    {
      "url": "https://oaidalleapi.../img-abc123.png",
      "revised_prompt": "A futuristic cityscape featuring flying vehicles..."
    }
  ]
}
```

## Edit Image

Create an edited version of an image based on a prompt.

**Endpoint:** `POST /v1/images/edits`

**Note:** Only available for DALL-E 2

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| image | file | Yes | Image to edit (PNG, max 4MB, square) |
| prompt | string | Yes | Description of how to edit the image |
| mask | file | No | Transparent areas indicate where to edit |
| model | string | No | Must be "dall-e-2" |
| n | integer | No | Number of images to generate (1-10) |
| size | string | No | Size of output ("256x256", "512x512", "1024x1024") |
| response_format | string | No | Format ("url" or "b64_json") |

### Example with File Upload

```javascript
const fs = require('fs');

async function editImage() {
  try {
    const response = await openai.images.edit({
      model: "dall-e-2",
      image: fs.createReadStream("original.png"),
      mask: fs.createReadStream("mask.png"),
      prompt: "Add a red hat to the person",
      n: 1,
      size: "1024x1024"
    });
    
    console.log('Edited image:', response.data[0].url);
  } catch (error) {
    console.error('Error editing image:', error.message);
  }
}
```

## Create Image Variation

Generate variations of an existing image.

**Endpoint:** `POST /v1/images/variations`

**Note:** Only available for DALL-E 2

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| image | file | Yes | Image to create variations of |
| model | string | No | Must be "dall-e-2" |
| n | integer | No | Number of variations (1-10) |
| size | string | No | Size of output |
| response_format | string | No | Format ("url" or "b64_json") |

### Example

```javascript
async function createVariations() {
  try {
    const response = await openai.images.createVariation({
      model: "dall-e-2",
      image: fs.createReadStream("original.png"),
      n: 3,
      size: "1024x1024"
    });
    
    response.data.forEach((image, index) => {
      console.log(`Variation ${index + 1}: ${image.url}`);
    });
  } catch (error) {
    console.error('Error creating variations:', error.message);
  }
}
```

## Model Specifications

### DALL-E 3
- Sizes: "1024x1024", "1792x1024", "1024x1792"
- Max images per request: 1
- Features: Better prompt following, higher quality
- Supports quality and style parameters
- Returns revised_prompt with actual prompt used

### DALL-E 2
- Sizes: "256x256", "512x512", "1024x1024"
- Max images per request: 10
- Supports edits and variations
- Lower cost than DALL-E 3

## Advanced Usage

### Base64 Image Handling

```javascript
async function generateBase64Image() {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A beautiful abstract painting",
      size: "1024x1024",
      response_format: "b64_json"
    });
    
    const base64Data = response.data[0].b64_json;
    
    // Save base64 to file
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync('generated-image.png', buffer);
    
    console.log('Image saved to generated-image.png');
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Prompt Engineering for Better Results

```javascript
class ImagePromptBuilder {
  constructor() {
    this.elements = [];
  }
  
  subject(description) {
    this.elements.push(`Subject: ${description}`);
    return this;
  }
  
  style(style) {
    this.elements.push(`Style: ${style}`);
    return this;
  }
  
  lighting(lighting) {
    this.elements.push(`Lighting: ${lighting}`);
    return this;
  }
  
  mood(mood) {
    this.elements.push(`Mood: ${mood}`);
    return this;
  }
  
  details(details) {
    this.elements.push(`Details: ${details}`);
    return this;
  }
  
  build() {
    return this.elements.join(', ');
  }
}

// Usage
const prompt = new ImagePromptBuilder()
  .subject("a majestic lion")
  .style("photorealistic, professional wildlife photography")
  .lighting("golden hour sunlight")
  .mood("powerful and serene")
  .details("shallow depth of field, high resolution")
  .build();

const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: prompt,
  quality: "hd"
});
```

### Batch Image Generation

```javascript
async function batchGenerateImages(prompts) {
  const results = [];
  
  for (const prompt of prompts) {
    try {
      console.log(`Generating: ${prompt}`);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        size: "1024x1024"
      });
      
      results.push({
        prompt: prompt,
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt
      });
      
      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 12000)); // 5 per minute
    } catch (error) {
      results.push({
        prompt: prompt,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### Image Download and Storage

```javascript
const https = require('https');
const path = require('path');

async function downloadAndStoreImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    
    https.get(imageUrl, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function generateAndSave(prompt, outputDir = './images') {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024"
    });
    
    const imageUrl = response.data[0].url;
    const timestamp = Date.now();
    const filename = path.join(outputDir, `dalle-${timestamp}.png`);
    
    await downloadAndStoreImage(imageUrl, filename);
    
    // Save metadata
    const metadata = {
      prompt: prompt,
      revised_prompt: response.data[0].revised_prompt,
      timestamp: timestamp,
      filename: filename
    };
    
    fs.writeFileSync(
      path.join(outputDir, `dalle-${timestamp}-metadata.json`),
      JSON.stringify(metadata, null, 2)
    );
    
    return metadata;
  } catch (error) {
    throw error;
  }
}
```

### Content Policy Handling

```javascript
async function safeImageGeneration(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024"
    });
    
    return {
      success: true,
      data: response.data[0]
    };
  } catch (error) {
    if (error.status === 400 && error.message.includes('content policy')) {
      return {
        success: false,
        error: 'Content policy violation',
        message: 'The prompt contains content that violates OpenAI policies'
      };
    } else if (error.status === 400) {
      return {
        success: false,
        error: 'Invalid prompt',
        message: 'The prompt is invalid or too long'
      };
    } else {
      throw error;
    }
  }
}
```

## Image Analysis with Vision

While not part of the Images API, you can analyze generated images using GPT-4 Vision:

```javascript
async function analyzeGeneratedImage() {
  try {
    // First generate an image
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A complex abstract painting with hidden symbols",
      size: "1024x1024"
    });
    
    const imageUrl = imageResponse.data[0].url;
    
    // Then analyze it with GPT-4 Vision
    const analysis = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in detail. What elements do you see?"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });
    
    console.log('Generated image:', imageUrl);
    console.log('Analysis:', analysis.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

## Error Handling

```javascript
async function robustImageGeneration(prompt, options = {}) {
  const defaults = {
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
    n: 1
  };
  
  const config = { ...defaults, ...options, prompt };
  
  try {
    const response = await openai.images.generate(config);
    return response;
  } catch (error) {
    if (error.status === 400) {
      console.error('Bad request:', error.message);
      if (error.message.includes('billing')) {
        console.error('Billing issue - check your OpenAI account');
      } else if (error.message.includes('content policy')) {
        console.error('Content policy violation');
      } else if (error.message.includes('prompt')) {
        console.error('Invalid prompt - check length and content');
      }
    } else if (error.status === 401) {
      console.error('Authentication failed - check API key');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded - wait before retrying');
    } else if (error.status === 500) {
      console.error('Server error - try again later');
    }
    
    throw error;
  }
}
```