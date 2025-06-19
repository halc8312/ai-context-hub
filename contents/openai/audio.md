# OpenAI Audio API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** openai-node v4.x or higher

The Audio API provides two main capabilities: speech-to-text transcription/translation using Whisper, and text-to-speech generation using TTS models.

## Rate Limiting
- Whisper: 50 requests per minute
- TTS: 50 requests per minute
- File size limits: 25MB for audio files
- Consider chunking large audio files

## Security Considerations
- Audio files may contain sensitive information
- Implement proper access controls for audio storage
- Consider privacy regulations for voice data
- Sanitize filenames when processing user uploads
- Monitor for inappropriate content generation

## Speech to Text (Whisper)

### Create Transcription

Transcribes audio into the input language.

**Endpoint:** `POST /v1/audio/transcriptions`

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | file | Yes | Audio file to transcribe |
| model | string | Yes | Model ID (currently only "whisper-1") |
| language | string | No | Language of the audio (ISO-639-1) |
| prompt | string | No | Optional guide for model |
| response_format | string | No | Format: "json", "text", "srt", "verbose_json", "vtt" |
| temperature | number | No | Sampling temperature (0-1) |

#### Basic Transcription Example

```javascript
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(audioPath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "json"
    });
    
    console.log('Transcription:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error.message);
  }
}

// Usage
await transcribeAudio('audio.mp3');
```

#### Advanced Transcription with Options

```javascript
async function transcribeWithOptions(audioPath, options = {}) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: options.language || "en",
      prompt: options.prompt || "",
      response_format: options.format || "verbose_json",
      temperature: options.temperature || 0
    });
    
    if (options.format === "verbose_json") {
      console.log('Duration:', transcription.duration);
      console.log('Language:', transcription.language);
      
      // Process segments with timestamps
      transcription.segments.forEach(segment => {
        console.log(`[${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s]: ${segment.text}`);
      });
    }
    
    return transcription;
  } catch (error) {
    console.error('Transcription error:', error.message);
    throw error;
  }
}
```

### Create Translation

Translates audio into English.

**Endpoint:** `POST /v1/audio/translations`

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | file | Yes | Audio file to translate |
| model | string | Yes | Model ID (currently only "whisper-1") |
| prompt | string | No | Optional guide for model |
| response_format | string | No | Output format |
| temperature | number | No | Sampling temperature (0-1) |

#### Translation Example

```javascript
async function translateAudio(audioPath) {
  try {
    const translation = await openai.audio.translations.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "json"
    });
    
    console.log('English translation:', translation.text);
    return translation.text;
  } catch (error) {
    console.error('Translation error:', error.message);
  }
}
```

## Text to Speech (TTS)

### Create Speech

Generates audio from text input.

**Endpoint:** `POST /v1/audio/speech`

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| model | string | Yes | "tts-1" or "tts-1-hd" |
| input | string | Yes | Text to generate audio for (max 4096 chars) |
| voice | string | Yes | Voice: "alloy", "echo", "fable", "onyx", "nova", "shimmer" |
| response_format | string | No | Format: "mp3", "opus", "aac", "flac", "wav", "pcm" |
| speed | number | No | Speed of audio (0.25 to 4.0) |

#### Basic TTS Example

```javascript
async function textToSpeech(text, outputPath) {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(outputPath, buffer);
    
    console.log(`Audio saved to ${outputPath}`);
  } catch (error) {
    console.error('TTS error:', error.message);
  }
}

// Usage
await textToSpeech("Hello, this is a test of text to speech.", "output.mp3");
```

#### Advanced TTS with Options

```javascript
async function generateSpeechWithOptions(text, options = {}) {
  const defaultOptions = {
    model: "tts-1-hd", // Higher quality
    voice: "nova",
    response_format: "mp3",
    speed: 1.0
  };
  
  const config = { ...defaultOptions, ...options, input: text };
  
  try {
    const response = await openai.audio.speech.create(config);
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `speech_${Date.now()}.${config.response_format}`;
    
    await fs.promises.writeFile(filename, buffer);
    
    return {
      filename: filename,
      format: config.response_format,
      voice: config.voice,
      size: buffer.length
    };
  } catch (error) {
    console.error('TTS error:', error.message);
    throw error;
  }
}

// Usage examples
await generateSpeechWithOptions("Welcome to our service!", {
  voice: "fable",
  speed: 0.9,
  response_format: "wav"
});
```

## Streaming Audio

### Stream TTS Output

```javascript
async function streamTextToSpeech(text, voice = "alloy") {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      response_format: "mp3"
    });
    
    const stream = response.body;
    const chunks = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    return buffer;
  } catch (error) {
    console.error('Streaming error:', error.message);
    throw error;
  }
}
```

## Audio Processing Utilities

### Audio File Chunking

```javascript
class AudioChunker {
  constructor(maxSizeMB = 24) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
  }
  
  async chunkAudioFile(filePath) {
    const stats = await fs.promises.stat(filePath);
    
    if (stats.size <= this.maxSizeBytes) {
      return [filePath]; // No chunking needed
    }
    
    // For demonstration - in production, use audio processing library
    console.warn('File exceeds size limit. Audio chunking required.');
    // Implementation would use ffmpeg or similar
    return [filePath];
  }
}
```

### Batch Transcription

```javascript
async function batchTranscribe(audioPaths, options = {}) {
  const results = [];
  
  for (const audioPath of audioPaths) {
    try {
      console.log(`Transcribing: ${audioPath}`);
      
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        ...options
      });
      
      results.push({
        file: audioPath,
        text: transcription.text,
        success: true
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      results.push({
        file: audioPath,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}
```

### Multi-Voice Narrator

```javascript
class MultiVoiceNarrator {
  constructor() {
    this.voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }
  
  async narrate(script) {
    // script format: [{ speaker: "narrator", text: "..." }, ...]
    const audioSegments = [];
    
    for (const segment of script) {
      const voice = this.assignVoice(segment.speaker);
      
      try {
        const audio = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice,
          input: segment.text,
          speed: segment.speed || 1.0
        });
        
        const buffer = Buffer.from(await audio.arrayBuffer());
        audioSegments.push({
          speaker: segment.speaker,
          voice: voice,
          buffer: buffer
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating speech for ${segment.speaker}:`, error.message);
      }
    }
    
    return audioSegments;
  }
  
  assignVoice(speaker) {
    // Simple assignment - could be more sophisticated
    const voiceMap = {
      'narrator': 'nova',
      'character1': 'alloy',
      'character2': 'fable',
      'character3': 'echo'
    };
    
    return voiceMap[speaker] || 'nova';
  }
}
```

## Supported Audio Formats

### Input Formats (Whisper)
- mp3
- mp4
- mpeg
- mpga
- m4a
- wav
- webm

### Output Formats (TTS)
- mp3 (default) - Compressed, widely supported
- opus - Low latency, good for streaming
- aac - Good compression, Apple devices
- flac - Lossless compression
- wav - Uncompressed, high quality
- pcm - Raw audio data

## Language Support

### Whisper Supported Languages

```javascript
const WHISPER_LANGUAGES = {
  'af': 'Afrikaans',
  'ar': 'Arabic',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'be': 'Belarusian',
  'bs': 'Bosnian',
  'bg': 'Bulgarian',
  'ca': 'Catalan',
  'zh': 'Chinese',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'nl': 'Dutch',
  'en': 'English',
  'et': 'Estonian',
  'fi': 'Finnish',
  'fr': 'French',
  'gl': 'Galician',
  'de': 'German',
  'el': 'Greek',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'kn': 'Kannada',
  'kk': 'Kazakh',
  'ko': 'Korean',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mk': 'Macedonian',
  'ms': 'Malay',
  'mr': 'Marathi',
  'mi': 'Maori',
  'ne': 'Nepali',
  'no': 'Norwegian',
  'fa': 'Persian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sr': 'Serbian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'es': 'Spanish',
  'sw': 'Swahili',
  'sv': 'Swedish',
  'tl': 'Tagalog',
  'ta': 'Tamil',
  'th': 'Thai',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'vi': 'Vietnamese',
  'cy': 'Welsh'
};

function isLanguageSupported(languageCode) {
  return languageCode in WHISPER_LANGUAGES;
}
```

## Real-time Applications

### Live Transcription Service

```javascript
class LiveTranscriptionService {
  constructor() {
    this.audioBuffer = [];
    this.isProcessing = false;
  }
  
  async processAudioChunk(chunk) {
    this.audioBuffer.push(chunk);
    
    // Process when buffer reaches threshold
    if (this.audioBuffer.length >= 10 && !this.isProcessing) {
      this.isProcessing = true;
      
      try {
        // Combine chunks into single audio file
        const audioData = Buffer.concat(this.audioBuffer);
        const tempFile = `temp_${Date.now()}.wav`;
        
        await fs.promises.writeFile(tempFile, audioData);
        
        // Transcribe
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFile),
          model: "whisper-1",
          response_format: "json"
        });
        
        // Clean up
        await fs.promises.unlink(tempFile);
        this.audioBuffer = [];
        
        return transcription.text;
      } catch (error) {
        console.error('Live transcription error:', error);
      } finally {
        this.isProcessing = false;
      }
    }
  }
}
```

## Error Handling

```javascript
async function robustAudioOperation(operation, retries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error.status === 400) {
        console.error('Bad request:', error.message);
        if (error.message.includes('file format')) {
          throw new Error('Unsupported audio format');
        }
        throw error; // Don't retry bad requests
      } else if (error.status === 413) {
        throw new Error('File too large - maximum size is 25MB');
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
const transcription = await robustAudioOperation(async () => {
  return await openai.audio.transcriptions.create({
    file: fs.createReadStream('audio.mp3'),
    model: 'whisper-1'
  });
});
```